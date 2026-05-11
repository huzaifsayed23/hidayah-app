"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Loader2, Bookmark, BookmarkCheck } from 'lucide-react';
import { Chapter, hidayahFetch, getVersesByPage, getChapters, getVersesByJuz } from '@/lib/api';
import { safeStorage } from '@/lib/storage';

function toArabicIndic(num: number | string): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num.toString().split("").map((c) => digits[parseInt(c)]).join("");
}

export default function QuranReaderClient({ initialPage, juzNumber }: { initialPage: number, juzNumber: number }) {
  const router = useRouter();
  const [verses, setVerses] = useState<any[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const pageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // Save last read progress
    safeStorage.setItem('hidayah_last_read_page', initialPage.toString());
    safeStorage.setItem('hidayah_last_read_juz', juzNumber.toString());

    async function loadData() {
      setIsLoading(true);
      try {
        const juzVerses = await getVersesByJuz(juzNumber);
        setVerses(juzVerses || []);

        const chaptersData = await getChapters();
        setChapters(chaptersData || []);

        const token = safeStorage.getItem('hidayah_token');
        let userId = 'guest';
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.userId || 'guest';
          } catch (e) {}
        }
        
        const storageKey = `hidayah_bookmarks_${userId}`;
        const localBookmarks = JSON.parse(safeStorage.getItem(storageKey) || '[]');
        
        try {
          const bookmarksRes = await hidayahFetch('/api/users/quran/bookmarks');
          if (bookmarksRes.ok) {
            const bData = await bookmarksRes.json();
            const apiKeys = bData.bookmarks?.map((b: any) => b.verseKey) || [];
            setBookmarks(apiKeys);
            safeStorage.setItem(storageKey, JSON.stringify(apiKeys));
          } else {
            setBookmarks(localBookmarks);
          }
        } catch (e) {
          setBookmarks(localBookmarks);
        }

      } catch (error) {
        console.error("Error loading Quran Juz:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [juzNumber]);

  // Scroll to initial page when data is loaded
  useEffect(() => {
    if (!isLoading && verses.length > 0) {
      const targetRef = pageRefs.current[initialPage.toString()];
      if (targetRef) {
        setTimeout(() => {
          targetRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [isLoading, initialPage, verses.length]);

  const toggleBookmark = async (verseKey: string, pNum: number) => {
    const isBookmarked = bookmarks.includes(verseKey);
    const newBookmarks = isBookmarked ? bookmarks.filter(k => k !== verseKey) : [...bookmarks, verseKey];
    
    const token = safeStorage.getItem('hidayah_token');
    let userId = 'guest';
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId || 'guest';
      } catch (e) {}
    }
    const storageKey = `hidayah_bookmarks_${userId}`;

    // Optimistic update
    setBookmarks(newBookmarks);
    safeStorage.setItem(storageKey, JSON.stringify(newBookmarks));

    try {
      // Backend POST handles the toggle internally
      const res = await hidayahFetch('/api/users/quran/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ 
          verseKey,
          pageNumber: pNum 
        })
      });
      
      if (!res.ok) {
        // Revert on error
        setBookmarks(bookmarks);
        safeStorage.setItem(storageKey, JSON.stringify(bookmarks));
      }
    } catch (err) {
      console.warn("API bookmark failed", err);
      // Revert on error
      setBookmarks(bookmarks);
      safeStorage.setItem(storageKey, JSON.stringify(bookmarks));
    }
  };

  const currentChapter = (verseKey: string) => {
    const chapterId = parseInt(verseKey.split(':')[0]);
    return chapters.find(c => c.id === chapterId);
  };

  // Group verses by page_number
  const pages = verses.reduce((acc: any, verse: any) => {
    const pageNum = verse.page_number;
    if (!acc[pageNum]) acc[pageNum] = [];
    acc[pageNum].push(verse);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-hidayah-primary flex flex-col items-center p-2 sm:p-4 pb-32">
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 px-2">
        <Link href="/quran" className="p-2"><X className="w-6 h-6 text-hidayah-dark/40" /></Link>
        <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-hidayah-gold bg-hidayah-secondary/50 px-4 py-1.5 rounded-full border border-hidayah-gold/10">
          Juz {juzNumber} • Mushaf Mode
        </div>
        <div className="w-10" />
      </div>

      {isLoading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-6">
          <Loader2 className="w-10 h-10 animate-spin text-hidayah-gold" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Opening the Mushaf...</p>
        </div>
      ) : (
        <div className="w-full max-w-3xl space-y-6">
          {Object.keys(pages).map((pageNum: string) => (
            <div 
              key={pageNum} 
              ref={(el) => { pageRefs.current[pageNum] = el; }}
              className="bg-[#fbf8f1] rounded-[32px] shadow-lg border border-hidayah-border/10 overflow-hidden relative"
            >
              {/* Page Header */}
              <div className="px-10 py-3 border-b border-hidayah-border/5 flex justify-between items-center bg-hidayah-secondary/20">
                 <span className="text-[9px] font-bold text-hidayah-dark/30 uppercase tracking-widest">Page {pageNum}</span>
                 <span className="text-[9px] font-bold text-hidayah-gold uppercase tracking-widest">Juz {juzNumber}</span>
              </div>

              <div className="p-4 sm:p-8 lg:p-10">
                <div 
                  className="mushaf-layout font-arabic text-[22px] sm:text-[36px] text-center leading-[1.15] sm:leading-[1.2] tracking-tight antialiased" 
                  dir="rtl"
                  style={{ wordSpacing: '-0.08em', letterSpacing: '-0.02em' }}
                >
                  {pages[pageNum].map((verse: any, idx: number) => {
                    const isBookmarked = bookmarks.includes(verse.verse_key);
                    const isNewChapter = verse.verse_key.split(':')[1] === "1";
                    const chapter = isNewChapter ? currentChapter(verse.verse_key) : null;

                    return (
                      <React.Fragment key={verse.id || idx}>
                        {isNewChapter && chapter && (
                          <div className="w-full flex flex-col items-center my-4 py-3 border-y border-hidayah-border/10 bg-hidayah-secondary/5 rounded-2xl" dir="ltr">
                            <div className="text-lg font-arabic text-hidayah-gold mb-0.5">{chapter.name_arabic}</div>
                            <div className="text-[7px] font-bold uppercase tracking-[0.3em] text-hidayah-dark opacity-20">{chapter.name_simple}</div>
                          </div>
                        )}
                        
                        <span className="relative group mx-0.5 inline">
                          <span 
                            className={`transition-colors duration-500 hover:text-hidayah-gold ${isBookmarked ? 'text-hidayah-gold' : 'text-hidayah-dark'}`}
                          >
                            {verse.text_indopak}
                          </span>
                          <span 
                            onClick={() => toggleBookmark(verse.verse_key, parseInt(pageNum))}
                            className="relative inline-flex items-center cursor-pointer select-none px-0.5"
                          >
                            <span className="text-hidayah-gold/60 mx-1 font-arabic text-[20px] sm:text-[24px]">
                              ﴾{toArabicIndic(verse.verse_key.split(':')[1])}﴿
                            </span>
                            {isBookmarked && (
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center animate-in slide-in-from-top-2 duration-500 pointer-events-none">
                                <Bookmark className="w-4 h-4 text-hidayah-gold fill-hidayah-gold" />
                                <div className="w-[2px] h-3 bg-hidayah-gold/50"></div>
                              </div>
                            )}
                          </span>
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Juz Navigation */}
          <div className="flex justify-between gap-4 py-8">
            <Link 
              href={juzNumber > 1 ? `/quran/read/${[1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582][juzNumber - 2]}` : '#'}
              className={`flex-1 py-5 bg-hidayah-secondary rounded-[32px] text-center text-[10px] font-bold uppercase tracking-widest border border-hidayah-border/30 transition-all active:scale-95 ${juzNumber <= 1 ? 'opacity-20 pointer-events-none' : 'hover:bg-hidayah-gold hover:text-white hover:border-hidayah-gold shadow-sm'}`}
            >
              Previous Juz
            </Link>
            <Link 
              href={juzNumber < 30 ? `/quran/read/${[1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582][juzNumber]}` : '#'}
              className={`flex-1 py-5 bg-hidayah-dark text-white rounded-[32px] text-center text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${juzNumber >= 30 ? 'opacity-20 pointer-events-none' : 'hover:bg-hidayah-gold shadow-md'}`}
            >
              Next Juz
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
