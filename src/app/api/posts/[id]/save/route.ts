

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

import { getAuthUser } from '@/lib/auth';

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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await getAuthUser();
    if (!decoded || (!decoded.userId && !decoded.id)) {
      return NextResponse.json({ message: 'Unauthorized or missing userId' }, { 
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const userId = decoded.userId || decoded.id;

    await dbConnect();
    const { id: postId } = await params;
    
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { 
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (!user.savedPosts) {
      user.savedPosts = [];
    }

    const postIdStr = postId.toString();
    const hasSaved = user.savedPosts.some((id: any) => id.toString() === postIdStr);

    if (hasSaved) {
      user.savedPosts = user.savedPosts.filter((id: any) => id.toString() !== postIdStr);
    } else {
      user.savedPosts.push(postId as any);
    }

    await user.save();

    return NextResponse.json({ 
      hasSaved: !hasSaved 
    }, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Error saving post:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
