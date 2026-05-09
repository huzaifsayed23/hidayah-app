"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, ChevronRight, Bookmark } from 'lucide-react';

interface QuizRewardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onViewBadge?: () => void;
  level?: number | string;
  levelName?: string;
  badgeName?: string;
  badgeIcon?: string;
}

const LEVEL_STYLES: Record<string, { colors: string[], border: string, accent: string }> = {
  "1": { colors: ["#CD7F32", "#E69B5F", "#8B4513"], border: "border-orange-900/20", accent: "#CD7F32" }, // Bronze
  "2": { colors: ["#BDC3C7", "#ECECEC", "#8E9EAB"], border: "border-slate-400/20", accent: "#8E9EAB" }, // Silver
  "3": { colors: ["#C9A646", "#F5E6B3", "#A67C00"], border: "border-yellow-900/20", accent: "#C9A646" }, // Gold
  "4": { colors: ["#0F3D2E", "#1F7A63", "#A8E6CF"], border: "border-emerald-900/20", accent: "#1F7A63" }, // Emerald Metal
  "5": { colors: ["#1E3C72", "#2A5298", "#AFCBFF"], border: "border-blue-900/20", accent: "#2A5298" }, // Sapphire Steel
  "mixed": { colors: ["#1A1A1A", "#4A4A4A", "#000000"], border: "border-white/10", accent: "#C9A646" } // Obsidian Master
};

const CONFETTI_COLORS = ['#C9A86A', '#FFFFFF', '#AFCBFF', '#A8E6CF'];

export default function QuizRewardOverlay({
  isOpen,
  onClose,
  onViewBadge,
  level = 1,
  levelName,
  badgeName,
  badgeIcon
}: QuizRewardOverlayProps) {
  const [showButtons, setShowButtons] = useState(false);
  const style = LEVEL_STYLES[level.toString()] || LEVEL_STYLES["3"];

  // Default values based on level
  const defaults: Record<string, { icon: string, name: string, label: string }> = {
    "1": { icon: "📜", name: "Foundations Badge", label: "Foundations" },
    "2": { icon: "📖", name: "Quran Scholar", label: "Quran Knowledge" },
    "3": { icon: "✨", name: "Prophetic Mirror", label: "Prophets" },
    "4": { icon: "🛡️", name: "Sahaba Sentinel", label: "Sahabah" },
    "5": { icon: "🏰", name: "Ummah Historian", label: "History" },
    "mixed": { icon: "⭐", name: "Al-Mustafa Master", label: "Mushkil" }
  };

  const currentLevel = level.toString();
  const displayIcon = badgeIcon || defaults[currentLevel]?.icon || "✨";
  const displayName = badgeName || defaults[currentLevel]?.name || "Achievement Unlocked";
  const displayLevel = levelName || defaults[currentLevel]?.label || `Level ${level}`;

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowButtons(true), 2500);
      return () => clearTimeout(timer);
    } else {
      setShowButtons(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center overflow-hidden perspective-[1000px]">
          {/* 1. Screen Dim + Focus */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
          />

          {/* 4. Soft Confetti Animation (Background Layer) */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden w-full h-full">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: -50, 
                  x: `${Math.random() * 100}vw`, 
                  opacity: 0, 
                  rotate: 0 
                }}
                animate={{ 
                  y: ['0vh', '110vh'],
                  opacity: [0, 1, 1, 0],
                  rotate: 720,
                  x: [
                    `${Math.random() * 100}vw`, 
                    `${Math.random() * 100 + (Math.random() - 0.5) * 20}vw`
                  ]
                }}
                transition={{ 
                  duration: 5 + Math.random() * 5, 
                  repeat: Infinity, 
                  delay: Math.random() * 5,
                  ease: "linear"
                }}
                className="absolute w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  boxShadow: `0 0 12px ${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}60`
                }}
              />
            ))}
          </div>

          {/* 5. Glow Pulse (Behind Medal) */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full blur-[100px]"
            style={{ background: `radial-gradient(circle, ${style.accent}40, transparent)` }}
          />

          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full">
            {/* 2 & 3. Medal Entry + Spinning Effect */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0, y: 100, rotateY: 0 }}
              animate={{ scale: 1, opacity: 1, y: 0, rotateY: 1080 }}
              transition={{ 
                duration: 2.5,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1
              }}
              className="relative mb-12 preserve-3d"
            >
              {/* Medal Body */}
              <div 
                className={`w-44 h-44 sm:w-64 sm:h-64 rounded-full p-1.5 shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_0_40px_rgba(255,255,255,0.3)] relative`}
                style={{ 
                  background: `linear-gradient(135deg, ${style.colors[0]}, ${style.colors[1]}, ${style.colors[2]})`,
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Inner Face */}
                <div className="w-full h-full rounded-full bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden border border-white/20">
                  {/* Dynamic Light Reflection */}
                  <motion.div 
                    animate={{ x: [-300, 300], opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
                    className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-45"
                  />
                  
                  {/* Master level special glow */}
                  {level === 'mixed' && (
                    <motion.div 
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-radial from-[#C9A86A]/20 to-transparent"
                    />
                  )}

                  <span className="text-7xl sm:text-8xl mb-3 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-10">{displayIcon}</span>
                  <div className={`h-1 w-16 rounded-full mb-3 shadow-inner`} style={{ backgroundColor: `${style.accent}40` }} />
                  <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] z-10`} style={{ color: style.accent }}>
                    {level === 'mixed' ? 'AL-MUSTAFA' : `Rank ${level}`}
                  </span>
                </div>

                {/* 3D Edge Effect (Simulated thickness) */}
                <div className="absolute inset-0 rounded-full border-[6px] border-black/30 translate-z-[-2px]" />
                <div className="absolute inset-0 rounded-full border-[2px] border-white/20 translate-z-[2px]" />
              </div>

              {/* Orbital Rings */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className={`absolute -inset-8 border border-dashed rounded-full opacity-20`}
                style={{ borderColor: style.accent }}
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className={`absolute -inset-4 border border-white/10 rounded-full`}
              />
            </motion.div>

            {/* 6. Text Reveal */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="h-px w-8 bg-[#C9A86A]/30" />
                  <span className="text-[10px] sm:text-xs font-bold text-[#C9A86A] uppercase tracking-[0.4em]">MashaAllah</span>
                  <div className="h-px w-8 bg-[#C9A86A]/30" />
                </div>
                <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-2 tracking-tight">
                  Level Complete
                </h2>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                className="space-y-6"
              >
                <p className="text-white/60 text-sm sm:text-base leading-relaxed max-w-xs mx-auto">
                  You've unlocked the <span className="text-[#C9A86A] font-bold">"{displayName}"</span> for your journey.
                </p>

                {/* Badge Chip */}
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="w-6 h-6 rounded-full bg-[#C9A86A]/20 flex items-center justify-center text-[#C9A86A]">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{displayLevel} Badge</span>
                </div>
              </motion.div>
            </div>

            {/* 7. Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: showButtons ? 1 : 0, 
                y: showButtons ? 0 : 20 
              }}
              className="mt-12 w-full grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <button
                onClick={onClose}
                className="relative overflow-hidden group py-5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Continue Journey <ChevronRight className="w-4 h-4" />
                </span>
              </button>
              
              <button
                onClick={onViewBadge}
                className="py-5 rounded-full bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95 backdrop-blur-md flex items-center justify-center gap-2"
              >
                <Bookmark className="w-4 h-4" /> View Badge
              </button>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
