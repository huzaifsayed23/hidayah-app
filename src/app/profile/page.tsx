"use client";

import React, { useState, useEffect } from 'react';
import { Bookmark, Edit3, ArrowLeft, Trophy, Map, Loader2 } from 'lucide-react';
import Link from 'next/link';
import FeedCard from '@/components/community/FeedCard';
import ProfileMenu from '@/components/profile/ProfileMenu';
import ProfileImageUpdate from '@/components/profile/ProfileImageUpdate';
import EditableBio from '@/components/profile/EditableBio';
import { BADGES } from '@/constants/rewards';

import BottomNav from '@/components/BottomNav';
import { HIDAYAH_API_URL, hidayahFetch } from '@/lib/api';



export default function ProfilePage({ searchParams }: { searchParams: React.PropsWithChildren<{ tab?: string }> | any }) {
  const [currentTab, setCurrentTab] = useState("posts");
  const [userData, setUserData] = useState<any>(null);
  const [displayPosts, setDisplayPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await hidayahFetch(`${HIDAYAH_API_URL}/api/auth/me`);

        if (res.ok) {
          // Fetch full profile info
          const profileRes = await hidayahFetch(`${HIDAYAH_API_URL}/api/users/profile`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setUserData(profileData.user);
            
            // Get posts
            const tab = new URLSearchParams(window.location.search).get('tab') || 'posts';
            setCurrentTab(tab);
            
            const postsRes = await hidayahFetch(`${HIDAYAH_API_URL}/api/posts?userId=${profileData.user._id}&tab=${tab}`);

            if (postsRes.ok) {
              const postsData = await postsRes.json();
              setDisplayPosts(postsData.posts);
            }
          }
        }


      } catch (e) {
        console.error("Profile page data fetch error:", e);
      } finally {

        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-hidayah-primary)]">
        <Loader2 className="w-8 h-8 animate-spin text-hidayah-gold" />
      </div>
    );
  }

  const user = userData || {
    username: "Guest",
    bio: "Seeking knowledge and patience.",
    createdAt: new Date(),
    unlockedBadges: [],
    unlockedBackgrounds: []
  };

  const userName = user.username ? `@${user.username}` : "Guest";
  const userInitial = user.username ? user.username.charAt(0).toUpperCase() : "G";
  const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });


  const userImage = user.image;
  const userBio = user.bio || "Seeking knowledge and patience.";
  const unlockedBadges = user.unlockedBadges || [];
  const currentUserId = user._id;


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
                    key={post._id || post.id} 
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
