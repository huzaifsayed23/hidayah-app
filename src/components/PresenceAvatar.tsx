"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PresenceAvatarProps {
  user: {
    username: string;
    image?: string | null;
    isOnline: boolean;
    lastSeen: string | Date;
  };
  size?: 'sm' | 'md' | 'lg';
  showLastSeen?: boolean;
}

export default function PresenceAvatar({ user, size = 'md', showLastSeen = true }: PresenceAvatarProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const auraSize = {
    sm: 'p-0.5',
    md: 'p-1',
    lg: 'p-1.5',
  };

  const formatLastSeen = (date: string | Date) => {
    const lastSeenDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastSeenDate.toLocaleDateString();
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        {/* Noor Aura Ring */}
        {user.isOnline && (
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5],
              boxShadow: [
                '0 0 0px var(--color-hidayah-gold)',
                '0 0 15px var(--color-hidayah-gold)',
                '0 0 0px var(--color-hidayah-gold)'
              ]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className={cn(
              "absolute inset-0 rounded-full border-2 border-[var(--color-hidayah-gold)]",
              auraSize[size]
            )}
          />
        )}

        {/* Avatar Image */}
        <div 
          className={cn(
            "rounded-full overflow-hidden border-2 border-white shadow-sm transition-all duration-700",
            sizeClasses[size],
            !user.isOnline && "filter grayscale(0.8) opacity-70"
          )}
        >
          {user.image ? (
            <img 
              src={user.image} 
              alt={user.username} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-[var(--color-hidayah-secondary)] flex items-center justify-center text-[var(--color-hidayah-dark)] font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Status Indicator Dot (Optional but helpful) */}
        <div className={cn(
          "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
          user.isOnline ? "bg-green-500" : "bg-gray-400"
        )} />
      </div>

      {showLastSeen && !user.isOnline && (
        <p className="text-[9px] font-serif italic text-[var(--color-hidayah-dark)]/40 whitespace-nowrap">
          Active {formatLastSeen(user.lastSeen)}
        </p>
      )}
    </div>
  );
}
