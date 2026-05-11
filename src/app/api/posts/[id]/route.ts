

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

import { getAuthUser } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    },
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { 
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    await dbConnect();
    const { id: postId } = await params;

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { 
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Check ownership
    const currentUserId = user.userId || user.id || user.email;
    if (post.userId.toString() !== currentUserId) {
      return NextResponse.json({ message: 'Forbidden' }, { 
        status: 403,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    await Post.findByIdAndDelete(postId);

    return NextResponse.json({ message: 'Post deleted successfully' }, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
