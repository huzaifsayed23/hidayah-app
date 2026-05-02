"use client";

import React, { useState, useEffect } from 'react';
import { Search, Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Link from 'next/link';
import { getPusherClient } from '@/lib/pusher';
import { HIDAYAH_API_URL } from '@/lib/api';


interface CommunityHeaderProps {
  userName: string;
  onSearch?: (query: string) => void;
}

export default function CommunityHeader({ userName, onSearch }: CommunityHeaderProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  useEffect(() => {
    let channel: any;

    const setupPusher = async () => {
      try {
        const res = await fetch(`${HIDAYAH_API_URL}/api/auth/me`);
        const userData = await res.json();

        
        if (userData.id) {
          const pusher = getPusherClient();
          channel = pusher.subscribe(`user-${userData.id}`);
          
          channel.bind('notification', (data: any) => {
            // Trigger shake for all notifications
            setIsShaking(true);
            setHasUnread(true);
            setTimeout(() => setIsShaking(false), 500);

            // Play sound only for circle requests/invites
            if (data.type === 'circle_invite' || data.type === 'circle_request') {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.volume = 0.4;
              audio.play().catch(e => console.log("Audio blocked by browser:", e));
            }
          });
        }
      } catch (err) {
        console.error("Pusher setup auth check error:", err);
      }

    };

    setupPusher();
    return () => {
      if (channel) channel.unbind_all();
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (onSearch) onSearch(q);
  };

  return (
    <header className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <AnimatePresence mode="wait">
          {!isSearching ? (
            <motion.div 
              key="title"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <p className="text-sm font-medium text-[var(--color-hidayah-dark)] opacity-70">As-salamu alaykum,</p>
              <h1 className="text-2xl font-bold font-serif mt-1">{userName}</h1>
            </motion.div>
          ) : (
            <motion.div 
              key="search"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '100%' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex-1 mr-4"
            >
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-[var(--color-hidayah-dark)] opacity-40" />
                <input 
                  autoFocus
                  type="text" 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search usernames or reflections..."
                  className="w-full pl-12 pr-10 py-3 bg-[var(--color-hidayah-secondary)] rounded-full text-sm outline-none border border-transparent focus:border-[var(--color-hidayah-gold)] transition-all"
                />
                <button 
                  onClick={() => { setIsSearching(false); setSearchQuery(""); if (onSearch) onSearch(""); }}
                  className="absolute right-3 p-1 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--color-hidayah-dark)] opacity-40" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 shrink-0">
          {!isSearching && (
            <button 
              onClick={() => setIsSearching(true)}
              className="p-2.5 rounded-full hover:bg-[var(--color-hidayah-secondary)] transition-colors"
            >
              <Search className="w-5 h-5 text-[var(--color-hidayah-dark)] opacity-70" />
            </button>
          )}
          <Link href="/notifications" className="p-2.5 rounded-full hover:bg-[var(--color-hidayah-secondary)] transition-colors relative group">
            <motion.div
              animate={isShaking ? {
                rotate: [0, -15, 15, -15, 15, 0],
                scale: [1, 1.2, 1.2, 1.2, 1.2, 1]
              } : {}}
              transition={{ duration: 0.5 }}
            >
              <Bell className="w-5 h-5 text-[var(--color-hidayah-dark)] opacity-70 group-hover:opacity-100 transition-opacity" />
            </motion.div>
            {hasUnread && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[var(--color-hidayah-gold)] rounded-full border-2 border-[var(--color-hidayah-primary)]"></span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
