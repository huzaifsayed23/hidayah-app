export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Circle from '@/models/Circle';
import Notification from '@/models/Notification';
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

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'mine';

    await dbConnect();
    
    let circles;
    if (filter === 'mine') {
      circles = await Circle.find({ memberIds: user.userId }).sort({ createdAt: -1 }).lean();
    } else {
      // Discover: Circles that I'm NOT already a member of
      circles = await Circle.find({ 
        memberIds: { $ne: user.userId }
      }).sort({ createdAt: -1 }).lean();
    }

    return NextResponse.json({ circles });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching circles' }, { status: 500 });
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

    try {
      const newCircle = await Circle.create({
        title,
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
      if (privacy === 'private' && memberIds && memberIds.length > 0) {
        const invitations = memberIds.map((recipientId: string) => ({
          recipientId,
          senderId: user.userId,
          senderName: user.username || 'A brother/sister',
          type: 'circle_invite',
          circleId: newCircle._id,
          circleTitle: newCircle.title,
          status: 'pending'
        }));
        
        await Promise.all(invitations.map((invite: any) => Notification.create(invite)));
      }

      return NextResponse.json({ circle: newCircle }, { status: 201 });
    } catch (dbError: any) {
      return NextResponse.json({ message: 'Database Error: ' + dbError.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
