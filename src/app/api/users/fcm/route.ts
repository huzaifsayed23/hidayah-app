import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { token } = await req.json();
    if (!token) return NextResponse.json({ message: 'Token is required' }, { status: 400 });

    await dbConnect();
    
    // Use findByIdAndUpdate with $addToSet to avoid duplicates
    await User.findByIdAndUpdate(user.userId, {
      $addToSet: { fcmTokens: token }
    });

    return NextResponse.json({ message: 'Token registered successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('FCM Registration error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
