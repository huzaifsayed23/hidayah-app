export function generateStaticParams() { return [{ id: '1' }]; }

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';
import Post from '@/models/Post';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getAuthUser() {
  const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
  const token = cookieStore.get('hidayah_token')?.value;
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    return jwt.verify(token, secret) as any;
  } catch (e) {
    return null;
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const user = await getAuthUser();
    const isAdmin = user?.email === 'huzaifsayed454@gmail.com'; 
    if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { action } = await req.json(); // 'delete', 'dismiss', 'warn', 'suspend'

    await dbConnect();
    const User = (await import('@/models/User')).default;

    const report = await Report.findById(reportId);
    if (!report) return NextResponse.json({ message: 'Report not found' }, { status: 404 });

    if (action === 'delete') {
      if (report.postId) {
        await Post.findByIdAndDelete(report.postId);
      } else if (report.reportedUserId) {
        // For user reports, 'delete' might mean suspend/ban
        await User.findByIdAndUpdate(report.reportedUserId, { isSuspended: true });
      }
      report.status = 'resolved';
    } else if (action === 'dismiss') {
      report.status = 'dismissed';
      if (report.postId) {
        const post = await Post.findById(report.postId);
        if (post) {
          post.reportCount = 0;
          post.isVisible = true;
          await post.save();
        }
      }
    } else if (action === 'warn') {
      // Find target user (either post author or reported user)
      let targetUserId = report.reportedUserId;
      if (!targetUserId && report.postId) {
        const post = await Post.findById(report.postId);
        targetUserId = post?.userId;
      }

      if (targetUserId) {
        const targetUser = await User.findById(targetUserId);
        if (targetUser) {
          targetUser.warningCount = (targetUser.warningCount || 0) + 1;
          // Auto-suspend on 2nd warning
          if (targetUser.warningCount >= 2) {
            targetUser.isSuspended = true;
          }
          await targetUser.save();
        }
      }
      report.status = 'resolved';
    } else if (action === 'suspend') {
      let targetUserId = report.reportedUserId;
      if (!targetUserId && report.postId) {
        const post = await Post.findById(report.postId);
        targetUserId = post?.userId;
      }
      if (targetUserId) {
        await User.findByIdAndUpdate(targetUserId, { isSuspended: true });
      }
      report.status = 'resolved';
    }

    await report.save();

    return NextResponse.json({ message: `Report ${action}ed successfully` });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
