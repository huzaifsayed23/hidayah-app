export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';
import Post from '@/models/Post';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('hidayah_token')?.value;
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    return jwt.verify(token, secret) as any;
  } catch (e) {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { postId, reportedUserId, reason, details } = await req.json();
    if (!reason || (!postId && !reportedUserId)) {
      return NextResponse.json({ message: 'Target (Post or User) and reason are required' }, { status: 400 });
    }

    await dbConnect();

    // Create report
    try {
      await Report.create({
        reporterId: user.userId,
        postId,
        reportedUserId,
        reason,
        details
      });
    } catch (err: any) {
      if (err.code === 11000) {
        return NextResponse.json({ message: 'You have already reported this content' }, { status: 400 });
      }
      throw err;
    }

    // Auto-moderation: hide post after 3 reports (Only for posts)
    if (postId) {
      const post = await Post.findById(postId);
      if (post) {
        post.reportCount = (post.reportCount || 0) + 1;
        if (post.reportCount > 3) {
          post.isVisible = false;
        }
        await post.save();
      }
    }

    return NextResponse.json({ message: 'Report submitted successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Report error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    // Admin check: you might want to restrict this to specific emails or roles
    const isAdmin = user?.email === 'huzaifsayed454@gmail.com'; 
    if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const reports = await Report.find({ status: 'pending' })
      .populate('postId')
      .populate('reporterId', 'username email')
      .populate('reportedUserId', 'username email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
