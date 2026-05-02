"use client";

import React from 'react';
import Link from 'next/link';
import { Calendar, PenTool } from 'lucide-react';

interface UserSearchResultProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    bio: string;
    image: string | null;
    joinedAt: string;
    postCount: number;
  };
}

export default function UserSearchResult({ user }: UserSearchResultProps) {
  const joinedDate = new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <Link href={`/profile/${user.username}`}>
      <div className="bg-[var(--color-hidayah-secondary)] hover:bg-[var(--color-hidayah-gold)]/5 transition-all duration-300 rounded-[16px] px-3 py-2 border border-[var(--color-hidayah-border)]/20 shadow-sm flex gap-3 items-center group">
        <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--color-hidayah-primary)] border border-[var(--color-hidayah-border)]/10 shadow-sm overflow-hidden flex items-center justify-center font-bold text-xs text-[var(--color-hidayah-dark)]">
          {user.image ? (
            <img src={user.image} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            user.username.charAt(0).toUpperCase()
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-bold text-[13px] text-[var(--color-hidayah-dark)] truncate">{user.username.startsWith('@') ? user.username : `@${user.username}`}</h3>
              <span className="text-[10px] text-[var(--color-hidayah-dark)] opacity-40 truncate font-serif italic hidden sm:block">{user.bio}</span>
            </div>
            <div className="flex items-center gap-1 text-[var(--color-hidayah-gold)] text-[10px] font-bold">
              <PenTool className="w-2.5 h-2.5" />
              {user.postCount}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
