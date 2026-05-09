export function generateStaticParams() { return [{ id: '1' }]; }

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getUser() {
  const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
  const token = cookieStore.get('hidayah_token')?.value;
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    return jwt.verify(token, secret) as any;
  } catch(e) {
    return null;
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id: postId } = await params;

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // Check ownership
    if (post.userId.toString() !== user.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await Post.findByIdAndDelete(postId);

    return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
