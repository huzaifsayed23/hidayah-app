"use client";

import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MOOD_PALETTES, GRADIENT_LIBRARY, generateMeshGradient } from '@/lib/gradients';
import PostMenu from './PostMenu';
import HadithCard from './HadithCard';
import { NatureBackground } from '../NatureBackground';
import { hidayahFetch } from '@/lib/api';
import { toBlob } from 'html-to-image';
import { Logo } from '@/components/Logo';
import { Share2 } from 'lucide-react';

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
}

export default function FeedCard({
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
}: FeedCardProps & { authorName?: string }) {
  const author = propAuthor || authorName || "User";
  const [isLiked, setIsLiked] = useState(ameens?.includes(currentUserId || "") || false);
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
  const cardRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    
    try {
      if (!cardRef.current) return;
      
      // Capture the card exactly as it looks
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: 'transparent'
      });

      if (!blob) throw new Error("Failed to capture");

      const file = new File([blob], `hidayah_${id}.png`, { type: 'image/png' });
      
      const triggerDownload = () => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hidayah_reflection_${id}.png`;
        a.click();
        URL.revokeObjectURL(url);
      };

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Hidayah Reflection',
          });
        } catch (shareError) {
          // If it's a system error (not user cancel), download instead
          if ((shareError as Error).name !== 'AbortError') {
            triggerDownload();
          }
        }
      } else {
        triggerDownload();
      }
    } catch (err) {
      console.error("Critical share failure:", err);
    } finally {
      setIsSharing(false);
    }
  };

  React.useEffect(() => {
    setIsLiked(ameens?.includes(currentUserId || "") || false);
    setLikesCount(ameenCount || 0);
    setRepliesList(replies || []);
    setIsSavedPost(isSaved);
  }, [ameens, ameenCount, currentUserId, replies, isSaved]);

  const handleLike = async () => {
    if (!currentUserId) return; // Must be logged in
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      const res = await hidayahFetch(`/api/posts/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.hasLiked);
        setLikesCount(data.ameenCount);
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
    if (!currentUserId) return;
    if (!isLiked) {
      handleLike();
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  const submitReply = async () => {
    if (!replyText.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);
    
    try {
      const res = await hidayahFetch(`/api/posts/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText })
      });
      if (res.ok) {
        const data = await res.json();
        setRepliesList([...repliesList, data.reply]);
        setReplyText("");
      }
    } catch (e) {
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) {
      alert('Please sign in to save reflections.');
      return;
    }
    
    setIsSavedPost(!isSavedPost);
    try {
      const res = await hidayahFetch(`/api/posts/${id}/save`, { method: 'POST' });
      if (!res.ok) setIsSavedPost(isSavedPost);
    } catch {
      setIsSavedPost(isSavedPost);
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
      ref={cardRef}
      onDoubleClick={handleDoubleTap}
      className={`relative group overflow-hidden ${compact ? 'rounded-[32px] flex flex-col aspect-[4/5] sm:aspect-[3/4] p-3.5 sm:p-6' : 'rounded-[48px] p-5 sm:p-8'} border border-[var(--color-hidayah-border)]/30 ${hasGradient ? '' : 'bg-[var(--color-hidayah-primary)] shadow-sm hover:shadow-md'} transition-all duration-300 select-none`}
    >
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center z-[100] pointer-events-none animate-in fade-in zoom-in-50 duration-300">
          <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl opacity-90" />
        </div>
      )}
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
      {/* Readability overlay - balanced for 'middle perfect' fit */}
      <div className={`absolute inset-0 ${customBackgroundImage ? 'bg-black/35' : 'bg-black/25'} z-[1]`} />

      {/* Content wrapper to stay above gradient */}
      <div className={`relative z-10 flex flex-col ${compact ? 'gap-3 sm:gap-4' : 'gap-6'}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`${compact ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10 md:w-12 md:h-12'} shrink-0 rounded-full flex items-center justify-center font-bold ${compact ? 'text-sm' : 'text-lg'} ${avatarBg} overflow-hidden`}>
              {authorImage ? (
                <img src={authorImage} alt={author || "User"} className="w-full h-full object-cover" />
              ) : (
                (author || "User").charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col">
              <h3 className={`font-semibold ${compact ? 'text-[11px] sm:text-xs md:text-sm truncate max-w-[70px] sm:max-w-none' : 'text-sm'} ${textColor}`}>{author || "User"}</h3>
              <span className={`text-[9px] sm:text-[10px] md:text-xs ${textMuted}`}>{timeAgo}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className={`px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-1.5 rounded-full border ${compact ? 'text-[9px] sm:text-[10px] md:text-xs hidden sm:block' : 'text-xs'} font-medium ${tagBg}`}>
              {moodTag}
            </span>
            <PostMenu 
              postId={id} 
              onDelete={handleDelete} 
              isDeleting={isDeleting} 
              hasGradient={hasGradient} 
              showDelete={showDelete && userId === currentUserId}
            />
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
              onClick={handleShare}
              disabled={isSharing}
              className={`p-2 rounded-full transition-all active:scale-90 shadow-sm z-20 ${isSharing ? 'animate-pulse' : ''} ${isLightText ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-black/5 text-[var(--color-hidayah-dark)] hover:bg-black/10'}`}
              title="Share to Story"
            >
              {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className={`w-4 h-4 transition-transform hover:scale-125`} />}
            </button>
            
            <button 
              onClick={handleSave}
              className={`p-2 rounded-full transition-all active:scale-90 shadow-sm z-20 ${isSavedPost ? 'bg-[var(--color-hidayah-gold)] text-white' : (isLightText ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-black/5 text-[var(--color-hidayah-dark)] hover:bg-black/10')}`}
              title={isSavedPost ? 'Unsave reflection' : 'Save reflection'}
            >
              <Bookmark className={`w-4 h-4 transition-transform hover:scale-125 ${isSavedPost ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Expanded Replies Section */}
          {!compact && showReplies && (
            <div className={`mt-4 pt-4 border-t ${borderCol} space-y-4 relative z-30`}>
              {repliesList.length > 0 ? (
                <div className="space-y-3 pr-2">
                  {(isRepliesExpanded ? repliesList : repliesList.slice(-1)).map((reply: any, i: number) => (
                    <div key={i} className={`p-3 rounded-xl ${isLightText ? 'bg-white/10' : 'bg-[var(--color-hidayah-primary)]'} border ${borderCol}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold ${textColor}`}>{reply.author || "User"}</span>
                        <span className={`text-[10px] ${textMuted}`}>{new Date(reply.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className={`text-sm ${textColor}`}>{reply.content}</p>
                    </div>
                  ))}
                  
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
        <div className="mt-4 flex items-center justify-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
          <Logo className="w-4 h-4 text-white" showText={false} />
          <span className="text-[8px] font-bold text-white uppercase tracking-[0.2em]">Hidayah</span>
        </div>
      </div>
    </div>
  );
}
