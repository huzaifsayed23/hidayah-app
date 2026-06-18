import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let user = null;
    try {
      user = await getAuthUser();
    } catch (e) {}
    
    if (!user) return NextResponse.json({ unreadCircles: 0, unreadNotifications: 0 });

    const userId = user.userId || user.email;
    await dbConnect();
    
    const unreadNotifications = await Notification.countDocuments({ 
      recipientId: userId, 
      isRead: false,
      type: { $ne: 'circle_message' }
    });

    const unreadCircles = await Notification.countDocuments({ 
      recipientId: userId, 
      isRead: false,
      type: 'circle_message'
    });

    return NextResponse.json({ unreadCircles, unreadNotifications });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
