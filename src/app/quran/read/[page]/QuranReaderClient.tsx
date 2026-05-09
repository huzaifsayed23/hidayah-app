'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { HIDAYAH_API_URL, hidayahFetch } from '@/lib/api';

function toArabicIndic(num: number): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map((c) => digits[parseInt(c)]).join('');
}

export default function QuranReaderClient() {
  const params = useParams();
  const pageNum = parseInt(params?.page as string);

  const [verses, setVerses] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref for double-click tracking to prevent state reset issues
  const lastClickRef = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    if (!pageNum || isNaN(pageNum)) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [vRes, cRes] = await Promise.all([
          fetch(`https://api.qurancdn.com/api/qdc/verses/by_page/${pageNum}?words=false&translations=131&per_page=50&fields=text_indopak,text_uthmani`),
          fetch('https://api.qurancdn.com/api/qdc/chapters?language=en'),
        ]);
        const vData = await vRes.json();
        const cData = await cRes.json();
        setVerses(vData.verses || []);
        setChapters(cData.chapters || []);

        // Load bookmarks from API
        try {
          const bRes = await hidayahFetch('/api/users/quran/bookmarks');
          if (bRes.ok) {
            const bData = await bRes.json();
            const apiBookmarks = (bData.bookmarks || []).map((b: any) => b.verseKey);
            
            // Merge with localStorage bookmarks
            const localSaved = JSON.parse(localStorage.getItem('hidayah_local_bookmarks') || '[]');
            const merged = Array.from(new Set([...apiBookmarks, ...localSaved]));
            setBookmarks(merged);
          }
        } catch (_) {
          // Fallback to localStorage only if API fails
          const localSaved = JSON.parse(localStorage.getItem('hidayah_local_bookmarks') || '[]');
          setBookmarks(localSaved);
        }
      } catch (e) {
        console.error('Quran load error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    const updateLastRead = async () => {
      try {
        await hidayahFetch(`${HIDAYAH_API_URL}/api/users/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastReadPage: pageNum }),
        });
      } catch (e) {}
    };

    if (pageNum) {
      load();
      updateLastRead();
    }
  }, [pageNum]);

  if (isNaN(pageNum) || pageNum < 1 || pageNum > 604) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg opacity-50">Invalid Page</p>
      </div>
    );
  }

  const chapterIds = Array.from(new Set(verses.map((v) => parseInt(v.verse_key?.split(':')[0]))));
  const pageChapters = chapterIds.map((id) => chapters.find((c: any) => c.id === id));
  const primaryChapter = pageChapters[0] as any;
  const juzNumber = verses.length > 0 ? verses[0].juz_number : '';

  const toggleBookmark = async (verseKey: string) => {
    try {
      const isBookmarked = bookmarks.includes(verseKey);
      
      // Update local state and localStorage immediately (optimistic)
      const newBookmarks = isBookmarked 
        ? bookmarks.filter(k => k !== verseKey) 
        : [...bookmarks, verseKey];
      
      setBookmarks(newBookmarks);
      localStorage.setItem('hidayah_local_bookmarks', JSON.stringify(newBookmarks));
      
      if (!isBookmarked) {
        localStorage.setItem('hidayah_last_marked_verse', verseKey);
        localStorage.setItem('hidayah_last_marked_page', pageNum.toString());
      }

      // Prepare bookmark object for server
      const [chapterId, verseNumber] = verseKey.split(':').map(Number);
      const bookmarkData = {
        chapterId,
        verseNumber,
        pageNumber: pageNum,
        verseKey,
        addedAt: new Date().toISOString()
      };

      // Sync with API using the correct local path
      await hidayahFetch('/api/users/quran/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookmarkData),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerseClick = (verseKey: string) => {
    const now = Date.now();
    const lastClick = lastClickRef.current[verseKey] || 0;
    if (now - lastClick < 300) {
      toggleBookmark(verseKey);
      lastClickRef.current[verseKey] = 0; // Reset
    } else {
      lastClickRef.current[verseKey] = now;
    }
  };

  return (
    <main className="min-h-screen bg-hidayah-primary flex flex-col items-center p-2 sm:p-4 pb-32 overflow-x-hidden">
      <div className="w-full max-w-[650px] flex items-center justify-between mb-4 text-hidayah-dark/60 px-4">
        <Link href="/quran" className="p-2 hover:text-hidayah-gold transition-colors">
          <X className="w-6 h-6" />
        </Link>
        <div className="text-sm tracking-widest uppercase font-medium">Juz {juzNumber}</div>
        <div className="w-10" />
      </div>

      <div className="w-full max-w-[680px] bg-[#fbf8f1] rounded-3xl shadow-2xl shadow-hidayah-dark/5 border-2 border-hidayah-border/30 overflow-hidden relative flex flex-col">
        <div className="px-6 py-6 flex justify-between items-center border-b border-hidayah-border/20 bg-hidayah-secondary/30">
          <div className="text-hidayah-gold font-arabic text-2xl">{primaryChapter?.name_arabic}</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-hidayah-dark/50">{primaryChapter?.name_simple}</div>
        </div>

        <div className="p-1 sm:p-2 flex-grow flex flex-col justify-center" dir="rtl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-hidayah-gold" />
            </div>
          ) : (
            <div
              className="text-[#2D241E] font-arabic break-words mushaf-layout"
              style={{ 
                fontSize: '2.0rem',
                lineHeight: '1.95',
                wordSpacing: '0.1em'
              }}
            >
              {verses.map((verse) => {
                const verseNum = parseInt(verse.verse_key?.split(':')[1]);
                const chapterId = parseInt(verse.verse_key?.split(':')[0]);
                const isFirstVerse = verseNum === 1;
                const isBookmarked = bookmarks.includes(verse.verse_key);
                const arabicText = verse.text_indopak || verse.text_uthmani || verse.text_simple;

                return (
                  <React.Fragment key={verse.id}>
                    {isFirstVerse && chapterId !== 1 && chapterId !== 9 && (
                      <div className="my-2 text-center block w-full text-hidayah-gold font-arabic text-3xl leading-tight opacity-90">
                        بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
                      </div>
                    )}
                    <span
                      className={`group cursor-pointer transition-all duration-300 inline relative ${isBookmarked ? 'text-hidayah-gold' : 'hover:text-hidayah-gold/50'}`}
                      onClick={() => handleVerseClick(verse.verse_key)}
                    >
                      {arabicText}
                      <span className="inline-flex items-center justify-center mx-1.5 relative select-none translate-y-1">
                        {/* Compact ornament for Indo-Pak V2 script */}
                        <div className="w-6 h-6 rounded-full border border-hidayah-gold/40 flex items-center justify-center bg-hidayah-gold/5 relative">
                          <span className="text-[9px] font-bold text-[#2D2A26] font-sans leading-none">
                            {toArabicIndic(verseNum)}
                          </span>
                        </div>
                        {isBookmarked && (
                          <span className="absolute -top-4 -right-1 text-hidayah-gold animate-in fade-in zoom-in duration-300 z-10">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                          </span>
                        )}
                      </span>
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-hidayah-border/20 text-center bg-hidayah-secondary/30">
          <span className="text-[#2D241E]/50 font-arabic text-lg">{toArabicIndic(pageNum)}</span>
        </div>
      </div>

      <div className="w-full max-w-[600px] flex items-center justify-between mt-8">
        {pageNum < 604 ? (
          <Link
            href={`/quran/read/${pageNum + 1}`}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-hidayah-secondary hover:bg-hidayah-gold hover:text-white transition-all duration-300 border border-hidayah-border/50 text-hidayah-dark group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium tracking-wider text-sm uppercase">Next Page</span>
          </Link>
        ) : <div />}

        {pageNum > 1 ? (
          <Link
            href={`/quran/read/${pageNum - 1}`}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-hidayah-secondary hover:bg-hidayah-gold hover:text-white transition-all duration-300 border border-hidayah-border/50 text-hidayah-dark group"
          >
            <span className="font-medium tracking-wider text-sm uppercase">Prev Page</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : <div />}
      </div>
    </main>
  );
}
