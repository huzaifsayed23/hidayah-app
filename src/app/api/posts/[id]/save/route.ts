import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('hidayah_token')?.value;
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    return jwt.verify(token, secret) as any;
  } catch(e) {
    return null;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await getUser();
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Unauthorized or missing userId' }, { status: 401 });
    }

    await dbConnect();
    const { id: postId } = await params;
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (!user.savedPosts) {
      user.savedPosts = [];
    }

    const postIdStr = postId.toString();
    const hasSaved = user.savedPosts.some((id: any) => id.toString() === postIdStr);

    if (hasSaved) {
      user.savedPosts = user.savedPosts.filter((id: any) => id.toString() !== postIdStr);
    } else {
      user.savedPosts.push(postId);
    }

    await user.save();

    return NextResponse.json({ 
      hasSaved: !hasSaved 
    }, { status: 200 });

  } catch (error) {
    console.error('Error saving post:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
