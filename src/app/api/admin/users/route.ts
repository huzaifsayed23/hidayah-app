


import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getAuthUser() {
  const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
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
    // During static export, 'cookies()' will throw or return empty.
    // We catch it to allow the build to proceed.
    let user = null;
    try {
       user = await getAuthUser();
    } catch (e) {
       // Ignore error during build collection
    }
    
    // Strict Admin Check
    const isAdmin = user?.email?.toLowerCase() === 'huzaifsayed454@gmail.com';
    if (!isAdmin && user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // If no user (e.g. during build), return a placeholder or empty list
    if (!user) {
       return NextResponse.json({ users: [] }, { status: 200 });
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

export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser();
    const isAdmin = user?.email?.toLowerCase() === 'huzaifsayed454@gmail.com';
    if (!isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    // Check if user exists
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // You might also want to delete their posts, replies, etc here
    // For now, let's just delete the user document
    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
