
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { getAuthUser } from '@/lib/auth';

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
    
    // Safety check author
    const authorStr = String(reply.author || "").toLowerCase().trim();
    const cleanAuthor = authorStr.startsWith('@') ? authorStr.substring(1) : authorStr;
    
    const currentUsername = String(user.username || "").toLowerCase().trim();
    const currentUserId = String(user.userId || user.id || "").trim();
    const postOwnerId = String(post.userId || "").trim();
    const userEmail = String(user.email || "").toLowerCase();

    const isAuthor = cleanAuthor !== "" && currentUsername !== "" && cleanAuthor === currentUsername;
    const isOwner = postOwnerId !== "" && currentUserId !== "" && postOwnerId === currentUserId;
    const isGlobalAdmin = ['huzaifsayed454@gmail.com', 'huzaifsayed23@gmail.com'].includes(userEmail);

    if (!isAuthor && !isOwner && !isGlobalAdmin) {
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

export async function POST(
  req: Request,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const postId = resolvedParams.id;
    
    // 1. Check for deletion fallback
    const url = new URL(req.url, 'http://localhost');
    const replyId = url.searchParams.get('replyId');
    const isDelete = url.searchParams.get('action') === 'delete';
    
    if (isDelete && replyId) {
      return performCommentDeletion(postId, replyId);
    }

    // 2. Standard reply creation
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const body = await req.json();
    const { content } = body;
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
      createdAt: new Date()
    };

    if (!post.replies) (post as any).replies = [];
    post.replies.push(newReply as any);
    post.commentCount = post.replies.length;
    await post.save();

    // Get the newly added reply with its database-generated _id
    const savedReply = post.replies[post.replies.length - 1];

    return NextResponse.json({ 
      reply: savedReply,
      commentCount: post.commentCount
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
  const isDelete = url.searchParams.get('action') === 'delete';
  
  if (isDelete && replyId) {
    return performCommentDeletion(postId, replyId);
  }

  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
