"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { ReflectionTheme } from '@/constants/rewards';
import { NatureBackground } from './NatureBackground';

interface ThemePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ReflectionTheme | null;
}

export const ThemePreviewModal: React.FC<ThemePreviewModalProps> = ({ isOpen, onClose, theme }) => {
  if (!theme) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl aspect-video rounded-[40px] overflow-hidden shadow-2xl border border-white/10"
          >
            <NatureBackground themeId={theme.id} className="w-full h-full" showOverlay={false} />
            
            {/* Overlay Info */}
            <div className="absolute inset-0 flex flex-col justify-between p-8 sm:p-12 z-10 pointer-events-none">
              <div className="flex justify-between items-start">
                <div className="pointer-events-auto">
                  <div className="flex items-center gap-2 text-white/60 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">
                    <Sparkles className="w-3 h-3" />
                    Theme Preview
                  </div>
                  <h2 className="text-4xl sm:text-6xl font-serif font-bold text-white drop-shadow-xl">{theme.name}</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all pointer-events-auto"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="max-w-md pointer-events-auto">
                <p className="text-white/80 text-lg sm:text-xl font-serif italic mb-6 leading-relaxed">
                  "{theme.mood}"
                </p>
                <div className="flex gap-2">
                   {theme.colors.map((c, i) => (
                     <div key={i} className="w-8 h-8 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                   ))}
                </div>
              </div>
            </div>

            {/* Bottom Gradient for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
