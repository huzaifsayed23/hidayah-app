import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';

export async function POST(req: Request, { params }: { params: any }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const postId = resolvedParams.id;

    await dbConnect();
    
    const viewerUserId = user.userId || user.id;

    // Check if the user has already viewed
    const post = await Post.findById(postId).select('viewers');
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    const hasViewed = post.viewers && post.viewers.some((v: any) => v.userId.toString() === viewerUserId.toString());
    
    if (!hasViewed) {
      // Get viewer details to store so we don't have to populate later
      const dbUser = await User.findById(viewerUserId).select('username image').lean() as any;
      const username = dbUser?.username || user.email?.split('@')[0] || 'User';
      const userImage = dbUser?.image || null;

      await Post.updateOne(
        { _id: postId },
        { 
          $push: { 
            viewers: {
              userId: viewerUserId,
              username: username,
              userImage: userImage,
              viewedAt: new Date()
            }
          }
        }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error recording view:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
