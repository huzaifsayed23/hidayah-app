export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CircleMessage from '@/models/CircleMessage';
import { pusherServer } from '@/lib/pusher';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('hidayah_token')?.value;
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
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { messageId } = await params;
    await dbConnect();

    const message = await CircleMessage.findById(messageId)
      .populate('senderId', 'username profileImage')
      .populate({
        path: 'replyTo',
        populate: { path: 'senderId', select: 'username' }
      })
      .lean();

    if (!message) return NextResponse.json({ message: 'Message not found' }, { status: 404 });

    const formattedMessage = {
      ...message,
      senderName: message.senderId?.username || 'Unknown',
      senderImage: message.senderId?.profileImage || null,
    };

    return NextResponse.json({ message: formattedMessage });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching message' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id, messageId } = await params;

    await dbConnect();

    const message = await CircleMessage.findById(messageId);
    if (!message) return NextResponse.json({ message: 'Message not found' }, { status: 404 });

    // Only sender can delete their own message
    if (message.senderId.toString() !== user.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await CircleMessage.findByIdAndDelete(messageId);

    // Trigger Pusher to remove from other users' UI
    try {
      await pusherServer.trigger(`circle-${id}`, 'delete-message', { messageId });
    } catch (e) {
      console.error('Pusher Delete Error:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Message Error:', error);
    return NextResponse.json({ message: 'Error deleting message' }, { status: 500 });
  }
}
