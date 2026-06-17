
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    },
  });
}

export async function GET(req: Request) {
  try {
    const userSession = await getAuthUser();

    if (!userSession) {
      return NextResponse.json({ authenticated: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findById(userSession.userId).select('username email acceptedTerms');
    
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Auto-fix for admin username if needed
    if (user.email?.toLowerCase() === 'huzaifsayed454@gmail.com' && user.username !== 'HuzaifSayed') {
      user.username = 'HuzaifSayed';
      await user.save();
    } else if (!user.username) {
      user.username = user.email ? user.email.split('@')[0] : 'User' + Math.floor(Math.random() * 1000);
      await user.save();
    }

    return NextResponse.json({ 
      authenticated: true,
      id: user._id,
      username: user.username,
      email: user.email,
      acceptedTerms: user.acceptedTerms || false,
      isAdmin: ['huzaifsayed454@gmail.com', 'huzaifsayed23@gmail.com'].includes(user.email?.toLowerCase())
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
