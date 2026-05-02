"use client";

import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';

interface BookmarkButtonProps {
  verse: any;
  initialIsBookmarked: boolean;
}

export default function BookmarkButton({ verse, initialIsBookmarked }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const toggleBookmark = async () => {
    // Optimistic update for instant feedback
    const previousState = isBookmarked;
    setIsBookmarked(!isBookmarked);
    
    try {
      const res = await fetch('/api/users/quran/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: parseInt(verse.verse_key.split(":")[0]),
          verseNumber: parseInt(verse.verse_key.split(":")[1]),
          pageNumber: verse.page_number,
          verseKey: verse.verse_key,
        }),
      });
      if (!res.ok) {
        throw new Error('Sync failed');
      }
      const data = await res.json();
      // Ensure state matches server response exactly
      setIsBookmarked(data.action === 'added');
    } catch (err) {
      console.error(err);
      // Revert on failure
      setIsBookmarked(previousState);
      alert("Connection lost. Bookmark could not be saved.");
    }
  };

  return (
    <button 
      onClick={toggleBookmark}
      disabled={isLoading}
      className={`ml-1 p-1 rounded-full transition-all hover:bg-hidayah-gold/10 ${isBookmarked ? 'text-hidayah-gold' : 'text-hidayah-gold/30 hover:text-hidayah-gold'}`}
      title={isBookmarked ? "Remove Bookmark" : "Bookmark Verse"}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isBookmarked ? (
        <BookmarkCheck className="w-3.5 h-3.5 fill-current" />
      ) : (
        <Bookmark className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
