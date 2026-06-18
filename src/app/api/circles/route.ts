


import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Circle from '@/models/Circle';
import Notification from '@/models/Notification';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('hidayah_token')?.value;
    if (!token) return null;
    
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    return jwt.verify(token, secret) as any;
  } catch (e) {
    return null;
  }
}



export async function GET(req: Request) {
  try {
    let user = null;
    try {
      user = await getAuthUser();
    } catch (e) {
      // Ignore during build
    }

    if (!user) return NextResponse.json({ circles: [] });

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'mine';

    let circles;
    if (filter === 'mine') {
      circles = await Circle.find({ memberIds: user.userId }).sort({ lastMessageAt: -1, createdAt: -1 }).limit(50).lean();
      
      let unreadCounts: Record<string, number> = {};
      try {
        const unreadAgg = await Notification.aggregate([
          { $match: { recipientId: new mongoose.Types.ObjectId(user.userId), type: 'circle_message', isRead: false } },
          { $group: { _id: '$circleId', count: { $sum: 1 } } }
        ]);
        unreadAgg.forEach((doc: any) => {
          if (doc._id) unreadCounts[doc._id.toString()] = doc.count;
        });
      } catch (err) {
        console.error("Error fetching unread counts for circles:", err);
      }
      
      circles = circles.map((c: any) => ({
        ...c,
        unreadCount: unreadCounts[c._id.toString()] || 0
      }));
    } else {
      // Discover: Circles that I'm NOT already a member of and that are public
      circles = await Circle.find({ 
        memberIds: { $ne: user.userId },
        privacy: 'public'
      }).sort({ lastMessageAt: -1, createdAt: -1 }).limit(50).lean();
    }

    return NextResponse.json({ circles });
  } catch (error: any) {
    console.error('CRITICAL CIRCLES FETCH ERROR:', error);
    return NextResponse.json({ message: 'Error fetching circles', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { title, description, category, privacy, memberIds } = await req.json();
    
    // Validate private circle requirements
    if (privacy === 'private' && (!Array.isArray(memberIds) || memberIds.length < 2)) {
      return NextResponse.json({ 
        message: `Private circles require at least 3 members to maintain community safety. Please invite at least 2 souls.` 
      }, { status: 400 });
    }

    if (!title || !description || !category) {
      return NextResponse.json({ message: 'Title, description and category are required' }, { status: 400 });
    }

    await dbConnect();

    // Generate Slug
    let slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Check if slug already exists, if so append unique string
    const existingCircle = await Circle.findOne({ slug });
    if (existingCircle) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    try {
      const newCircle = await Circle.create({
        title,
        slug,
        description,
        category,
        privacy,
        creatorId: user.userId,
        memberIds: [user.userId], // Creator is always a member
        rules: [
          "Respectful discussion",
          "No spam",
          "Stay on topic",
          "Islamic-focused conversation"
        ]
      });

      // Send invitations ONLY for private circles
      if (privacy === 'private' && Array.isArray(memberIds) && memberIds.length > 0) {
        // Filter out any null/undefined/empty IDs and ensure creator doesn't invite themselves
        const validMemberIds = memberIds.filter(id => id && typeof id === 'string' && id !== user.userId);
        
        const invitations = validMemberIds.map((recipientId: string) => ({
          recipientId,
          senderId: user.userId,
          senderName: user.username || 'A brother/sister',
          type: 'circle_invite',
          circleId: newCircle._id,
          circleTitle: newCircle.title,
          status: 'pending'
        }));
        
        if (invitations.length > 0) {
          await Promise.all(invitations.map((invite: any) => Notification.create(invite)));
        }
      }

      return NextResponse.json({ circle: newCircle }, { status: 201 });
    } catch (dbError: any) {
      return NextResponse.json({ message: 'Database Error: ' + dbError.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
