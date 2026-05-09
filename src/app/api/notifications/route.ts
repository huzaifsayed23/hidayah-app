export function generateStaticParams() { return []; }

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
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



export async function GET() {
  try {
    let user = null;
    try {
      user = await getAuthUser();
    } catch (e) {
      // Ignore during build
    }
    
    if (!user) return NextResponse.json({ notifications: [] });

    const userId = user.userId || user.email;
    await dbConnect();
    
    // Fetch notifications and populate post info
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('postId', 'backdropVariant content verse')
      .lean();

    console.log(`Fetched ${notifications.length} notifications for user ${userId}`);
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Mark all as read
export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const userId = user.userId || user.email;
    await dbConnect();
    
    await Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
