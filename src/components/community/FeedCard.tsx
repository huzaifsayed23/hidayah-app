"use client";

import React, { useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Loader2, Trash2, X } from 'lucide-react';
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
  preview?: boolean;
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
  preview = true,
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
  const [isMounted, setIsMounted] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);
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

  const handleCommentTouchStart = (replyId: string) => {
    if (commentTimerRef.current) {
      clearTimeout(commentTimerRef.current);
    }
    commentTimerRef.current = setTimeout(() => {
      setCommentMenuId(replyId);
    }, 600) as any;
  };

  const handleCommentTouchEnd = () => {
    if (commentTimerRef.current) {
      clearTimeout(commentTimerRef.current);
      commentTimerRef.current = null;
    }
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
    const parentIdSaved = replyingTo?.commentId || null;
    
    // Clear input and show loading state immediately
    setReplyText("");
    setIsSubmittingReply(true);
    setReplyingTo(null);
    
    // 1. Optimistic Update - Add to UI immediately
    const optimisticReply = {
      _id: `temp-${Date.now()}`,
      author: effectiveUserName || "User",
      content: textToSubmit,
      createdAt: new Date().toISOString(),
      likes: [],
      parentId: parentIdSaved
    };
    
    const updatedReplies = [...repliesList, optimisticReply];
    setRepliesList(updatedReplies);
    
    try {
      const res = await hidayahFetch(`/api/posts/${id}/reply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textToSubmit, parentId: parentIdSaved })
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

  const toggleCommentLike = async (replyId: string) => {
    const loggedInUsername = (effectiveUserName || "").replace(/^@/, '').trim().toLowerCase();
    if (!loggedInUsername) {
      alert("Please sign in to like comments");
      return;
    }

    const originalReplies = [...repliesList];

    const updatedReplies = repliesList.map(r => {
      const rId = (r._id || r.id || "").toString();
      if (rId === replyId) {
        const likes = r.likes || [];
        const index = likes.indexOf(loggedInUsername);
        const newLikes = index === -1 
          ? [...likes, loggedInUsername]
          : likes.filter((u: string) => u !== loggedInUsername);
        return { ...r, likes: newLikes };
      }
      return r;
    });

    setRepliesList(updatedReplies);
    safeStorage.updateCommunityCache(id, { 
      replies: updatedReplies,
      commentCount: updatedReplies.length 
    });

    try {
      const res = await hidayahFetch(`/api/posts/${id}/reply/?replyId=${replyId}&action=like`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error("Failed to like comment");
      }
    } catch (err) {
      setRepliesList(originalReplies);
      safeStorage.updateCommunityCache(id, { 
        replies: originalReplies,
        commentCount: originalReplies.length 
      });
      console.error(err);
    }
  };

  const handleCommentReport = async (replyId: string) => {
    if (!window.confirm("Report this comment for violating community guidelines?")) return;
    
    setCommentMenuId(null);
    alert("Thank you. This comment has been reported and sent to our moderators for review.");
    
    try {
      await hidayahFetch(`/api/posts/${id}/reply/?replyId=${replyId}&action=report`, {
        method: 'POST'
      });
    } catch (err) {
      console.error("Error reporting comment:", err);
    }
  };

  const handleDeleteComment = async (replyId: string) => {
    if (!replyId) return;

    const originalReplies = [...repliesList];
    
    const updatedReplies = repliesList.filter(r => {
      const rId = (r._id || r.id || "").toString();
      return rId !== replyId && r.parentId !== replyId;
    });
    setRepliesList(updatedReplies);
    setCommentMenuId(null);
    
    safeStorage.updateCommunityCache(id, { 
      replies: updatedReplies,
      commentCount: updatedReplies.length 
    });

    try {
      const res = await hidayahFetch(`/api/posts/${id}/reply/?replyId=${replyId}&action=delete`, {
        method: 'POST'
      });
      
      if (!res.ok) {
        setRepliesList(originalReplies);
        safeStorage.updateCommunityCache(id, { 
          replies: originalReplies,
          commentCount: originalReplies.length 
        });
        const errorData = await res.json().catch(() => ({}));
        alert(`Could not delete comment: ${errorData.message || 'Server Error'}`);
      }
    } catch (err) {
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

  const isVerseLong = !!verse && (
    verse.text.length > 220 || 
    (!!verse.translation && verse.translation.length > 130)
  );

  const isHadithLong = !!hadith && (
    hadith.hadithArabic.length > 220 || 
    hadith.hadithEnglish.length > 130
  );

  const isContentLong = !!content && content.length > 150;

  const isLongContent = isVerseLong || isHadithLong || isContentLong;

  // Dynamic colors based on background (Jewel & Metal)
  const textColor = 'text-white';
  const textMuted = 'text-white/70';
  const borderCol = 'border-white/20';
  const avatarBg = 'bg-white/20 backdrop-blur-md text-white';
  const tagBg = 'bg-white/10 border-white/20 text-white backdrop-blur-md';
  const globalTextShadow = '0 2px 8px rgba(0,0,0,0.3)';

  return (
    <div 
      className={`relative group overflow-hidden ${compact ? 'rounded-[32px] flex flex-col aspect-[4/5] sm:aspect-[3/4] cursor-pointer active:scale-[0.98]' : 'rounded-[48px]'} border border-[var(--color-hidayah-border)]/30 ${hasGradient ? '' : 'bg-[var(--color-hidayah-primary)] shadow-sm hover:shadow-md'} transition-all duration-300 select-none`}
      onDoubleClick={handleDoubleTap}
      onClick={(e) => {
        if (compact) {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('a')) return;
          router.push(`/community/post-reader?id=${id}`);
        }
      }}
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

        {/* Content Section (Scrollable for long verses/text only when not in preview mode) */}
        <div className={`pr-1 mobile-scroll-container ${
          compact 
            ? 'space-y-2 sm:space-y-3' 
            : preview 
              ? 'space-y-3 overflow-hidden' 
              : 'space-y-5 max-h-[550px] overflow-y-auto custom-scrollbar overscroll-contain'
        }`}>
          {verse && (
            <div className={`border-l-2 pl-3 py-0.5 md:pl-4 md:py-1 space-y-1 md:space-y-2 ${hasGradient ? 'border-white/50' : 'border-[var(--color-hidayah-gold)]'}`}>
              <div>
                <p 
                  className={`font-arabic ${compact ? 'text-sm sm:text-base' : preview ? 'text-lg sm:text-xl md:text-2xl line-clamp-4' : 'text-xl sm:text-2xl md:text-3xl'} text-right allow-select ${savedTextColor ? '' : textColor}`} 
                  style={{
                    color: savedTextColor || undefined,
                    textShadow: savedTextColor ? '0.5px 0.5px 1px rgba(0,0,0,0.2)' : globalTextShadow,
                    lineHeight: preview ? undefined : '2'
                  }}
                  dir="rtl"
                >
                  {verse.text}
                </p>
              </div>

              {verse.translation && (
                <div>
                  <p 
                    className={`italic leading-relaxed allow-select ${compact ? 'text-[9px] sm:text-[10px]' : preview ? 'text-xs sm:text-sm md:text-base line-clamp-2' : 'text-sm sm:text-base md:text-lg'} ${savedTextColor ? '' : (isLightText ? 'text-white/90' : 'text-[var(--color-hidayah-dark)]/80')}`}
                    style={{
                      color: savedTextColor || undefined,
                      textShadow: savedTextColor ? '0.5px 0.5px 1px rgba(0,0,0,0.2)' : undefined
                    }}
                  >
                    "{verse.translation}"
                  </p>
                </div>
              )}
              <p className={`text-[7px] md:text-[9px] font-bold uppercase tracking-wider ${savedTextColor ? '' : (hasGradient ? 'text-white/90' : 'text-[var(--color-hidayah-gold)]')}`} style={{ color: savedTextColor || undefined }}>
                {verse.surah} • Ayah {verse.ayah}
              </p>
            </div>
          )}
          {hadith && (
            <div className="mt-2">
              <HadithCard hadith={hadith} isLightText={isLightText} transparent={hasGradient} customTextColor={savedTextColor} preview={preview} />
            </div>
          )}
          <div>
            <p 
              className={`${compact ? 'text-[11px] sm:text-xs md:text-sm line-clamp-6' : preview ? 'text-base md:text-lg line-clamp-4' : 'text-lg md:text-xl'} allow-select ${savedTextColor ? '' : textColor}`}
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

          {preview && isLongContent && (
            <div className="pt-1 flex justify-end">
              <Link 
                href={`/community/post-reader?id=${id}`}
                className="text-[var(--color-hidayah-gold)] hover:text-white text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-colors duration-200 flex items-center gap-1 bg-black/10 hover:bg-black/25 border border-white/5 px-3 py-1.5 rounded-full shadow-sm"
              >
                Read Full
                <svg className="w-3 h-3 text-[var(--color-hidayah-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
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
              onClick={(e) => {
                e.stopPropagation();
                setShowReplies(true);
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

      {/* Bottom Sheet Comments Panel */}
      {isMounted && typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showReplies && (
            <div className="fixed inset-0 z-[150000] flex items-end justify-center">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowReplies(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              
              {/* Sheet */}
              <motion.div
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={0.3}
                onDragEnd={(e, info) => {
                  if (info.offset.y > 100 || info.velocity.y > 300) {
                    setShowReplies(false);
                  }
                }}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="relative w-full max-w-lg bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] flex flex-col z-10 max-h-[85vh] overflow-hidden"
              >
                {/* Drag Handle & Header */}
                <div className="flex flex-col items-center pt-3 pb-4 px-6 border-b border-[var(--color-hidayah-border)]/70 cursor-grab active:cursor-grabbing select-none shrink-0 bg-[var(--color-hidayah-primary)]">
                  <div className="w-12 h-1.5 bg-[var(--color-hidayah-dark)]/15 rounded-full mb-4" />
                  <div className="w-full flex items-center justify-between">
                    <h3 className="font-serif font-bold text-lg text-[var(--color-hidayah-dark)] flex items-center gap-2">
                      Comments 
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[var(--color-hidayah-secondary)] text-[var(--color-hidayah-dark)] font-sans font-bold">
                        {repliesList.length}
                      </span>
                    </h3>
                    <button 
                      onClick={() => setShowReplies(false)}
                      className="p-1.5 rounded-full hover:bg-black/5 text-[var(--color-hidayah-dark)] opacity-60 hover:opacity-100 transition-all active:scale-95"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Comments List */}
                <div 
                  className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar"
                  style={{ overscrollBehaviorY: 'contain' }}
                >
                  {(() => {
                    const rootComments = repliesList.filter((r: any) => !r.parentId);
                    const loggedInUsername = (effectiveUserName || "").replace(/^@/, '').trim().toLowerCase();
                    const loggedInEmail = (effectiveEmail || "").toLowerCase();

                    if (rootComments.length === 0) {
                      return (
                        <div className="py-16 text-center text-[var(--color-hidayah-dark)]/40">
                          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                          <p className="text-sm font-medium">No comments yet</p>
                          <p className="text-xs opacity-60">Be the first to share your thoughts on this reflection.</p>
                        </div>
                      );
                    }

                    return rootComments.map((reply: any, i: number) => {
                      const renderCommentRow = (r: any, isReply: boolean = false) => {
                        const rId = (r._id || r.id || "").toString();
                        const replyAuthorClean = (r.author || "").replace(/^@/, '').trim().toLowerCase();
                        const hasLiked = r.likes?.includes(loggedInUsername);
                        const likeCount = r.likes?.length || 0;

                        return (
                          <div 
                            key={rId || i}
                            className={`flex gap-3 group/comment relative transition-all duration-200 ${isReply ? 'ml-10 pl-3 border-l-2 border-[var(--color-hidayah-border)]/30' : ''}`}
                            onTouchStart={() => handleCommentTouchStart(rId)}
                            onTouchEnd={handleCommentTouchEnd}
                            onTouchMove={handleCommentTouchEnd}
                            onMouseDown={() => handleCommentTouchStart(rId)}
                            onMouseUp={handleCommentTouchEnd}
                            onMouseLeave={handleCommentTouchEnd}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setCommentMenuId(rId);
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-[var(--color-hidayah-secondary)] border border-[var(--color-hidayah-border)]/45 flex items-center justify-center font-bold text-xs shrink-0 text-[var(--color-hidayah-dark)] select-none">
                              {(r.author || "U").charAt(0).toUpperCase()}
                            </div>
                            
                            <div className="flex-1 bg-[var(--color-hidayah-secondary)]/30 rounded-2xl px-4 py-2.5 border border-[var(--color-hidayah-border)]/30 flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-xs font-bold text-[var(--color-hidayah-dark)] truncate max-w-[120px]">
                                    @{r.author ? r.author.replace(/^@/, "") : "User"}
                                  </span>
                                  <span className="text-[9px] text-[var(--color-hidayah-dark)] opacity-40">
                                    {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-xs text-[var(--color-hidayah-dark)]/85 leading-relaxed break-words">{r.content}</p>
                                
                                <div className="flex items-center gap-3 mt-1.5 select-none">
                                  {!r.parentId && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReplyingTo({ commentId: rId, username: r.author });
                                      }}
                                      className="text-[10px] font-bold text-[var(--color-hidayah-dark)]/50 hover:text-[var(--color-hidayah-dark)] transition-colors active:scale-95"
                                    >
                                      Reply
                                    </button>
                                  )}
                                  <span className="text-[9px] text-[var(--color-hidayah-dark)]/35 opacity-0 group-hover/comment:opacity-100 transition-opacity pointer-events-none hidden sm:inline">
                                    Hold to option
                                  </span>
                                </div>
                              </div>

                              {/* Heart Like button on far right */}
                              <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5 select-none">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCommentLike(rId);
                                  }}
                                  className="p-1 hover:bg-black/5 rounded-full transition-all active:scale-75"
                                >
                                  <Heart className={`w-3.5 h-3.5 transition-colors ${hasLiked ? 'fill-red-500 text-red-500' : 'opacity-40 hover:opacity-100 text-[var(--color-hidayah-dark)]'}`} />
                                </button>
                                {likeCount > 0 && (
                                  <span className="text-[9px] font-bold opacity-50 text-[var(--color-hidayah-dark)]">{likeCount}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      };

                      const commentReplies = repliesList.filter((r: any) => {
                        const pId = (r.parentId || "").toString();
                        const rId = (reply._id || reply.id || "").toString();
                        return pId === rId;
                      });

                      return (
                        <div key={reply._id || i} className="space-y-3">
                          {renderCommentRow(reply, false)}
                          
                          {/* Threaded Nested Replies */}
                          {commentReplies.length > 0 && (
                            <div className="space-y-3 mt-2">
                              {commentReplies.map((replyChild: any, idx: number) => 
                                renderCommentRow(replyChild, true)
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Replying Target Banner */}
                {replyingTo && (
                  <div className="px-6 py-2 bg-[var(--color-hidayah-secondary)] border-t border-[var(--color-hidayah-border)]/50 flex justify-between items-center text-xs text-[var(--color-hidayah-dark)] animate-fade-in shrink-0">
                    <span className="opacity-70 font-medium">
                      Replying to <span className="font-bold">@{replyingTo.username.replace(/^@/, '')}</span>
                    </span>
                    <button 
                      onClick={() => setReplyingTo(null)}
                      className="p-1 rounded-full hover:bg-black/5 opacity-60 hover:opacity-100 transition-all active:scale-90"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-[var(--color-hidayah-border)]/50 bg-[var(--color-hidayah-primary)] shrink-0 pb-[max(env(safe-area-inset-bottom),1rem)]">
                  <div className="flex gap-2.5 relative items-center">
                    <input 
                      type="text" 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={replyingTo ? `Reply to @${replyingTo.username.replace(/^@/, '')}...` : "Add a comment..."}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitReply(); }}
                      className="flex-1 rounded-full px-4 py-2.5 text-xs bg-black/5 border border-[var(--color-hidayah-border)] focus:outline-none text-[var(--color-hidayah-dark)] focus:border-[var(--color-hidayah-dark)] placeholder:text-[var(--color-hidayah-dark)]/40"
                    />
                    <button 
                      onClick={submitReply}
                      disabled={!replyText.trim() || isSubmittingReply}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 bg-[var(--color-hidayah-dark)] text-white disabled:opacity-30 disabled:scale-100 shrink-0 shadow-sm"
                    >
                      {isSubmittingReply ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Instagram-style Comment Action sheet modal */}
                <AnimatePresence>
                  {commentMenuId && (() => {
                    const selectedComment = repliesList.find(r => (r._id || r.id || "").toString() === commentMenuId);
                    if (!selectedComment) return null;

                    const loggedInUsername = (effectiveUserName || "").replace(/^@/, '').trim().toLowerCase();
                    const loggedInEmail = (effectiveEmail || "").toLowerCase();
                    const replyAuthorClean = (selectedComment.author || "").replace(/^@/, '').trim().toLowerCase();
                    const isMyComment = loggedInUsername && replyAuthorClean && loggedInUsername === replyAuthorClean;
                    const isGlobalAdmin = ['huzaifsayed454@gmail.com', 'huzaifsayed23@gmail.com'].includes(loggedInEmail) || (actualUserFromStorage?.isAdmin);
                    const canDelete = isMyComment || isGlobalAdmin;

                    return (
                      <div className="absolute inset-0 z-[200000] flex items-end justify-center bg-black/40 backdrop-blur-[2px]">
                        <div 
                          onClick={() => setCommentMenuId(null)}
                          className="absolute inset-0"
                        />
                        
                        <motion.div
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          exit={{ y: "100%" }}
                          transition={{ type: "spring", damping: 25, stiffness: 220 }}
                          className="relative w-full max-w-lg bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] p-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] flex flex-col gap-3 z-10"
                        >
                          <div className="w-12 h-1.5 bg-[var(--color-hidayah-dark)]/15 rounded-full mx-auto mb-2" />
                          
                          <div className="text-center py-2 border-b border-[var(--color-hidayah-border)]/50">
                            <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Comment Options</p>
                            <p className="text-xs text-[var(--color-hidayah-dark)]/70 truncate mt-1 px-4 font-serif italic">"{selectedComment.content}"</p>
                          </div>

                          {canDelete ? (
                            <button
                              onClick={() => handleDeleteComment(selectedComment._id)}
                              className="w-full py-4 text-sm font-bold text-red-500 hover:bg-red-50/50 rounded-2xl transition-all active:scale-98 text-center"
                            >
                              Delete Comment
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCommentReport(selectedComment._id)}
                              className="w-full py-4 text-sm font-bold text-red-500 hover:bg-red-50/50 rounded-2xl transition-all active:scale-98 text-center"
                            >
                              Report Comment
                            </button>
                          )}
                          
                          <button
                            onClick={() => setCommentMenuId(null)}
                            className="w-full py-4 text-sm font-bold opacity-60 hover:bg-black/5 rounded-2xl transition-all active:scale-98 text-center"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      </div>
                    );
                  })()}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

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
                <div className={`border-l-4 pl-10 space-y-6 ${savedTextColor ? 'border-black/30' : 'border-white/50'}`}>
                  <p className={`font-quran text-[64px] text-right leading-relaxed ${savedTextColor ? '' : 'text-white'}`} style={{ color: savedTextColor || undefined }} dir="rtl">
                    {verse.text}
                  </p>
                  {verse.translation && (
                    <p className={`text-4xl italic leading-relaxed ${savedTextColor ? '' : 'text-white/90'}`} style={{ color: savedTextColor || undefined }}>
                      "{verse.translation}"
                    </p>
                  )}
                  <p className={`text-2xl font-bold uppercase tracking-widest ${savedTextColor ? '' : 'text-white/90'}`} style={{ color: savedTextColor || undefined }}>
                    {verse.surah} • Ayah {verse.ayah}
                  </p>
                </div>
              )}

              {hadith && (
                <div className={`bg-white/5 backdrop-blur-sm p-10 rounded-[48px] border ${savedTextColor ? 'border-black/10' : 'border-white/10'}`}>
                   <p className={`font-arabic text-5xl text-right mb-6 ${savedTextColor ? '' : 'text-white/90'}`} style={{ color: savedTextColor || undefined }} dir="rtl">{hadith.hadithArabic}</p>
                   <p className={`text-3xl leading-relaxed italic ${savedTextColor ? '' : 'text-white/80'}`} style={{ color: savedTextColor || undefined }}>"{hadith.hadithEnglish}"</p>
                   <p className={`text-xl font-bold uppercase mt-4 ${savedTextColor ? '' : 'text-white/50'}`} style={{ color: savedTextColor || undefined }}>{hadith.bookName} • {hadith.hadithNumber}</p>
                </div>
              )}

              <p 
                className={`text-[52px] leading-[1.6] ${savedTextColor ? '' : 'text-white'}`} 
                style={{ 
                  color: savedTextColor || undefined,
                  textShadow: savedTextColor ? '1px 1px 2px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.3)',
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
