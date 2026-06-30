"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark, BookmarkCheck, Loader2, Info, Languages } from "lucide-react";
import { getChapters, getVersesByChapter, Chapter, Verse, hidayahFetch } from "@/lib/api";

function toArabicIndic(num: number | string): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num.toString().split("").map((c) => digits[parseInt(c)]).join("");
}

export default function SurahReaderPage({ initialSurahId }: { initialSurahId?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = initialSurahId || params.id as string;
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [fontSize, setFontSize] = useState(26); 
  const [showInfo, setShowInfo] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false); // Default to reading form

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
        
        const res = await hidayahFetch("/api/surahs/bookmark");
        if (res.ok) {
          const bookmarks = await res.json();
          const isMarked = bookmarks.some((b: any) => b.surahId === parseInt(id));
          setIsBookmarked(isMarked);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-hidayah-primary)] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-hidayah-gold animate-spin mb-4" />
        <p className="text-hidayah-dark/50 font-serif">Opening the Surah...</p>
      </div>
    );
  }

  if (!chapter) return null;

  return (
    <main className="min-h-screen bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] pb-20">
      <header className="sticky top-0 z-30 bg-[var(--color-hidayah-primary)]/90 backdrop-blur-md border-b border-hidayah-border/30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/surahs" className="p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-hidayah-dark/60" />
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight">{chapter.name_simple}</h1>
              <p className="text-[10px] tracking-widest text-hidayah-gold uppercase font-medium">Surah {chapter.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowTranslation(!showTranslation)} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${showTranslation ? 'bg-hidayah-gold text-white shadow-md' : 'bg-[var(--color-hidayah-secondary)] text-hidayah-dark border border-hidayah-border/50 hover:bg-hidayah-border/20'}`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{showTranslation ? "Hide" : "Trans"}</span>
            </button>
            <button onClick={toggleBookmark} className="p-2">
              {isBookmarked ? <BookmarkCheck className="w-6 h-6 text-hidayah-gold" /> : <Bookmark className="w-6 h-6 text-hidayah-dark/30" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <span className="text-5xl font-quran block mb-1">{chapter.name_arabic}</span>
          <span className="text-xs sm:text-sm tracking-widest text-hidayah-gold uppercase font-medium">{chapter.translated_name.name}</span>
        </div>

        {id !== "1" && id !== "9" && (
          <div className="text-center font-quran text-[32px] sm:text-[42px] mb-6 sm:mb-8 text-hidayah-dark tracking-wide">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </div>
        )}

        {showTranslation ? (
          <div className="flex flex-col gap-5">
            {verses.map((verse) => (
              <div key={verse.id} className="bg-[var(--color-hidayah-secondary)] px-5 py-4 rounded-2xl border border-hidayah-border/40 shadow-sm">
                <div className="text-right font-quran mushaf-layout mb-3 text-[24px] sm:text-[38px]" dir="rtl">
                  {verse.text_uthmani || verse.text_indopak || verse.text || ''} <span className="text-hidayah-gold mx-1 font-quran text-[20px] sm:text-[24px]">﴾{toArabicIndic(verse.verse_key.split(":")[1])}﴿</span>
                </div>
                <div className="text-[var(--color-hidayah-dark)] text-sm leading-relaxed border-l-2 border-hidayah-gold/30 pl-3 opacity-70">
                  {verse.translations?.[0]?.text.replace(/<[^>]*>/g, "") || "Translation unavailable"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--color-hidayah-mushaf-bg)] rounded-[32px] shadow-lg border border-hidayah-border/10 p-6 sm:p-10 transition-colors duration-300">
            <div className="mushaf-layout font-quran text-[24px] sm:text-[38px] text-center antialiased" dir="rtl">
              {verses.map((verse) => (
                <span key={verse.id} className="inline mx-0.5 group">
                  <span className="transition-colors duration-500 hover:text-hidayah-gold text-hidayah-dark">
                    {verse.text_uthmani || verse.text_indopak || verse.text || ''}
                  </span>
                  <span className="text-hidayah-gold/60 mx-1 font-quran inline-flex items-center text-[20px] sm:text-[24px]">
                    ﴾{toArabicIndic(verse.verse_key.split(":")[1])}﴿
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
