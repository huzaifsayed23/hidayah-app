"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Loader2, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import HadithCard from '@/components/community/HadithCard';
import { Logo } from '@/components/Logo';

const BOOKS = [
  { id: 'sahih-bukhari', name: 'Sahih Bukhari', author: 'Imam Bukhari' },
  { id: 'sahih-muslim', name: 'Sahih Muslim', author: 'Imam Muslim' },
  { id: 'al-tirmidhi', name: 'Jami\' Al-Tirmidhi', author: 'Imam Tirmidhi' },
  { id: 'abu-dawood', name: 'Sunan Abu Dawood', author: 'Imam Abu Dawood' },
  { id: 'sunan-nasai', name: 'Sunan an-Nasa\'i', author: 'Imam an-Nasa\'i' },
  { id: 'ibn-e-majah', name: 'Sunan Ibn Majah', author: 'Imam Ibn Majah' },
];

export default function DailyHadithPage() {
  const router = useRouter();
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [hadith, setHadith] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const HADITH_API_KEY = '$2y$10$3SYRpmT3X6dkewYtNNK0cuONUsnyDPe4IfonUpkH5rIpBJvaSsPj2';

  const fetchHadithFromBook = async (bookSlug: string, isNext = true) => {
    if (isNext && hadith) {
      setHistory(prev => [...prev, hadith]);
    }
    
    setLoading(true);
    setError("");
    setSelectedBook(bookSlug);
    try {
      const randomNum = Math.floor(Math.random() * 200) + 1;
      const res = await fetch(`https://hadithapi.com/api/hadiths?apiKey=${HADITH_API_KEY}&hadithNumber=${randomNum}&book=${bookSlug}`);
      const data = await res.json();
      
      if (data.status === 200 && data.hadiths?.data?.length > 0) {
        const h = data.hadiths.data[0];
        setHadith({
          hadithArabic: h.hadithArabic,
          hadithEnglish: h.hadithEnglish,
          bookName: h.book.bookName,
          hadithNumber: h.hadithNumber,
          status: h.status
        });
      } else {
        setError(`Could not find a Hadith in ${bookSlug}.`);
      }
    } catch (err) {
      setError("Failed to connect to Hadith service.");
    } finally {
      setLoading(false);
    }
  };

  const showPreviousHadith = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHadith(prev);
    setHistory(prevStack => prevStack.slice(0, -1));
  };

  return (
    <main className="min-h-screen bg-hidayah-primary p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => selectedBook ? (setSelectedBook(null), setHadith(null), setHistory([])) : router.back()}
            className="p-3 rounded-full bg-hidayah-secondary hover:bg-hidayah-border/20 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-hidayah-dark" />
          </button>
          <Logo />
          <div className="w-11" /> {/* Spacer */}
        </div>

        {!selectedBook ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-serif font-bold text-hidayah-dark mb-2">Hadith Collections</h1>
              <p className="text-hidayah-dark/50 italic">Select a collection to read from the Kutub al-Sittah</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BOOKS.map((book, idx) => (
                <button
                  key={book.id}
                  onClick={() => fetchHadithFromBook(book.id)}
                  className="group relative flex flex-col p-6 rounded-[2.5rem] bg-hidayah-secondary border border-hidayah-border/30 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden text-left"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <BookOpen className="w-16 h-16 text-hidayah-dark" />
                  </div>
                  <h3 className="text-lg font-bold text-hidayah-dark group-hover:text-hidayah-gold transition-colors">{book.name}</h3>
                  <p className="text-xs text-hidayah-dark/40 font-medium tracking-widest uppercase mt-1">{book.author}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-serif font-bold text-hidayah-dark mb-1">
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
                  Next
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-hidayah-gold animate-spin mb-4" />
                <p className="text-hidayah-dark/50 animate-pulse">Consulting the archives...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-8 rounded-3xl border border-red-100 text-center">
                <p className="text-red-600 font-medium mb-4">{error}</p>
                <button 
                  onClick={() => fetchHadithFromBook(selectedBook)}
                  className="px-6 py-2 bg-red-600 text-white rounded-full text-sm font-bold"
                >
                  Try Again
                </button>
              </div>
            ) : hadith && (
              <div>
                <HadithCard hadith={hadith} />
                
                <div className="mt-12 text-center flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => setSelectedBook(null)}
                    className="px-8 py-4 bg-hidayah-secondary text-hidayah-dark rounded-2xl font-bold border border-hidayah-border/30 hover:bg-hidayah-border/10 transition-all"
                  >
                    Change Collection
                  </button>
                  <button 
                    onClick={() => {
                      sessionStorage.setItem('pendingHadith', JSON.stringify(hadith));
                      router.push('/community/circles/create?attach=hadith');
                    }}
                    className="px-8 py-4 bg-hidayah-dark text-[var(--color-hidayah-primary)] rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-black/10"
                  >
                    Share Reflection
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
