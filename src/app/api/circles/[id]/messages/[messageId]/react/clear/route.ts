
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CircleMessage from '@/models/CircleMessage';
import { pusherServer } from '@/lib/pusher-server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getAuthUser(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('hidayah_token')?.value || req.headers.get('Authorization')?.slice(7);
    if (!token) return null;
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    return jwt.verify(token, secret) as any;
  } catch (e) {
    return null;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id, messageId } = await params;
    await dbConnect();

    const message = await CircleMessage.findById(messageId);
    if (!message) return NextResponse.json({ message: 'Message not found' }, { status: 404 });

    // Remove ALL reactions from this user
    message.reactions = message.reactions.filter(
      (r: any) => r && r.userId && String(r.userId) !== String(user.userId)
    );

    message.markModified('reactions');
    await message.save();

    // Trigger Pusher
    await pusherServer.trigger(`circle-${id}`, 'reaction', {
      messageId,
      reactions: message.reactions
    });

    return NextResponse.json({ reactions: message.reactions });
  } catch (error: any) {
    console.error('CLEAR REACTION ERROR:', error);
    return NextResponse.json({ message: 'Error clearing reactions' }, { status: 500 });
  }
}
