"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface HadithCardProps {
  hadith: {
    hadithArabic: string;
    hadithEnglish: string;
    bookName: string;
    hadithNumber: string;
    status: string;
  };
  isLightText?: boolean;
  transparent?: boolean;
  customTextColor?: string | null;
}

export default function HadithCard({ 
  hadith, 
  isLightText = false, 
  transparent = false, 
  customTextColor = null 
}: HadithCardProps) {
  const textColor = customTextColor || (isLightText ? 'text-white' : 'text-[var(--color-hidayah-dark)]');
  const textMuted = isLightText ? 'text-white/50' : 'text-[var(--color-hidayah-dark)]/40';
  const borderCol = isLightText ? 'border-white/20' : 'border-[var(--color-hidayah-border)]/40';
  const cardBg = transparent 
    ? (isLightText ? 'bg-white/10 backdrop-blur-md' : 'bg-black/5 backdrop-blur-md')
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
      className={`relative w-full p-6 sm:p-8 rounded-[48px] ${cardBg} border ${borderCol} shadow-xl overflow-hidden group`}
    >
      {/* Glossy overlay effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isLightText ? 'from-white/10' : 'from-white/30'} to-transparent pointer-events-none`} />

      {/* Header: Source Citation */}
      <header className="mb-6">
        <p className={`text-[10px] sm:text-xs font-serif italic tracking-[0.2em] uppercase ${textMuted}`}>
          {hadith.bookName} • {hadith.hadithNumber}
        </p>
      </header>

      {/* Arabic Content */}
      <div className="mb-8">
        <p 
          className={`font-arabic text-2xl sm:text-3xl leading-[2.2] text-center allow-select ${customTextColor ? '' : textColor}`} 
          style={shineStyle}
          dir="rtl"
        >
          {hadith.hadithArabic}
        </p>
      </div>

      {/* English Content */}
      <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar overscroll-contain touch-auto">
        <p 
          className={`font-serif text-lg sm:text-xl leading-[1.8] allow-select ${customTextColor ? '' : (isLightText ? 'text-white/80' : 'text-[var(--color-hidayah-dark)]/80')} text-justify pb-4`}
          style={shineStyle}
        >
          {hadith.hadithEnglish}
        </p>
      </div>

      {/* Footer: Grading Badge */}
      <footer className="mt-8 flex items-center justify-between">
        <div className={`px-6 py-2 rounded-full bg-[var(--color-hidayah-gold)] ${isLightText ? 'text-white' : 'text-[var(--color-hidayah-primary)]'} text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-gold/20`}>
          {hadith.status}
        </div>
      </footer>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </motion.div>
  );
}
