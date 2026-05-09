"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, BookOpen, ChevronLeft, ChevronRight, Search, X, Sparkles } from 'lucide-react';
import HadithCard from '@/components/community/HadithCard';
import { Logo } from '@/components/Logo';
import { hidayahFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

const BOOKS = [
  { id: 'sahih-bukhari', name: 'Sahih Bukhari', author: 'Imam Bukhari', count: 7000 },
  { id: 'sahih-muslim', name: 'Sahih Muslim', author: 'Imam Muslim', count: 7000 },
  { id: 'al-tirmidhi', name: 'Jami\' Al-Tirmidhi', author: 'Imam Tirmidhi', count: 3900 },
  { id: 'abu-dawood', name: 'Sunan Abu Dawood', author: 'Imam Abu Dawood', count: 4800 },
  { id: 'sunan-nasai', name: 'Sunan an-Nasa\'i', author: 'Imam an-Nasa\'i', count: 5600 },
  { id: 'ibn-e-majah', name: 'Sunan Ibn Majah', author: 'Imam Ibn Majah', count: 4300 },
];

export default function DailyHadithPage() {
  const router = useRouter();
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [hadith, setHadith] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const HADITH_API_KEY = '$2y$10$3SYRpmT3X6dkewYtNNK0cuONUsnyDPe4IfonUpkH5rIpBJvaSsPj2';

  const fetchHadithFromBook = async (bookSlug: string, isNext = true) => {
    if (isNext && hadith) {
      setHistory(prev => [...prev, hadith]);
    }

    setLoading(true);
    setError("");
    setSelectedBook(bookSlug);
    setIsSearching(false);
    
    try {
      const bookInfo = BOOKS.find(b => b.id === bookSlug);
      const maxCount = bookInfo?.count || 1000;
      const randomNum = Math.floor(Math.random() * maxCount) + 1;
      
      const res = await fetch(`https://hadithapi.com/api/hadiths?apiKey=${HADITH_API_KEY}&hadithNumber=${randomNum}&book=${bookSlug}`);
      const data = await res.json();

      if (data.status === 200 && data.hadiths?.data?.length > 0) {
        const h = data.hadiths.data[0];
        setHadith({
          hadithArabic: h.hadithArabic,
          hadithEnglish: h.hadithEnglish,
          bookName: h.book.bookName,
          hadithNumber: h.hadithNumber,
          status: h.status,
          bookSlug: bookSlug
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Fallback to a lower number if high number fails
        const fallbackNum = Math.floor(Math.random() * 500) + 1;
        const res2 = await fetch(`https://hadithapi.com/api/hadiths?apiKey=${HADITH_API_KEY}&hadithNumber=${fallbackNum}&book=${bookSlug}`);
        const data2 = await res2.json();
        
        if (data2.status === 200 && data2.hadiths?.data?.length > 0) {
          const h = data2.hadiths.data[0];
          setHadith({
            hadithArabic: h.hadithArabic,
            hadithEnglish: h.hadithEnglish,
            bookName: h.book.bookName,
            hadithNumber: h.hadithNumber,
            status: h.status,
            bookSlug: bookSlug
          });
        } else {
          setError(`Could not find a random Hadith in ${bookSlug}.`);
        }
      }
    } catch (err) {
      setError("Failed to connect to Hadith service.");
    } finally {
      setLoading(false);
    }
  };

  const surpriseMe = () => {
    const randomBook = BOOKS[Math.floor(Math.random() * BOOKS.length)];
    fetchHadithFromBook(randomBook.id);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setIsSearching(true);
    setError("");
    
    try {
      const res = await fetch(`https://hadithapi.com/api/hadiths?apiKey=${HADITH_API_KEY}&hadithEnglish=${encodeURIComponent(searchQuery)}&paginate=20`);
      const data = await res.json();

      if (data.status === 200 && data.hadiths?.data?.length > 0) {
        setSearchResults(data.hadiths.data.map((h: any) => ({
          hadithArabic: h.hadithArabic,
          hadithEnglish: h.hadithEnglish,
          bookName: h.book.bookName,
          hadithNumber: h.hadithNumber,
          status: h.status,
          bookSlug: h.book.bookSlug
        })));
      } else {
        setSearchResults([]);
        setError("No hadiths found for your search.");
      }
    } catch (err) {
      setError("Search failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const showPreviousHadith = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHadith(prev);
    setHistory(prevStack => prevStack.slice(0, -1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const checkAuth = async () => {
      const res = await hidayahFetch('/api/auth/me');
      if (!res.ok) router.push('/auth');
    };
    checkAuth();
  }, [router]);

  return (
    <main className="min-h-screen bg-hidayah-primary p-4 sm:p-6 pb-24 flex flex-col items-center mobile-scroll-container">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sticky top-0 z-40 bg-hidayah-primary/80 backdrop-blur-md py-2">
          <button
            onClick={() => {
              if (isSearching) {
                setIsSearching(false);
                setSearchQuery("");
                setError("");
              } else if (selectedBook) {
                setSelectedBook(null);
                setHadith(null);
                setHistory([]);
              } else {
                router.push('/dashboard');
              }
            }}
            className="p-3 rounded-full bg-hidayah-secondary hover:bg-hidayah-border/20 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-hidayah-dark" />
          </button>
          <Logo />
          <div className="w-11" />
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-10 relative">
          <div className="relative group">
            <input 
              type="text"
              placeholder="Search in Kutub al-Sittah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-5 bg-hidayah-secondary border border-hidayah-border/30 rounded-[32px] text-hidayah-dark focus:outline-none focus:ring-2 focus:ring-hidayah-gold/20 transition-all shadow-sm"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-hidayah-dark/30 group-focus-within:text-hidayah-gold transition-colors" />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1 hover:bg-hidayah-dark/5 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-hidayah-dark/30" />
              </button>
            )}
          </div>
        </form>

        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div 
              key="search-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif font-bold text-hidayah-dark">Search Results</h2>
                <button 
                  onClick={() => setIsSearching(false)}
                  className="text-xs font-bold text-hidayah-gold uppercase tracking-widest"
                >
                  Clear
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-hidayah-gold animate-spin mb-4" />
                  <p className="text-hidayah-dark/50 italic">Searching through generations...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((h, i) => (
                  <HadithCard 
                    key={`${h.bookSlug}-${h.hadithNumber}-${i}`} 
                    hadith={h} 
                    onShare={(h) => {
                      sessionStorage.setItem('pendingHadith', JSON.stringify(h));
                      router.push('/community/create?attach=hadith');
                    }}
                  />
                ))
              ) : (
                <div className="text-center py-20 text-hidayah-dark/40">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>{error || "No results found for your query."}</p>
                </div>
              )}
            </motion.div>
          ) : !selectedBook ? (
            <motion.div 
              key="book-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-hidayah-gold/10 text-[10px] font-bold text-hidayah-gold uppercase tracking-[0.2em] mb-4">
                  <Sparkles className="w-3 h-3" />
                  Kutub al-Sittah
                </div>
                <h1 className="text-3xl font-serif font-bold text-hidayah-dark mb-2">Sacred Collections</h1>
                <p className="text-hidayah-dark/50 italic max-w-sm mx-auto mb-8">Explore the six canonical books of Hadith with modern precision.</p>
                
                <button 
                  onClick={surpriseMe}
                  className="px-8 py-4 bg-hidayah-dark text-[var(--color-hidayah-primary)] rounded-full font-bold shadow-xl shadow-black/10 hover:scale-105 transition-all flex items-center gap-3 mx-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  Surprise Me
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {BOOKS.map((book, idx) => (
                  <button
                    key={book.id}
                    onClick={() => fetchHadithFromBook(book.id)}
                    className="group relative flex flex-col p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] bg-hidayah-secondary border border-hidayah-border/30 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden text-left active:scale-[0.98]"
                  >
                    <div className="absolute -top-2 -right-2 p-4 sm:p-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                      <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-hidayah-dark" />
                    </div>
                    <h3 className="text-[11px] sm:text-base font-bold text-hidayah-dark group-hover:text-hidayah-gold leading-tight transition-colors">{book.name}</h3>
                    <p className="text-[8px] sm:text-xs text-hidayah-dark/40 font-medium tracking-widest uppercase mt-1">{book.author}</p>
                    
                    <div className="mt-4 sm:mt-6 flex items-center gap-1 sm:gap-2 text-[8px] sm:text-[10px] font-bold text-hidayah-gold opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      EXPLORE <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="hadith-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="animate-in fade-in slide-in-from-bottom-4 duration-1000"
            >
              <div className="text-center mb-10">
                <h2 className="text-2xl font-serif font-bold text-hidayah-dark mb-4">
                  {BOOKS.find(b => b.id === selectedBook)?.name}
                </h2>

                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={showPreviousHadith}
                    disabled={history.length === 0 || loading}
                    className="flex items-center gap-2 text-xs font-bold text-hidayah-dark/70 uppercase tracking-widest hover:text-hidayah-gold disabled:opacity-20 transition-all group"
                  >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Previous
                  </button>
                  <div className="w-px h-4 bg-hidayah-border/30" />
                  <button
                    onClick={() => fetchHadithFromBook(selectedBook)}
                    disabled={loading}
                    className="flex items-center gap-2 text-xs font-bold text-hidayah-gold uppercase tracking-widest hover:opacity-70 transition-opacity group"
                  >
                    Next Hadith
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-hidayah-gold animate-spin mb-4" />
                  <p className="text-hidayah-dark/50 italic">Seeking wisdom...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 p-8 rounded-[40px] border border-red-100 text-center">
                  <p className="text-red-600 font-medium mb-6">{error}</p>
                  <button
                    onClick={() => fetchHadithFromBook(selectedBook)}
                    className="px-8 py-3 bg-red-600 text-white rounded-full text-sm font-bold shadow-lg shadow-red-200"
                  >
                    Try Again
                  </button>
                </div>
              ) : hadith && (
                <div className="space-y-12">
                  <HadithCard 
                    hadith={hadith} 
                    onShare={(h) => {
                      sessionStorage.setItem('pendingHadith', JSON.stringify(h));
                      router.push('/community/circles/create?attach=hadith');
                    }}
                  />

                  <div className="text-center flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => setSelectedBook(null)}
                      className="px-8 py-5 bg-hidayah-secondary text-hidayah-dark rounded-[24px] font-bold border border-hidayah-border/30 hover:bg-hidayah-border/10 transition-all active:scale-95"
                    >
                      Back to Collections
                    </button>
                    <button
                      onClick={() => {
                        sessionStorage.setItem('pendingHadith', JSON.stringify(hadith));
                        router.push('/community/create?attach=hadith');
                      }}
                      className="px-8 py-5 bg-hidayah-dark text-[var(--color-hidayah-primary)] rounded-[24px] font-bold hover:opacity-90 transition-all shadow-xl shadow-black/10 active:scale-95"
                    >
                      Share Reflection
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
