export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
    const token = cookieStore.get('hidayah_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);
    const userId = decoded.userId;

    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { image } = await req.json();

    await dbConnect();
    const user = await User.findByIdAndUpdate(userId, { image }, { new: true });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Update all posts by this user to reflect the new image
    await (await import('@/models/Post')).default.updateMany(
      { userId: userId },
      { authorImage: image }
    );

    return NextResponse.json({ message: 'Profile image updated', image: user.image }, { status: 200 });
  } catch (error) {
    console.error('Profile image update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
