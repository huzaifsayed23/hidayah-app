"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ReflectionTheme, REFLECTION_THEMES } from '@/constants/rewards';
import { generateMeshGradient } from '@/lib/gradients';

interface NatureBackgroundProps {
  themeId: string;
  className?: string;
  showOverlay?: boolean;
  variant?: number;
}

export const NatureBackground: React.FC<NatureBackgroundProps> = ({ 
  themeId, 
  className = "", 
  showOverlay = true,
  variant = 0
}) => {
  const theme = REFLECTION_THEMES.find(t => t.id === themeId);

  if (!theme) return null;

  const isGradientTheme = !theme.image;

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ background: isGradientTheme ? theme.colors[4] || theme.colors[0] : theme.gradient }}
    >
      {/* 1. Real Nature Image Layer or Mesh Gradient Layer */}
      <div className="absolute inset-0 z-0">
        {isGradientTheme ? (
          <div 
            className="w-full h-full"
            style={{ backgroundImage: generateMeshGradient(theme.colors, variant) }}
          />
        ) : (
          <>
            <motion.img 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              src={theme.image} 
              alt={theme.name}
              className="w-full h-full object-cover"
            />
            {/* Subtle overlay to blend the image with the theme gradient */}
            <div className="absolute inset-0 bg-black/20" />
          </>
        )}
      </div>

      {/* 2. Particle Animation (Rain/Snow/Glow) */}
      <Particles themeId={themeId} />

      {/* 3. Fog/Mist Layers */}
      <MistLayers themeId={themeId} />

      {/* 4. Lighting Layer / Glow */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-40 bg-gradient-to-b from-transparent via-white/5 to-black/20" />

      {/* 4b. Sun Layer for Blazing Sunset */}
      {themeId === 'blazing_sunset' && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-[400px] h-[400px] bg-orange-500 rounded-full blur-[150px] mix-blend-screen"
          />
          {/* God Rays */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 w-[1000px] h-[60px] bg-gradient-to-r from-orange-400/20 to-transparent blur-md origin-left"
              style={{
                rotate: `${i * 60}deg`,
              }}
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scaleX: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* 4c. Sacred Glow for Makkah/Madina */}
      {(themeId === 'makkah_dreamy' || themeId === 'madina_dreamy') && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.3, 0.5, 0.3],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className={`w-[500px] h-[500px] rounded-full blur-[180px] mix-blend-soft-light ${
              themeId === 'makkah_dreamy' ? 'bg-white' : 'bg-emerald-100'
            }`}
          />
          {/* Spiritual sparkles */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
      )}

      {/* 5. Overlay Texture (Paper/Noise) */}
      <div className="absolute inset-0 z-30 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

      {/* Content Backdrop Blur (if needed) */}
      {showOverlay && (
        <div className="absolute inset-0 z-10 bg-black/5 backdrop-blur-[2px]" />
      )}
    </div>
  );
};


const Particles = ({ themeId }: { themeId: string }) => {
  const isRainy = themeId.includes('rain');
  const isSnowy = themeId.includes('snow');
  const isGlow = themeId.includes('sunset') || themeId.includes('golden') || themeId.includes('lake');
  const isBlazing = themeId === 'blazing_sunset';

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {isBlazing && (
        <div className="absolute inset-0">
          {[...Array(25)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-200 rounded-full blur-[2px]"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${60 + Math.random() * 40}%`, // Focus particles on the bottom (reflection area)
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 0.8, 0],
                y: [0, -50],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}
      {isRainy && (
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-[1px] h-4 bg-white/20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, 1000],
                x: [0, -100],
                opacity: [0, 0.4, 0]
              }}
              transition={{
                duration: 0.5 + Math.random() * 0.5,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "linear"
              }}
            />
          ))}
        </div>
      )}
      {isSnowy && (
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, 800],
                x: [0, Math.random() * 100 - 50],
                opacity: [0, 0.6, 0]
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "linear"
              }}
            />
          ))}
        </div>
      )}
      {isGlow && (
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-100/30 rounded-full blur-xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MistLayers = ({ themeId }: { themeId: string }) => {
  const hasMist = themeId.includes('mist') || themeId.includes('valley') || themeId.includes('forest');
  
  if (!hasMist) return null;

  return (
    <div className="absolute inset-0 z-15 pointer-events-none overflow-hidden">
      <motion.div 
        className="absolute bottom-0 left-0 w-[200%] h-1/2 bg-gradient-to-t from-white/20 to-transparent blur-3xl"
        animate={{
          x: ['-50%', '0%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div 
        className="absolute bottom-10 left-[-50%] w-[200%] h-1/3 bg-gradient-to-t from-white/10 to-transparent blur-2xl"
        animate={{
          x: ['0%', '-50%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};
