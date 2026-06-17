import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const events = body.events || [];

    await dbConnect();

    for (const event of events) {
      if (event.name === 'member_removed') {
        const userId = event.user_id;
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date()
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pusher Webhook Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}