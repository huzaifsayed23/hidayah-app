
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    },
  });
}

/**
 * Consistently handles comment deletion for both DELETE and POST fallback
 */
async function performCommentDeletion(postId: string, replyId: string) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
  };

  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: 'Please sign in to manage comments' }, { status: 401, headers: corsHeaders });
    }

    await dbConnect();
    
    if (!postId || !replyId) {
      return NextResponse.json({ message: 'Missing identifiers' }, { status: 400, headers: corsHeaders });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404, headers: corsHeaders });
    }

    // Ensure replies exists
    if (!post.replies) (post as any).replies = [];
    
    // Find reply
    const replyIndex = post.replies.findIndex((r: any) => {
      const rId = (r._id || r.id || "").toString();
      return rId === replyId;
    });

    if (replyIndex === -1) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404, headers: corsHeaders });
    }

    const reply = post.replies[replyIndex];
    
    // Safety check author (only the comment creator or admins can delete)
    const authorStr = String(reply.author || "").toLowerCase().trim();
    const cleanAuthor = authorStr.startsWith('@') ? authorStr.substring(1) : authorStr;
    
    const currentUsername = String(user.username || "").toLowerCase().trim();
    const userEmail = String(user.email || "").toLowerCase();

    const isAuthor = cleanAuthor !== "" && currentUsername !== "" && cleanAuthor === currentUsername;
    const isGlobalAdmin = ['huzaifsayed454@gmail.com', 'huzaifsayed23@gmail.com'].includes(userEmail) || (user && user.isAdmin);

    if (!isAuthor && !isGlobalAdmin) {
      return NextResponse.json({ message: 'You do not have permission to delete this comment' }, { status: 403, headers: corsHeaders });
    }

    // Perform atomic deletion using $pull
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { 
        $pull: { replies: { _id: replyId } },
        $inc: { commentCount: -1 }
      },
      { new: true }
    );

    if (!updatedPost) {
      return NextResponse.json({ message: 'Failed to update post' }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ 
      message: 'Comment deleted', 
      commentCount: updatedPost.commentCount 
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Comment Deletion Error:', error);
    return NextResponse.json({ 
      message: `Server Error: ${error.message || 'Unknown'}` 
    }, { status: 500, headers: corsHeaders });
  }
}

/**
 * Handles liking/unliking comments
 */
async function performCommentLike(postId: string, replyId: string) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
  };

  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: 'Please sign in to like comments' }, { status: 401, headers: corsHeaders });
    }

    await dbConnect();
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404, headers: corsHeaders });
    }

    const reply = post.replies.find((r: any) => (r._id || r.id || "").toString() === replyId);
    if (!reply) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404, headers: corsHeaders });
    }

    const username = (user.username || user.email.split('@')[0]).replace(/^@/, '').trim().toLowerCase();
    
    if (!reply.likes) reply.likes = [];
    const index = reply.likes.indexOf(username);
    
    if (index === -1) {
      await Post.updateOne(
        { _id: postId, "replies._id": replyId },
        { $addToSet: { "replies.$.likes": username } }
      );
      reply.likes.push(username);
    } else {
      await Post.updateOne(
        { _id: postId, "replies._id": replyId },
        { $pull: { "replies.$.likes": username } }
      );
      reply.likes.splice(index, 1);
    }

    return NextResponse.json({ 
      message: 'Comment like toggled', 
      likes: reply.likes 
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Comment Like Error:', error);
    return NextResponse.json({ 
      message: `Server Error: ${error.message || 'Unknown'}` 
    }, { status: 500, headers: corsHeaders });
  }
}

/**
 * Handles reporting comments
 */
async function performCommentReport(postId: string, replyId: string) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
  };

  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: 'Please sign in to report comments' }, { status: 401, headers: corsHeaders });
    }

    await dbConnect();
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404, headers: corsHeaders });
    }

    const reply = post.replies.find((r: any) => (r._id || r.id || "").toString() === replyId);
    if (!reply) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404, headers: corsHeaders });
    }

    const username = (user.username || user.email.split('@')[0]).replace(/^@/, '').trim().toLowerCase();
    
    await Post.updateOne(
      { _id: postId, "replies._id": replyId },
      { $addToSet: { "replies.$.reports": username } }
    );

    // Also create an official Report document so the admin can see it
    const Report = (await import('@/models/Report')).default;
    await Report.create({
      reporterId: user.userId,
      postId: postId,
      reason: "Inappropriate Content", // Default fallback since the old UI didn't ask for a reason
      details: `Comment Report: User reported comment ${replyId} by ${reply.author}. Comment text: "${reply.content}"`
    });

    return NextResponse.json({ 
      message: 'Comment reported successfully'
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Comment Report Error:', error);
    if (error.code === 11000) {
      // Ignore duplicate report errors
      return NextResponse.json({ message: 'Comment reported successfully' }, { status: 200, headers: corsHeaders });
    }
    return NextResponse.json({ 
      message: `Server Error: ${error.message || 'Unknown'}` 
    }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(
  req: Request,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const postId = resolvedParams.id;
    
    const url = new URL(req.url, 'http://localhost');
    const replyId = url.searchParams.get('replyId');
    const action = url.searchParams.get('action');
    
    // 1. Check for action fallbacks
    if (action === 'delete' && replyId) {
      return performCommentDeletion(postId, replyId);
    }
    if (action === 'like' && replyId) {
      return performCommentLike(postId, replyId);
    }
    if (action === 'report' && replyId) {
      return performCommentReport(postId, replyId);
    }

    // 2. Standard reply/comment creation
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const body = await req.json();
    const { content, parentId } = body;
    if (!content?.trim()) {
      return NextResponse.json({ message: 'Content is required' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    await dbConnect();
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    let authorName = user.username ? `@${user.username}` : user.email.split('@')[0];
    const newReply = {
      author: authorName,
      content: content.trim(),
      createdAt: new Date(),
      likes: [],
      parentId: parentId || null
    };

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { replies: newReply as any },
        $inc: { commentCount: 1 }
      },
      { new: true }
    );

    if (!updatedPost) {
      return NextResponse.json({ message: 'Failed to update post' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Get the newly added reply with its database-generated _id
    const savedReply = updatedPost.replies[updatedPost.replies.length - 1];

    // Handle Notifications
    try {
      const senderName = user.username || (user.email ? user.email.split('@')[0] : 'User');
      
      if (!parentId) {
        // Top-level comment: Notify post owner
        if (post.userId && post.userId.toString() !== user.userId.toString()) {
          await Notification.create({
            recipientId: post.userId,
            senderId: user.userId,
            senderName: senderName,
            type: 'comment',
            postId: postId,
            commentText: content.trim()
          });
          await pusherServer.trigger(`user-${post.userId.toString()}`, 'notification', {
            type: 'comment',
            message: `${senderName} commented on your reflection 💬`
          });
        }
      } else {
        // Reply: Notify parent comment owner
        const parentComment = post.replies.find((r: any) => (r._id || r.id || "").toString() === parentId);
        if (parentComment) {
          const parentAuthorUsername = parentComment.author.replace(/^@/, '');
          const User = (await import('@/models/User')).default;
          const parentUser = await User.findOne({ username: parentAuthorUsername });
          
          if (parentUser && parentUser._id.toString() !== user.userId.toString()) {
            await Notification.create({
              recipientId: parentUser._id,
              senderId: user.userId,
              senderName: senderName,
              type: 'comment',
              postId: postId,
              commentText: content.trim()
            });
            await pusherServer.trigger(`user-${parentUser._id.toString()}`, 'notification', {
              type: 'comment',
              message: `${senderName} replied to your comment`
            });
          }
        }
      }
    } catch (notificationErr) {
      console.error('Comment notification error:', notificationErr);
    }

    return NextResponse.json({ 
      reply: savedReply,
      commentCount: updatedPost.commentCount
    }, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });

  } catch (error: any) {
    return NextResponse.json({ message: `Reply Error: ${error.message}` }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: any }
) {
  const resolvedParams = await params;
  const postId = resolvedParams.id;
  const url = new URL(req.url, 'http://localhost');
  const replyId = url.searchParams.get('replyId');
  
  if (!replyId) return NextResponse.json({ message: 'Missing replyId' }, { status: 400 });
  
  return performCommentDeletion(postId, replyId);
}

export async function GET(
  req: Request,
  { params }: { params: any }
) {
  const resolvedParams = await params;
  const postId = resolvedParams.id;
  const url = new URL(req.url, 'http://localhost');
  const replyId = url.searchParams.get('replyId');
  const action = url.searchParams.get('action');
  
  if (action === 'delete' && replyId) {
    return performCommentDeletion(postId, replyId);
  }
  if (action === 'like' && replyId) {
    return performCommentLike(postId, replyId);
  }
  if (action === 'report' && replyId) {
    return performCommentReport(postId, replyId);
  }

  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}

