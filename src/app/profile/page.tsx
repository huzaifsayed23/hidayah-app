"use client";

import { useState, useEffect, Suspense } from 'react';
import { Bookmark, Edit3, ArrowLeft, Medal, Loader2, BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import FeedCard from '@/components/community/FeedCard';
import HadithCard from '@/components/community/HadithCard';
import ProfileMenu from '@/components/profile/ProfileMenu';
import ProfileImageUpdate from '@/components/profile/ProfileImageUpdate';
import EditableBio from '@/components/profile/EditableBio';
import { BADGES } from '@/constants/rewards';
import BottomNav from '@/components/BottomNav';
import { hidayahFetch } from '@/lib/api';
import { safeStorage } from '@/lib/storage';
import MedalIcon from '@/components/ui/MedalIcon';

function ProfileContent() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'posts');
  const [userData, setUserData] = useState<any>(null);
  const [displayPosts, setDisplayPosts] = useState<any[]>([]);
  const [savedHadiths, setSavedHadiths] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    const tabFromUrl = searchParams.get('tab') || 'posts';
    if (tabFromUrl !== activeTab) setActiveTab(tabFromUrl);

    const targetUser = searchParams.get('u');
    setIsPublicView(!!targetUser);

    // Instant load from cache for "My Profile"
    if (!targetUser) {
      const cached = safeStorage.getItem('hidayah_profile_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUserData(parsed.user);
          setSavedHadiths(parsed.user.savedHadiths || []);
          if (parsed.posts) setDisplayPosts(parsed.posts);
          setIsLoading(false);
        } catch (e) {}
      }
    }

    const fetchData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hidayah_token') : null;
      if (!token && !targetUser) {
        router.push('/auth');
        return;
      }
      
      if (targetUser || !safeStorage.getItem('hidayah_profile_cache')) {
        setIsLoading(true);
      }
      
      try {
        if (targetUser) {
          const [profileRes, searchRes] = await Promise.all([
             hidayahFetch(`/api/users/profile/${targetUser}`),
             hidayahFetch(`/api/users/search?q=${targetUser}`)
          ]);
          
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setUserData(profileData.user);
            setDisplayPosts(profileData.posts || []);
          } else if (searchRes.ok) {
            const searchData = await searchRes.json();
            const found = searchData.users?.find((u: any) => u.username === targetUser);
            if (found) {
              setUserData(found);
              const postsRes = await hidayahFetch(`/api/posts?userId=${found._id || found.id}`);
              if (postsRes.ok) {
                const postsData = await postsRes.json();
                setDisplayPosts(postsData.posts || []);
              }
            } else {
              setError("Member not found");
            }
          }
        } else {
          const profileRes = await hidayahFetch('/api/users/profile');
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setUserData(profileData.user);
            setSavedHadiths(profileData.user.savedHadiths || []);
            
            let fetchedPosts = [];
            // We fetch the current tab's posts if it's not achievements
            if (tabFromUrl !== 'achievements' && tabFromUrl !== 'hadiths') {
              const postsRes = await hidayahFetch(`/api/posts?userId=${profileData.user._id}&tab=${tabFromUrl === 'posts' ? 'posts' : 'saved'}`);
              if (postsRes.ok) {
                const postsData = await postsRes.json();
                fetchedPosts = postsData.posts;
                setDisplayPosts(fetchedPosts);
              }
            }

            safeStorage.setItem('hidayah_profile_cache', JSON.stringify({
              user: profileData.user,
              posts: fetchedPosts
            }));
          }
        }
      } catch (e) {
        console.error("Profile fetch error:", e);
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [searchParams, router]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.replace(`/profile?tab=${tab}${isPublicView ? `&u=${user.username}` : ''}`, { scroll: false });
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-hidayah-primary)]">
        <h2 className="text-xl font-bold mb-4">{error}</h2>
        <Link href="/community" className="px-6 py-2 bg-[var(--color-hidayah-gold)] text-white rounded-full font-bold">Back to Community</Link>
      </div>
    );
  }

  if (!mounted || (isLoading && !userData)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-hidayah-primary)]">
        <Loader2 className="w-8 h-8 animate-spin text-hidayah-gold" />
      </div>
    );
  }

  const user = userData || {
    username: "User",
    bio: "Seeking knowledge and patience.",
    createdAt: new Date(),
    unlockedBadges: [],
    unlockedBackgrounds: [],
    savedHadiths: []
  };

  const userName = userData ? `@${user.username || 'User'}` : "Loading...";
  const userInitial = user.username ? user.username.charAt(0).toUpperCase() : "U";
  const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const userImage = user.image;
  const userBio = user.bio || "Seeking knowledge and patience.";
  const unlockedBadges = user.unlockedBadges || [];
  
  // Get the actual logged-in user's ID from local storage for interactions
  const loggedInUserJson = typeof window !== 'undefined' ? localStorage.getItem('hidayah_user') : null;
  const loggedInUser = loggedInUserJson ? JSON.parse(loggedInUserJson) : null;
  const currentUserId = loggedInUser?._id || loggedInUser?.id || loggedInUser?.user?._id || loggedInUser?.user?.id;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen pb-24 max-w-2xl mx-auto px-4 sm:px-6 pt-8 mobile-scroll-container"
    >
      <div className="flex justify-between items-center mb-4">
        <Link href="/community" className="p-2.5 rounded-full hover:bg-[var(--color-hidayah-secondary)] transition-colors text-[var(--color-hidayah-dark)] opacity-70 hover:opacity-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        {!isPublicView && <ProfileMenu />}
      </div>

      <div className="flex flex-col items-center text-center mb-10">
        {isPublicView ? (
          <div className="w-24 h-24 mb-4 rounded-full border-2 border-white shadow-md overflow-hidden flex items-center justify-center bg-white font-bold text-3xl">
             {userImage ? <img src={userImage} className="w-full h-full object-cover" /> : userInitial}
          </div>
        ) : (
          <ProfileImageUpdate initialImage={userImage} userInitial={userInitial} />
        )}
        <h1 className="text-3xl font-bold font-serif text-[var(--color-hidayah-dark)]">{userName}</h1>
        {isPublicView ? (
           <p className="mt-2 text-[var(--color-hidayah-dark)] opacity-60 font-serif max-w-sm italic">"{userBio}"</p>
        ) : (
          <EditableBio initialBio={userBio} />
        )}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-hidayah-secondary)] text-xs font-medium text-[var(--color-hidayah-dark)] opacity-80">
          Joined {joinedDate}
        </div>
      </div>

      <div className="flex border-b border-[var(--color-hidayah-border)]/50 mb-8 overflow-x-auto custom-scrollbar whitespace-nowrap">
        <button 
          onClick={() => handleTabChange('posts')}
          className={`flex-1 min-w-[100px] pb-4 text-[10px] sm:text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all ${activeTab === "posts" ? 'text-[var(--color-hidayah-dark)] border-b-2 border-[var(--color-hidayah-gold)]' : 'text-[var(--color-hidayah-dark)] opacity-40 hover:opacity-100'}`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          Reflections
        </button>
        {!isPublicView && (
          <button 
            onClick={() => handleTabChange('saved')}
            className={`flex-1 min-w-[100px] pb-4 text-[10px] sm:text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all ${activeTab === "saved" ? 'text-[var(--color-hidayah-dark)] border-b-2 border-[var(--color-hidayah-gold)]' : 'text-[var(--color-hidayah-dark)] opacity-40 hover:opacity-100'}`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Saved
          </button>
        )}
        <button 
          onClick={() => handleTabChange('achievements')}
          className={`flex-1 min-w-[100px] pb-4 text-[10px] sm:text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all ${activeTab === "achievements" ? 'text-[var(--color-hidayah-dark)] border-b-2 border-[var(--color-hidayah-gold)]' : 'text-[var(--color-hidayah-dark)] opacity-40 hover:opacity-100'}`}
        >
          <Medal className="w-3.5 h-3.5" />
          Badges
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-6 w-full"
        >
          {activeTab === 'achievements' ? (
            <div className="bg-[var(--color-hidayah-secondary)]/30 backdrop-blur-md rounded-[48px] p-8 border border-[var(--color-hidayah-border)]/30 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-hidayah-gold/20 flex items-center justify-center">
                  <Medal className="w-5 h-5 text-hidayah-gold" />
                </div>
                <h2 className="text-xl font-serif font-bold text-[var(--color-hidayah-dark)]">Spiritual Milestones</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {BADGES.map((badge, index) => {
                  const isUnlocked = unlockedBadges.includes(badge.id);
                  return (
                    <div key={badge.id} className={`flex items-center gap-4 p-4 rounded-[32px] border transition-all ${isUnlocked ? 'bg-[var(--color-hidayah-primary)] border-hidayah-gold/30 shadow-sm' : 'opacity-40 grayscale bg-transparent'}`}>
                      <MedalIcon 
                        level={badge.levelRequired} 
                        isUnlocked={isUnlocked} 
                        icon={badge.icon}
                        size="sm"
                      />
                      <div>
                        <div className="text-[9px] font-bold text-hidayah-gold uppercase">{badge.levelRequired === 6 ? 'Mushkil' : `Level ${badge.levelRequired}`}</div>
                        <div className="font-serif font-bold text-sm">{badge.name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-serif font-bold text-[var(--color-hidayah-dark)]">
                  {isPublicView ? 'Shared Reflections' : (activeTab === 'saved' ? 'Saved Reflections' : 'My Posts')}
                </h2>
                <span className="text-xs font-medium text-[var(--color-hidayah-dark)] opacity-50">
                  {isLoading ? '...' : `${displayPosts.length} Reflection${displayPosts.length !== 1 ? 's' : ''}`}
                </span>
              </div>
              
              {isLoading && displayPosts.length === 0 ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-hidayah-gold opacity-50" />
                </div>
              ) : displayPosts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-6">
                  {displayPosts.map((post: any) => (
                    <FeedCard 
                      key={post._id} 
                      id={post._id}
                      {...post} 
                      compact={true} 
                      currentUserId={currentUserId} 
                      currentUserName={user?.username}
                      showDelete={!isPublicView && activeTab === "posts"} 
                      onDeleteSuccess={(deletedId) => setDisplayPosts(prev => prev.filter(p => p._id !== deletedId))}
                      onSaveToggle={(postId, isSaved) => {
                        if (activeTab === 'saved' && !isSaved) {
                          setDisplayPosts(prev => prev.filter(p => (p._id || p.id)?.toString() !== postId?.toString()));
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-[var(--color-hidayah-dark)]/40 bg-[var(--color-hidayah-secondary)]/50 rounded-[40px] border border-dashed border-[var(--color-hidayah-border)]">
                  <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>You haven't posted or saved any reflections yet.</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-hidayah-primary)]">
        <Loader2 className="w-8 h-8 animate-spin text-hidayah-gold" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
