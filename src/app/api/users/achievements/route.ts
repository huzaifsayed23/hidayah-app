export function generateStaticParams() { return []; }
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';


async function getUser() {
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
    const user = await getUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const dbUser = await User.findById(user.userId).select('unlockedBadges unlockedBackgrounds');

    if (!dbUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    return NextResponse.json({ 
      badges: dbUser.unlockedBadges || [],
      backgrounds: dbUser.unlockedBackgrounds || []
    });
  } catch (error) {
    console.error('Achievements fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
