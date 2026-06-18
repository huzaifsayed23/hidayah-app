import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Circle from '@/models/Circle';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const currentUserId = user.userId || user.id;
    const userObjectId = new mongoose.Types.ObjectId(currentUserId);

    // 1. Find all private circles where the current user is a member
    const userCircles = await Circle.find({ memberIds: userObjectId, privacy: 'private' }).select('memberIds').lean();
    
    // 2. Gather all member IDs from these circles
    const allowedUserIdsSet = new Set<string>();
    
    // Always include the current user so they can view their own 24h reflections
    allowedUserIdsSet.add(currentUserId.toString());

    for (const circle of userCircles) {
      if (circle.memberIds) {
        for (const memberId of circle.memberIds) {
          allowedUserIdsSet.add(memberId.toString());
        }
      }
    }

    const allowedUserIds = Array.from(allowedUserIdsSet).map(id => new mongoose.Types.ObjectId(id));

    // 3. Find active 24h reflections from allowed users
    const now = new Date();
    const activeStories = await Post.find({
      is24h: true,
      expiresAt: { $gt: now },
      userId: { $in: allowedUserIds },
      isVisible: { $ne: false }
    })
    .sort({ createdAt: 1 }) // Chronological order per user
    .lean();

    // 4. Group stories by user
    const userMap: { [key: string]: any } = {};

    for (const story of activeStories) {
      const uId = story.userId.toString();
      if (!userMap[uId]) {
        // Fetch user basic profile details
        const authorDetails = await User.findById(story.userId).select('username image').lean() as any;
        let displayUsername = authorDetails?.username || story.authorName || 'User';
        if (!displayUsername.startsWith('@')) {
          displayUsername = `@${displayUsername}`;
        }
        userMap[uId] = {
          userId: uId,
          username: displayUsername,
          userImage: authorDetails?.image || story.authorImage || null,
          reflections: []
        };
      }
      userMap[uId].reflections.push({
        _id: story._id.toString(),
        content: story.content || '',
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        reflectionThemeId: story.reflectionThemeId,
        textColor: story.textColor || '#FFFFFF',
        customBackgroundImage: story.customBackgroundImage,
        verse: story.verse,
        hadith: story.hadith,
        moodTag: story.moodTag,
        backdropVariant: story.backdropVariant,
        viewers: uId === currentUserId.toString() ? (story.viewers || []) : []
      });
    }

    // Convert object to array
    const groupedStories = Object.values(userMap);

    // Place current user's stories first, if any
    const currentUserStoriesIndex = groupedStories.findIndex((u: any) => u.userId === currentUserId);
    if (currentUserStoriesIndex > -1) {
      const [currentUserStories] = groupedStories.splice(currentUserStoriesIndex, 1);
      groupedStories.unshift(currentUserStories);
    }

    return NextResponse.json({ stories: groupedStories }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching 24h stories:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
