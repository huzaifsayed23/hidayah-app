export const dynamic = 'force-dynamic';
]; }

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CircleMessage from '@/models/CircleMessage';
import { pusherServer } from '@/lib/pusher';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getAuthUser() {
  try {
    const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
    const token = cookieStore.get('hidayah_token')?.value;
    if (!token) return null;
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    return jwt.verify(token, secret) as any;
  } catch(e) {
    return null;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id, messageId } = await params;
    const { emoji } = await req.json();

    await dbConnect();

    const message = await CircleMessage.findById(messageId);
    if (!message) return NextResponse.json({ message: 'Message not found' }, { status: 404 });

    // Check if user already reacted with this emoji
    const existingIndex = message.reactions.findIndex(
      (r: any) => r.userId.toString() === user.userId && r.emoji === emoji
    );

    if (existingIndex > -1) {
      // Remove reaction
      message.reactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      message.reactions.push({ userId: user.userId, emoji });
    }

    await message.save();

    // Trigger Pusher
    await pusherServer.trigger(`circle-${id}`, 'reaction', {
      messageId,
      reactions: message.reactions
    });

    return NextResponse.json({ reactions: message.reactions });
  } catch (error) {
    console.error('Reaction Error:', error);
    return NextResponse.json({ message: 'Error updating reaction' }, { status: 500 });
  }
}
