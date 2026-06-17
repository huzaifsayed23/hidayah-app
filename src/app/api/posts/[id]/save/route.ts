
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: any }
) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
  };

  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: 'Please sign in to save reflections' }, { status: 401, headers: corsHeaders });
    }

    const userId = user.userId || user.id;
    if (!userId) {
      return NextResponse.json({ message: 'User identity not found' }, { status: 401, headers: corsHeaders });
    }

    await dbConnect();
    const resolvedParams = await params;
    const postId = resolvedParams.id;
    
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ message: 'Valid Post ID is required' }, { status: 400, headers: corsHeaders });
    }

    const Post = (await import('@/models/Post')).default;
    const postObj = await Post.findById(postId);
    if (!postObj) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404, headers: corsHeaders });
    }
    if (postObj.is24h) {
      return NextResponse.json({ message: '24h Reflections cannot be saved permanently' }, { status: 400, headers: corsHeaders });
    }

    const userData = await User.findById(userId);
    if (!userData) {
      return NextResponse.json({ message: 'User not found' }, { status: 404, headers: corsHeaders });
    }

    // Toggle save status atomically
    const postIdObj = new mongoose.Types.ObjectId(postId);
    const hasSaved = userData.savedPosts?.some((id: any) => id?.toString() === postId.toString());

    if (hasSaved) {
      await User.findByIdAndUpdate(userId, { 
        $pull: { savedPosts: postIdObj } 
      });
    } else {
      await User.findByIdAndUpdate(userId, { 
        $addToSet: { savedPosts: postIdObj } 
      });
    }

    return NextResponse.json({ 
      hasSaved: !hasSaved,
      message: hasSaved ? 'Removed from saved' : 'Saved successfully'
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Save Reflection Error:', error);
    return NextResponse.json({ 
      message: `Save Error: ${error.message || 'Unknown'}` 
    }, { status: 500, headers: corsHeaders });
  }
}

// Support GET for checking status or as a fallback
export async function GET(
  req: Request,
  { params }: { params: any }
) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
  };

  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ isSaved: false }, { status: 200, headers: corsHeaders });

    const userId = user.userId || user.id;
    await dbConnect();
    const resolvedParams = await params;
    const postId = resolvedParams.id;

    const userData = await User.findById(userId);
    const isSaved = userData?.savedPosts?.some((id: any) => id?.toString() === postId.toString()) || false;

    return NextResponse.json({ isSaved }, { status: 200, headers: corsHeaders });
  } catch (e) {
    return NextResponse.json({ isSaved: false }, { status: 200, headers: corsHeaders });
  }
}
