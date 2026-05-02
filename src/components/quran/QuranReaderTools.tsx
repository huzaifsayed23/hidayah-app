"use client";

import React, { useEffect } from 'react';

export default function QuranReaderTools({ pageNumber }: { pageNumber: number }) {
  useEffect(() => {
    // Save progress
    const saveProgress = async () => {
      try {
        await fetch('/api/users/quran/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageNumber }),
        });
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    };
    
    saveProgress();
  }, [pageNumber]);

  return null;
}
