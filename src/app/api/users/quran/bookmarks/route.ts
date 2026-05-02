export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('hidayah_token')?.value;
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);
    return decoded.userId;
  } catch(e) {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const bookmark = await req.json();
    await dbConnect();
    
    // Check if already bookmarked
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    const exists = user.bookmarks.some((b: any) => b.verseKey === bookmark.verseKey);
    
    if (exists) {
      // Remove it
      await User.findByIdAndUpdate(userId, {
        $pull: { bookmarks: { verseKey: bookmark.verseKey } }
      });
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // Add it
      await User.findByIdAndUpdate(userId, {
        $push: { bookmarks: bookmark }
      });
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
    try {
      const userId = await getUserId();
      if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  
      await dbConnect();
      const user = await User.findById(userId).select('bookmarks');
      if (!user) return NextResponse.json({ bookmarks: [] });
      return NextResponse.json({ bookmarks: user.bookmarks });
    } catch (error) {
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  }
