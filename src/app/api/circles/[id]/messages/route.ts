export const dynamic = 'force-dynamic';
]; }

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Circle from '@/models/Circle';
import CircleMessage from '@/models/CircleMessage';
import User from '@/models/User';
import { pusherServer } from '@/lib/pusher';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getAuthUser(req: Request) {
  let token = null;
  try {
    const cookieStore = (await cookies().catch(() => null));
    token = cookieStore?.get('hidayah_token')?.value;
  } catch (e) {}

  if (!token) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    return jwt.verify(token, secret) as any;
  } catch(e) {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user = null;
    try {
      user = await getAuthUser(req);
    } catch (e) {
      // Ignore during build
    }

    if (!user) return NextResponse.json({ messages: [] });

    const { id } = await params;
    await dbConnect();

    // Resolve circleId if it's a slug or title
    let circleId = id;
    if (!mongoose.isValidObjectId(id)) {
      let circle = await Circle.findOne({ slug: id }).select('_id');
      if (!circle) {
        circle = await Circle.findOne({ title: { $regex: new RegExp(id.replace(/-/g, ' '), 'i') } }).select('_id');
      }
      if (circle) circleId = circle._id.toString();
    }

    const messages = await CircleMessage.find({ circleId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username profileImage')
      .populate({
        path: 'replyTo',
        populate: { path: 'senderId', select: 'username' }
      })
      .lean();

    // Map senderId to senderName for frontend compatibility
    const formattedMessages = messages.map((m: any) => ({
      ...m,
      senderName: m.senderId?.username || 'Unknown',
      senderImage: m.senderId?.profileImage || null,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Fetch Messages Error:', error);
    return NextResponse.json({ message: 'Error fetching messages' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    
    // Resolve circleId if it's a slug or title
    let circleId = id;
    if (!mongoose.isValidObjectId(id)) {
      await dbConnect();
      let circle = await Circle.findOne({ slug: id }).select('_id');
      if (!circle) {
        circle = await Circle.findOne({ title: { $regex: new RegExp(id.replace(/-/g, ' '), 'i') } }).select('_id');
      }
      if (circle) circleId = circle._id.toString();
    }
    
    // Use formData for larger payloads (Next.js JSON limit is 1MB)
    const formData = await req.formData();
    const text = formData.get('text') as string;
    const replyToId = formData.get('replyToId') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const fileUrl = formData.get('fileUrl') as string;
    const fileName = formData.get('fileName') as string;

    console.log(`Sending message to circle ${circleId} from user ${user.userId}`);

    if (!user || !user.userId) {
      return NextResponse.json({ message: 'User identity not found in token' }, { status: 401 });
    }

    if (!text && !imageUrl && !fileUrl) {
      return NextResponse.json({ message: 'Message content is required (text or attachment)' }, { status: 400 });
    }

    await dbConnect();

    const newMessage = await CircleMessage.create({
      circleId: circleId,
      senderId: user.userId,
      text: text || "",
      imageUrl: imageUrl || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      replyTo: (replyToId && replyToId !== "") ? replyToId : null,
    });

    const populatedMessage = await CircleMessage.findById(newMessage._id)
      .populate('senderId', 'username image') // Fixed: User model uses 'image' not 'profileImage'
      .populate({
        path: 'replyTo',
        populate: { path: 'senderId', select: 'username' }
      })
      .lean();

    if (!populatedMessage) throw new Error("Failed to retrieve created message");

    const formattedMessage = {
      ...populatedMessage,
      senderName: populatedMessage.senderId?.username || 'Unknown',
      senderImage: populatedMessage.senderId?.image || null,
    };

    // Lightweight Pusher trigger (strip large Base64 strings)
    const pusherMessage = {
      ...formattedMessage,
      imageUrl: formattedMessage.imageUrl ? 'PENDING' : null,
      fileUrl: formattedMessage.fileUrl ? 'PENDING' : null,
    };

    try {
      await pusherServer.trigger(`circle-${id}`, 'new-message', pusherMessage);
    } catch (e) {
      console.error('Pusher Trigger Error:', e);
    }

    return NextResponse.json({ message: formattedMessage }, { status: 201 });
  } catch (error: any) {
    console.error('CRITICAL SEND MESSAGE ERROR:', error);
    return NextResponse.json({ 
      message: 'Error sending message', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
