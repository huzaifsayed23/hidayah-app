export function generateStaticParams() { return []; }

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import QuizProgress from '@/models/QuizProgress';
import { BADGES, REFLECTION_THEMES } from '@/constants/rewards';



export async function GET() {
  try {
    let token = null;
    try {
      const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
      token = cookieStore.get('hidayah_token')?.value;
    } catch (e) {
      // Ignore during build
    }

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);
    const userId = decoded.userId;

    await dbConnect();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Sync badges & backgrounds with QuizProgress
    try {
      const progress = await QuizProgress.findOne({ userId });
      if (progress) {
        const completedLevels = progress.completedLevels || [];
        let updated = false;
        
        if (!user.unlockedBadges) user.unlockedBadges = [];
        if (!user.unlockedBackgrounds) user.unlockedBackgrounds = [];
        
        // 1. Sync Badges
        const validBadgeIds = BADGES.filter(b => completedLevels.includes(b.levelRequired)).map(b => b.id);
        const filteredBadges = user.unlockedBadges.filter((bid: string) => validBadgeIds.includes(bid));
        
        if (filteredBadges.length !== user.unlockedBadges.length) {
          user.unlockedBadges = filteredBadges;
          updated = true;
        }

        for (const badgeId of validBadgeIds) {
          if (!user.unlockedBadges.includes(badgeId)) {
            user.unlockedBadges.push(badgeId);
            updated = true;
          }
        }

        // 2. Sync Backgrounds (Themes)
        const validThemeIds = REFLECTION_THEMES.filter(t => completedLevels.includes(t.levelRequired)).map(t => t.id);
        const filteredThemes = user.unlockedBackgrounds.filter((tid: string) => validThemeIds.includes(tid));

        if (filteredThemes.length !== user.unlockedBackgrounds.length) {
          user.unlockedBackgrounds = filteredThemes;
          updated = true;
        }

        for (const themeId of validThemeIds) {
          if (!user.unlockedBackgrounds.includes(themeId)) {
            user.unlockedBackgrounds.push(themeId);
            updated = true;
          }
        }

        if (updated) {
          user.markModified('unlockedBadges');
          user.markModified('unlockedBackgrounds');
          await user.save();
        }
      }
    } catch (syncError) {
      console.error('Progress sync error:', syncError);
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {

  try {
    const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
    const token = cookieStore.get('hidayah_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);
    const userId = decoded.userId;

    const { bio, username, lastReadPage } = await req.json();

    await dbConnect();
    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (username !== undefined) updateData.username = username;
    if (lastReadPage !== undefined) updateData.lastReadPage = lastReadPage;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // If username changed, update all posts too
    if (username) {
        const Post = (await import('@/models/Post')).default;
        await Post.updateMany({ userId: userId }, { authorName: username });
    }

    return NextResponse.json({ message: 'Profile updated', user }, { status: 200 });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
    const token = cookieStore.get('hidayah_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);
    const userId = decoded.userId;

    await dbConnect();
    
    // Delete user's posts
    const Post = (await import('@/models/Post')).default;
    await Post.deleteMany({ userId: userId });
    
    // Delete user
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Clear cookie
    cookieStore.delete('hidayah_token');

    return NextResponse.json({ message: 'Account deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
