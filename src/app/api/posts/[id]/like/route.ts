

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

    await dbConnect();
    const { id: postId } = await params;
    const post = await Post.findById(postId);
    
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { 
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const userId = user.userId || user.id || user.email;
    if (!post.ameens) post.ameens = [];
    
    const hasLiked = post.ameens.includes(userId);

    if (hasLiked) {
      post.ameens = post.ameens.filter((id: string) => id !== userId);
      post.ameenCount = Math.max(0, post.ameenCount - 1);
    } else {
      post.ameens.push(userId);
      post.ameenCount += 1;
    }

    await post.save();

    if (!hasLiked && post.userId && post.userId.toString() !== userId) {
      try {
        const Notification = (await import('@/models/Notification')).default;
        
        let senderName = user.username;
        if (!senderName) {
          const prefix = user.email.split('@')[0];
          senderName = prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[0-9]/g, '');
        }

        await Notification.create({
          recipientId: post.userId,
          senderId: userId,
          senderName: senderName,
          type: 'like',
          postId: post._id,
          postExcerpt: post.content ? post.content.substring(0, 50) : "Verse post",
          moodTag: post.moodTag,
          backdropVariant: post.backdropVariant,
        });
      } catch (err) {
        console.error('Error creating notification:', err);
      }
    }

    return NextResponse.json({ 
      ameenCount: post.ameenCount,
      hasLiked: !hasLiked
    }, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
