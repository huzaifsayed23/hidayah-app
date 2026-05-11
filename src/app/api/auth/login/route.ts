
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    },
  });
}

export async function POST(req: Request) {
  try {
    // 1. Connect to DB
    try { await dbConnect(); } catch (e: any) { throw new Error(`DB Connection Error: ${e.message}`); }
    
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 2. Find User
    let user;
    try {
      user = await User.findOne({ email }).select('+password');
    } catch (e: any) {
      throw new Error(`User Find Error: ${e.message}`);
    }

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { message: 'Your account has been suspended for community guideline violations.' },
        { status: 403, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 3. Compare Password
    let isMatch;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (e: any) {
      throw new Error(`Password Comparison Error: ${e.message}`);
    }

    if (!isMatch) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 4. Update Profile if Admin
    try {
      if (user.email?.toLowerCase() === 'huzaifsayed454@gmail.com' && user.username !== 'HuzaifSayed') {
        user.username = 'HuzaifSayed';
        await user.save();
      } else if (!user.username) {
        user.username = user.email ? user.email.split('@')[0] : 'User' + Math.floor(Math.random() * 1000);
        await user.save();
      }
    } catch (e: any) {
      throw new Error(`Profile Update Error: ${e.message}`);
    }

    // 5. Generate JWT
    let token;
    let step = "JWT Signing";
    try {
      const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
      token = jwt.sign(
        { userId: user._id.toString(), email: user.email, username: user.username },
        jwtSecret,
        { expiresIn: '7d' }
      );
    } catch (e: any) {
      throw new Error(`JWT Signing Error: ${e.message}`);
    }

    step = "Cookie Setting";
    const isProduction = process.env.NODE_ENV === 'production';
    let cookieStore = null;
    try {
      cookieStore = await cookies();
    } catch (e) {
      console.warn("Cookies access failed:", e);
    }
    
    if (cookieStore) {
      try {
        await cookieStore.set('hidayah_token', token, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'lax',
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: '/',
        });
      } catch (e) {
        console.warn("Cookie set failed:", e);
      }
    }


    return NextResponse.json(
      { 
        message: 'Logged in successfully', 
        userId: user._id, 
        acceptedTerms: user.acceptedTerms, 
        token 
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
    
  } catch (error: any) {
    console.error('CRITICAL LOGIN ERROR:', error);
    
    // Return more details to help debugging production APK issues
    const errorMessage = error.message || 'Unknown Server Error';
    const isConnectionError = errorMessage.includes('DB Connection') || errorMessage.includes('connection');
    
    return NextResponse.json(
      { 
        message: errorMessage,
        error: true,
        code: isConnectionError ? 'DB_ERROR' : 'AUTH_ERROR',
        env: {
          hasMongo: !!process.env.MONGODB_URI,
          hasJwt: !!process.env.JWT_SECRET,
          nodeEnv: process.env.NODE_ENV
        }
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}
