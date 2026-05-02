import React from 'react';
import { Bookmark, Edit3, ArrowLeft, Trophy, Map } from 'lucide-react';
import Link from 'next/link';
import FeedCard from '@/components/community/FeedCard';
import ProfileMenu from '@/components/profile/ProfileMenu';
import ProfileImageUpdate from '@/components/profile/ProfileImageUpdate';
import EditableBio from '@/components/profile/EditableBio';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { MOOD_PALETTES } from '@/lib/constants';
import { BADGES, REFLECTION_THEMES } from '@/constants/rewards';
import { NatureBackground } from '@/components/NatureBackground';
import BottomNav from '@/components/BottomNav';

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const currentTab = tab || "posts";

  const cookieStore = await cookies();
  const token = cookieStore.get('hidayah_token')?.value;
  let userName = "Guest";
  let userInitial = "G";
  let userEmail = "";
  let userId = "";
  let currentUserId = "";
  let userImage = null;
  let userBio = "";
  let joinedAt = null;
  let unlockedBadges: string[] = [];
  let unlockedBackgrounds: string[] = [];
  let quizProgress: any = null;

  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production');
      userEmail = decoded.email;
      userId = decoded.userId;
      currentUserId = decoded.userId || decoded.email;
      if (decoded.username) {
        userName = `@${decoded.username}`;
        userInitial = decoded.username.charAt(0).toUpperCase();
      } else {
        const prefix = decoded.email.split('@')[0];
        userName = prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[0-9]/g, '');
        userInitial = userName.charAt(0).toUpperCase();
      }
    } catch(e) {}
  }

  await dbConnect();
  
  // Need to dynamically import User to query savedPosts if not already imported
  const User = (await import('@/models/User')).default;
  
  let userSavedPostsIds: string[] = [];
  if (currentUserId && currentUserId !== 'admin@gmail.com') {
    const userDoc = await User.findById(currentUserId).lean() as any;
    if (userDoc) {
      userImage = userDoc.image;
      if (userDoc.username) {
        userName = `@${userDoc.username}`;
        userInitial = userDoc.username.charAt(0).toUpperCase();
      }
      userBio = userDoc.bio || "Seeking knowledge and patience. Striving to be better than I was yesterday.";
      joinedAt = userDoc.createdAt;
      if (userDoc.savedPosts) {
        userSavedPostsIds = userDoc.savedPosts.map((id: any) => id.toString());
      }
      unlockedBadges = userDoc.unlockedBadges || [];
      unlockedBackgrounds = userDoc.unlockedBackgrounds || [];

      const QuizProgress = (await import('@/models/QuizProgress')).default;
      quizProgress = await QuizProgress.findOne({ userId: currentUserId }).lean();
    }
  }

  let userPosts = [];
  if (currentTab === "saved") {
    userPosts = await Post.find({ _id: { $in: userSavedPostsIds } }).sort({ createdAt: -1 }).lean();
  } else {
    userPosts = await Post.find({ userId: currentUserId }).sort({ createdAt: -1 }).lean();
  }

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
    reflectionThemeId: post.reflectionThemeId,
    textColor: post.textColor,
  }));

  const joinedDate = joinedAt ? new Date(joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';

  return (
    <div className="min-h-screen pb-24 max-w-2xl mx-auto px-4 sm:px-6 pt-8">
      {/* Header / Actions */}
      <div className="flex justify-between items-center mb-4">
        <Link href="/community" className="p-2.5 rounded-full hover:bg-[var(--color-hidayah-secondary)] transition-colors text-[var(--color-hidayah-dark)] opacity-70 hover:opacity-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <ProfileMenu />
      </div>

      {/* Profile Info */}
      <div className="flex flex-col items-center text-center mb-10">
        <ProfileImageUpdate initialImage={userImage} userInitial={userInitial} />
        <h1 className="text-3xl font-bold font-serif text-[var(--color-hidayah-dark)]">{userName}</h1>
        <EditableBio initialBio={userBio} />
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-hidayah-secondary)] text-xs font-medium text-[var(--color-hidayah-dark)] opacity-80">
          Joined {joinedDate}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-hidayah-border)]/50 mb-8">
        <Link 
          href="/profile?tab=posts"
          className={`flex-1 pb-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${currentTab === "posts" ? 'text-[var(--color-hidayah-dark)] border-b-2 border-[var(--color-hidayah-gold)]' : 'text-[var(--color-hidayah-dark)] opacity-60 hover:opacity-100'}`}
        >
          <Edit3 className="w-4 h-4" />
          My Reflections
        </Link>
        <Link 
          href="/profile?tab=saved"
          className={`flex-1 pb-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${currentTab === "saved" ? 'text-[var(--color-hidayah-dark)] border-b-2 border-[var(--color-hidayah-gold)]' : 'text-[var(--color-hidayah-dark)] opacity-60 hover:opacity-100'}`}
        >
          <Bookmark className="w-4 h-4" />
          Saved
        </Link>
        <Link 
          href="/profile?tab=achievements"
          className={`flex-1 pb-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${currentTab === "achievements" ? 'text-[var(--color-hidayah-dark)] border-b-2 border-[var(--color-hidayah-gold)]' : 'text-[var(--color-hidayah-dark)] opacity-60 hover:opacity-100'}`}
        >
          <Trophy className="w-4 h-4" />
          Achievements
        </Link>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 w-full">
        {currentTab === 'achievements' ? (
          <div className="space-y-10">
            {/* Badges Section */}
            <div className="bg-[var(--color-hidayah-secondary)]/30 backdrop-blur-md rounded-[48px] p-8 border border-[var(--color-hidayah-border)]/30 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-hidayah-gold/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-hidayah-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-[var(--color-hidayah-dark)]">Spiritual Milestones</h2>
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Your path of knowledge</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {BADGES.map((badge, index) => {
                  const isUnlocked = unlockedBadges.includes(badge.id);
                  const isMaster = badge.levelRequired === 6;
                  
                  // Medal colors based on level
                  const medalColors = [
                    'from-[#CD7F32] to-[#8B4513]', // Level 1: Bronze
                    'from-[#C0C0C0] to-[#707070]', // Level 2: Silver
                    'from-[#FFD700] to-[#B8860B]', // Level 3: Gold
                    'from-[#E5E4E2] to-[#B4B4B4]', // Level 4: Platinum
                    'from-[#B9F2FF] to-[#7BB8FF]', // Level 5: Diamond
                    'from-[#FFD700] via-[#9B59B6] to-[#FFD700]', // Master: Royal
                  ];
                  
                  const medalGradient = medalColors[index] || medalColors[0];
                  
                  return (
                    <div 
                      key={badge.id}
                      className={`group relative flex items-center gap-4 p-4 rounded-[32px] border transition-all duration-500 ${isUnlocked ? 'bg-[var(--color-hidayah-primary)] border-hidayah-gold/30 shadow-md hover:scale-[1.02]' : 'bg-hidayah-secondary/30 border-hidayah-border/10 opacity-60 grayscale'}`}
                    >
                      <div className="relative shrink-0">
                        {/* Medal Shape */}
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center relative overflow-hidden ${isUnlocked ? `bg-gradient-to-br ${medalGradient} shadow-lg ring-4 ring-[var(--color-hidayah-primary)]/20` : 'bg-hidayah-dark/10 opacity-30'}`}>
                          {isUnlocked && (
                            <>
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)]" />
                              <span className="text-2xl drop-shadow-md z-10">{badge.icon}</span>
                            </>
                          )}
                          {!isUnlocked && <Trophy className="w-8 h-8 text-hidayah-dark/30" />}
                        </div>
                        
                        {/* Level Tag */}
                        {isUnlocked && (
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--color-hidayah-primary)] shadow-md flex items-center justify-center text-[10px] font-black text-hidayah-gold border border-hidayah-gold/10">
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
                      
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-hidayah-secondary/80 rounded-[32px] backdrop-blur-[1px]">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-hidayah-dark/60">Locked</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-serif font-bold text-[var(--color-hidayah-dark)]">{currentTab === 'saved' ? 'Saved Reflections' : 'Your Archive'}</h2>
              <span className="text-xs font-medium text-[var(--color-hidayah-dark)] opacity-50">{displayPosts.length} Reflection{displayPosts.length !== 1 && 's'}</span>
            </div>
            
            {displayPosts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                {displayPosts.map((post: any) => (
                  <FeedCard 
                    key={post.id} 
                    {...post} 
                    compact={true}
                    currentUserId={currentUserId}
                    showDelete={currentTab === "posts"}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-[var(--color-hidayah-dark)]/50 bg-[var(--color-hidayah-secondary)] rounded-3xl border border-[var(--color-hidayah-border)]/50">
                <p>{currentTab === 'saved' ? "You haven't saved any reflections yet." : "You haven't posted any reflections yet."}</p>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
