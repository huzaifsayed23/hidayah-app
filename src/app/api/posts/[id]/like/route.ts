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

    await dbConnect();
    const { id: postId } = await params;
    const post = await Post.findById(postId);
    
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    const userId = user.userId || user.id || user.email; // Ensure we get a valid ID from the token
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

    // Create Notification if it's a new like and not the author's own post
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
    }, { status: 200 });

  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
