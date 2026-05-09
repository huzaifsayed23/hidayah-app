export const dynamic = 'force-dynamic';
]; }

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import Circle from '@/models/Circle';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getAuthUser() {
  const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
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
    const { action } = await req.json(); // 'accept' or 'deny'

    await dbConnect();
    const notification = await Notification.findById(id);
    if (!notification) return NextResponse.json({ message: 'Notification not found' }, { status: 404 });

    if (notification.recipientId.toString() !== user.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Fetch current user details for the latest username
    const dbUser = await User.findById(user.userId);

    if (action === 'accept') {
      notification.status = 'accepted';
      
      // If it's an invite, the current user (recipient) joins
      // If it's a request, the applicant (sender) joins
      const joiningUserId = notification.type === 'circle_invite' 
        ? user.userId 
        : notification.senderId;

      await Circle.findByIdAndUpdate(notification.circleId, {
        $addToSet: { memberIds: joiningUserId }
      });

      // Send feedback notification to the person who initiated
      await Notification.create({
        recipientId: notification.senderId,
        senderId: user.userId,
        senderName: dbUser?.username || user.username || 'A soul',
        type: notification.type, // circle_invite or circle_request
        circleId: notification.circleId,
        circleTitle: notification.circleTitle,
        status: 'accepted',
        isRead: false
      });
    } else {
      notification.status = 'denied';

      // Send feedback notification to the person who initiated
      await Notification.create({
        recipientId: notification.senderId,
        senderId: user.userId,
        senderName: user.username || 'A soul',
        type: notification.type,
        circleId: notification.circleId,
        circleTitle: notification.circleTitle,
        status: 'denied',
        isRead: false
      });
    }

    notification.isRead = true;
    await notification.save();

    return NextResponse.json({ success: true, status: notification.status });
  } catch (error) {
    console.error('Response Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
