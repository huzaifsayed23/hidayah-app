import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('hidayah_token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);

    await dbConnect();
    const user = await User.findById(decoded.userId).select('acceptedTerms');

    return NextResponse.json({ 
      authenticated: true,
      id: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      acceptedTerms: user?.acceptedTerms || false,
      isAdmin: decoded.email === 'huzaifsayed454@gmail.com'
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
