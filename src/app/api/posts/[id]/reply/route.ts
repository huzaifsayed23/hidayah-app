

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
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { 
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const body = await req.json();
    const { content } = body;
    if (!content || !content.trim()) {
      return NextResponse.json({ message: 'Content is required' }, { 
        status: 400,
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

    let authorName = `@${user.username}`;
    if (!user.username) {
      const prefix = user.email.split('@')[0];
      authorName = prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[0-9]/g, '');
    }

    const newReply = {
      author: authorName,
      content: content.trim(),
      createdAt: new Date()
    };

    if (!post.replies) (post as any).replies = [];
    post.replies.push(newReply as any);
    post.commentCount = post.replies.length;
    await post.save();

    const currentUserId = user.userId || user.id || user.email;
    if (post.userId && post.userId.toString() !== currentUserId) {
      try {
        const Notification = (await import('@/models/Notification')).default;
        
        let senderName = user.username;
        if (!senderName) {
          const prefix = user.email.split('@')[0];
          senderName = prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[0-9]/g, '');
        }

        await Notification.create({
          recipientId: post.userId,
          senderId: currentUserId,
          senderName: senderName,
          type: 'comment',
          postId: post._id,
          postExcerpt: post.content ? post.content.substring(0, 50) : "Verse post",
          commentText: content.trim(),
          moodTag: post.moodTag,
          backdropVariant: post.backdropVariant,
        });
      } catch (err) {
        console.error('Error creating notification:', err);
      }
    }

    return NextResponse.json({ 
      reply: newReply,
      commentCount: post.commentCount
    }, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Error replying to post:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
