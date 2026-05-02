"use client";

import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MOOD_PALETTES, generateMeshGradient } from '@/lib/gradients';
import PostMenu from './PostMenu';
import HadithCard from './HadithCard';
import { NatureBackground } from '../NatureBackground';

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
}

export default function FeedCard({
  id,
  author,
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
}: FeedCardProps) {
  const [isLiked, setIsLiked] = useState(ameens?.includes(currentUserId || "") || false);
  const [likesCount, setLikesCount] = useState(ameenCount || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [repliesList, setRepliesList] = useState(replies || []);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isRepliesExpanded, setIsRepliesExpanded] = useState(false);
  const [isSavedPost, setIsSavedPost] = useState(isSaved);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

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
      const res = await fetch(`/api/posts/${id}/like`, { method: 'POST' });
      if (!res.ok) {
        setIsLiked(isLiked);
        setLikesCount(likesCount);
      }
    } catch (e) {
      setIsLiked(isLiked);
      setLikesCount(likesCount);
    }
  };

  const submitReply = async () => {
    if (!replyText.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);
    
    try {
      const res = await fetch(`/api/posts/${id}/reply`, {
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
    if (!currentUserId || currentUserId === 'admin@gmail.com') {
      alert('Saving posts requires a registered account.');
      return;
    }
    
    setIsSavedPost(!isSavedPost);
    try {
      const res = await fetch(`/api/posts/${id}/save`, { method: 'POST' });
      if (!res.ok) setIsSavedPost(isSavedPost);
    } catch {
      setIsSavedPost(isSavedPost);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this reflection?")) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
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

  // Default to false if backdropVariant isn't provided (for old mock posts, though we can give them one too)
  const hasGradient = backdropVariant !== undefined && backdropVariant !== null && backdropVariant >= 0;
  const isWhite = backdropVariant === -2;
  const cardBg = isWhite ? 'bg-white' : 'bg-[var(--color-hidayah-secondary)]';
  const colors = MOOD_PALETTES[(themePalette || moodTag || "").trim()] || MOOD_PALETTES["Reflective"];
  const currentGradient = hasGradient ? generateMeshGradient(colors, backdropVariant) : '';
  const baseColor = colors[4] || colors[0] || '#FFFFFF';
  const isLightGradient = (hasGradient && (baseColor.toUpperCase().startsWith('#F') || baseColor.toUpperCase().startsWith('#E'))) || (reflectionThemeId && reflectionThemeId.includes('snow'));
  const isLightText = hasGradient || !!reflectionThemeId;

  // Dynamic colors based on background
  const textColor = isLightText ? 'text-white' : 'text-[var(--color-hidayah-dark)]';
  const textMuted = isLightText ? 'text-white/70' : 'text-[var(--color-hidayah-dark)] opacity-60';
  const borderCol = isLightText ? 'border-white/20' : 'border-[var(--color-hidayah-border)]/50';
  const avatarBg = isLightText ? 'bg-white/20 backdrop-blur-md text-white' : 'bg-black/5 backdrop-blur-md text-[var(--color-hidayah-dark)]';
  const tagBg = isLightText ? 'bg-white/10 border-white/20 text-white backdrop-blur-md' : 'bg-black/5 border-[var(--color-hidayah-border)]/20 text-[var(--color-hidayah-dark)] backdrop-blur-md';

  return (
    <div className={`relative group overflow-hidden ${compact ? 'rounded-[32px] flex flex-col aspect-[4/5] sm:aspect-[3/4] p-4 sm:p-6' : 'rounded-[48px] p-6 sm:p-8'} border border-[var(--color-hidayah-border)]/30 ${hasGradient ? '' : 'bg-[var(--color-hidayah-primary)] shadow-sm hover:shadow-md'} transition-all duration-300`}>
      {/* Background Gradient */}
      {hasGradient && (
        <>
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: currentGradient,
              backgroundColor: colors[4], // Base color
            }}
          />
          {/* Overlay to ensure text legibility */}
          {/* Overlay to ensure text legibility (Always show for gradients since we forced white text) */}
          <div className="absolute inset-0 z-0 bg-black/30 pointer-events-none" />
        </>
      )}

      {/* Content wrapper to stay above gradient */}
      <div className={`relative z-10 flex flex-col ${compact ? 'gap-3 sm:gap-4' : 'gap-6'}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`${compact ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10 md:w-12 md:h-12'} shrink-0 rounded-full flex items-center justify-center font-bold ${compact ? 'text-sm' : 'text-lg'} ${avatarBg} overflow-hidden`}>
              {authorImage ? (
                <img src={authorImage} alt={author} className="w-full h-full object-cover" />
              ) : (
                author.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col">
              <h3 className={`font-semibold ${compact ? 'text-[11px] sm:text-xs md:text-sm truncate max-w-[70px] sm:max-w-none' : 'text-sm'} ${textColor}`}>{author}</h3>
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

        {/* Content */}
        <div className={compact ? 'space-y-2 sm:space-y-3' : 'space-y-5'}>
          {verse && (
            <div className={`max-h-[120px] sm:max-h-[180px] overflow-y-auto custom-scrollbar border-l-2 pl-3 py-0.5 md:pl-4 md:py-1 space-y-1 md:space-y-3 ${hasGradient ? 'border-white/50' : 'border-[var(--color-hidayah-gold)]'}`}>
              <p 
                className={`font-arabic ${compact ? 'text-sm sm:text-base' : 'text-xl md:text-2xl'} text-right leading-relaxed allow-select ${savedTextColor ? '' : textColor}`} 
                style={{
                  color: savedTextColor || undefined,
                  textShadow: savedTextColor ? '0.5px 0.5px 1px rgba(0,0,0,0.2)' : undefined
                }}
                dir="rtl"
              >
                {verse.text}
              </p>
              {verse.translation && (
                <p 
                  className={`italic leading-relaxed allow-select ${compact ? 'text-[10px] sm:text-[11px]' : 'text-sm md:text-base'} ${savedTextColor ? '' : (isLightText ? 'text-white/90' : 'text-[var(--color-hidayah-dark)]/80')}`}
                  style={{
                    color: savedTextColor || undefined,
                    textShadow: savedTextColor ? '0.5px 0.5px 1px rgba(0,0,0,0.2)' : undefined
                  }}
                >
                  "{verse.translation}"
                </p>
              )}
              <p className={`text-[8px] md:text-xs font-bold uppercase tracking-wider ${savedTextColor ? '' : (hasGradient ? 'text-white/90' : 'text-[var(--color-hidayah-gold)]')}`} style={{ color: savedTextColor || undefined }}>
                {verse.surah} • Ayah {verse.ayah}
              </p>
            </div>
          )}
          {hadith && (
            <div className="mt-2">
              <HadithCard hadith={hadith} isLightText={isLightText} transparent={hasGradient} customTextColor={savedTextColor} />
            </div>
          )}
          <div className={`${compact ? 'max-h-[80px]' : 'max-h-[350px]'} overflow-y-auto custom-scrollbar pr-1`}>
            <p 
              className={`${compact ? 'text-[11px] sm:text-xs md:text-sm line-clamp-6' : 'text-lg md:text-xl'} allow-select ${savedTextColor ? '' : textColor}`}
              style={{
                color: savedTextColor || undefined,
                fontFamily: 'var(--font-crimson), var(--font-serif)',
                lineHeight: compact ? '1.5' : '1.8',
                textShadow: savedTextColor ? '0.5px 0.5px 1px rgba(0,0,0,0.2)' : undefined
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
              className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-[11px] md:text-sm font-medium group transition-colors ${isLiked ? 'text-red-500' : textColor} hover:opacity-80`}
            >
              <Heart className={`${compact ? 'w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5' : 'w-4 h-4 md:w-5 md:h-5'} transition-all ${isLiked ? 'fill-red-500 text-red-500' : (isLightText ? 'group-hover:fill-red-500 group-hover:text-red-500 text-white' : 'text-[var(--color-hidayah-dark)] group-hover:fill-red-500 group-hover:text-red-500')}`} />
              <span className={compact ? 'hidden sm:inline' : ''}>Like</span>
              <span className={compact ? 'inline sm:hidden ml-0.5' : 'ml-0.5'}>{likesCount > 0 ? likesCount : ''}</span>
            </button>
            <button 
              onClick={() => setShowReplies(!showReplies)}
              className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-[11px] md:text-sm font-medium transition-opacity ${textMuted} hover:opacity-100 ${textColor}`}
            >
              <MessageCircle className={`${compact ? 'w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5' : 'w-4 h-4 md:w-5 md:h-5'}`} />
              <span className={compact ? 'hidden sm:inline' : ''}>{repliesList.length > 0 ? `${repliesList.length} Comments` : 'Comment'}</span>
              <span className={compact ? 'inline sm:hidden ml-0.5' : 'hidden'}>{repliesList.length}</span>
            </button>
            
            <div className="flex-1" />
            
            <button 
              onClick={handleSave}
              className={`p-2 rounded-full transition-all ${isSavedPost ? 'bg-[var(--color-hidayah-gold)] text-white shadow-sm' : (isLightText ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-black/5 text-[var(--color-hidayah-dark)]/50 hover:bg-black/10')}`}
              title={isSavedPost ? 'Unsave reflection' : 'Save reflection'}
            >
              <Bookmark className={`w-4 h-4 ${isSavedPost ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Expanded Replies Section */}
          {!compact && showReplies && (
            <div className={`mt-4 pt-4 border-t ${borderCol} space-y-4`}>
              {repliesList.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                  {(isRepliesExpanded ? repliesList : repliesList.slice(-1)).map((reply: any, i: number) => (
                    <div key={i} className={`p-3 rounded-xl ${isLightText ? 'bg-black/20' : 'bg-[var(--color-hidayah-primary)]'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold ${textColor}`}>{reply.author}</span>
                        <span className={`text-[10px] ${textMuted}`}>{new Date(reply.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className={`text-sm ${textColor}`}>{reply.content}</p>
                    </div>
                  ))}
                  
                  {repliesList.length > 1 && !isRepliesExpanded && (
                    <button 
                      onClick={() => setIsRepliesExpanded(true)}
                      className={`text-xs font-medium pt-1 hover:underline ${textMuted}`}
                    >
                      View {repliesList.length - 1} other {repliesList.length - 1 === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                  {repliesList.length > 1 && isRepliesExpanded && (
                    <button 
                      onClick={() => setIsRepliesExpanded(false)}
                      className={`text-xs font-medium pt-1 hover:underline ${textMuted}`}
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
                  className={`flex-1 rounded-full px-4 py-2 text-sm bg-transparent border focus:outline-none ${isLightText ? 'border-white/30 text-white placeholder:text-white/50 focus:border-white' : 'border-[var(--color-hidayah-border)] text-[var(--color-hidayah-dark)] focus:border-[var(--color-hidayah-dark)] placeholder:text-[var(--color-hidayah-dark)]/50'}`}
                />
                <button 
                  onClick={submitReply}
                  disabled={!replyText.trim() || isSubmittingReply}
                  className={`p-2 rounded-full flex items-center justify-center transition-colors ${isLightText ? 'bg-white text-[var(--color-hidayah-dark)] hover:bg-gray-200' : 'bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] hover:bg-black'} disabled:opacity-50`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
