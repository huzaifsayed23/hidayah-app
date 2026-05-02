import React from 'react';
import { Search, Bell, Plus, UserCircle } from 'lucide-react';
import Link from 'next/link';
import FeedCard from '@/components/community/FeedCard';
import CommunityFeed from '@/components/community/CommunityFeed';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import BottomNav from '@/components/BottomNav';

const MOODS = ["All", "Peaceful", "Grateful", "Hopeful", "Reflective", "Seeking Sabr"];

const MOCK_POSTS = [
  {
    id: "1",
    author: "Zayd",
    timeAgo: "2 hours ago",
    moodTag: "Reflective",
    content: "Sometimes the most profound answers come when we finally stop rushing and learn to sit in silence. Trust His timing.",
    verse: {
      surah: "Al-Baqarah",
      ayah: 153,
      text: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ"
    },
    ameenCount: 12,
    commentCount: 3,
  },
  {
    id: "2",
    author: "Aisha",
    timeAgo: "5 hours ago",
    moodTag: "Grateful",
    content: "Alhamdulillah for the small mercies we overlook every day. The cool breeze, the ability to breathe easily, a text from a loved one. It all matters.",
    ameenCount: 45,
    commentCount: 0,
  },
  {
    id: "3",
    author: "Omar",
    timeAgo: "1 day ago",
    moodTag: "Seeking Sabr",
    content: "When things don't go as planned, I remind myself that my perspective is limited, but His wisdom is infinite. Still learning to let go.",
    verse: {
      surah: "Ash-Sharh",
      ayah: 5,
      text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا"
    },
    ameenCount: 89,
    commentCount: 12,
  }
];

export const dynamic = "force-dynamic";

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ mood?: string }> }) {
  const { mood } = await searchParams;
  const currentMood = mood || "All";

  const cookieStore = await cookies();
  const token = cookieStore.get('hidayah_token')?.value;
  let userName = "Guest";
  let currentUserId = "";

  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production');
      currentUserId = decoded.userId || decoded.email; // Fallback to email for admin account
      if (decoded.username) {
        userName = `@${decoded.username}`;
      } else {
        const prefix = decoded.email.split('@')[0];
        userName = prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[0-9]/g, '');
      }
    } catch(e) {}
  }

  await dbConnect();

  let userSavedPosts: string[] = [];
  if (currentUserId && currentUserId !== 'admin@gmail.com') {
    const User = (await import('@/models/User')).default;
    const userDoc = await User.findById(currentUserId).lean() as any;
    
    if (userDoc && userDoc.acceptedTerms === false) {
      const { redirect } = await import('next/navigation');
      redirect('/agreement');
    }

    if (userDoc && userDoc.savedPosts) {
      userSavedPosts = userDoc.savedPosts.map((id: any) => id.toString());
    }
  }

  const query = currentMood !== "All" ? { moodTag: currentMood } : {};
  const dbPosts = await Post.find(query).sort({ createdAt: -1 }).lean();
  
  const displayPosts = dbPosts.length > 0 ? dbPosts.map((post: any) => ({
    id: post._id.toString(),
    author: post.authorName,
    timeAgo: new Date(post.createdAt).toLocaleDateString(),
    moodTag: post.moodTag,
    content: post.content,
    verse: post.verse || undefined,
    ameenCount: post.ameenCount || 0,
    commentCount: post.commentCount || 0,
    ameens: post.ameens || [],
    replies: (post.replies || []).map((r: any) => ({
      author: r.author,
      content: r.content,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })),
    backdropVariant: post.backdropVariant,
    themePalette: post.themePalette,
    isSaved: userSavedPosts.includes(post._id.toString()),
    userId: post.userId?.toString(),
    authorImage: post.authorImage,
    hadith: post.hadith || undefined,
    reflectionThemeId: post.reflectionThemeId,
    textColor: post.textColor,
  })) : []; // Do not show mock posts if filtered


  return (
    <div className="min-h-screen pb-24 max-w-2xl mx-auto px-4 sm:px-6 pt-8">
      <CommunityFeed 
        initialPosts={displayPosts} 
        userName={userName} 
        currentUserId={currentUserId}
        moods={MOODS}
        currentMood={currentMood}
      />
      <BottomNav />
    </div>
  );
}
