export function generateStaticParams() { return []; }

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Helper to get authenticated user
async function getUser(req?: Request) {
  let token = null;
  try {
    const cookieStore = (await cookies().catch(() => null));
    token = cookieStore?.get('hidayah_token')?.value;
  } catch (e) {}

  if (!token && req) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    return jwt.verify(token, secret) as any;
  } catch(e) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    try {
      await dbConnect();
    } catch (e) {
      return NextResponse.json({ posts: [], page: 1, limit: 50 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const mood = url.searchParams.get('mood');

    const query: any = { isVisible: { $ne: false } };
    if (userId) {
      query.userId = userId;
    }
    if (mood && mood !== 'All') {
      query.moodTag = mood;
    }

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ posts, page, limit }, { status: 200 });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    // Use the actual username, fallback to email prefix if an old account
    let authorName = user.username;
    if (!authorName) {
      const prefix = user.email.split('@')[0];
      authorName = prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[0-9]/g, '');
    }

    const User = (await import('@/models/User')).default;
    const userDoc = await User.findById(user.userId).lean() as any;

    const newPost = await Post.create({
      userId: user.userId,
      authorName: authorName,
      authorImage: userDoc?.image || null,
      content: body.content,
      moodTag: body.moodTag || 'Reflective',
      themePalette: body.themePalette || body.moodTag || 'Reflective',
      backdropVariant: body.backdropVariant || 0,
      verse: body.verse || null,
      hadith: body.hadith || null,
      reflectionThemeId: body.reflectionThemeId || null,
      textColor: body.textColor || null,
      customBackgroundImage: body.customBackgroundImage || null,
    });

    return NextResponse.json({ post: newPost }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
