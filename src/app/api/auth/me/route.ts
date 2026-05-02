export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    // Try cookie first
    const cookieStore = await cookies();
    let token = cookieStore.get('hidayah_token')?.value;

    // Fallback: try Authorization Bearer header (for localStorage-based auth)
    if (!token) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

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
