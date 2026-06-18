"use client";

import React, { useState, useEffect } from 'react';
import { Home, Users, User, PlusCircle, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hidayahFetch } from '@/lib/api';

export default function BottomNav() {
  const rawPathname = usePathname();
  const pathname = rawPathname?.replace(/\/$/, '') || '/';
  const [unreadCircles, setUnreadCircles] = useState(0);
  
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('hidayah_token');
        if (!token) return;
        const res = await hidayahFetch('/api/notifications/unread-count');
        if (res.ok) {
          const data = await res.json();
          setUnreadCircles(data.unreadCircles || 0);
        }
      } catch (err) {}
    };
    fetchCounts();
    // Simple interval for background refresh
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [pathname]); // Refetch when navigation happens (e.g. going out of a circle)
  
  // Debug log

  const isQuranReadPage = pathname?.startsWith('/quran/read');
  const isQuizLevelPage = pathname?.startsWith('/quiz/') && pathname !== '/quiz';
  const isChatPage = pathname?.startsWith('/community/') && 
                     !pathname?.startsWith('/community/circles') && 
                     !pathname?.startsWith('/community/create');
  
  const isCreateCirclePage = pathname === '/community/circles/create';

  const shouldHideNav = [
    '/',
    '/onboarding',
    '/agreement',
    '/auth',
    '/hadith',
    '/dashboard',
  ].includes(pathname) || 
  pathname?.startsWith('/quran') || 
  pathname?.startsWith('/surahs') || 
  pathname?.startsWith('/duas') || 
  pathname?.startsWith('/quiz') || 
  pathname?.startsWith('/prayer') ||
  isChatPage || isCreateCirclePage;

  if (shouldHideNav) return null;

  const navItems = [
    { name: 'Feed', href: '/community', icon: Home },
    { name: 'Explore', href: '/dashboard', icon: LayoutGrid },
    { name: 'Create', href: '/community/create', icon: PlusCircle, isSpecial: true },
    { name: 'Circles', href: '/community/circles', icon: Users },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[10000] flex justify-center p-4 pb-[max(env(safe-area-inset-bottom),1.5rem)] pointer-events-none"
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
    >
      <nav className="flex items-center gap-1 p-1.5 bg-[#F2EBE1] border-2 border-[#C9A86A] rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto max-w-xs w-full justify-between overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/community' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={false}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-[#C9A86A] text-white shadow-lg hover:scale-110 active:scale-90 transition-all mx-1 shrink-0"
              >
                <Icon className="w-6 h-6" />
              </Link>
            );
          }

          return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={false}
                className={`relative flex items-center gap-2 ${isActive ? 'px-4' : 'px-3'} py-3 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#2E2A26] text-[#F2EBE1] shadow-md' 
                    : 'text-[#2E2A26]/60 hover:bg-[#E8DCCB]'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  {item.name === 'Circles' && unreadCircles > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#F2EBE1]">
                      {unreadCircles > 99 ? '99+' : unreadCircles}
                    </span>
                  )}
                </div>
                {isActive && <span className="text-[10px] font-bold uppercase tracking-widest">{item.name}</span>}
              </Link>
          );
        })}
      </nav>
    </div>
  );
}
