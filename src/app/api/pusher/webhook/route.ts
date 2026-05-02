import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const events = body.events;

    await dbConnect();

    for (const event of events) {
      if (event.name === 'member_removed') {
        const userId = event.user_id;
        
        // Update user status to offline
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        // Broadcast status change to all clients if needed 
        // (Pusher presence channels handle member_removed automatically on client side,
        // but we might want to broadcast a custom event for other parts of the app)
        await pusherServer.trigger('presence-community', 'USER_STATUS_CHANGED', {
          userId,
          status: 'offline',
          lastSeen: new Date(),
        });
      } else if (event.name === 'member_added') {
        const userId = event.user_id;
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });
        
        await pusherServer.trigger('presence-community', 'USER_STATUS_CHANGED', {
          userId,
          status: 'online',
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pusher Webhook Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
