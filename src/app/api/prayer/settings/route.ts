


import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import UserPrayerSettings from '@/models/UserPrayerSettings';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';

async function getUserId() {
  const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
  const token = cookieStore.get('hidayah_token')?.value;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

export async function GET() {
  await dbConnect();
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const settings = await UserPrayerSettings.findOne({ userId });
    return NextResponse.json(settings || {});
  } catch (error) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const settings = await UserPrayerSettings.findOneAndUpdate(
      { userId },
      { ...body, userId },
      { upsert: true, new: true }
    );
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
