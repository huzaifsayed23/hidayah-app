import React from 'react';
import { ArrowLeft, Calendar, PenTool, Trophy } from 'lucide-react';
import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';
import FeedCard from '@/components/community/FeedCard';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { BADGES } from '@/constants/rewards';
import ReportUserButton from '@/components/profile/ReportUserButton';

export const dynamic = "force-dynamic";

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function PublicProfilePage({ params, searchParams }: PublicProfilePageProps) {
  const { username } = await params;
  
  await dbConnect();

  // Try to find user by username or email prefix
  let userDoc = await User.findOne({ username: username }).lean() as any;
  if (!userDoc) {
    // Try email prefix if no exact username match
    userDoc = await User.findOne({ email: { $regex: `^${username}@`, $options: 'i' } }).lean() as any;
  }

  if (!userDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
          <Link href="/community" className="text-[var(--color-hidayah-gold)] font-bold">Back to Community</Link>
        </div>
      </div>
    );
  }

  const userId = userDoc._id.toString();
  
  // Get current user to check if posts are saved
  const cookieStore = await cookies();
  const token = cookieStore.get('hidayah_token')?.value;
  let currentUserId = "";
  let userSavedPostsIds: string[] = [];

  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production');
      currentUserId = decoded.userId || decoded.email;
      
      const currentUserDoc = await User.findById(currentUserId).lean() as any;
      if (currentUserDoc && currentUserDoc.savedPosts) {
        userSavedPostsIds = currentUserDoc.savedPosts.map((id: any) => id.toString());
      }
    } catch(e) {}
  }

  const userPosts = await Post.find({ userId: userId }).sort({ createdAt: -1 }).lean();
  
  const displayPosts = userPosts.map((post: any) => ({
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
    isSaved: userSavedPostsIds.includes(post._id.toString()),
    userId: post.userId?.toString(),
    authorImage: post.authorImage,
    textColor: post.textColor,
  }));

  const joinedDate = userDoc.createdAt ? new Date(userDoc.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';

  // Get tab from searchParams
  const paramsSearch = await searchParams;
  const currentTab = paramsSearch?.tab || "posts";

  const unlockedBadges = userDoc.unlockedBadges || [];

  return (
    <div className="min-h-screen pb-24 max-w-2xl mx-auto px-4 sm:px-6 pt-8">
      {/* Header */}
      <div className="flex items-center mb-10">
        <Link href="/community" className="p-2.5 rounded-full hover:bg-[var(--color-hidayah-secondary)] transition-colors text-[var(--color-hidayah-dark)] opacity-70 hover:opacity-100 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold font-serif">Community Member</h2>
      </div>

      {/* Profile Info */}
      <div className="bg-[var(--color-hidayah-secondary)]/50 rounded-[32px] p-6 mb-8 border border-[var(--color-hidayah-border)]/30 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-hidayah-gold)] opacity-20"></div>
        
        <div className="w-20 h-20 mx-auto rounded-full bg-white border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-2xl text-[var(--color-hidayah-dark)] mb-4">
          {userDoc.image ? (
            <img src={userDoc.image} alt={username} className="w-full h-full object-cover" />
          ) : (
            username.charAt(0).toUpperCase()
          )}
        </div>
        
        <h1 className="text-2xl font-bold font-serif text-[var(--color-hidayah-dark)] mb-1">
          {userDoc.username ? `@${userDoc.username}` : username}
        </h1>
        
        <p className="text-xs text-[var(--color-hidayah-dark)] opacity-70 italic font-serif leading-relaxed max-w-sm mx-auto mb-5">
          "{userDoc.bio || "Seeking knowledge and patience."}"
        </p>
        
        <div className="flex items-center justify-center gap-5">
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-[var(--color-hidayah-gold)]">{displayPosts.length}</span>
            <span className="text-[9px] uppercase tracking-widest font-bold opacity-40">Reflections</span>
          </div>
          <div className="w-px h-6 bg-[var(--color-hidayah-border)]/50"></div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-[var(--color-hidayah-dark)] opacity-80">{joinedDate}</span>
            <span className="text-[9px] uppercase tracking-widest font-bold opacity-40">Member Since</span>
          </div>
        </div>

        {currentUserId !== userId && (
          <div className="mt-2">
            <ReportUserButton 
              reportedUserId={userId} 
              username={userDoc.username || username} 
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-hidayah-border)]/50 mb-8">
        <Link 
          href={`/profile/${username}?tab=posts`}
          className={`flex-1 pb-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${currentTab === "posts" ? 'text-[var(--color-hidayah-dark)] border-b-2 border-[var(--color-hidayah-gold)]' : 'text-[var(--color-hidayah-dark)] opacity-40 hover:opacity-100'}`}
        >
          Reflections
        </Link>
        <Link 
          href={`/profile/${username}?tab=achievements`}
          className={`flex-1 pb-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${currentTab === "achievements" ? 'text-[var(--color-hidayah-dark)] border-b-2 border-[var(--color-hidayah-gold)]' : 'text-[var(--color-hidayah-dark)] opacity-40 hover:opacity-100'}`}
        >
          Achievements
        </Link>
      </div>

      {/* Content Section */}
      <div className="space-y-6">
        {currentTab === 'achievements' ? (
          <div className="bg-white/40 backdrop-blur-md rounded-[40px] p-8 border border-white/20 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-hidayah-gold/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-hidayah-gold" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-[var(--color-hidayah-dark)]">Spiritual Milestones</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Their path of knowledge</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {BADGES.map((badge: any, index: number) => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                const isMaster = badge.levelRequired === 6;
                
                const medalColors = [
                  'from-[#CD7F32] to-[#8B4513]',
                  'from-[#C0C0C0] to-[#707070]',
                  'from-[#FFD700] to-[#B8860B]',
                  'from-[#E5E4E2] to-[#B4B4B4]',
                  'from-[#B9F2FF] to-[#7BB8FF]',
                  'from-[#FFD700] via-[#9B59B6] to-[#FFD700]',
                ];
                
                const medalGradient = medalColors[index] || medalColors[0];
                
                return (
                  <div 
                    key={badge.id}
                    className={`group relative flex items-center gap-4 p-4 rounded-[32px] border transition-all duration-500 ${isUnlocked ? 'bg-white border-hidayah-gold/30 shadow-md' : 'bg-hidayah-secondary/30 border-hidayah-border/10 opacity-60 grayscale'}`}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center relative overflow-hidden ${isUnlocked ? `bg-gradient-to-br ${medalGradient} shadow-lg ring-4 ring-white/20` : 'bg-hidayah-dark/10 opacity-30'}`}>
                        {isUnlocked && (
                          <>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)]" />
                            <span className="text-2xl drop-shadow-md z-10">{badge.icon}</span>
                          </>
                        )}
                        {!isUnlocked && <Trophy className="w-8 h-8 text-hidayah-dark/30" />}
                      </div>
                      {isUnlocked && (
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-[10px] font-black text-hidayah-gold border border-hidayah-gold/10">
                          {isMaster ? 'M' : badge.levelRequired}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-hidayah-gold mb-0.5">
                        {isMaster ? 'Master Level' : `Level ${badge.levelRequired}`}
                      </div>
                      <div className="font-serif font-bold text-hidayah-dark text-sm truncate">{badge.name}</div>
                      <p className="text-[10px] text-hidayah-dark/50 line-clamp-1">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-[var(--color-hidayah-border)]/30"></div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">Shared Reflections</h3>
              <div className="h-px flex-1 bg-[var(--color-hidayah-border)]/30"></div>
            </div>

            {displayPosts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {displayPosts.map((post) => (
                  <FeedCard 
                    key={post.id} 
                    {...post} 
                    currentUserId={currentUserId} 
                    compact={true}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-[var(--color-hidayah-secondary)] rounded-[32px] border border-dashed border-[var(--color-hidayah-border)]/50">
                <p className="text-[var(--color-hidayah-dark)] opacity-40 font-medium">This member hasn't shared any reflections yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
