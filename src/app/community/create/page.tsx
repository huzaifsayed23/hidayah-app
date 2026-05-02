"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, BookOpen, Send, Type, Image as ImageIcon, Search, Loader2, CheckCircle2, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PALETTES, SPIRITUAL_MOODS, COMMON_COLORS, generateMeshGradient } from '@/lib/gradients';
import { REFLECTION_THEMES } from '@/constants/rewards';
import { NatureBackground } from '@/components/NatureBackground';
import { hidayahFetch } from '@/lib/api';


export default function CreateReflectionPage() {
  const router = useRouter();
  const [mood, setMood] = useState<string>("Reflective");
  const [palette, setPalette] = useState<string>("Reflective");
  const [reflectionText, setReflectionText] = useState("");
  const [linkVerse, setLinkVerse] = useState(false);
  const [backdropVariant, setBackdropVariant] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verseQuery, setVerseQuery] = useState("");
  const [selectedVerse, setSelectedVerse] = useState<any>(null);
  const [isSearchingVerse, setIsSearchingVerse] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [linkType, setLinkType] = useState<'quran' | 'hadith'>('quran');
  const [selectedHadith, setSelectedHadith] = useState<any>(null);
  const [hadithResults, setHadithResults] = useState<any[]>([]);
  const [isSearchingHadith, setIsSearchingHadith] = useState(false);
  const [unlockedBackgrounds, setUnlockedBackgrounds] = useState<string[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedTextColor, setSelectedTextColor] = useState<string | null>(null);

  const TEXT_COLORS = [
    { name: 'Pure White', hex: '#FFFFFF', label: 'Standard Light' },
    { name: 'Pure Black', hex: '#000000', label: 'Standard Dark' },
    { name: 'Antique Gold', hex: '#D4AF37', label: 'Foundational wisdom' },
    { name: 'Rose Bronze', hex: '#9E5B6D', label: 'Warm verses' },
    { name: 'Emerald Forest', hex: '#1B5E20', label: 'Grounded reflections' },
    { name: 'Royal Amethyst', hex: '#6A1B9A', label: 'Spiritual depth' },
    { name: 'Deep Sapphire', hex: '#0D47A1', label: 'Calm ocean' },
  ];

  const HADITH_API_KEY = '$2y$10$3SYRpmT3X6dkewYtNNK0cuONUsnyDPe4IfonUpkH5rIpBJvaSsPj2';

  React.useEffect(() => {
    const pending = sessionStorage.getItem('pendingHadith');
    if (pending) {
      try {
        const h = JSON.parse(pending);
        setSelectedHadith(h);
        setLinkType('hadith');
        setLinkVerse(true);
        // Clean up
        sessionStorage.removeItem('pendingHadith');
      } catch (e) {}
    }

    // Fetch unlocked backgrounds
    hidayahFetch('/api/user/rewards')
      .then(res => res.json())
      .then(data => {
        if (data.unlockedBackgrounds) {
          setUnlockedBackgrounds(data.unlockedBackgrounds);
        }
      })

      .catch(console.error);
  }, []);

  const handleShare = async () => {
    if ((!reflectionText.trim() && !selectedVerse) || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const res = await hidayahFetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: reflectionText,
          moodTag: mood,
          themePalette: palette,
          backdropVariant,
          verse: selectedVerse,
          hadith: selectedHadith,
          reflectionThemeId: selectedThemeId,
          textColor: selectedTextColor,
        })
      });

      
      if (res.ok) {
        router.push('/community');
        router.refresh();
      } else {
        setIsSubmitting(false);
      }
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  const searchVerse = async () => {
    if (!verseQuery.trim()) return;
    setIsSearchingVerse(true);
    setSearchError("");
    
    try {
      // Basic normalization: Replace spaces with colons to support "2 255" as "2:255"
      let reference = verseQuery.trim().replace(/\s+/g, ':');
      
      // Fetch both Arabic (uthmani) and Translation (en.sahih)
      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${reference}/editions/quran-uthmani,en.sahih`);
      const data = await response.json();
      
      if (data.code === 200 && data.data.length >= 2) {
        setSelectedVerse({
          surah: data.data[0].surah.englishName,
          ayah: data.data[0].numberInSurah,
          text: data.data[0].text,
          translation: data.data[1].text
        });
        setSearchError("");
      } else {
        setSearchError("Verse not found. Use format '2:255'");
        setSelectedVerse(null);
      }
    } catch (error) {
      setSearchError("Search failed. Try '2:255' format.");
      setSelectedVerse(null);
    } finally {
      setIsSearchingVerse(false);
    }
  };

  const searchHadith = async () => {
    if (!verseQuery.trim()) return;
    setIsSearchingHadith(true);
    setSearchError("");
    setHadithResults([]);
    
    try {
      // Determine if searching by number or keyword
      const isNumber = /^\d+$/.test(verseQuery.trim());
      const queryParam = isNumber ? `hadithNumber=${verseQuery.trim()}` : `hadithEnglish=${verseQuery.trim()}`;
      
      const response = await fetch(`https://hadithapi.com/api/hadiths?apiKey=${HADITH_API_KEY}&${queryParam}`);
      const data = await response.json();
      
      if (data.status === 200 && data.hadiths?.data?.length > 0) {
        // Filter for Sahih/Hasan
        const filtered = data.hadiths.data.filter((h: any) => 
          h.status?.toLowerCase().includes('sahih') || 
          h.status?.toLowerCase().includes('hasan')
        );

        if (filtered.length > 0) {
          setHadithResults(filtered);
        } else {
          setSearchError("No Sahih/Hasan results found.");
        }
      } else {
        setSearchError("No Hadith found for this query.");
      }
    } catch (error) {
      setSearchError("Hadith search failed.");
    } finally {
      setIsSearchingHadith(false);
    }
  };

  const colors = PALETTES[palette];
  
  const hasGradient = backdropVariant >= 0;
  const isWhite = backdropVariant === -2;
  const currentGradient = hasGradient ? generateMeshGradient(colors, backdropVariant) : '';
  const baseColor = colors[4] || colors[0] || '#FFFFFF';
  const isLightGradient = hasGradient && (baseColor.toUpperCase().startsWith('#F') || baseColor.toUpperCase().startsWith('#E'));
  const isLightText = hasGradient;
  
  const containerBg = isWhite ? 'bg-white' : (!hasGradient ? 'bg-[var(--color-hidayah-secondary)]' : (isLightGradient ? 'bg-[var(--color-hidayah-secondary)]' : 'bg-[#2E2A26]'));
  const textColor = isLightText ? 'text-white' : 'text-[var(--color-hidayah-dark)]';
  const textMuted = isLightText ? 'text-white/70' : 'text-[var(--color-hidayah-dark)]/60';
  const controlBg = isLightText ? 'bg-black/20 border-white/10' : 'bg-white/30 border-[var(--color-hidayah-border)]/20 shadow-sm';
  const buttonBgActive = isLightText ? 'bg-white text-black border-white shadow-lg' : 'bg-[var(--color-hidayah-dark)] text-white border-[var(--color-hidayah-dark)] shadow-md';
  const buttonBgInactive = isLightText ? 'bg-black/20 text-white border-white/30 hover:bg-black/40' : 'bg-white/50 text-[var(--color-hidayah-dark)] border-[var(--color-hidayah-border)] hover:bg-white/80';

  return (
    <div className={`fixed inset-0 z-50 flex flex-col transition-colors duration-500 ${selectedThemeId ? 'bg-black' : containerBg} ${textColor}`}>
      {/* Background with AnimatePresence for smooth crossfade */}
      <AnimatePresence>
        {hasGradient && (
          <motion.div
            key={palette + backdropVariant}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: currentGradient,
              backgroundColor: colors[4] // Base color
            }}
          />
        )}
      </AnimatePresence>

      {/* 30% translucent black overlay to ensure white text legibility (Always show for gradients) */}
      {hasGradient && (
        <div className="absolute inset-0 z-0 bg-black/30 pointer-events-none" />
      )}

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col h-full w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 max-w-2xl mx-auto w-full shrink-0">
          <button 
            onClick={() => router.back()}
            className={`p-3 rounded-full ${isLightText ? 'bg-black/20 hover:bg-black/40 text-white' : 'bg-white/50 hover:bg-white/80 text-[var(--color-hidayah-dark)]'} backdrop-blur-md hover:scale-105 transition-all shadow-sm`}
          >
            <X className="w-5 h-5" />
          </button>
          <button 
            onClick={handleShare}
            disabled={(!reflectionText.trim() && !selectedVerse) || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-full ${isLightText ? 'bg-white text-[var(--color-hidayah-dark)] hover:bg-gray-100' : 'bg-[var(--color-hidayah-dark)] text-white hover:bg-black'} font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md`}
          >
            <span>{isSubmitting ? 'Sharing...' : 'Share'}</span>
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-4 overflow-y-auto">
          <h1 className={`text-2xl font-serif font-bold mb-6 text-center ${isLightText ? 'drop-shadow-md text-white' : 'text-[var(--color-hidayah-dark)]'}`}>
            What is the state of your heart?
          </h1>

          {/* State of Heart selector (Spiritual Moods only) */}
          <div className="flex flex-wrap gap-3 justify-center mb-8 shrink-0">
            {SPIRITUAL_MOODS.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMood(m);
                  setPalette(m);
                  setBackdropVariant(0);
                }}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border backdrop-blur-md ${
                  mood === m
                    ? `${buttonBgActive} scale-105`
                    : buttonBgInactive
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Options & Backdrop selector */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8 shrink-0">
            <div className={`flex gap-2 p-1.5 backdrop-blur-md rounded-xl border ${controlBg}`}>
              <button 
                onClick={() => setLinkVerse(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${!linkVerse ? (isLightText ? 'bg-white text-black font-bold' : 'bg-[var(--color-hidayah-dark)] text-white font-bold') : `hover:bg-black/10 ${textColor}`}`}
              >
                <Type className="w-4 h-4" />
                Text
              </button>
              <button 
                onClick={() => setLinkVerse(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${linkVerse ? (isLightText ? 'bg-white text-black font-bold' : 'bg-[var(--color-hidayah-dark)] text-white font-bold') : `hover:bg-black/10 ${textColor}`}`}
              >
                <BookOpen className="w-4 h-4" />
                Verse
              </button>
            </div>

              {/* Backdrop Variants Scroll */}
              <div className={`flex items-center gap-3 backdrop-blur-md p-2 px-3 rounded-xl border overflow-x-auto hide-scrollbar ${controlBg}`}>
                <span className={`text-xs font-medium flex items-center gap-1 shrink-0 uppercase tracking-wider mr-1 ${textMuted}`}>
                  <ImageIcon className="w-3.5 h-3.5" />
                  Variation
                </span>
                
                {/* White Backdrop Option */}
                <button
                  onClick={() => setBackdropVariant(-2)}
                  className={`w-9 h-9 rounded-full border-2 transition-all shrink-0 bg-white ${backdropVariant === -2 ? `border-[var(--color-hidayah-dark)] scale-110 shadow-lg` : 'border-[var(--color-hidayah-border)] opacity-60 hover:opacity-100 hover:scale-105'}`}
                  aria-label="Select white backdrop"
                />

                {/* Simple Beige Backdrop Option */}
                <button
                  onClick={() => setBackdropVariant(-1)}
                  className={`w-9 h-9 rounded-full border-2 transition-all shrink-0 bg-[var(--color-hidayah-secondary)] ${backdropVariant === -1 ? `border-[var(--color-hidayah-dark)] scale-110 shadow-lg` : 'border-[var(--color-hidayah-border)] opacity-60 hover:opacity-100 hover:scale-105'}`}
                  aria-label="Select simple backdrop"
                />

                {/* Gradient Variants */}
                {[0, 1, 2, 3, 4].map((variant) => (
                  <button
                    key={variant}
                    onClick={() => setBackdropVariant(variant)}
                    className={`w-9 h-9 rounded-full border-2 transition-all shrink-0 ${backdropVariant === variant ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                    style={{
                      backgroundImage: generateMeshGradient(colors, variant),
                      backgroundColor: colors[4] // Use the 5th color as base
                    }}
                    aria-label={`Select backdrop variant ${variant + 1}`}
                  />
                ))}
              </div>

              {/* Common Colors Scroll */}
              <div className={`flex items-center gap-3 backdrop-blur-md p-2 px-3 rounded-xl border overflow-x-auto hide-scrollbar ${controlBg}`}>
                <span className={`text-xs font-medium flex items-center gap-1 shrink-0 uppercase tracking-wider mr-1 ${textMuted}`}>
                  <Palette className="w-3.5 h-3.5" />
                  Colors
                </span>
                
                {/* Default Mood Color */}
                <button
                  onClick={() => setPalette(mood)}
                  className={`w-9 h-9 rounded-full border-2 transition-all shrink-0 ${palette === mood ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                  style={{
                    backgroundColor: PALETTES[mood][0]
                  }}
                  title={`Original ${mood}`}
                />

                {/* Common Colors */}
                {COMMON_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setPalette(c)}
                    className={`w-9 h-9 rounded-full border-2 transition-all shrink-0 ${palette === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                    style={{
                      backgroundColor: PALETTES[c][0]
                    }}
                    title={c}
                  />
                ))}
              </div>

              {/* Text Color Selection (Premium Shiny Colors) */}
              <div className={`flex items-center gap-3 backdrop-blur-md p-2 px-3 rounded-xl border overflow-x-auto hide-scrollbar ${controlBg}`}>
                <span className={`text-xs font-medium flex items-center gap-1 shrink-0 uppercase tracking-wider mr-1 ${textMuted}`}>
                  <Type className="w-3.5 h-3.5" />
                  Text Color
                </span>
                
                {/* Default/Theme-Aware Option */}
                <button
                  onClick={() => setSelectedTextColor(null)}
                  className={`w-9 h-9 rounded-full border-2 transition-all shrink-0 ${selectedTextColor === null ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                  style={{
                    background: 'linear-gradient(45deg, #000 50%, #fff 50%)',
                  }}
                  title="Theme Default"
                />

                {/* All Options */}
                {TEXT_COLORS.map((tc) => (
                  <button
                    key={tc.hex}
                    onClick={() => setSelectedTextColor(tc.hex)}
                    className={`w-9 h-9 rounded-full border-2 transition-all shrink-0 ${selectedTextColor === tc.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                    style={{
                      backgroundColor: tc.hex,
                      boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)'
                    }}
                    title={tc.name}
                  />
                ))}
              </div>

            </div>

          {/* Verse Input */}
          {linkVerse && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-5 rounded-2xl backdrop-blur-md border shrink-0 shadow-lg ${controlBg}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setLinkType('quran')}
                    className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${linkType === 'quran' ? 'border-hidayah-gold text-hidayah-gold' : 'border-transparent opacity-40 hover:opacity-70'}`}
                  >
                    Quran
                  </button>
                  <button 
                    onClick={() => setLinkType('hadith')}
                    className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${linkType === 'hadith' ? 'border-hidayah-gold text-hidayah-gold' : 'border-transparent opacity-40 hover:opacity-70'}`}
                  >
                    Hadith
                  </button>
                </div>
                {(selectedVerse || selectedHadith) && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase tracking-tighter animate-pulse">
                    <CheckCircle2 className="w-3 h-3" /> Attached
                  </span>
                )}
              </div>
              
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={verseQuery}
                    onChange={(e) => setVerseQuery(e.target.value)}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter') linkType === 'quran' ? searchVerse() : searchHadith(); 
                    }}
                    placeholder={linkType === 'quran' ? "e.g. 2:255 or 103:1" : "Search keyword or number..."} 
                    className={`w-full bg-transparent border-b-2 pb-2 focus:outline-none text-lg ${isLightText ? 'border-white/30 text-white focus:border-white placeholder:text-white/40' : 'border-[var(--color-hidayah-dark)]/30 text-[var(--color-hidayah-dark)] focus:border-[var(--color-hidayah-dark)] placeholder:text-[var(--color-hidayah-dark)]/40'}`}
                  />
                  {searchError && (
                    <p className="absolute top-full left-0 mt-1 text-[10px] text-red-500 font-medium">
                      {searchError}
                    </p>
                  )}
                </div>
                <button 
                  onClick={linkType === 'quran' ? searchVerse : searchHadith}
                  disabled={isSearchingVerse || isSearchingHadith || !verseQuery.trim()}
                  className={`p-2 rounded-full transition-all ${isLightText ? 'bg-white text-black hover:bg-gray-200' : 'bg-[var(--color-hidayah-dark)] text-white hover:bg-black'} disabled:opacity-50`}
                >
                  {isSearchingVerse || isSearchingHadith ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>

              {/* Hadith Search Results */}
              {linkType === 'hadith' && hadithResults.length > 0 && (
                <div className="mt-4 max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {hadithResults.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedHadith({
                          hadithArabic: h.hadithArabic,
                          hadithEnglish: h.hadithEnglish,
                          bookName: h.book.bookName,
                          hadithNumber: h.hadithNumber,
                          status: h.status
                        });
                        setHadithResults([]);
                        setVerseQuery("");
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${isLightText ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-black/5 border-[var(--color-hidayah-border)]/20 hover:bg-black/10'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-[9px] font-bold uppercase tracking-wider ${textMuted}`}>{h.book.bookName} • {h.hadithNumber}</p>
                        <span className="px-2 py-0.5 rounded-full bg-hidayah-gold/20 text-hidayah-gold text-[8px] font-bold">{h.status}</span>
                      </div>
                      <p className={`text-xs line-clamp-2 italic ${selectedTextColor ? '' : textColor}`} style={{ color: selectedTextColor || undefined }}>"{h.hadithEnglish}"</p>
                    </button>
                  ))}
                </div>
              )}

              {selectedHadith && linkType === 'hadith' && (
                <div className={`mt-4 p-4 rounded-xl border-l-4 ${isLightText ? 'bg-white/10 border-white/50' : 'bg-black/5 border-[var(--color-hidayah-gold)]'} animate-in fade-in slide-in-from-top-1`}>
                  <div className="flex justify-between items-center mb-3">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`} style={{ color: selectedTextColor || undefined }}>
                      {selectedHadith.bookName} • Hadith {selectedHadith.hadithNumber}
                    </p>
                    <button onClick={() => setSelectedHadith(null)} className="text-[10px] underline opacity-50">Remove</button>
                  </div>
                  <p 
                    className={`font-arabic text-right text-lg leading-relaxed mb-3 ${selectedTextColor ? '' : textColor} line-clamp-3`} 
                    style={{ 
                      color: selectedTextColor || undefined,
                      textShadow: selectedTextColor ? '0.5px 0.5px 1px rgba(0,0,0,0.2)' : undefined
                    }} 
                    dir="rtl"
                  >
                    {selectedHadith.hadithArabic}
                  </p>
                  <p 
                    className={`text-sm italic leading-relaxed ${selectedTextColor ? '' : (isLightText ? 'text-white/90' : 'text-[var(--color-hidayah-dark)]/80')} line-clamp-3`}
                    style={{ 
                      color: selectedTextColor || undefined,
                      textShadow: selectedTextColor ? '0.5px 0.5px 1px rgba(0,0,0,0.2)' : undefined
                    }}
                  >
                    "{selectedHadith.hadithEnglish}"
                  </p>
                </div>
              )}

              {selectedVerse && linkType === 'quran' && (
                <div className={`mt-4 p-4 rounded-xl border-l-4 ${isLightText ? 'bg-white/10 border-white/50' : 'bg-black/5 border-[var(--color-hidayah-gold)]'} animate-in fade-in slide-in-from-top-1`}>
                  <p 
                    className={`font-arabic text-right text-lg leading-relaxed mb-3 ${selectedTextColor ? '' : textColor}`} 
                    style={{ 
                      color: selectedTextColor || undefined,
                      textShadow: selectedTextColor ? '0.5px 0.5px 1px rgba(0,0,0,0.2)' : undefined
                    }} 
                    dir="rtl"
                  >
                    {selectedVerse.text}
                  </p>
                  <p 
                    className={`text-sm italic leading-relaxed mb-3 ${selectedTextColor ? '' : (isLightText ? 'text-white/90' : 'text-[var(--color-hidayah-dark)]/80')}`}
                    style={{ 
                      color: selectedTextColor || undefined,
                      textShadow: selectedTextColor ? '0.5px 0.5px 1px rgba(0,0,0,0.2)' : undefined
                    }}
                  >
                    "{selectedVerse.translation}"
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`} style={{ color: selectedTextColor || undefined }}>
                    {selectedVerse.surah} • Ayah {selectedVerse.ayah}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Reflection Text Box */}
          <div className={`flex-1 flex flex-col p-6 rounded-[48px] backdrop-blur-md border ${controlBg} shadow-inner transition-all duration-500`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Your Reflection</p>
            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Share your reflection..."
              className={`w-full flex-1 bg-transparent resize-none focus:outline-none text-lg md:text-xl leading-relaxed ${selectedTextColor ? '' : (isLightText ? 'text-white placeholder:text-white/50' : 'text-black placeholder:text-black/30')}`}
              style={{
                color: selectedTextColor || undefined,
                fontFamily: 'var(--font-crimson), var(--font-serif)',
                lineHeight: '1.8',
                textShadow: selectedTextColor ? '0.5px 0.5px 1px rgba(0,0,0,0.2)' : undefined
              }}
            />
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}
