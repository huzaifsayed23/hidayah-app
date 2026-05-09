export function generateStaticParams() { return []; }

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST() {
  try {
    const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
    const token = cookieStore.get('hidayah_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);

    await dbConnect();
    await User.findByIdAndUpdate(decoded.userId, { acceptedTerms: true });

    return NextResponse.json({ message: 'Terms accepted' }, { status: 200 });

  } catch (error) {
    console.error('Accept terms error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
