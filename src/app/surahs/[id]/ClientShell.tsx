"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark, BookmarkCheck, Loader2, Info } from "lucide-react";
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
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6">
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
            <Link href="/surahs" className="p-2 hover:bg-hidayah-secondary rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-hidayah-dark/60" />
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight">{chapter.name_simple}</h1>
              <p className="text-[10px] tracking-widest text-hidayah-gold uppercase font-medium">Surah {chapter.id}</p>
            </div>
          </div>
          <button onClick={toggleBookmark} className="p-2">
            {isBookmarked ? <BookmarkCheck className="w-6 h-6 text-hidayah-gold" /> : <Bookmark className="w-6 h-6 text-hidayah-dark/30" />}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <span className="text-5xl font-arabic block mb-4">{chapter.name_arabic}</span>
          <span className="text-sm tracking-widest text-hidayah-gold uppercase font-medium">{chapter.translated_name.name}</span>
        </div>

        <div className="flex flex-col gap-10">
          {verses.map((verse) => (
            <div key={verse.id} className="bg-[#F2E8DA] p-6 rounded-[32px] border border-hidayah-border/40 shadow-sm">
              <div className="text-right font-arabic mushaf-layout mb-6" dir="rtl" style={{ fontSize: `${fontSize}px` }}>
                {verse.text_indopak} <span className="text-hidayah-gold mx-1 font-arabic">﴾{toArabicIndic(verse.verse_key.split(":")[1])}﴿</span>
              </div>
              <div className="text-black text-sm leading-relaxed border-l-2 border-hidayah-gold/30 pl-4">
                {verse.translations?.[0]?.text.replace(/<[^>]*>/g, "") || "Translation unavailable"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
