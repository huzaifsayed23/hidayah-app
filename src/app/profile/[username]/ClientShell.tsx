"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, Calendar, PenTool, Medal, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import FeedCard from '@/components/community/FeedCard';
import { BADGES } from '@/constants/rewards';
import ReportUserButton from '@/components/profile/ReportUserButton';
import { HIDAYAH_API_URL, hidayahFetch } from '@/lib/api';
import MedalIcon from '@/components/ui/MedalIcon';


function ProfileContent() {
  const router = useRouter();
  const { username } = useParams() as { username: string };
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || "posts";

  const [isLoading, setIsLoading] = useState(true);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [displayPosts, setDisplayPosts] = useState<any[]>([]);
   const [currentUserId, setCurrentUserId] = useState("");
   const [currentUserName, setCurrentUserName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch current user for context
        const meRes = await hidayahFetch(`${HIDAYAH_API_URL}/api/auth/me`);
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUserId(meData.id || meData.userId);
          setCurrentUserName(meData.username);
        }


        // Fetch target user profile
        const profileRes = await hidayahFetch(`${HIDAYAH_API_URL}/api/users/profile/${username}`);

        
        if (!profileRes.ok) {
          // Try search if direct profile fails
          const searchRes = await hidayahFetch(`${HIDAYAH_API_URL}/api/users/search?q=${username}`);

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const foundUser = searchData.users?.find((u: any) => u.username === username);
            if (foundUser) {
              setUserDoc(foundUser);
              // Fetch their posts
              const postsRes = await hidayahFetch(`${HIDAYAH_API_URL}/api/posts?userId=${foundUser._id}`);

              if (postsRes.ok) {
                const postsData = await postsRes.json();
                setDisplayPosts(postsData.posts || []);
              }
            } else {
              setError("User not found");
            }
          } else {
            setError("User not found");
          }
        } else {
          const profileData = await profileRes.json();
          if (profileData) {
            setUserDoc(profileData.user);
            setDisplayPosts(profileData.posts || []);
          }
        }
      } catch (err) {
        console.error("Public profile fetch error:", err);
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (username) fetchData();
  }, [username]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-hidayah-primary)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-hidayah-gold)]" />
      </div>
    );
  }

  if (error || !userDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "User not found"}</h1>
          <Link href="/community" className="text-[var(--color-hidayah-gold)] font-bold">Back to Community</Link>
        </div>
      </div>
    );
  }

  const joinedDate = userDoc.createdAt ? new Date(userDoc.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';
  const unlockedBadges = userDoc.unlockedBadges || [];

  return (
    <div className="min-h-screen pb-24 max-w-2xl mx-auto px-4 sm:px-6 pt-8">
      {/* Header */}
      <div className="flex items-center mb-10">
        <button onClick={() => router.back()} className="p-2.5 rounded-full hover:bg-[var(--color-hidayah-secondary)] transition-colors text-[var(--color-hidayah-dark)] opacity-70 hover:opacity-100 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </button>
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

        {currentUserId !== userDoc._id && (
          <div className="mt-2">
            <ReportUserButton 
              reportedUserId={userDoc._id} 
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
                <Medal className="w-5 h-5 text-hidayah-gold" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-[var(--color-hidayah-dark)]">Spiritual Milestones</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Their path of knowledge</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {BADGES.map((badge: any) => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                const isMaster = badge.levelRequired === 6;
                
                return (
                  <div 
                    key={badge.id}
                    className={`group relative flex items-center gap-4 p-4 rounded-[32px] border transition-all duration-500 ${isUnlocked ? 'bg-white border-hidayah-gold/30 shadow-md' : 'bg-hidayah-secondary/30 border-hidayah-border/10 opacity-60 grayscale'}`}
                  >
                    <MedalIcon 
                      level={badge.levelRequired} 
                      isUnlocked={isUnlocked} 
                      icon={badge.icon}
                      size="sm"
                      className="shrink-0"
                    />
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
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {displayPosts.map((post) => (
                  <FeedCard 
                    key={post._id || post.id}
                    id={post._id || post.id}
                    onDeleteSuccess={(deletedId) => setDisplayPosts(prev => prev.filter(p => (p._id || p.id) !== deletedId))} 
                    {...post} 
                    currentUserId={currentUserId} 
                    currentUserName={currentUserName}
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

export default function PublicProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-hidayah-primary)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-hidayah-gold)]" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
