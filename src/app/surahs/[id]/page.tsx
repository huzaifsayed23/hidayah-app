"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark, BookmarkCheck, Settings, Loader2, Info } from "lucide-react";
import { getChapters, getVersesByChapter, Chapter, Verse, hidayahFetch } from "@/lib/api";


export default function SurahReaderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [fontSize, setFontSize] = useState(32); // Default Arabic font size
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [chaptersData, versesData] = await Promise.all([
          getChapters(),
          getVersesByChapter(parseInt(id))
        ]);
        
        const currentChapter = chaptersData.find(c => c.id === parseInt(id));
        setChapter(currentChapter || null);
        setVerses(versesData);
        
        // Fetch bookmark status from API
        const res = await hidayahFetch("/api/surahs/bookmark");
        if (res.ok) {
          const bookmarks = await res.json();
          const isMarked = bookmarks.some((b: any) => b.surahId === parseInt(id));
          setIsBookmarked(isMarked);
          
          // If bookmarked, find last ayah read and maybe scroll to it (optional enhancement)
          const currentBookmark = bookmarks.find((b: any) => b.surahId === parseInt(id));
          if (currentBookmark) {
            console.log("Last read ayah:", currentBookmark.lastAyahRead);
          }
        }

      } catch (error) {
        console.error("Error loading Surah:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await hidayahFetch("/api/surahs/bookmark", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ surahId: parseInt(id) })
        });
      } else {
        await hidayahFetch("/api/surahs/bookmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ surahId: parseInt(id), lastAyahRead: 1 })
        });
      }

      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const updateProgress = async (ayahNumber: number) => {
    try {
      await hidayahFetch("/api/surahs/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surahId: parseInt(id), lastAyahRead: ayahNumber })
      });
    } catch (error) {

      // Silent error for progress update
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-hidayah-gold animate-spin mb-4" />
        <p className="text-hidayah-dark/50 font-serif">Preparing your reading sanctuary...</p>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Surah Not Found</h1>
        <Link href="/surahs" className="text-hidayah-gold underline">Return to Library</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] transition-colors duration-500">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[var(--color-hidayah-primary)]/90 backdrop-blur-md border-b border-hidayah-border/30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/surahs" className="p-2 hover:bg-hidayah-secondary rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-hidayah-dark/60" />
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight">{chapter.name_simple}</h1>
              <p className="text-[10px] tracking-widest text-hidayah-gold uppercase font-medium">
                Surah {chapter.id} • {chapter.verses_count} Ayahs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 hover:bg-hidayah-secondary rounded-full transition-colors text-hidayah-dark/40"
            >
              <Info className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleBookmark}
              className="p-2 hover:bg-hidayah-secondary rounded-full transition-colors"
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-6 h-6 text-hidayah-gold" />
              ) : (
                <Bookmark className="w-6 h-6 text-hidayah-dark/30" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Reading View */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Surah Intro */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <span className="text-5xl font-arabic text-[var(--color-hidayah-dark)] mb-4 block">
              {chapter.name_arabic}
            </span>
            <span className="text-sm tracking-widest text-hidayah-gold uppercase font-medium">
              {chapter.translated_name.name}
            </span>
          </motion.div>

          {chapter.id !== 1 && chapter.id !== 9 && (
            <div className="text-4xl font-arabic text-[var(--color-hidayah-dark)]/80 mb-12">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </div>
          )}
        </div>

        {/* Verses */}
        <div className="flex flex-col gap-8 md:gap-12">
          {verses.map((verse, index) => {
            const verseNum = parseInt(verse.verse_key.split(":")[1]);
            return (
              <motion.div
                key={verse.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="group relative bg-[#F2E8DA] p-6 md:p-10 rounded-[48px] border border-hidayah-border/40 hover:border-hidayah-gold/60 transition-all duration-500 shadow-sm"
              >
                {/* Verse Number Indicator */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-hidayah-gold/30" />
                  <div className="flex items-center gap-2 px-6 py-1.5 rounded-full bg-[#E5D5C0] border border-hidayah-gold/50 shadow-sm">
                    <span className="text-[10px] font-bold text-[#2D241E] uppercase tracking-[0.2em]">
                      Ayah {verseNum}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-hidayah-gold/30" />
                </div>

                {/* Arabic Text - Full Line */}
                <div 
                  className="w-full text-right mb-6 leading-[2.2] font-arabic text-black transition-all duration-500 hover:text-hidayah-gold"
                  dir="rtl"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {verse.text_indopak}
                </div>

                {/* Translation - Below every line */}
                <div className="text-black text-sm md:text-base leading-relaxed font-sans font-normal tracking-normal text-left max-w-3xl pl-4 border-l-2 border-hidayah-gold/50">
                  {verse.translations && verse.translations.length > 0 
                    ? verse.translations[0].text.replace(/<sup[^>]*>.*?<\/sup>/g, "").replace(/<\/?[^>]+(>|$)/g, "")
                    : "Translation not available"}
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Footer Navigation */}
        <div className="mt-20 flex justify-between items-center gap-4">
          {parseInt(id) > 1 && (
            <Link 
              href={`/surahs/${parseInt(id) - 1}`}
              className="flex-1 p-6 rounded-3xl bg-[#FAF7F2] border border-hidayah-border/30 hover:border-hidayah-gold transition-all text-center"
            >
              <span className="text-xs uppercase tracking-widest text-hidayah-dark/40 block mb-1">Previous</span>
              <span className="font-bold text-hidayah-dark">Surah {parseInt(id) - 1}</span>
            </Link>
          )}
          {parseInt(id) < 114 && (
            <Link 
              href={`/surahs/${parseInt(id) + 1}`}
              className="flex-1 p-6 rounded-3xl bg-[#FAF7F2] border border-hidayah-border/30 hover:border-hidayah-gold transition-all text-center"
            >
              <span className="text-xs uppercase tracking-widest text-hidayah-dark/40 block mb-1">Next</span>
              <span className="font-bold text-hidayah-dark">Surah {parseInt(id) + 1}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Info Modal/Panel */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-hidayah-dark/20 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Surah Info</h3>
              <button onClick={() => setShowInfo(false)} className="p-2">✕</button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-hidayah-border/10 pb-2">
                <span className="text-hidayah-dark/60">Revelation</span>
                <span className="capitalize font-medium">{chapter.revelation_place}</span>
              </div>
              <div className="flex justify-between border-b border-hidayah-border/10 pb-2">
                <span className="text-hidayah-dark/60">Total Ayahs</span>
                <span className="font-medium">{chapter.verses_count}</span>
              </div>
              <div className="flex justify-between border-b border-hidayah-border/10 pb-2">
                <span className="text-hidayah-dark/60">Meaning</span>
                <span className="font-medium">{chapter.translated_name.name}</span>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-hidayah-border/10">
              <h4 className="text-sm font-bold text-hidayah-gold uppercase tracking-widest mb-4">Reading Settings</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm">Text Size</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => setFontSize(Math.max(20, fontSize - 4))} className="w-8 h-8 rounded-full border border-hidayah-border/30 flex items-center justify-center">-</button>
                  <span className="font-bold">{fontSize}</span>
                  <button onClick={() => setFontSize(Math.min(64, fontSize + 4))} className="w-8 h-8 rounded-full border border-hidayah-border/30 flex items-center justify-center">+</button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowInfo(false)}
              className="w-full mt-8 py-4 rounded-2xl bg-hidayah-dark text-[var(--color-hidayah-primary)] font-bold hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </main>
  );
}
