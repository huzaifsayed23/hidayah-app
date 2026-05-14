"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const PULL_THRESHOLD = 80;

export default function PullToRefresh({ onRefresh, children, className = "" }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePan = (event: any, info: PanInfo) => {
    if (isRefreshing) return;
    
    // Only allow pull down if we are at the top of the page
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 0) return;

    if (info.offset.y > 0) {
      // Resistance effect: pull slower as it goes deeper
      const distance = Math.min(info.offset.y * 0.4, PULL_THRESHOLD + 20);
      setPullDistance(distance);
    } else {
      setPullDistance(0);
    }
  };

  const handlePanEnd = async (event: any, info: PanInfo) => {
    if (isRefreshing) return;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      
      try {
        await onRefresh();
      } catch (e) {
        console.error("Refresh failed", e);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Pull Indicator Area */}
      <motion.div 
        className="absolute top-0 left-0 right-0 flex justify-center items-center overflow-hidden z-0"
        style={{ height: pullDistance }}
        animate={{ height: pullDistance }}
        transition={isRefreshing ? { type: "spring", stiffness: 200, damping: 20 } : { type: "tween", duration: 0.1 }}
      >
        <div className="flex flex-col items-center gap-1 opacity-60">
          <motion.div
            animate={isRefreshing ? { rotate: 360 } : { rotate: (pullDistance / PULL_THRESHOLD) * 180 }}
            transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0 }}
          >
            <Loader2 className={`w-6 h-6 text-[var(--color-hidayah-gold)] ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.div>
          {pullDistance > 20 && !isRefreshing && (
            <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-hidayah-gold)]">
              {pullDistance >= PULL_THRESHOLD ? "Release to Refresh" : "Pull to Refresh"}
            </span>
          )}
        </div>
      </motion.div>

      {/* Content Area */}
      <motion.div
        ref={containerRef}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        animate={{ y: pullDistance }}
        transition={isRefreshing ? { type: "spring", stiffness: 200, damping: 20 } : { type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 bg-[inherit]"
      >
        {children}
      </motion.div>
    </div>
  );
}
