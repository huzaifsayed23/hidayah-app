"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

interface MedalIconProps {
  level: number;
  isUnlocked: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: string;
  className?: string;
}

const MEDAL_STYLES: Record<number, { colors: string[], accent: string, text: string }> = {
  1: { colors: ["#CD7F32", "#E69B5F", "#8B4513"], accent: "#CD7F32", text: "BRONZE" }, // Bronze
  2: { colors: ["#BDC3C7", "#ECECEC", "#8E9EAB"], accent: "#8E9EAB", text: "SILVER" }, // Silver
  3: { colors: ["#C9A646", "#F5E6B3", "#A67C00"], accent: "#C9A646", text: "GOLD" },   // Gold
  4: { colors: ["#0F3D2E", "#1F7A63", "#A8E6CF"], accent: "#1F7A63", text: "EMERALD" }, // Emerald
  5: { colors: ["#1E3C72", "#2A5298", "#AFCBFF"], accent: "#2A5298", text: "SAPPHIRE" }, // Sapphire
  6: { colors: ["#1A1A1A", "#4A4A4A", "#000000"], accent: "#C9A646", text: "OBSIDIAN" }  // Obsidian
};

export default function MedalIcon({ level, isUnlocked, size = 'md', icon, className = "" }: MedalIconProps) {
  const style = MEDAL_STYLES[level] || MEDAL_STYLES[1];
  
  const sizeMap = {
    xs: 'w-8 h-8 text-sm',
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl',
    xl: 'w-32 h-32 text-5xl'
  };

  const containerSize = sizeMap[size].split(' ')[0] + ' ' + sizeMap[size].split(' ')[1];
  const textSize = sizeMap[size].split(' ')[2];

  if (!isUnlocked) {
    return (
      <div className={`${containerSize} rounded-full bg-hidayah-dark/5 border border-hidayah-dark/10 flex items-center justify-center opacity-40 grayscale ${className}`}>
        <Lock className="w-1/2 h-1/2 text-hidayah-dark/30" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05, rotate: 5 }}
      className={`relative ${containerSize} rounded-full p-[3%] shadow-xl preserve-3d ${className}`}
      style={{ 
        background: `linear-gradient(135deg, ${style.colors[0]}, ${style.colors[1]}, ${style.colors[2]})`,
      }}
    >
      {/* Outer Rim Shine */}
      <div className="absolute inset-0 rounded-full border-2 border-white/20 pointer-events-none" />
      
      {/* Inner Face */}
      <div className="w-full h-full rounded-full bg-black/10 backdrop-blur-[1px] flex flex-col items-center justify-center relative overflow-hidden border border-white/30">
        {/* Dynamic Shine Sweep */}
        <motion.div 
          animate={{ x: [-150, 150], opacity: [0, 0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
          className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-45 pointer-events-none"
        />
        
        {/* Subtle Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)] pointer-events-none" />
        
        {/* Master level special glow */}
        {level === 6 && (
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-radial from-[#C9A86A]/30 to-transparent pointer-events-none"
          />
        )}

        <span className={`${textSize} drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] z-10 select-none mb-[2%]`}>
          {icon || "✨"}
        </span>
        
        {size !== 'xs' && (
          <span className="text-[15%] font-black tracking-[0.3em] text-white/90 z-10 opacity-80 uppercase">
            {style.text}
          </span>
        )}
      </div>

      {/* 3D Depth Shadow */}
      <div className="absolute inset-0 rounded-full shadow-[inset_0_-4px_8px_rgba(0,0,0,0.4)] pointer-events-none" />
    </motion.div>
  );
}
