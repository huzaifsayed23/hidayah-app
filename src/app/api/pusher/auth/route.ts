export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
    const token = cookieStore.get('hidayah_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);

    const formData = await req.formData();
    const socketId = formData.get('socket_id') as string;
    const channelName = formData.get('channel_name') as string;

    await dbConnect();
    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Presence channel data
    const presenceData = {
      user_id: user._id.toString(),
      user_info: {
        username: user.username,
        image: user.image,
      },
    };

    const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
    
    // Update user status to online
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher Auth Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
