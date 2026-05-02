"use client";

import React, { useState, useRef } from 'react';
import BookmarkButton from './BookmarkButton';

interface InteractiveVerseProps {
  verse: any;
  initialIsBookmarked: boolean;
  children: React.ReactNode;
  verseNum: number;
}

export default function InteractiveVerse({ verse, initialIsBookmarked, children, verseNum }: InteractiveVerseProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const lastTap = useRef<number>(0);

  const toggleBookmark = async () => {
    // Basic optimistic toggle
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    
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
      if (res.ok) {
        const data = await res.json();
        setIsBookmarked(data.action === 'added');
      }
    } catch (err) {
      setIsBookmarked(!newState);
    }
  };

  const handleTouchEnd = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      toggleBookmark();
    }
    lastTap.current = now;
  };

  return (
    <span className="inline">
      <span 
        onTouchEnd={handleTouchEnd}
        onDoubleClick={toggleBookmark}
        className={`hover:text-hidayah-gold transition-colors duration-300 cursor-pointer ${isBookmarked ? 'text-hidayah-gold' : ''}`}
      >
        {children}
      </span>
      <span className="inline-flex items-center justify-center mx-2 text-hidayah-gold text-xl sm:text-2xl font-arabic relative group select-none">
        ﴾{toArabicIndic(verseNum)}﴿
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded-lg shadow-sm border border-hidayah-border/20 z-20">
          <BookmarkButton verse={verse} initialIsBookmarked={isBookmarked} />
        </div>
      </span>
    </span>
  );
}

function toArabicIndic(num: number): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num.toString().split("").map((c) => digits[parseInt(c)]).join("");
}
