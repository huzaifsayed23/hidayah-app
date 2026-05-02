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
  } catch (e) {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getAuthUser();
    
    // Strict Admin Check
    const isAdmin = user?.email === 'huzaifsayed454@gmail.com';
    if (!isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Fetch all users sorted by most recently joined
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select('username email createdAt isSuspended warningCount');

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
