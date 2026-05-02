import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const { username, email, password, image } = await req.json();

    if (!username || !email || !password || password.length < 6) {
      return NextResponse.json(
        { message: 'Invalid credentials or missing fields' },
        { status: 400 }
      );
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 409 }
      );
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { message: 'That username already exists. Please try a different username.' },
        { status: 409 }
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
      { userId: user._id, email: user.email, username: user.username },
      jwtSecret,
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set('hidayah_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return NextResponse.json(
      { message: 'Account created successfully', userId: user._id, acceptedTerms: user.acceptedTerms },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
