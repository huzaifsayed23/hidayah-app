import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    await dbConnect();

    // Search users by username or email (since email prefix is used as fallback username)
    // In a real app, you'd have a separate field for searchable username/displayName
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).limit(10).lean();

    // For each user, count their posts
    const usersWithStats = await Promise.all(users.map(async (user: any) => {
      const postCount = await Post.countDocuments({ userId: user._id.toString() });
      return {
        _id: user._id.toString(),
        id: user._id.toString(),
        username: user.username || user.email.split('@')[0],
        displayName: user.username ? `@${user.username}` : user.email.split('@')[0],
        bio: user.bio || "Seeking knowledge and patience.",
        image: user.image,
        joinedAt: user.createdAt,
        postCount: postCount
      };
    }));

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
