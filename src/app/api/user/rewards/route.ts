


import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
    const token = cookieStore.get('hidayah_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);
    const userId = decoded.userId || decoded.email;

    await dbConnect();
    const isEmail = userId.includes('@');
    const user = isEmail 
      ? await User.findOne({ email: userId }).select('unlockedBadges unlockedBackgrounds').lean() 
      : await User.findById(userId).select('unlockedBadges unlockedBackgrounds').lean();

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      unlockedBadges: user.unlockedBadges || [],
      unlockedBackgrounds: user.unlockedBackgrounds || [],
    });
  } catch (error) {
    console.error('Rewards API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
