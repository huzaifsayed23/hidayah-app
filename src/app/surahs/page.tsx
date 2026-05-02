"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, ArrowLeft, Loader2 } from "lucide-react";
import { getChapters, Chapter } from "@/lib/api";

export default function SurahListPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadChapters() {
      try {
        const data = await getChapters();
        // Remove duplicates by ID
        const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values())
          .sort((a, b) => a.id - b.id);
        setChapters(uniqueData);
      } catch (error) {
        console.error("Error fetching chapters:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadChapters();
  }, []);

  const filteredChapters = chapters.filter((chapter) => {
    const query = searchQuery.toLowerCase();
    return (
      chapter.name_simple.toLowerCase().includes(query) ||
      chapter.name_arabic.toLowerCase().includes(query) ||
      chapter.translated_name.name.toLowerCase().includes(query) ||
      chapter.id.toString() === query
    );
  });

  return (
    <main className="min-h-screen bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] pb-20 transition-colors duration-500">
      {/* Header Section */}
      <header className="sticky top-0 z-20 bg-[var(--color-hidayah-primary)]/90 backdrop-blur-md border-b border-hidayah-border/40 px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link href="/community" className="p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-hidayah-dark/60" />
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-serif font-bold text-[var(--color-hidayah-dark)]">Surahs</h1>
            <p className="text-xs tracking-widest text-hidayah-gold uppercase font-medium">
              {chapters.length > 0 ? `${chapters.length} Surahs` : "Loading..."}
            </p>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Search Bar */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-hidayah-dark/30" />
          <input
            type="text"
            placeholder="Search by name or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[var(--color-hidayah-secondary)] border border-hidayah-border/60 focus:border-hidayah-gold focus:outline-none focus:ring-1 focus:ring-hidayah-gold transition-all shadow-sm text-[var(--color-hidayah-dark)] placeholder:text-hidayah-dark/30"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-hidayah-gold animate-spin mb-4" />
            <p className="text-hidayah-dark/50 animate-pulse">Opening the library...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <AnimatePresence mode="popLayout">
              {filteredChapters.map((chapter, index) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                >
                  <Link
                    href={`/surahs/${chapter.id}`}
                    className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-[var(--color-hidayah-secondary)] rounded-[24px] border border-hidayah-border/30 shadow-sm hover:shadow-xl hover:shadow-hidayah-gold/5 transition-all duration-300 text-center h-full"
                  >
                    {/* Number Box */}
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[var(--color-hidayah-primary)] border border-hidayah-border/30 text-hidayah-gold font-serif font-bold group-hover:bg-hidayah-gold group-hover:text-[var(--color-hidayah-primary)] transition-colors duration-300 text-xs">
                      {chapter.id}
                    </div>

                    {/* Names and Info */}
                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="text-sm sm:text-base font-bold text-hidayah-dark truncate mb-1">
                        {chapter.name_simple}
                      </h3>
                      <div className="text-lg font-arabic text-[var(--color-hidayah-dark)] group-hover:text-hidayah-gold transition-colors mb-1">
                        {chapter.name_arabic}
                      </div>
                      <div className="flex flex-col items-center gap-1 text-[10px] sm:text-xs text-[var(--color-hidayah-dark)]/50">
                        <span className="truncate w-full">{chapter.translated_name.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="capitalize">{chapter.revelation_place}</span>
                          <span className="w-0.5 h-0.5 rounded-full bg-hidayah-border" />
                          <span>{chapter.verses_count} Ayahs</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredChapters.length === 0 && (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 text-hidayah-border mx-auto mb-4" />
                <p className="text-hidayah-dark/40">No Surahs found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
