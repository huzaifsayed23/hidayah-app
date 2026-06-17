
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

    const { username, name, email, password, image } = body;
    const finalUsername = username || name;

    if (!finalUsername || !email || !password || password.length < 6) {
      return NextResponse.json(
        { message: 'Invalid credentials or missing fields' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 2. Check for existing email
    try {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return NextResponse.json(
          { message: 'Email already exists' },
          { status: 409, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
    } catch (e: any) {
      throw new Error(`Email Check Error: ${e.message}`);
    }

    // 3. Check for existing username
    try {
      const existingUsername = await User.findOne({ username: finalUsername });
      if (existingUsername) {
        return NextResponse.json(
          { message: 'That username already exists. Please try a different username.' },
          { status: 409, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
    } catch (e: any) {
      throw new Error(`Username Check Error: ${e.message}`);
    }

    // 4. Create User
    let user;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        username: finalUsername,
        email,
        password: hashedPassword,
        image: image || null,
      });
    } catch (e: any) {
      throw new Error(`User Creation Error: ${e.message}`);
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
        message: 'Account created successfully', 
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
    console.error('Signup error:', error);
    
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
