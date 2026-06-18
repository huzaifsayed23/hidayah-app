"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, BookOpen, Send, Search, Loader2, Sparkles, ArrowLeft, Hash, Image as ImageIcon, Camera
} from 'lucide-react';
import { hidayahFetch } from '@/lib/api';
import MountedGuard from '@/components/MountedGuard';
import { GRADIENT_LIBRARY, SPIRITUAL_THEMES, generateMeshGradient } from '@/lib/gradients';

const TEXT_COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
  { name: 'Shiny Gold', value: '#FFD700' },
  { name: 'Emerald', value: '#50C878' },
  { name: 'Ruby', value: '#E0115F' },
];


export default function CreateReflectionPage() {
  const router = useRouter();
  
  // State
  const [reflectionText, setReflectionText] = useState("");
  const [selectedSuite, setSelectedSuite] = useState(SPIRITUAL_THEMES[0] || "Peaceful");
  const [selectedGradient, setSelectedGradient] = useState(
    (SPIRITUAL_THEMES[0] && GRADIENT_LIBRARY[SPIRITUAL_THEMES[0]]?.options[0]) || 
    GRADIENT_LIBRARY["Peaceful"].options[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedTextColor, setSelectedTextColor] = useState("#FFFFFF");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [is24h, setIs24h] = useState(false);

  
  // Verse Lookup State
  const [verseRef, setVerseRef] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [attachedVerse, setAttachedVerse] = useState<any>(null);
  const [attachedHadith, setAttachedHadith] = useState<any>(null);
  const [hadithRef, setHadithRef] = useState("");
  const [isSearchingHadith, setIsSearchingHadith] = useState(false);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const meRes = await hidayahFetch('/api/auth/me');
        if (meRes.ok) {
          const data = await meRes.json();
          if (data.userId) setUserId(data.userId);
        }
      } catch (e) {}
    };

    const checkAttachedContent = () => {
      const pendingHadith = sessionStorage.getItem('pendingHadith');
      if (pendingHadith) {
        setAttachedHadith(JSON.parse(pendingHadith));
        // We don't clear it yet so user can refresh without losing it
      }
    };

    fetchUser();
    checkAttachedContent();
  }, []);

  const lookupVerse = async () => {
    if (!verseRef.includes(':')) return;
    setIsSearching(true);
    try {
      const [surah, ayah] = verseRef.split(':');
      const localRes = await fetch('/quran.json').catch(() => null);
      if (localRes && localRes.ok) {
        const quran = await localRes.json();
        const surahData = quran.find((s: any) => s.number === parseInt(surah));
        const ayahData = surahData?.ayahs.find((a: any) => a.number === parseInt(ayah));
        if (ayahData) {
          setAttachedVerse({
            id: verseRef,
            text: ayahData.text,
            translation: ayahData.translation || ayahData.text,
            surah: surahData.name,
            ayah: ayahData.number
          });
          setVerseRef("");
          setIsSearching(false);
          return;
        }
      }
      const resText = await hidayahFetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/quran-indopak`);
      const resTrans = await hidayahFetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.sahih`);
      const dataText = await resText.json();
      const dataTrans = await resTrans.json();
      if (dataText.code === 200) {
        setAttachedVerse({
          id: verseRef,
          text: dataText.data.text,
          translation: dataTrans.data.text,
          surah: dataText.data.surah.englishName,
          ayah: dataText.data.numberInSurah
        });
        setVerseRef("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const lookupHadith = async () => {
    let query = hadithRef.trim();
    if (!query) return;
    
    // Remove wrapping parentheses if present
    query = query.replace(/^\(|\)$/g, '').trim();

    setIsSearchingHadith(true);
    try {
      let book = 'bukhari';
      let num = query;
      
      // Match formats like "Bukhari - 5530", "tirmidhi: 2260", "muslim 123"
      const match = query.match(/^([a-zA-Z\s\-]+?)[\s:\-]+(\d+)$/);
      if (match) {
        book = match[1].toLowerCase().replace(/[\s\-]/g, '');
        num = match[2];
      } else {
        // If it's just a number, default to bukhari
        num = query.replace(/\D/g, '');
      }

      const apiMap: any = {
        'sahihbukhari': 'bukhari',
        'bukhari': 'bukhari',
        'sahihmuslim': 'muslim',
        'muslim': 'muslim',
        'altirmidhi': 'tirmidhi',
        'tirmidhi': 'tirmidhi',
        'abudawood': 'abudawud',
        'abudawud': 'abudawud',
        'sunannasai': 'nasai',
        'nasai': 'nasai',
        'ibnemajah': 'ibnmajah',
        'ibnmajah': 'ibnmajah',
        'b': 'bukhari',
        'm': 'muslim'
      };
      
      const apiBook = apiMap[book] || 'bukhari';

      const [arRes, enRes] = await Promise.all([
        hidayahFetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${apiBook}/${num}.json`),
        hidayahFetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${apiBook}/${num}.json`)
      ]);
      
      if (arRes.ok && enRes.ok) {
        const arData = await arRes.json();
        const enData = await enRes.json();
        
        if (arData.hadiths?.[0]) {
          // Format book name to be nicely capitalized
          const displayBookName = book.charAt(0).toUpperCase() + book.slice(1).replace('sahih', 'Sahih ').replace('al', 'Al-');

          setAttachedHadith({
            hadithArabic: arData.hadiths[0].text,
            hadithEnglish: enData.hadiths[0].text,
            bookName: arData.metadata?.name || displayBookName,
            hadithNumber: arData.hadiths[0].hadithnumber,
            status: arData.hadiths[0].grades?.[0]?.grade || "Authentic"
          });
          setHadithRef("");
          setIsSearchingHadith(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingHadith(false);
    }
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 7 * 1024 * 1024) {
      alert("Please choose an image smaller than 7MB");
      return;
    }

    setIsImageLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomImage(reader.result as string);
      setIsImageLoading(false);
      console.log("Custom background image loaded successfully:", file.name);
    };
    reader.onerror = () => {
      alert("Failed to read image. Please try another file.");
      setIsImageLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    const hasContent = reflectionText.trim().length > 0;
    const hasVerse = !!attachedVerse;
    const hasHadith = !!attachedHadith;

    if ((!hasContent && !hasVerse && !hasHadith) || isSubmitting) return;
    setIsSubmitting(true);
    
    // Find the variant index
    const variantIndex = GRADIENT_LIBRARY[selectedSuite].options.findIndex(o => o.id === selectedGradient.id);

    try {
      const res = await hidayahFetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: reflectionText,
          moodTag: selectedSuite,
          reflectionThemeId: selectedGradient.id,
          backdropVariant: variantIndex >= 0 ? variantIndex : 0,
          verse: attachedVerse,
          hadith: attachedHadith,
          userId: userId,
          textColor: selectedTextColor,
          customBackgroundImage: customImage,
          timestamp: new Date().toISOString(),
          is24h: is24h
        })
      });
      if (res.ok) {
        sessionStorage.removeItem('pendingHadith');
        router.push('/community');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MountedGuard>
      <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col overflow-x-hidden font-sans relative">
        
        {/* Full-Screen Immersive Atmosphere (MATCHING FEEDCARD) */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          {customImage ? (
            <div 
              className="absolute inset-0 bg-cover bg-center no-repeat transition-all duration-700"
              style={{ 
                backgroundImage: `url(${customImage})`,
                backgroundPosition: 'center center',
                backgroundSize: 'cover'
              }}
            />
          ) : (
            <div 
              className="absolute inset-0 transition-all duration-1000 opacity-100" 
              style={{ 
                background: generateMeshGradient(selectedGradient.colors, 0)
              }} 
            />
          )}
          <div className={`absolute inset-0 ${customImage ? 'bg-black/35' : 'bg-black/25'} transition-all duration-500`} />
        </div>

        {/* Header Navigation */}
        <header className="relative z-50 px-4 sm:px-6 py-6 sm:py-10 flex items-center justify-between">
          <button 
            onClick={() => router.push('/community')} 
            className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all backdrop-blur-md active-tactile"
          >
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-light uppercase tracking-[0.3em] text-[#C9A86A] font-sans">Hidayah</h1>
            <div className="h-[1px] w-8 bg-[#C9A86A] mx-auto mt-2 opacity-40" />
          </div>
          <div className="w-10 sm:w-12" />
        </header>

        {/* Immersive Editor Content */}
        <main className="relative z-10 flex-1 flex flex-col pb-12 pt-0 sm:pt-4">
          
          <div className="w-full flex flex-col items-center">
            
            {/* 1. SELECTION SYSTEM */}
            <section className="w-full space-y-6 sm:space-y-8 mb-6 sm:mb-8">
              
              {/* Category Slider */}
              <div className="w-full flex horizontal-slider hide-scrollbar px-4 sm:px-6 justify-center">
                {SPIRITUAL_THEMES.map((key) => (
                  <button
                    key={key}
                    onClick={() => { setSelectedSuite(key); setSelectedGradient(GRADIENT_LIBRARY[key].options[0]); }}
                    className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-[20px] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all shrink-0 border ${
                      selectedSuite === key 
                        ? 'bg-white text-black border-white shadow-[0_15px_30px_-5px_rgba(255,255,255,0.3)] scale-105' 
                        : 'bg-white/5 text-white/30 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Sub-Mood Swatch Slider (Mood-specific) */}
              <div className="w-full flex horizontal-slider hide-scrollbar px-6 sm:px-8 justify-center gap-4 sm:gap-6">
                {selectedSuite && GRADIENT_LIBRARY[selectedSuite]?.options?.map((grad) => (
                  <button
                    key={grad.id}
                    onClick={() => setSelectedGradient(grad)}
                    className="flex flex-col items-center gap-1.5 sm:gap-2 shrink-0 group"
                  >
                    <div 
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-700 relative p-[2px] shadow-[0_10px_20px_rgba(0,0,0,0.3)] ${
                        selectedGradient.id === grad.id ? 'scale-110 shadow-2xl ring-2 ring-white/50' : 'opacity-20 grayscale group-hover:opacity-60'
                      }`}
                      style={{ 
                        background: `linear-gradient(135deg, ${grad.colors[0]}, ${grad.colors[1]}, ${grad.colors[2]})`,
                        boxShadow: selectedGradient.id === grad.id ? `0 0 25px ${grad.primary}50` : undefined
                      }}
                    >
                      <div className="w-full h-full rounded-full bg-black/40 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-100" style={{ background: `linear-gradient(135deg, ${grad.colors[0]}, ${grad.colors[1]}, ${grad.colors[2]})` }} />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-40" />
                        {selectedGradient.id === grad.id && <Sparkles className="w-4 h-4 text-white animate-pulse" />}
                      </div>
                    </div>
                    <span className={`text-[5px] sm:text-[6px] font-bold uppercase tracking-[0.1em] text-center w-14 sm:w-16 leading-tight transition-all duration-500 ${
                      selectedGradient.id === grad.id ? 'text-white' : 'text-white/40'
                    }`}>
                      {grad.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Premium Metallic Row (Common to every mood) */}
              <div className="w-full mt-2 sm:mt-4">
                <div className="px-6 sm:px-8 mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10"></div>
                  <h4 className="text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.4em] text-white/60">Premium Metallic</h4>
                  <div className="h-px flex-1 bg-white/10"></div>
                </div>
                <div className="w-full flex horizontal-slider hide-scrollbar px-6 sm:px-8 justify-center gap-4 sm:gap-6">
                  {GRADIENT_LIBRARY["Premium"]?.options?.map((grad) => (
                    <button
                      key={grad.id}
                      onClick={() => setSelectedGradient(grad)}
                      className="flex flex-col items-center gap-1.5 sm:gap-2 shrink-0 group"
                    >
                      <div 
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-700 relative p-[2px] shadow-[0_10px_20px_rgba(0,0,0,0.3)] ${
                          selectedGradient.id === grad.id ? 'scale-110 shadow-2xl ring-2 ring-white/50' : 'opacity-40 grayscale group-hover:opacity-80'
                        }`}
                        style={{ 
                          background: `linear-gradient(135deg, ${grad.colors[0]}, ${grad.colors[1]}, ${grad.colors[2]})`,
                          boxShadow: selectedGradient.id === grad.id ? `0 0 25px ${grad.primary}80` : undefined
                        }}
                      >
                        <div className="w-full h-full rounded-full bg-black/40 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 opacity-100" style={{ background: `linear-gradient(135deg, ${grad.colors[0]}, ${grad.colors[1]}, ${grad.colors[2]})` }} />
                          {/* Glossy Metallic Shine */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-70" />
                          {selectedGradient.id === grad.id && <Sparkles className="w-3 h-3 text-white animate-pulse" />}
                        </div>
                      </div>
                      <span className={`text-[5px] sm:text-[6px] font-bold uppercase tracking-[0.1em] text-center w-12 sm:w-14 leading-tight transition-all duration-500 ${
                        selectedGradient.id === grad.id ? 'text-white' : 'text-white/40'
                      }`}>
                        {grad.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Color Selection */}
              <div className="w-full mt-2 sm:mt-4">
                <div className="px-6 sm:px-8 mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10"></div>
                  <h4 className="text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.4em] text-white/60">Text Color</h4>
                  <div className="h-px flex-1 bg-white/10"></div>
                </div>
                <div className="w-full flex justify-center gap-4 sm:gap-6 px-6 pb-4">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedTextColor(color.value)}
                      className={`group flex flex-col items-center gap-1.5 transition-all duration-300 ${selectedTextColor === color.value ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}
                    >
                      <div 
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all ${selectedTextColor === color.value ? 'border-white ring-2 ring-white/20' : 'border-transparent'}`}
                        style={{ 
                          backgroundColor: color.value,
                          boxShadow: color.value !== '#000000' && color.value !== '#FFFFFF' ? `0 0 10px ${color.value}60` : 'none'
                        }}
                      />
                      <span className={`text-[5px] sm:text-[6px] font-bold uppercase tracking-widest ${selectedTextColor === color.value ? 'text-white' : 'text-white/60'}`}>
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Image Selection */}
              <div className="w-full mt-2 sm:mt-4">
                <div className="px-6 sm:px-8 mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10"></div>
                  <h4 className="text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.4em] text-white/60">Reflection Background</h4>
                  <div className="h-px flex-1 bg-white/10"></div>
                </div>
                <div className="w-full flex justify-center gap-4 px-6 pb-4">
                  <label className={`group flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${customImage ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                    <div className={`w-12 h-12 rounded-[18px] border-2 flex items-center justify-center transition-all ${customImage ? 'border-[#C9A86A] bg-[#C9A86A]/20' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                      {isImageLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                    </div>
                    <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-widest text-white/80">
                      {customImage ? 'Change Image' : 'From Gallery'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>

                  {customImage && (
                    <button 
                      onClick={() => setCustomImage(null)}
                      className="group flex flex-col items-center gap-2 transition-all duration-300 opacity-60 hover:opacity-100"
                    >
                      <div className="w-12 h-12 rounded-[18px] border-2 border-red-500/30 bg-red-500/10 flex items-center justify-center">
                        <X className="w-5 h-5 text-red-500" />
                      </div>
                      <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-widest text-red-500/80">Clear Image</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Reflection Type Selector */}
              <div className="w-full mt-2 sm:mt-4">
                <div className="px-6 sm:px-8 mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10"></div>
                  <h4 className="text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.4em] text-white/60">Reflection Type</h4>
                  <div className="h-px flex-1 bg-white/10"></div>
                </div>
                <div className="w-full flex justify-center gap-6 sm:gap-8 px-6 pb-4">
                  <button
                    onClick={() => setIs24h(false)}
                    className={`flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-[20px] text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${
                      !is24h 
                        ? 'bg-white text-black border-white shadow-[0_15px_30px_-5px_rgba(255,255,255,0.3)] scale-105' 
                        : 'bg-white/5 text-white/30 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${!is24h ? 'bg-black' : 'bg-white/30'}`} />
                    Permanent Reflection
                  </button>
                  <button
                    onClick={() => setIs24h(true)}
                    className={`flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-[20px] text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${
                      is24h 
                        ? 'bg-white text-black border-white shadow-[0_15px_30px_-5px_rgba(255,255,255,0.3)] scale-105' 
                        : 'bg-white/5 text-white/30 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${is24h ? 'bg-black' : 'bg-white/30'}`} />
                    24h Reflection
                  </button>
                </div>
              </div>
            </section>


            {/* 2. VERSE SELECTION BUTTON (ABOVE TEXT BOX) */}
            <div className="w-full max-w-xl px-4 sm:px-6 mb-3 sm:mb-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSearching(!isSearching)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border transition-all font-bold text-[9px] sm:text-[10px] uppercase tracking-widest ${
                    isSearching || attachedVerse ? 'bg-[#C9A86A] text-black border-[#C9A86A]' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                   {attachedVerse ? 'Change Verse' : 'Add Verse'}
                </button>

                <button 
                  onClick={() => { setIsSearchingHadith(!isSearchingHadith); setIsSearching(false); }}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border transition-all font-bold text-[9px] sm:text-[10px] uppercase tracking-widest ${
                    isSearchingHadith || attachedHadith ? 'bg-[#C9A86A] text-black border-[#C9A86A]' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {attachedHadith ? 'Change Hadith' : 'Add Hadith'}
                </button>

                {attachedVerse && (
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#C9A86A] animate-pulse truncate max-w-[100px]">
                    {attachedVerse.surah} {attachedVerse.ayah}
                  </span>
                )}
                {attachedHadith && (
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#C9A86A] animate-pulse truncate max-w-[100px]">
                    Hadith {attachedHadith.hadithNumber}
                  </span>
                )}
              </div>
              
              {isSearching && (
                <div className="mt-3 p-3.5 sm:p-4 bg-black/40 rounded-[24px] border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/20" />
                  <input 
                    autoFocus
                    type="text" 
                    value={verseRef} 
                    onChange={(e) => setVerseRef(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && lookupVerse()}
                    placeholder="ENTER VERSE (e.g. 3:45)"
                    className="flex-1 bg-transparent border-none text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-white focus:outline-none placeholder:text-white/20"
                  />
                  <button onClick={lookupVerse} className="text-[#C9A86A] p-2 hover:scale-110 transition-transform">
                    {isSearching && verseRef ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {isSearchingHadith && (
                <div className="mt-3 p-3.5 sm:p-4 bg-black/40 rounded-[24px] border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/20" />
                  <input 
                    autoFocus
                    type="text" 
                    value={hadithRef} 
                    onChange={(e) => setHadithRef(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && lookupHadith()}
                    placeholder="e.g. (Bukhari - 5530)"
                    className="flex-1 bg-transparent border-none text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-white focus:outline-none placeholder:text-white/20"
                  />
                  <button onClick={lookupHadith} className="text-[#C9A86A] p-2 hover:scale-110 transition-transform">
                    {isSearchingHadith && hadithRef ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>
              )}

            </div>

            {/* 3. REFLECTION BOX */}
            <div className="w-full max-w-xl px-4 sm:px-6 mb-8 sm:mb-12 relative">
              <div 
                className="w-full bg-white/10 rounded-[20px] px-5 sm:px-8 py-5 sm:py-6 border border-white/20 relative transition-all duration-700 shadow-[0_0_80px_-10px_rgba(255,255,255,0.1)] overflow-hidden"
                style={{ 
                  boxShadow: `0 0 60px ${selectedGradient.primary}20, inset 0 0 20px rgba(255,255,255,0.05)`,
                  backdropFilter: 'none'
                }}
              >
                {customImage && (
                  <div className="absolute inset-0 z-0">
                    <img src={customImage} alt="Background" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-black/30" />
                  </div>
                )}
                <div className="relative z-10 w-full h-full">
                 {attachedVerse && (
                  <div className="mb-6 sm:mb-8 p-3 sm:p-5 relative animate-in zoom-in-95 duration-500 border-l-2 border-white/30 pl-4 sm:pl-6">
                    <p className="font-quran text-right text-lg sm:text-xl mb-2" dir="rtl" style={{ color: selectedTextColor }}>{attachedVerse.text}</p>
                    <p className="text-[10px] sm:text-xs italic leading-relaxed mb-2" style={{ color: selectedTextColor, opacity: 0.8 }}>"{attachedVerse.translation}"</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: selectedTextColor }}>{attachedVerse.surah} • Ayah {attachedVerse.ayah}</p>
                      <button onClick={() => setAttachedVerse(null)} className="p-1.5 bg-red-500/20 hover:bg-red-500 rounded-full transition-colors"><X className="w-3 h-3 text-white" /></button>
                    </div>
                  </div>

                )}
                {attachedHadith && (
                  <div className="mb-6 sm:mb-8 p-3 sm:p-5 relative animate-in zoom-in-95 duration-500 border-l-2 border-white/30 pl-4 sm:pl-6">
                    <p className="font-arabic text-right text-lg sm:text-xl mb-2" dir="rtl" style={{ color: selectedTextColor }}>{attachedHadith.hadithArabic}</p>
                    <p className="text-[10px] sm:text-xs italic leading-relaxed mb-2" style={{ color: selectedTextColor, opacity: 0.8 }}>"{attachedHadith.hadithEnglish}"</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: selectedTextColor }}>{attachedHadith.bookName} • Hadith {attachedHadith.hadithNumber}</p>
                      <button onClick={() => setAttachedHadith(null)} className="p-1.5 bg-red-500/20 hover:bg-red-500 rounded-full transition-colors"><X className="w-3 h-3 text-white" /></button>
                    </div>
                  </div>

                )}

                <textarea
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="What's on your heart?"
                  className="w-full bg-transparent border-none focus:outline-none text-lg sm:text-2xl font-serif placeholder:text-white/20 resize-none leading-relaxed min-h-[100px] sm:min-h-[150px]"
                  style={{ 
                    color: selectedTextColor,
                    textShadow: selectedTextColor === '#000000' ? 'none' : '0 2px 10px rgba(0,0,0,0.5)' 
                  }}
                  maxLength={500}
                />

                <div className="flex justify-between items-center mt-4">
                  <span className="text-[9px] sm:text-[10px] font-mono text-white/20 uppercase tracking-widest">{reflectionText.length}/500</span>
                  <div className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-white/40">{selectedSuite}</div>
                </div>
                </div>
              </div>
            </div>


            {/* Action Button */}
            <div className="w-full max-w-md px-6 sm:px-8 mt-2 sm:mt-4">
              <button
                onClick={handlePost}
                disabled={(!reflectionText.trim() && !attachedVerse && !attachedHadith) || isSubmitting}
                className="w-full py-5 sm:py-8 rounded-full text-white font-bold text-[10px] sm:text-xs tracking-[0.4em] sm:tracking-[0.6em] uppercase shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700 disabled:opacity-10 flex items-center justify-center gap-3 sm:gap-4 relative overflow-hidden group border border-white/10 active-tactile"
              >
                <div className="absolute inset-0 transition-all duration-1000 opacity-90" 
                     style={{ background: `linear-gradient(135deg, ${selectedGradient.colors[0]}, ${selectedGradient.colors[1]})` }} />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                <span className="relative z-10 flex items-center gap-3 sm:gap-4">
                  {isSubmitting ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <><span>Post Reflection</span><Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></>}
                </span>
              </button>
            </div>
          </div>
        </main>

        {/* Global Styles & Scroll Safety */}
        <style dangerouslySetInnerHTML={{ __html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          
          /* Hide Global Navbar on this page */
          nav { display: none !important; }
          
          body { background: #050505; }
          
          input::placeholder { font-size: 8px; letter-spacing: 0.2em; }
          @media (min-width: 640px) {
            input::placeholder { font-size: 9px; letter-spacing: 0.3em; }
          }
        `}} />
      </div>
    </MountedGuard>
  );
}
