export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
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

    const dbUser = await User.findById(user.userId);
    if (!dbUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const isMuted = dbUser.mutedCircles.includes(id as any);

    if (isMuted) {
      dbUser.mutedCircles = dbUser.mutedCircles.filter((cId: any) => cId.toString() !== id);
    } else {
      dbUser.mutedCircles.push(id as any);
    }

    await dbUser.save();

    return NextResponse.json({ isMuted: !isMuted });
  } catch (error) {
    console.error('Mute Toggle Error:', error);
    return NextResponse.json({ message: 'Error toggling mute' }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const dbUser = await User.findById(user.userId);
    if (!dbUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const isMuted = dbUser.mutedCircles.includes(id as any);

    return NextResponse.json({ isMuted });
  } catch (error) {
    console.error('Mute Status Error:', error);
    return NextResponse.json({ message: 'Error checking mute status' }, { status: 500 });
  }
}
