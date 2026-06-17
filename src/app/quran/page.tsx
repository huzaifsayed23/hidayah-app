"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Search, Bookmark, History, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { getJuzs, Juz, HIDAYAH_API_URL, hidayahFetch } from "@/lib/api";
import { safeStorage } from "@/lib/storage";
import { useState, useEffect } from "react";
import { motion } from 'framer-motion';

import PageJumpInput from "@/components/quran/PageJumpInput";
import BottomNav from "@/components/BottomNav";

const JUZ_PAGES = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 202, 222, 242, 262, 282, 302, 322,
  342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

export default function QuranPage() {
  const router = useRouter();
  const [juzs, setJuzs] = useState<Juz[]>([]);
  const [lastReadPage, setLastReadPage] = useState(1);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Get User ID from token for isolated storage
      const token = safeStorage.getItem('hidayah_token');
      let userId = 'guest';
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.userId || 'guest';
        } catch (e) {}
      }
      const storageKey = `hidayah_bookmarks_${userId}`;

      // Immediate load from localStorage for instant feel
      const localPage = safeStorage.getItem('hidayah_last_read_page');
      if (localPage) setLastReadPage(parseInt(localPage));
      
      const localBookmarks = JSON.parse(safeStorage.getItem(storageKey) || '[]');
      if (localBookmarks.length > 0) {
        // Fallback placeholder if server hasn't loaded yet
        setBookmarks(localBookmarks.map((k: string) => ({ verseKey: k, pageNumber: 1, addedAt: new Date() })));
      }

      try {
        const juzsData = await getJuzs();
        const allJuzs = Array.from(new Map(juzsData.map((item: Juz) => [item.juz_number, item])).values())
          .sort((a: Juz, b: Juz) => a.juz_number - b.juz_number);
        setJuzs(allJuzs);

        const profileRes = await hidayahFetch('/api/users/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const serverPage = profileData.user.lastReadPage;
          if (serverPage) {
            setLastReadPage(serverPage);
            safeStorage.setItem('hidayah_last_read_page', serverPage.toString());
          }
          
          const serverBookmarks = profileData.user.bookmarks || [];
          setBookmarks(serverBookmarks);
          safeStorage.setItem(storageKey, JSON.stringify(serverBookmarks.map((b: any) => b.verseKey)));
        }
      } catch (e) {
        console.error("Quran page data fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const lastReadJuz = typeof window !== 'undefined' ? safeStorage.getItem('hidayah_last_read_juz') || "1" : "1";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-hidayah-primary)]">
        <Loader2 className="w-8 h-8 animate-spin text-hidayah-gold" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] p-6 sm:p-12 pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="max-w-4xl mx-auto"
      >
        <header className="mb-12 text-center relative pt-4">
          <Link 
            href="/community" 
            className="absolute left-0 top-4 p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-[var(--color-hidayah-dark)]/60" />
          </Link>
          <BookOpen className="w-10 h-10 mx-auto text-hidayah-gold mb-6" strokeWidth={1.5} />
          <h1 className="text-4xl font-light tracking-wide mb-4 text-[var(--color-hidayah-dark)]">
            The Noble Quran
          </h1>
          <p className="text-[var(--color-hidayah-dark)]/70 tracking-wide font-light max-w-md mx-auto mb-10">
            A peaceful sanctuary for your daily reading.
          </p>

          <div className="max-w-md mx-auto relative mb-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-hidayah-dark)]/30" />
            <PageJumpInput />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
            {/* Continue Reading Card */}
            <Link 
              href={`/quran/read/${lastReadPage}`}
              className="flex items-center gap-4 p-5 bg-[var(--color-hidayah-secondary)] rounded-3xl border border-hidayah-gold/30 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-hidayah-gold/10 flex items-center justify-center text-hidayah-gold">
                <History className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-hidayah-gold">Continue Reading</p>
                <p className="text-lg font-serif font-bold text-[var(--color-hidayah-dark)]">Juz {lastReadJuz} • Page {lastReadPage}</p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto text-hidayah-gold opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

            {/* Bookmarks Quick Access */}
            <Link 
              href="#bookmarks"
              className="flex items-center gap-4 p-5 bg-[var(--color-hidayah-secondary)] rounded-3xl border border-hidayah-border/30 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-hidayah-dark)]/5 flex items-center justify-center text-[var(--color-hidayah-dark)]">
                <Bookmark className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-hidayah-dark)] opacity-40">My Bookmarks</p>
                <p className="text-lg font-serif font-bold text-[var(--color-hidayah-dark)]">{bookmarks.length} Verses</p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto text-[var(--color-hidayah-dark)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </header>

        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-hidayah-dark/30 mb-6 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Browse by Juz
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-16">
          {juzs.map((juz) => {
            const startPage = JUZ_PAGES[juz.juz_number - 1] || 1;

            return (
              <Link
                href={`/quran/read/${startPage}`}
                key={juz.id}
                className="group flex flex-col items-center justify-center p-8 bg-[var(--color-hidayah-secondary)] rounded-3xl border border-hidayah-border/30 hover:border-hidayah-gold transition-all duration-500 hover:shadow-xl hover:shadow-hidayah-gold/5"
              >
                <div className="text-sm font-medium tracking-widest text-hidayah-gold uppercase mb-2">
                  Juz
                </div>
                <div className="text-4xl font-light text-[var(--color-hidayah-dark)] group-hover:scale-110 transition-transform duration-500">
                  {juz.juz_number}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bookmarks Section */}
        {bookmarks.length > 0 && (
          <section id="bookmarks" className="mt-16">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-hidayah-dark/30 mb-8 flex items-center gap-2">
              <Bookmark className="w-4 h-4" /> Saved Verses
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bookmarks.map((b: any, i: number) => (
                <Link 
                  key={i}
                  href={`/quran/read/${b.pageNumber}`}
                  className="bg-[var(--color-hidayah-secondary)] p-6 rounded-[2rem] border border-[var(--color-hidayah-border)]/20 shadow-sm hover:shadow-md transition-all flex flex-col gap-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-hidayah-gold uppercase tracking-widest">Saved Verse</span>
                    <span className="text-[10px] font-medium opacity-40">{new Date(b.addedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-quran text-xl text-hidayah-dark">Verse {b.verseKey}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-hidayah-border)]/10">
                    <span className="text-xs font-medium text-hidayah-dark/60 italic">Continue to Page {b.pageNumber}</span>
                    <ArrowRight className="w-4 h-4 text-hidayah-gold" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </motion.div>
    </main>
  );
}
