
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { getAuthUser } from '@/lib/auth';
import Notification from '@/models/Notification';
import { pusherServer } from '@/lib/pusher-server';

export const dynamic = 'force-dynamic';

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
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.userId || decoded.id;
    await dbConnect();

    const { id: postId } = await params;
    const post = await Post.findById(postId);

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    const hasLiked = post.ameens.includes(userId);

    if (hasLiked) {
      // Use atomic update for reliability
      await Post.findByIdAndUpdate(postId, { 
        $pull: { ameens: userId },
        $inc: { ameenCount: -1 }
      });
    } else {
      // Use atomic update for reliability
      await Post.findByIdAndUpdate(postId, { 
        $addToSet: { ameens: userId },
        $inc: { ameenCount: 1 }
      });

      // Trigger notification if not self-like
      if (post.userId.toString() !== userId.toString()) {
        const User = (await import('@/models/User')).default;
        const sender = await User.findById(userId).select('username email');
        if (sender) {
          const fallbackName = sender.username || (sender.email ? sender.email.split('@')[0] : 'User');
          try {
            await Notification.create({
              recipientId: post.userId,
              senderId: userId,
              senderName: fallbackName,
              type: 'like',
              postId: postId,
            });

            await pusherServer.trigger(`user-${post.userId.toString()}`, 'notification', {
              type: 'like',
              message: `${fallbackName} liked your reflection ❤️`
            });
          } catch (e) {
            console.error('Like notification error:', e);
          }
        }
      }
    }

    // Return the updated counts/status
    const updatedPost = await Post.findById(postId).select('ameenCount ameens');

    return NextResponse.json({ 
      hasLiked: !hasLiked,
      ameenCount: Math.max(0, updatedPost?.ameenCount || 0)
    }, { status: 200 });

  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
