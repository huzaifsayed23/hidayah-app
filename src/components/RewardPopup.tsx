"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, ReflectionTheme } from '@/constants/rewards';
import { NatureBackground } from './NatureBackground';
import { Trophy, Sparkles, Check } from 'lucide-react';

interface RewardPopupProps {
  isOpen: boolean;
  onClose: () => void;
  reward: {
    type: 'badge' | 'theme';
    data: Badge | ReflectionTheme;
    theme?: ReflectionTheme;
  } | null;
}

export const RewardPopup: React.FC<RewardPopupProps> = ({ isOpen, onClose, reward }) => {
  if (!reward) return null;

  const isBadge = reward.type === 'badge';
  const badge = isBadge ? (reward.data as Badge) : null;
  const theme = isBadge ? reward.theme : (reward.data as ReflectionTheme);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[48px] overflow-hidden shadow-2xl"
          >
            {/* Background Preview */}
            <div className="relative h-64 sm:h-80">
              {theme && (
                <NatureBackground 
                  themeId={theme.id} 
                  className="w-full h-full" 
                  showOverlay={false}
                />
              )}
              
              {/* Floating Gold Particles Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full blur-[1px]"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -100],
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>

              {/* Badge Icon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ rotateY: 0, scale: 0.2, opacity: 0 }}
                  animate={{ rotateY: 360, scale: 1, opacity: 1 }}
                  transition={{ 
                    duration: 1.2,
                    ease: "easeOut",
                    type: "spring",
                    stiffness: 100
                  }}
                  className="relative"
                >
                  {isBadge ? (
                    <div className="relative">
                      {/* Medal Style Icon */}
                      <div className={`w-32 h-32 rounded-full flex items-center justify-center relative overflow-hidden shadow-2xl ring-4 ring-white/30 bg-gradient-to-br ${
                        badge?.levelRequired === 1 ? 'from-[#CD7F32] to-[#8B4513]' :
                        badge?.levelRequired === 2 ? 'from-[#C0C0C0] to-[#707070]' :
                        badge?.levelRequired === 3 ? 'from-[#FFD700] to-[#B8860B]' :
                        badge?.levelRequired === 4 ? 'from-[#E5E4E2] to-[#B4B4B4]' :
                        badge?.levelRequired === 5 ? 'from-[#B9F2FF] to-[#7BB8FF]' :
                        'from-[#FFD700] via-[#9B59B6] to-[#FFD700]'
                      }`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)]" />
                        <span className="text-5xl drop-shadow-md z-10">{badge?.icon}</span>
                      </div>
                      
                      {/* Level Indicator */}
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center text-xs font-black text-hidayah-gold border-2 border-hidayah-gold/20">
                        {badge?.levelRequired === 6 ? 'M' : badge?.levelRequired}
                      </div>
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-full border border-white/40 flex items-center justify-center shadow-xl">
                      <Trophy className="w-16 h-16 text-white drop-shadow-lg" />
                    </div>
                  )}
                  
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-4 border-2 border-dashed border-white/20 rounded-full pointer-events-none"
                  />
                </motion.div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 sm:p-12 text-center bg-white relative">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-center gap-2 text-hidayah-gold font-bold uppercase tracking-[0.3em] text-[10px] mb-4">
                  <Sparkles className="w-3 h-3" />
                  Achievement Unlocked
                  <Sparkles className="w-3 h-3" />
                </div>
                
                <h2 className="text-4xl font-serif font-bold text-hidayah-dark mb-4">MashaAllah!</h2>
                
                <p className="text-hidayah-dark/60 mb-8 max-w-xs mx-auto leading-relaxed">
                  {isBadge 
                    ? `You've earned the "${badge?.name}" badge and a new reflection background.`
                    : `You've unlocked the "${theme?.name}" reflection background for your posts.`
                  }
                </p>

                <div className="space-y-4">
                  {isBadge && (
                    <div className="flex items-center gap-4 bg-hidayah-secondary/50 p-4 rounded-3xl border border-hidayah-border/10">
                      <div className="w-12 h-12 bg-hidayah-gold/20 rounded-2xl flex items-center justify-center text-hidayah-gold">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-hidayah-dark/40">Earned Badge</div>
                        <div className="font-serif font-bold text-hidayah-dark">{badge?.name}</div>
                      </div>
                      <div className="ml-auto w-8 h-8 bg-hidayah-gold rounded-full flex items-center justify-center text-white">
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full py-5 rounded-full bg-hidayah-dark text-[var(--color-hidayah-primary)] font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    Continue Journey
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
