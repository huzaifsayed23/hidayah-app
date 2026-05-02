export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Circle from '@/models/Circle';
import Notification from '@/models/Notification';
import User from '@/models/User';
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    await dbConnect();
    const circle = await Circle.findById(id);
    if (!circle) return NextResponse.json({ message: 'Circle not found' }, { status: 404 });

    // PUBLIC: Direct Join
    if (circle.privacy === 'public') {
      await Circle.findByIdAndUpdate(id, {
        $addToSet: { memberIds: user.userId }
      });
      return NextResponse.json({ success: true, joined: true, message: 'Joined circle successfully' });
    } 

    // PRIVATE: Send Request to Founder
    // Check if request already exists
    const existingRequest = await Notification.findOne({
      senderId: user.userId,
      circleId: id,
      type: 'circle_request',
      status: 'pending'
    });

    if (existingRequest) {
      return NextResponse.json({ message: 'Join request already pending' }, { status: 400 });
    }

    // Fetch current user details for the latest username
    const dbUser = await User.findById(user.userId);

    await Notification.create({
      recipientId: circle.creatorId,
      senderId: user.userId,
      senderName: dbUser?.username || user.username || 'A soul',
      type: 'circle_request',
      circleId: id,
      circleTitle: circle.title,
      status: 'pending'
    });

    return NextResponse.json({ success: true, joined: false, message: 'Join request sent to the founder' });
  } catch (error) {
    console.error('Join Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
