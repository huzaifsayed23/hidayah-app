"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Share2, Loader2 } from 'lucide-react';
import { hidayahFetch } from '@/lib/api';

interface HadithCardProps {
  hadith: {
    hadithArabic: string;
    hadithEnglish: string;
    bookName: string;
    hadithNumber: string;
    status: string;
    bookSlug?: string;
  };
  isLightText?: boolean;
  transparent?: boolean;
  customTextColor?: string | null;
  onShare?: (hadith: any) => void;
}

export default function HadithCard({ 
  hadith, 
  isLightText = false, 
  transparent = false, 
  customTextColor = null,
  onShare
}: HadithCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const checkSavedStatus = async () => {
      try {
        const res = await hidayahFetch('/api/hadith/save');
        if (res.ok) {
          const data = await res.json();
          const found = data.savedHadiths?.some((h: any) => 
            h.hadithNumber === hadith.hadithNumber && h.bookName === hadith.bookName
          );
          setIsSaved(!!found);
        }
      } catch (e) {}
    };
    checkSavedStatus();
  }, [hadith]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await hidayahFetch('/api/hadith/save', {
        method: 'POST',
        body: JSON.stringify(hadith)
      });
      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.isSaved);
      }
    } catch (e) {
      console.error("Failed to save hadith:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const textColor = customTextColor || (isLightText ? 'text-white' : 'text-[var(--color-hidayah-dark)]');
  const textMuted = isLightText ? 'text-white/50' : 'text-[var(--color-hidayah-dark)]/40';
  const borderCol = isLightText ? 'border-white/20' : 'border-[var(--color-hidayah-border)]/40';
  const cardBg = transparent 
    ? 'bg-transparent'
    : 'bg-[var(--color-hidayah-secondary)]/90 backdrop-blur-md';

  const shineStyle = customTextColor ? {
    color: customTextColor,
    textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.2)'
  } : {};

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative w-full p-4 sm:p-5 rounded-[32px] ${cardBg} border ${borderCol} ${transparent ? '' : 'shadow-xl'} overflow-hidden group`}
    >
      {/* Glossy overlay effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isLightText ? 'from-white/10' : 'from-white/30'} to-transparent pointer-events-none`} />

      {/* Header: Source Citation */}
      <header className="mb-6 flex justify-between items-start">
        <p className={`text-[10px] sm:text-xs font-serif italic tracking-[0.2em] uppercase ${textMuted}`}>
          {hadith.bookName} • {hadith.hadithNumber}
        </p>
        
        <div className="flex gap-2 relative z-10">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`p-2 rounded-full transition-all ${isSaved ? 'bg-hidayah-gold text-white' : 'bg-black/5 hover:bg-black/10 text-hidayah-dark'}`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />}
          </button>
          <button 
            onClick={() => onShare && onShare(hadith)}
            className="p-2 rounded-full bg-black/5 hover:bg-black/10 text-hidayah-dark transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="space-y-6">
        {/* Arabic Content */}
        <div>
          <p 
            className={`font-arabic text-lg sm:text-xl md:text-2xl text-center allow-select ${customTextColor ? '' : textColor}`} 
            style={shineStyle}
            dir="rtl"
          >
            {hadith.hadithArabic}
          </p>
        </div>

        {/* Translation Content */}
        <div className="pr-2 touch-auto">
          <p 
            className={`font-serif text-sm sm:text-base md:text-lg leading-[1.6] allow-select ${customTextColor ? '' : (isLightText ? 'text-white/80' : 'text-[var(--color-hidayah-dark)]/80')} text-justify pb-2`}
            style={shineStyle}
          >
            {hadith.hadithEnglish}
          </p>
        </div>
      </div>

      {/* Footer: Grading Badge */}
      <footer className="mt-6 flex items-center justify-between">
        <div className={`px-4 py-1.5 rounded-full bg-[var(--color-hidayah-gold)] ${isLightText ? 'text-white' : 'text-[var(--color-hidayah-primary)]'} text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-gold/20`}>
          {hadith.status}
        </div>
      </footer>
    </motion.div>
  );
}
