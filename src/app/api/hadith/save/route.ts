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
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);
    const userId = decoded.userId;

    const hadith = await req.json();

    if (!hadith || !hadith.hadithNumber || !hadith.bookName) {
      return NextResponse.json({ message: 'Invalid hadith data' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // Check if already saved
    const alreadySavedIndex = user.savedHadiths.findIndex((h: any) => 
      h.hadithNumber === hadith.hadithNumber && h.bookName === hadith.bookName
    );

    if (alreadySavedIndex > -1) {
      // Unsave
      user.savedHadiths.splice(alreadySavedIndex, 1);
      await user.save();
      return NextResponse.json({ message: 'Hadith removed from collection', isSaved: false });
    } else {
      // Save
      user.savedHadiths.push({
        ...hadith,
        addedAt: new Date()
      });
      await user.save();
      return NextResponse.json({ message: 'Hadith saved to collection', isSaved: true });
    }

  } catch (error) {
    console.error('Save hadith error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
    try {
      const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
      const token = cookieStore.get('hidayah_token')?.value;
      if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  
      const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
      const decoded: any = jwt.verify(token, secret);
      const userId = decoded.userId;
  
      await dbConnect();
      const user = await User.findById(userId).select('savedHadiths');
      if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
  
      return NextResponse.json({ savedHadiths: user.savedHadiths });
  
    } catch (error) {
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  }
