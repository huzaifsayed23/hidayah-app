


import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';




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
    const tab = url.searchParams.get('tab');

    const authUser = await getAuthUser();
    const currentUserId = authUser?.userId || authUser?.id;

    const query: any = { isVisible: { $ne: false } };
    if (userId && tab !== 'saved') {
      query.userId = userId;
    }
    if (mood && mood !== 'All') {
      query.moodTag = mood;
    }

    // Special logic for profile 'saved' tab
    if (tab === 'saved' && currentUserId) {
      const User = (await import('@/models/User')).default;
      const user = await User.findById(currentUserId).select('savedPosts');
      if (user && user.savedPosts && user.savedPosts.length > 0) {
        // Ensure we are querying by ObjectIds
        const savedIds = user.savedPosts.map((id: any) => id.toString());
        query._id = { $in: savedIds };
      } else {
        return NextResponse.json({ posts: [], page: 1, limit: 50 }, { status: 200 });
      }
    }

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Mark as saved if user is logged in
    let savedPostIds: string[] = [];
    if (currentUserId) {
      const User = (await import('@/models/User')).default;
      const user = await User.findById(currentUserId).select('savedPosts');
      if (user) {
        savedPostIds = user.savedPosts.map((id: any) => id.toString());
      }
    }

    const postsWithSavedStatus = posts.map((post: any) => ({
      ...post,
      isSaved: savedPostIds.includes(post._id.toString())
    }));

    return NextResponse.json({ posts: postsWithSavedStatus, page, limit }, { status: 200 });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    // Fetch full user doc to ensure we have the latest username/image
    const User = (await import('@/models/User')).default;
    const userDoc = await User.findById(user.userId).lean() as any;

    let authorName = userDoc?.username;
    if (!authorName) {
      authorName = userDoc?.email ? userDoc.email.split('@')[0] : 'User';
    }

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
