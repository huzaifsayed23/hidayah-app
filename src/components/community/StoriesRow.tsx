"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, BookOpen, Sparkles, Clock, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MOOD_PALETTES, GRADIENT_LIBRARY, generateMeshGradient } from '@/lib/gradients';
import { hidayahFetch } from '@/lib/api';
import { safeStorage } from '@/lib/storage';
import { AnimatePresence, motion } from 'framer-motion';

interface StoryReflection {
  _id: string;
  content: string;
  createdAt: string;
  expiresAt: string;
  reflectionThemeId?: string;
  textColor: string;
  customBackgroundImage?: string;
  verse?: {
    surah: string;
    ayah: number;
    text: string;
    translation?: string;
  };
  hadith?: {
    hadithArabic: string;
    hadithEnglish: string;
    bookName: string;
    hadithNumber: string;
    status: string;
  };
  moodTag: string;
  backdropVariant: number;
  viewers?: { userId: string; username: string; userImage: string | null; viewedAt: string }[];
}

interface UserStories {
  userId: string;
  username: string;
  userImage: string | null;
  reflections: StoryReflection[];
}

export default function StoriesRow() {
  const [stories, setStories] = useState<UserStories[]>([]);
  const [activeUserIndex, setActiveUserIndex] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [viewedStoryIds, setViewedStoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showViewersModal, setShowViewersModal] = useState<boolean>(false);
  const router = useRouter();

  // Time tracker for story automatic progression
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const STORY_DURATION_MS = 6000; // 6 seconds per story

  // Fetch stories on mount
  useEffect(() => {
    try {
      const userJsonStr = localStorage.getItem('hidayah_user');
      if (userJsonStr) {
        const userJson = JSON.parse(userJsonStr);
        setCurrentUserId(userJson?.user?._id || userJson?.user?.id || userJson?._id || userJson?.id || null);
      }
    } catch (e) {}

    const fetchStories = async () => {
      try {
        const res = await hidayahFetch('/api/posts/stories');
        if (res.ok) {
          const data = await res.json();
          setStories(data.stories || []);
        }
      } catch (err) {
        console.error("Failed to load stories:", err);
      } finally {
        setLoading(false);
      }
    };

    // Load viewed story ids from localStorage
    const savedViewed = safeStorage.getItem('hidayah_viewed_stories');
    if (savedViewed) {
      try {
        setViewedStoryIds(JSON.parse(savedViewed));
      } catch (e) {}
    }

    fetchStories();
  }, []);

  // Check if a user has any unviewed stories
  const hasUnviewedStories = (user: UserStories) => {
    return user.reflections.some(story => !viewedStoryIds.includes(story._id));
  };

  // Mark a story as viewed
  const markAsViewed = (storyId: string) => {
    if (!viewedStoryIds.includes(storyId)) {
      const updated = [...viewedStoryIds, storyId];
      setViewedStoryIds(updated);
      safeStorage.setItem('hidayah_viewed_stories', JSON.stringify(updated));
      
      hidayahFetch(`/api/posts/${storyId}/view`, { method: 'POST' }).catch(console.error);
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (activeUserIndex === null) return;
    const currentUser = stories[activeUserIndex];
    
    if (activeStoryIndex < currentUser.reflections.length - 1) {
      // Go to next story of same user
      setActiveStoryIndex(prev => prev + 1);
      setProgressPercent(0);
    } else if (activeUserIndex < stories.length - 1) {
      // Go to first story of next user
      setActiveUserIndex(prev => prev! + 1);
      setActiveStoryIndex(0);
      setProgressPercent(0);
    } else {
      // Close viewer
      handleCloseViewer();
    }
  };

  const handlePrev = () => {
    if (activeUserIndex === null) return;
    
    if (activeStoryIndex > 0) {
      // Go to previous story of same user
      setActiveStoryIndex(prev => prev - 1);
      setProgressPercent(0);
    } else if (activeUserIndex > 0) {
      // Go to last story of previous user
      const prevUserIndex = activeUserIndex - 1;
      setActiveUserIndex(prevUserIndex);
      setActiveStoryIndex(stories[prevUserIndex].reflections.length - 1);
      setProgressPercent(0);
    } else {
      // Loop back to start of current user's first story
      setProgressPercent(0);
    }
  };

  const handleCloseViewer = () => {
    setActiveUserIndex(null);
    setProgressPercent(0);
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  // Trigger mark as viewed and handle auto-progression on active story change
  useEffect(() => {
    if (activeUserIndex !== null && stories[activeUserIndex]) {
      const activeStory = stories[activeUserIndex].reflections[activeStoryIndex];
      if (activeStory) {
        markAsViewed(activeStory._id);
      }

      // Reset timer and progression percentage
      setProgressPercent(0);
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

      if (!showViewersModal) {
        // Start progress bar animator
        const intervalMs = 50;
        const step = (intervalMs / STORY_DURATION_MS) * 100;
        progressIntervalRef.current = setInterval(() => {
          setProgressPercent(prev => {
            if (prev >= 100) {
              clearInterval(progressIntervalRef.current!);
              return 100;
            }
            return prev + step;
          });
        }, intervalMs);

        // Start the timeout to go to next story
        progressTimerRef.current = setTimeout(() => {
          handleNext();
        }, STORY_DURATION_MS);
      }
    }

    return () => {
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [activeUserIndex, activeStoryIndex, showViewersModal]);

  if (loading) {
    return (
      <div className="w-full py-4 flex gap-4 overflow-x-auto hide-scrollbar px-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center shrink-0 gap-1.5 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-[var(--color-hidayah-secondary)] border border-[var(--color-hidayah-border)]/20" />
            <div className="w-12 h-2.5 bg-[var(--color-hidayah-secondary)] rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return null; // Don't show stories row if there are no stories
  }

  // Get active items
  const activeUser = activeUserIndex !== null ? stories[activeUserIndex] : null;
  const activeStory = activeUser ? activeUser.reflections[activeStoryIndex] : null;

  // Calculate remaining time
  const getRemainingTimeText = (expiresAtStr: string) => {
    const diffMs = new Date(expiresAtStr).getTime() - Date.now();
    if (diffMs <= 0) return "Expired";
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    return `${hours}h left`;
  };

  // Render reflection background gradient/image
  const getStoryStyle = (story: StoryReflection) => {
    if (story.customBackgroundImage) {
      return {
        backgroundImage: `url(${story.customBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    const mood = (story.moodTag || 'Reflective').trim();
    let colors = MOOD_PALETTES[mood] || MOOD_PALETTES["Reflective"];
    if (story.reflectionThemeId) {
      for (const suite of Object.values(GRADIENT_LIBRARY)) {
        const found = suite.options.find(o => o.id === story.reflectionThemeId);
        if (found) {
          colors = found.colors;
          break;
        }
      }
    }
    const variant = story.backdropVariant >= 0 ? story.backdropVariant : 0;
    return {
      background: generateMeshGradient(colors, variant)
    };
  };

  return (
    <div className="w-full mb-8">
      {/* 24h Stories Horizontal List */}
      <div className="flex gap-4 overflow-x-auto hide-scrollbar py-2 px-1">
        {stories.map((user, index) => {
          const unviewed = hasUnviewedStories(user);
          return (
            <button
              key={user.userId}
              onClick={() => {
                setActiveUserIndex(index);
                setActiveStoryIndex(0);
              }}
              className="flex flex-col items-center shrink-0 gap-2 focus:outline-none group"
            >
              {/* Outer ring indicates viewed state */}
              <div 
                className={`w-[68px] h-[68px] rounded-full p-[3px] flex items-center justify-center transition-all duration-300 ${
                  unviewed 
                    ? 'bg-gradient-to-tr from-[var(--color-hidayah-gold)] to-[#E5D7C3] scale-100 group-hover:scale-105 shadow-[0_4px_12px_rgba(201,168,106,0.3)]' 
                    : 'border-2 border-[var(--color-hidayah-border)]/40 opacity-70 group-hover:opacity-100'
                }`}
              >
                <div className="w-full h-full rounded-full bg-[var(--color-hidayah-primary)] p-[2px] flex items-center justify-center">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[var(--color-hidayah-secondary)] flex items-center justify-center font-bold text-lg text-[var(--color-hidayah-dark)] shadow-inner">
                    {user.userImage ? (
                      <img src={user.userImage} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      user.username.replace('@', '').charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-bold tracking-tight text-[var(--color-hidayah-dark)] max-w-[72px] truncate transition-all ${
                unviewed ? 'font-extrabold opacity-100' : 'opacity-60'
              }`}>
                {user.username}
              </span>
            </button>
          );
        })}
      </div>

      {/* Full-Screen 24h Story Viewer */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {activeUser && activeStory && (
            <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 z-[999999] bg-black flex flex-col select-none"
          >
            {/* Story Backdrop */}
            <div className="absolute inset-0 z-0 overflow-hidden" style={getStoryStyle(activeStory)}>
              <div className={`absolute inset-0 ${activeStory.customBackgroundImage ? 'bg-black/40' : 'bg-black/25'} backdrop-blur-[1px]`} />
            </div>

            {/* Left and Right Tap Targets */}
            <div className="absolute inset-0 z-30 flex">
              <div onClick={handlePrev} className="w-1/3 h-full cursor-pointer" />
              <div onClick={handleNext} className="w-2/3 h-full cursor-pointer" />
            </div>

            {/* Overlay UI elements */}
            <div className="relative z-40 w-full flex flex-col p-4 pt-[max(env(safe-area-inset-top),1.5rem)] flex-1 justify-between pointer-events-none">
              
              {/* Top Panel: Progress bars + Info */}
              <div className="w-full space-y-3 pointer-events-auto">
                
                {/* Segmented Progress Bar */}
                <div className="flex gap-1.5 w-full">
                  {activeUser.reflections.map((story, i) => {
                    let fillWidth = '0%';
                    if (i < activeStoryIndex) fillWidth = '100%';
                    if (i === activeStoryIndex) fillWidth = `${progressPercent}%`;

                    return (
                      <div key={story._id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-75 ease-linear"
                          style={{ width: fillWidth }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Author Info & Actions */}
                <div className="flex items-center justify-between">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseViewer();
                      router.push(`/profile?u=${activeUser.username.replace('@', '')}`);
                    }}
                    className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center font-bold text-white text-sm">
                      {activeUser.userImage ? (
                        <img src={activeUser.userImage} alt={activeUser.username} className="w-full h-full object-cover" />
                      ) : (
                        activeUser.username.replace('@', '').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm tracking-tight">{activeUser.username}</h3>
                      <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-semibold mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{getRemainingTimeText(activeStory.expiresAt)}</span>
                      </div>
                    </div>
                  </button>

                  {/* Close button */}
                  <button 
                    onClick={handleCloseViewer}
                    className="p-2 bg-black/30 hover:bg-black/50 border border-white/10 rounded-full text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Center Panel: Reflection Content */}
              <div className="w-full max-w-xl mx-auto flex flex-col justify-center items-center py-8 px-4 flex-1">
                <div 
                  className="w-full bg-white/10 border border-white/20 rounded-[28px] p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden"
                  style={{ 
                    boxShadow: `0 20px 50px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.05)`,
                    textShadow: activeStory.textColor === '#000000' ? 'none' : '0 2px 10px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Decorative background image overlay */}
                  {activeStory.customBackgroundImage && (
                    <div className="absolute inset-0 z-0">
                      <img src={activeStory.customBackgroundImage} alt="Background" className="w-full h-full object-cover opacity-30" />
                      <div className="absolute inset-0 bg-black/40" />
                    </div>
                  )}

                  <div className="relative z-10 space-y-6 flex-1 flex flex-col justify-start overflow-y-auto hide-scrollbar pt-6 sm:pt-8 pb-4">
                    {/* Verse attachment */}
                    {activeStory.verse && (
                      <div className="border-l-2 border-white/30 pl-4 py-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                        <p className="font-quran text-right text-base sm:text-lg mb-1.5 leading-relaxed" dir="rtl" style={{ color: activeStory.textColor }}>
                          {activeStory.verse.text}
                        </p>
                        <p className="text-[10px] sm:text-xs italic opacity-85 leading-relaxed" style={{ color: activeStory.textColor }}>
                          "{activeStory.verse.translation}"
                        </p>
                        <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] mt-1.5 opacity-60" style={{ color: activeStory.textColor }}>
                          {activeStory.verse.surah} • Ayah {activeStory.verse.ayah}
                        </p>
                      </div>
                    )}

                    {/* Hadith attachment */}
                    {activeStory.hadith && (
                      <div className="border-l-2 border-white/30 pl-4 py-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                        <p className="font-arabic text-right text-base sm:text-lg mb-1.5 leading-relaxed" dir="rtl" style={{ color: activeStory.hadith.hadithArabic }}>
                          {activeStory.hadith.hadithArabic}
                        </p>
                        <p className="text-[10px] sm:text-xs italic opacity-85 leading-relaxed" style={{ color: activeStory.hadith.hadithEnglish }}>
                          "{activeStory.hadith.hadithEnglish}"
                        </p>
                        <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] mt-1.5 opacity-60" style={{ color: activeStory.hadith.hadithEnglish }}>
                          {activeStory.hadith.bookName} • Hadith {activeStory.hadith.hadithNumber}
                        </p>
                      </div>
                    )}

                    {/* Text content */}
                    {activeStory.content && (
                      <p 
                        className="text-lg sm:text-2xl font-serif leading-relaxed text-center px-2 py-4"
                        style={{ color: activeStory.textColor }}
                      >
                        {activeStory.content}
                      </p>
                    )}
                  </div>

                  {/* Mood Tag */}
                  <div className="relative z-10 flex justify-end mt-4">
                    <span className="px-3.5 py-1.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-white/50">
                      {activeStory.moodTag}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="w-full flex justify-between items-center px-4 py-2 pointer-events-auto relative">
                
                {/* Viewers Indicator (Owner Only) */}
                {activeUser.userId === currentUserId && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowViewersModal(true);
                    }}
                    className="absolute left-1/2 -top-12 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 hover:text-white transition-all active:scale-95 z-50"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">{activeStory.viewers?.length || 0}</span>
                  </button>
                )}
                <button 
                  onClick={handlePrev}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/80 hover:text-white transition-all active-tactile"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                  {activeStoryIndex + 1} of {activeUser.reflections.length}
                </span>
                <button 
                  onClick={handleNext}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/80 hover:text-white transition-all active-tactile"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

            </div>
            
            {/* Viewers Bottom Sheet Modal */}
            <AnimatePresence>
              {showViewersModal && activeUser.userId === currentUserId && (
                <div className="absolute inset-0 z-[400000] flex items-end pointer-events-auto">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowViewersModal(false);
                    }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  />
                  
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                    className="relative w-full max-w-lg mx-auto bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex flex-col z-10 max-h-[70vh] overflow-hidden"
                  >
                    <div className="flex flex-col items-center pt-3 pb-4 px-6 border-b border-[var(--color-hidayah-border)]/70 bg-[var(--color-hidayah-primary)] shrink-0">
                      <div className="w-12 h-1.5 bg-[var(--color-hidayah-dark)]/15 rounded-full mb-4" />
                      <div className="w-full flex items-center justify-between">
                        <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                          Viewed By
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[var(--color-hidayah-secondary)] text-[var(--color-hidayah-dark)] font-sans font-bold">
                            {activeStory.viewers?.length || 0}
                          </span>
                        </h3>
                        <button 
                          onClick={() => setShowViewersModal(false)}
                          className="p-1.5 rounded-full hover:bg-black/5 opacity-60 hover:opacity-100 transition-all active:scale-95"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                      {(!activeStory.viewers || activeStory.viewers.length === 0) ? (
                        <div className="py-12 text-center text-[var(--color-hidayah-dark)]/40">
                          <Eye className="w-10 h-10 mx-auto mb-3 opacity-20" />
                          <p className="text-sm font-medium">No views yet</p>
                        </div>
                      ) : (
                        activeStory.viewers.map((viewer, i) => (
                          <button 
                            key={viewer.userId || i}
                            onClick={() => {
                              handleCloseViewer();
                              router.push(`/profile?u=${viewer.username.replace('@', '')}`);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--color-hidayah-secondary)]/50 transition-colors text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-[var(--color-hidayah-secondary)] border border-[var(--color-hidayah-border)]/45 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                              {viewer.userImage ? (
                                <img src={viewer.userImage} alt={viewer.username} className="w-full h-full object-cover" />
                              ) : (
                                viewer.username.replace('@', '').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[var(--color-hidayah-dark)] truncate">{viewer.username}</p>
                            </div>
                            {viewer.viewedAt && (
                              <div className="text-[10px] text-[var(--color-hidayah-dark)]/40 shrink-0">
                                {new Date(viewer.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
