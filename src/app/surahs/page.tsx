"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, ArrowLeft, Loader2, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { getChapters, Chapter } from "@/lib/api";

export default function SurahListPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "makkah" | "madinah">("all");
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
    const matchesSearch =
      chapter.name_simple.toLowerCase().includes(query) ||
      chapter.name_arabic.toLowerCase().includes(query) ||
      chapter.translated_name.name.toLowerCase().includes(query) ||
      chapter.id.toString() === query;

    const matchesFilter = filterType === "all" || chapter.revelation_place === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <main className="min-h-screen bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] pb-20 transition-colors duration-500">
      {/* Header Section */}
      <header className="sticky top-0 z-20 bg-[var(--color-hidayah-primary)]/90 backdrop-blur-md border-b border-hidayah-border/40 px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-full transition-colors">
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
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-hidayah-dark/30" />
          <input
            type="text"
            placeholder="Search by name or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[var(--color-hidayah-secondary)] border border-hidayah-border/60 focus:border-hidayah-gold focus:outline-none focus:ring-1 focus:ring-hidayah-gold transition-all shadow-sm text-[var(--color-hidayah-dark)] placeholder:text-hidayah-dark/30"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-10 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setFilterType("all")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all whitespace-nowrap ${
              filterType === "all" ? "bg-hidayah-dark text-white shadow-md" : "bg-[var(--color-hidayah-secondary)] text-hidayah-dark border border-hidayah-border/50 hover:bg-hidayah-border/20"
            }`}
          >
            All Surahs
          </button>
          <button
            onClick={() => setFilterType("makkah")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all whitespace-nowrap ${
              filterType === "makkah" ? "bg-hidayah-gold text-white shadow-md" : "bg-[var(--color-hidayah-secondary)] text-hidayah-dark border border-hidayah-border/50 hover:bg-hidayah-border/20"
            }`}
          >
            Makki
          </button>
          <button
            onClick={() => setFilterType("madinah")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all whitespace-nowrap ${
              filterType === "madinah" ? "bg-hidayah-gold text-white shadow-md" : "bg-[var(--color-hidayah-secondary)] text-hidayah-dark border border-hidayah-border/50 hover:bg-hidayah-border/20"
            }`}
          >
            Madani
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-hidayah-gold animate-spin mb-4" />
            <p className="text-hidayah-dark/50 animate-pulse">Opening the library...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {filteredChapters.map((chapter, index) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
                >
                  <Link
                    href={`/surahs/${chapter.id}`}
                    className="group flex items-center justify-between px-4 py-3 bg-[var(--color-hidayah-secondary)] rounded-2xl border border-hidayah-border/30 shadow-sm hover:shadow-md hover:border-hidayah-gold/40 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Number Box */}
                      <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-[var(--color-hidayah-primary)] border border-hidayah-border/30 text-hidayah-gold font-serif font-bold group-hover:bg-hidayah-gold group-hover:text-[var(--color-hidayah-primary)] transition-colors duration-300 text-sm shadow-inner">
                        {chapter.id}
                      </div>
                      
                      <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-hidayah-dark">
                          {chapter.name_simple}
                        </h3>
                        <div className="flex items-center gap-2 text-[9px] text-[var(--color-hidayah-dark)]/50 uppercase tracking-widest font-medium mt-0.5">
                          <span>{chapter.translated_name.name}</span>
                          <span>•</span>
                          <span>{chapter.verses_count} Ayahs</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xl font-quran text-[var(--color-hidayah-dark)] group-hover:text-hidayah-gold transition-colors">
                      {chapter.name_arabic}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredChapters.length === 0 && (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 text-hidayah-border mx-auto mb-4" />
                <p className="text-hidayah-dark/40">No Surahs found matching your criteria</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
