export function generateStaticParams() { return [{ id: '1' }]; }

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;
    if (!content || !content.trim()) {
      return NextResponse.json({ message: 'Content is required' }, { status: 400 });
    }

    await dbConnect();
    const { id: postId } = await params;
    const post = await Post.findById(postId);
    
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
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

    // Create Notification if it's not the author's own post
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
    }, { status: 200 });

  } catch (error) {
    console.error('Error replying to post:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
