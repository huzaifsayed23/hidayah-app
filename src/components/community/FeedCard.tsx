"use client";

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MOOD_PALETTES, GRADIENT_LIBRARY, generateMeshGradient } from '@/lib/gradients';
import PostMenu from './PostMenu';
import HadithCard from './HadithCard';
import { NatureBackground } from '../NatureBackground';
import { hidayahFetch } from '@/lib/api';
import { safeStorage } from '@/lib/storage';
import { toBlob } from 'html-to-image';
import { Logo } from '@/components/Logo';
import { Share2, Link2 } from 'lucide-react';
import Link from 'next/link';
import ShareReflectionModal from './ShareReflectionModal';
import { Share as CapShare } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface FeedCardProps {
  id: string;
  author: string;
  timeAgo: string;
  moodTag: string;
  content: string;
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
  ameenCount: number;
  commentCount: number;
  ameens?: string[];
  replies?: any[];
  currentUserId?: string;
  currentUserName?: string;
  backdropVariant?: number;
  compact?: boolean;
  rightAction?: React.ReactNode;
  isSaved?: boolean;
  userId?: string;
  showDelete?: boolean;
  themePalette?: string;
  authorImage?: string | null;
  reflectionThemeId?: string | null;
  textColor?: string | null;
  customBackgroundImage?: string | null;
  onDeleteSuccess?: (id: string) => void;
  onSaveToggle?: (id: string, isSaved: boolean) => void;
}

const FeedCard = memo(({
  id,
  author: propAuthor,
  authorName,
  timeAgo,
  moodTag,
  content,
  verse,
  hadith,
  ameenCount,
  commentCount,
  ameens,
  replies,
  currentUserId,
  currentUserName,
  backdropVariant,
  compact = false,
  rightAction,
  isSaved = false,
  userId,
  showDelete = false,
  themePalette,
  authorImage,
  reflectionThemeId,
  textColor: savedTextColor,
  customBackgroundImage,
  onDeleteSuccess,
  onSaveToggle,
}: FeedCardProps & { authorName?: string }) => {
  const author = propAuthor || authorName || "User";
  
  // Robust user extraction from props or localStorage fallback
  // This ensures that even if currentUserId prop is missing/delayed, we can still identify the logged-in user
  const { effectiveUserId, effectiveUserName, effectiveEmail, actualUserFromStorage } = React.useMemo(() => {
    if (typeof window === 'undefined') return { effectiveUserId: currentUserId || "", effectiveUserName: currentUserName || "", effectiveEmail: "", actualUserFromStorage: null };
    
    try {
      const userJsonStr = localStorage.getItem('hidayah_user');
      const userJson = userJsonStr ? JSON.parse(userJsonStr) : null;
      const u = userJson?.user || userJson;
      
      return {
        effectiveUserId: currentUserId || u?._id || u?.id || "",
        effectiveUserName: currentUserName || u?.username || "",
        effectiveEmail: u?.email || "",
        actualUserFromStorage: u
      };
    } catch (e) {
      return { effectiveUserId: currentUserId || "", effectiveUserName: currentUserName || "", effectiveEmail: "", actualUserFromStorage: null };
    }
  }, [currentUserId, currentUserName]);

  const [isLiked, setIsLiked] = useState(ameens?.includes(effectiveUserId || "") || false);
  const [likesCount, setLikesCount] = useState(ameenCount || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [repliesList, setRepliesList] = useState(replies || []);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isRepliesExpanded, setIsRepliesExpanded] = useState(false);
  const [isSavedPost, setIsSavedPost] = useState(isSaved);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const shareCaptureRef = React.useRef<HTMLDivElement>(null);
  const [commentMenuId, setCommentMenuId] = useState<string | null>(null);
  const [isPressingComment, setIsPressingComment] = useState<string | null>(null);
  const router = useRouter();
  const commentTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = React.useRef<{ x: number, y: number } | null>(null);

  const cancelCommentTimer = (e?: React.PointerEvent) => {
    setIsPressingComment(null);
    if (commentTimerRef.current) {
      clearTimeout(commentTimerRef.current);
      commentTimerRef.current = null;
    }
    touchStartPos.current = null;
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleShareToPlatform = async (platform: 'whatsapp' | 'instagram' | 'snapchat') => {
    if (isSharing) return;
    setIsSharing(true);
    
    try {
      const captureEl = shareCaptureRef.current || cardRef.current;
      if (!captureEl) return;
      
      const { toBlob } = await import('html-to-image');
      await new Promise(r => setTimeout(r, 800)); // Slightly more time for high-res rendering

      const blob = await toBlob(captureEl, {
        cacheBust: true,
        pixelRatio: 2.5, // High resolution for premium look
        backgroundColor: '#000000',
      });

      if (!blob) throw new Error("Capture failed");

      // Mobile Native Sharing (Capacitor)
      try {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        const fileName = `hidayah_share_${Date.now()}.png`;
        
        // Save to temporary cache directory for sharing
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        // Use native share sheet (Exactly like Gallery)
        await CapShare.share({
          title: 'Hidayah Reflection',
          text: 'Shared from Hidayah',
          files: [savedFile.uri],
        });
      } catch (capErr) {
        // Web Fallback if Capacitor plugins aren't available or fail
        console.warn("Capacitor share failed, trying web share:", capErr);
        const fileName = `hidayah_reflection_${id.slice(-4)}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Hidayah Reflection',
          });
        } else {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          alert("Reflection saved to downloads. You can now share it to your stories!");
        }
      }
    } catch (err) {
      console.error("Total share error:", err);
      alert("Could not share. Please try again.");
    } finally {
      setIsSharing(false);
      setShowShareModal(false);
    }
  };

  // Synchronize internal state with props only when they change meaningfully
  const lastProps = React.useRef({ isSaved, ameens });
  React.useEffect(() => {
    if (ameens && ameens !== lastProps.current.ameens) {
      setIsLiked(ameens.includes(effectiveUserId || ""));
      lastProps.current.ameens = ameens;
    }
    if (ameenCount !== undefined) setLikesCount(ameenCount);
    
    if (isSaved !== undefined && isSaved !== lastProps.current.isSaved) {
      setIsSavedPost(isSaved);
      lastProps.current.isSaved = isSaved;
    }
  }, [ameens, ameenCount, effectiveUserId, isSaved]);

  // Handle replies list separately to avoid wiping optimistic updates
  React.useEffect(() => {
    if (replies) setRepliesList(replies);
  }, [replies]);


  const handleLike = async () => {
    if (!effectiveUserId) {
      alert('Please sign in to like reflections.');
      return;
    }
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      const res = await hidayahFetch(`/api/posts/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.hasLiked);
        setLikesCount(data.ameenCount);
        
        // Update local community cache so it sticks if app is closed/reopened
        safeStorage.updateCommunityCache(id, { 
          ameens: data.hasLiked ? [...(ameens || []), effectiveUserId] : (ameens || []).filter(u => u !== effectiveUserId),
          ameenCount: data.ameenCount
        });
      } else {
        setIsLiked(isLiked);
        setLikesCount(likesCount);
      }
    } catch (e) {
      setIsLiked(isLiked);
      setLikesCount(likesCount);
    }
  };

  const handleDoubleTap = () => {
    if (!effectiveUserId) return;
    if (!isLiked) {
      handleLike();
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  const submitReply = async () => {
    if (!replyText.trim() || isSubmittingReply) return;
    
    const textToSubmit = replyText.trim();
    const originalReplies = [...repliesList];
    
    // Clear input and show loading state immediately
    setReplyText("");
    setIsSubmittingReply(true);
    
    // 1. Optimistic Update - Add to UI immediately
    const optimisticReply = {
      _id: `temp-${Date.now()}`,
      author: effectiveUserName || "User",
      content: textToSubmit,
      createdAt: new Date().toISOString()
    };
    
    const updatedReplies = [...repliesList, optimisticReply];
    setRepliesList(updatedReplies);
    
    try {
      const res = await hidayahFetch(`/api/posts/${id}/reply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textToSubmit })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Replace optimistic list with real list from server (which includes the real ID)
        const finalReplies = [...originalReplies, data.reply];
        setRepliesList(finalReplies);
        
        // Update local community cache
        safeStorage.updateCommunityCache(id, { 
          replies: finalReplies,
          commentCount: finalReplies.length 
        });
      } else {
        // Revert on failure
        setRepliesList(originalReplies);
        setReplyText(textToSubmit); // Restore text
        const errorData = await res.json().catch(() => ({}));
        alert(`Could not post comment: ${errorData.message || 'Server Error'}`);
      }
    } catch (e) {
      // Revert on error
      setRepliesList(originalReplies);
      setReplyText(textToSubmit);
      alert("Connection error. Please try again.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSave = async () => {
    // Emergency identity recovery if props are out of sync
    let activeId = effectiveUserId;
    if (!activeId && typeof window !== 'undefined') {
      try {
        const userJsonStr = localStorage.getItem('hidayah_user');
        if (userJsonStr) {
          const userJson = JSON.parse(userJsonStr);
          const u = userJson?.user || userJson;
          activeId = u?._id || u?.id || "";
        }
      } catch (e) {}
    }

    if (!activeId) {
      alert('Please sign in to manage your saved reflections.');
      return;
    }
    
    const nextSavedState = !isSavedPost;
    setIsSavedPost(nextSavedState);
    
    try {
      const res = await hidayahFetch(`/api/posts/${id}/save/`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsSavedPost(data.hasSaved);
        if (onSaveToggle) onSaveToggle(id, data.hasSaved);
        
        // Update local community cache so it sticks if app is closed/reopened
        safeStorage.updateCommunityCache(id, { isSaved: data.hasSaved });
        
        // Also update profile cache if it exists
        safeStorage.updateProfileSaveCache({
          _id: id,
          author,
          authorName,
          timeAgo,
          moodTag,
          content,
          verse,
          hadith,
          ameenCount: likesCount,
          commentCount: repliesList.length,
          ameens: isLiked ? [effectiveUserId] : [], // Rough approximation for cache
          userId,
          themePalette,
          authorImage,
          reflectionThemeId,
          textColor: savedTextColor,
          customBackgroundImage
        }, data.hasSaved);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setIsSavedPost(!nextSavedState);
        alert(errorData.message || 'Could not update save status. Please try again.');
      }
    } catch (err) {
      console.error("Save error:", err);
      setIsSavedPost(!nextSavedState);
      alert('Connection failed. Please check your internet.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this reflection?")) return;
    
    setIsDeleting(true);
    try {
      const res = await hidayahFetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onDeleteSuccess) onDeleteSuccess(id);
        router.refresh();
      } else {
        setIsDeleting(false);
        alert('Failed to delete post');
      }
    } catch (e) {
      setIsDeleting(false);
      alert('An error occurred');
    }
  };

  const handleDeleteComment = async (replyId: string) => {
    if (!replyId) return;

    // Store original state for potential revert
    const originalReplies = [...repliesList];
    
    // 1. Optimistic Update - Remove from UI instantly
    const updatedReplies = repliesList.filter(r => (r._id || r.id) !== replyId);
    setRepliesList(updatedReplies);
    
    // Update local community cache immediately for instant feedback across the app
    safeStorage.updateCommunityCache(id, { 
      replies: updatedReplies,
      commentCount: updatedReplies.length 
    });

    try {
      // Use explicit trailing slash + fallback param to guarantee compatibility with all environments
      const res = await hidayahFetch(`/api/posts/${id}/reply/?replyId=${replyId}&action=delete`, {
        method: 'POST' // Use POST fallback which is most reliable in mobile/web bridges
      });
      
      if (!res.ok) {
        // 2. Revert on server failure
        setRepliesList(originalReplies);
        safeStorage.updateCommunityCache(id, { 
          replies: originalReplies,
          commentCount: originalReplies.length 
        });
        const errorData = await res.json().catch(() => ({}));
        alert(`Could not delete comment: ${errorData.message || 'Server Error'}`);
      }
    } catch (err) {
      // 3. Revert on connection error
      setRepliesList(originalReplies);
      safeStorage.updateCommunityCache(id, { 
        replies: originalReplies,
        commentCount: originalReplies.length 
      });
      console.error(err);
      alert("Connection error. Please check your internet.");
    }
  };

  // Force gradients for all posts to ensure consistent "Premium" look
  const activeMood = (themePalette || moodTag || "Reflective").trim();
  let colors = MOOD_PALETTES[activeMood] || MOOD_PALETTES["Reflective"];

  // If a specific high-fidelity theme ID is provided, use its exact colors for perfect consistency
  if (reflectionThemeId) {
    for (const suite of Object.values(GRADIENT_LIBRARY)) {
      const found = suite.options.find(o => o.id === reflectionThemeId);
      if (found) {
        colors = found.colors;
        break;
      }
    }
  }
  
  // Default to 0 if backdropVariant isn't provided (ensures ALL posts get the new look)
  const variant = (backdropVariant !== undefined && backdropVariant !== null && backdropVariant >= 0) ? backdropVariant : 0;
  const hasGradient = true; // Force true to ensure premium aesthetic
  const isWhite = backdropVariant === -2;
  const cardBg = isWhite ? 'bg-white' : 'bg-[var(--color-hidayah-secondary)]';
  
  const currentGradient = generateMeshGradient(colors, variant);
  const baseColor = colors[4] || colors[0] || '#FFFFFF';
  const isLightText = true; // All our new premium themes use light text

  // Dynamic colors based on background (Jewel & Metal)
  const textColor = 'text-white';
  const textMuted = 'text-white/70';
  const borderCol = 'border-white/20';
  const avatarBg = 'bg-white/20 backdrop-blur-md text-white';
  const tagBg = 'bg-white/10 border-white/20 text-white backdrop-blur-md';
  const globalTextShadow = '0 2px 8px rgba(0,0,0,0.3)';

  return (
    <div 
      className={`relative group overflow-hidden ${compact ? 'rounded-[32px] flex flex-col aspect-[4/5] sm:aspect-[3/4]' : 'rounded-[48px]'} border border-[var(--color-hidayah-border)]/30 ${hasGradient ? '' : 'bg-[var(--color-hidayah-primary)] shadow-sm hover:shadow-md'} transition-all duration-300 select-none`}
      onDoubleClick={handleDoubleTap}
    >
      {/* Visual content wrapper for sharing capture */}
      <div ref={cardRef} className={`relative w-full h-full flex flex-col ${compact ? 'p-3.5 sm:p-6' : 'p-5 sm:p-8'} overflow-hidden rounded-[inherit] bg-[#EBE3D5]`}>
        {/* Background Layer */}
        {customBackgroundImage ? (
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center no-repeat transition-all duration-700"
            style={{ 
              backgroundImage: `url(${customBackgroundImage})`,
              backgroundPosition: 'center center',
              backgroundSize: 'cover'
            }}
          />
        ) : hasGradient && (
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: currentGradient,
              backgroundColor: colors[4]
            }}
          />
        )}
        <div className={`absolute inset-0 ${customBackgroundImage ? 'bg-black/35' : 'bg-black/25'} z-[1]`} />
        
        {/* The Actual Content (Now in normal flow so the card has height) */}
        <div className="relative z-10 h-full w-full flex flex-col">
           {/* showHeart */}
           {showHeart && (
             <div className="absolute inset-0 flex items-center justify-center z-[100] pointer-events-none animate-in fade-in zoom-in-50 duration-300">
               <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl opacity-90" />
             </div>
           )}
        {/* Header */}
        <div className="flex items-center justify-between">
            <Link href={`/profile?u=${author}`} className="flex items-center gap-2 md:gap-3 group/author">
              <div className={`${compact ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10 md:w-12 md:h-12'} shrink-0 rounded-full flex items-center justify-center font-bold ${compact ? 'text-sm' : 'text-lg'} ${avatarBg} overflow-hidden group-hover/author:border-white transition-all`}>
                {authorImage ? (
                  <img src={authorImage} alt={author || "User"} className="w-full h-full object-cover" />
                ) : (
                  (author || "User").charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col">
                <h3 className={`font-semibold ${compact ? 'text-[11px] sm:text-xs md:text-sm truncate max-w-[70px] sm:max-w-none' : 'text-sm'} ${textColor} group-hover/author:underline transition-all`}>{author || "User"}</h3>
                <span className={`text-[9px] sm:text-[10px] md:text-xs ${textMuted}`}>{timeAgo}</span>
              </div>
            </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className={`px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-1.5 rounded-full border ${compact ? 'text-[9px] sm:text-[10px] md:text-xs hidden sm:block' : 'text-xs'} font-medium ${tagBg}`}>
              {moodTag}
            </span>
              <PostMenu 
                postId={id} 
                onDelete={handleDelete}
                onUnsave={handleSave}
                isDeleting={isDeleting}
                isSaved={isSavedPost}
                hasGradient={hasGradient}
                showDelete={showDelete}
              />
              {compact && isSavedPost && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  className="bg-red-500/90 backdrop-blur-md border border-white/20 text-white p-2.5 rounded-full shadow-lg active:scale-90 transition-all hover:bg-red-600 group/unsave"
                  title="Unsave Reflection"
                >
                  <Bookmark className="w-4 h-4 fill-current group-hover/unsave:scale-110 transition-transform" />
                </button>
              )}

              {rightAction}
          </div>
        </div>

        {/* Content Section (Scrollable for long verses/text) */}
        <div className={`pr-1 mobile-scroll-container ${compact ? 'space-y-2 sm:space-y-3' : 'space-y-5 max-h-[450px] overflow-y-auto custom-scrollbar overscroll-contain'}`}>
          {verse && (
            <div className={`border-l-2 pl-3 py-0.5 md:pl-4 md:py-1 space-y-1 md:space-y-3 ${hasGradient ? 'border-white/50' : 'border-[var(--color-hidayah-gold)]'}`}>
              <p 
                className={`font-arabic ${compact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl md:text-2xl'} text-right allow-select ${savedTextColor ? '' : textColor}`} 
                style={{
                  color: savedTextColor || undefined,
                  textShadow: savedTextColor ? '0.5px 0.5px 1px rgba(0,0,0,0.2)' : globalTextShadow
                }}
                dir="rtl"
              >
                {verse.text}
              </p>

              {verse.translation && (
                <p 
                  className={`italic leading-relaxed allow-select ${compact ? 'text-[9px] sm:text-[10px]' : 'text-xs sm:text-sm md:text-base'} ${savedTextColor ? '' : (isLightText ? 'text-white/90' : 'text-[var(--color-hidayah-dark)]/80')}`}
                  style={{
                    color: savedTextColor || undefined,
                    textShadow: savedTextColor ? '0.5px 0.5px 1px rgba(0,0,0,0.2)' : undefined
                  }}
                >
                  "{verse.translation}"
                </p>

              )}
              <p className={`text-[7px] md:text-[9px] font-bold uppercase tracking-wider ${savedTextColor ? '' : (hasGradient ? 'text-white/90' : 'text-[var(--color-hidayah-gold)]')}`} style={{ color: savedTextColor || undefined }}>
                {verse.surah} • Ayah {verse.ayah}
              </p>

            </div>
          )}
          {hadith && (
            <div className="mt-2">
              <HadithCard hadith={hadith} isLightText={isLightText} transparent={hasGradient} customTextColor={savedTextColor} />
            </div>
          )}
          <div>
            <p 
              className={`${compact ? 'text-[11px] sm:text-xs md:text-sm line-clamp-6' : 'text-lg md:text-xl'} allow-select ${savedTextColor ? '' : textColor}`}
              style={{
                color: savedTextColor || undefined,
                fontFamily: 'var(--font-crimson), var(--font-serif)',
                lineHeight: compact ? '1.5' : '1.8',
                textShadow: savedTextColor ? '0.5px 0.5px 1px rgba(0,0,0,0.2)' : globalTextShadow
              }}
            >
              {content}
            </p>
          </div>
        </div>

        {/* Interactions */}
        <div className={`flex flex-col border-t mt-1 md:mt-2 ${borderCol}`}>
          <div className={`flex items-center ${compact ? 'gap-3 sm:gap-4 pt-2 md:pt-3' : 'gap-4 md:gap-6 pt-3 md:pt-4'}`}>
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-[11px] md:text-sm font-medium group transition-all active:scale-90 ${isLiked ? 'text-red-500' : textColor} hover:opacity-100`}
            >
              <Heart className={`${compact ? 'w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5' : 'w-4 h-4 md:w-5 md:h-5'} transition-all ${isLiked ? 'fill-red-500 text-red-500' : (isLightText ? 'text-white' : 'text-[var(--color-hidayah-dark)]')} group-hover:scale-125`} />
              <span className={compact ? 'hidden sm:inline' : ''}>Like</span>
              <span className={compact ? 'inline sm:hidden ml-0.5' : 'ml-0.5'}>{likesCount > 0 ? likesCount : ''}</span>
            </button>
            <button 
              onClick={() => {
                setShowReplies(!showReplies);
              }}
              className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-[11px] md:text-sm font-medium transition-all active:scale-90 z-20 ${textColor} hover:opacity-100 group`}
            >
              <MessageCircle className={`${compact ? 'w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5' : 'w-4 h-4 md:w-5 md:h-5'} group-hover:scale-125 transition-transform`} />
              <span className={compact ? 'hidden sm:inline' : ''}>{repliesList.length > 0 ? `${repliesList.length} Comments` : 'Comment'}</span>
              <span className={compact ? 'inline sm:hidden ml-0.5' : 'hidden'}>{repliesList.length}</span>
            </button>
            
            <div className="flex-1" />
            
            <button 
              onClick={handleShareClick}
              disabled={isSharing}
              className={`p-2 rounded-full transition-all active:scale-90 shadow-sm z-20 ${isSharing ? 'animate-pulse' : ''} ${isLightText ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-black/5 text-[var(--color-hidayah-dark)] hover:bg-black/10'}`}
              title="Share to Story"
            >
              {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className={`w-4 h-4 transition-transform hover:scale-125`} />}
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              className={`p-3 rounded-2xl transition-all active:scale-90 shadow-lg z-30 flex items-center gap-2 ${isSavedPost ? 'bg-red-500 text-white' : (isLightText ? 'bg-white/30 text-white' : 'bg-black/10 text-[var(--color-hidayah-dark)]')}`}
              title={isSavedPost ? 'Unsave reflection' : 'Save reflection'}
            >
              <Bookmark className={`w-5 h-5 transition-transform hover:scale-110 ${isSavedPost ? 'fill-current' : ''}`} />
              {isSavedPost && <span className="text-[10px] font-bold uppercase tracking-wider">Saved</span>}
            </button>

          </div>

          {/* Expanded Replies Section */}
          {!compact && showReplies && (
            <div className={`mt-4 pt-4 border-t ${borderCol} space-y-4 relative z-30`}>
              {repliesList.length > 0 ? (
                <div className="space-y-3 pr-2">
                  {(isRepliesExpanded ? repliesList : repliesList.slice(-1)).map((reply: any, i: number) => {
                    // Robust user extraction from props or localStorage fallback
                    const loggedInId = effectiveUserId;
                    const loggedInUsername = (effectiveUserName || "").replace(/^@/, '').trim().toLowerCase();
                    const loggedInEmail = (effectiveEmail || "").toLowerCase();
                    
                    const replyAuthorClean = (reply.author || "").replace(/^@/, '').trim().toLowerCase();
                    
                    const isMyComment = loggedInUsername && replyAuthorClean && loggedInUsername === replyAuthorClean;
                    const isGlobalAdmin = ['huzaifsayed454@gmail.com', 'huzaifsayed23@gmail.com'].includes(loggedInEmail) || (actualUserFromStorage?.isAdmin);

                    // Only the comment author or an admin can delete comments to prevent confusion
                    const canDelete = isMyComment || isGlobalAdmin;

                    return (
                      <div 
                        key={reply._id || i} 
                        className={`relative p-3 rounded-xl transition-all ${isLightText ? 'bg-white/10' : 'bg-[var(--color-hidayah-secondary)]'} border ${borderCol} select-none overflow-hidden`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-xs font-bold ${textColor}`}>{reply.author || "User"}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${textMuted}`}>{new Date(reply.createdAt).toLocaleDateString()}</span>
                            {canDelete && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm("Delete this comment?")) {
                                    handleDeleteComment(reply._id);
                                  }
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-all active:scale-90"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm ${textColor}`}>{reply.content}</p>
                      </div>
                    );
                  })}
                  
                  {repliesList.length > 1 && !isRepliesExpanded && (
                    <button 
                      onClick={() => setIsRepliesExpanded(true)}
                      className={`text-xs font-bold pt-1 hover:underline ${textColor} opacity-80`}
                    >
                      View {repliesList.length - 1} other {repliesList.length - 1 === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                  {repliesList.length > 1 && isRepliesExpanded && (
                    <button 
                      onClick={() => setIsRepliesExpanded(false)}
                      className={`text-xs font-bold pt-1 hover:underline ${textColor} opacity-80`}
                    >
                      Hide replies
                    </button>
                  )}
                </div>
              ) : (
                <p className={`text-sm italic ${textMuted}`}>No replies yet. Be the first to share your thoughts.</p>
              )}
              
              <div className="flex gap-2 relative">
                <input 
                  type="text" 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Add a comment..."
                  onKeyDown={(e) => { if (e.key === 'Enter') submitReply(); }}
                  className={`flex-1 rounded-full px-4 py-2 text-sm bg-black/5 border focus:outline-none ${isLightText ? 'border-white/30 text-white placeholder:text-white/50 focus:border-white' : 'border-[var(--color-hidayah-border)] text-[var(--color-hidayah-dark)] focus:border-[var(--color-hidayah-dark)] placeholder:text-[var(--color-hidayah-dark)]/50'}`}
                />
                <button 
                  onClick={submitReply}
                  disabled={!replyText.trim() || isSubmittingReply}
                  className={`p-2 rounded-full flex items-center justify-center transition-all active:scale-90 ${isLightText ? 'bg-white text-[var(--color-hidayah-dark)]' : 'bg-[var(--color-hidayah-dark)] text-white'} disabled:opacity-50`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-auto pt-4 flex items-center justify-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
          <Logo className="w-4 h-4 text-white" showText={false} />
          <span className="text-[8px] font-bold text-white uppercase tracking-[0.2em]">Hidayah</span>
        </div>
      </div>
    </div>
      {/* End of cardRef visual wrapper */}

      <ShareReflectionModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={handleShareToPlatform}
        isProcessing={isSharing}
      />

      {/* Hidden Capture Template for Social Sharing (Pure Reflection Look) */}
      <div className="fixed -left-[5000px] top-0 pointer-events-none" aria-hidden="true">
        <div 
          ref={shareCaptureRef}
          className="w-[1080px] flex flex-col p-16 relative overflow-hidden rounded-[80px]"
          style={{ 
            fontFamily: 'var(--font-crimson), serif',
            minHeight: '1350px' // High-resolution 4:5 aspect ratio base
          }}
        >
          {/* Exact Background as seen in App */}
          {customBackgroundImage ? (
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${customBackgroundImage})` }}
            />
          ) : (
            <div 
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: currentGradient,
                backgroundColor: colors[4]
              }}
            />
          )}
          <div className={`absolute inset-0 ${customBackgroundImage ? 'bg-black/35' : 'bg-black/25'} z-[1]`} />
          
          <div className="relative z-10 w-full h-full flex flex-col">
            {/* Header (Exact Match to App) */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-3xl bg-white/20 backdrop-blur-md text-white overflow-hidden">
                  {authorImage ? (
                    <img src={authorImage} alt={author} className="w-full h-full object-cover" />
                  ) : (
                    author.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold text-3xl text-white">{author}</h3>
                  <span className="text-xl text-white/70">{timeAgo}</span>
                </div>
              </div>
              <div className="px-8 py-3 rounded-full bg-white/10 border border-white/20 text-2xl font-medium text-white backdrop-blur-md">
                {moodTag}
              </div>
            </div>

            {/* Content (Exact Match to App) */}
            <div className="space-y-12 mb-12">
              {verse && (
                <div className="border-l-4 border-white/50 pl-10 space-y-6">
                  <p className="font-arabic text-[64px] text-right text-white leading-relaxed" dir="rtl">
                    {verse.text}
                  </p>
                  {verse.translation && (
                    <p className="text-4xl italic text-white/90 leading-relaxed">
                      "{verse.translation}"
                    </p>
                  )}
                  <p className="text-2xl font-bold text-white/90 uppercase tracking-widest">
                    {verse.surah} • Ayah {verse.ayah}
                  </p>
                </div>
              )}

              {hadith && (
                <div className="bg-white/5 backdrop-blur-sm p-10 rounded-[48px] border border-white/10">
                   <p className="font-arabic text-5xl text-right text-white/90 mb-6" dir="rtl">{hadith.hadithArabic}</p>
                   <p className="text-3xl text-white/80 leading-relaxed italic">"{hadith.hadithEnglish}"</p>
                   <p className="text-xl font-bold text-white/50 uppercase mt-4">{hadith.bookName} • {hadith.hadithNumber}</p>
                </div>
              )}

              <p 
                className="text-[52px] text-white leading-[1.6]" 
                style={{ 
                  textShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  fontFamily: 'var(--font-crimson), var(--font-serif)'
                }}
              >
                {content}
              </p>
            </div>

            {/* Footer (Pure Watermark) */}
            <div className="mt-auto pt-16 flex items-center justify-center gap-4 opacity-40">
              <Logo className="w-10 h-10 text-white" showText={false} />
              <span className="text-2xl font-bold text-white uppercase tracking-[0.3em]">Hidayah</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

FeedCard.displayName = "FeedCard";

export default FeedCard;
