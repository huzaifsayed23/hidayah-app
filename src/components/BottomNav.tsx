"use client";

import React from 'react';
import { Home, Users, User, PlusCircle, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const isChatPage = pathname?.startsWith('/groups/') && pathname !== '/groups' && pathname !== '/groups/create';
  const isQuranReadPage = pathname?.startsWith('/quran/read');
  
  const isQuizPage = pathname?.startsWith('/quiz');
  
  if (pathname === '/' || pathname === '/onboarding' || pathname === '/hadith' || pathname === '/community/create' || isChatPage || isQuranReadPage || isQuizPage) return null;

  const navItems = [
    { name: 'Feed', href: '/community', icon: Home },
    { name: 'Explore', href: '/dashboard', icon: LayoutGrid },
    { name: 'Create', href: '/community/create', icon: PlusCircle, isSpecial: true },
    { name: 'Circles', href: '/groups', icon: Users },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
      <nav className="flex items-center gap-1 p-1.5 bg-[var(--color-hidayah-primary)]/80 backdrop-blur-xl border border-[var(--color-hidayah-border)]/30 rounded-full shadow-2xl pointer-events-auto max-w-xs w-full justify-between">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/community' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-hidayah-gold)] text-white shadow-lg hover:scale-110 transition-transform mx-1"
              >
                <Icon className="w-6 h-6" />
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 ${isActive ? 'px-4' : 'px-3'} py-3 rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] shadow-md' 
                  : 'text-[var(--color-hidayah-dark)]/40 hover:bg-[var(--color-hidayah-secondary)]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              {isActive && <span className="text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-left-2">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
