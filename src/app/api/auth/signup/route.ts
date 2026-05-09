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
    await dbConnect();
    
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const { username, email, password, image } = body;

    if (!username || !email || !password || password.length < 6) {
      return NextResponse.json(
        { message: 'Invalid credentials or missing fields' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { message: 'Email already exists' },
        {
          status: 409,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { message: 'That username already exists. Please try a different username.' },
        {
          status: 409,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      image: image || null,
    });

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, username: user.username },
      jwtSecret,
      { expiresIn: '7d' }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieStore = (await cookies().catch(() => null));
    
    if (cookieStore) {
      try {
        cookieStore.set('hidayah_token', token, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'lax',
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: '/',
        });
      } catch (e) {
        console.warn("Cookie set failed (likely static export mode)");
      }
    }


    return NextResponse.json(
      { message: 'Account created successfully', userId: user._id, acceptedTerms: user.acceptedTerms, token },
      {
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
    
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
