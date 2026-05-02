"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, LogOut, Settings, Trash2, UserX, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '../ThemeProvider';
import { AboutUsModal } from '../AboutUsModal';

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action is permanent and will erase all your reflections and data.")) {
      return;
    }

    try {
      const res = await fetch('/api/users/profile', { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } catch (error) {
      console.error('Delete account failed:', error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-full hover:bg-[var(--color-hidayah-secondary)] transition-colors text-[var(--color-hidayah-dark)] opacity-70 hover:opacity-100"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-[var(--color-hidayah-primary)] rounded-2xl shadow-xl border border-[var(--color-hidayah-border)]/50 py-2 z-50 animate-in fade-in zoom-in duration-200">
            <button 
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[var(--color-hidayah-dark)] hover:bg-[var(--color-hidayah-secondary)] transition-colors font-medium group"
              onClick={toggleTheme}
            >
              <div className="flex items-center gap-3">
                {theme === 'light' ? <Moon className="w-4 h-4 opacity-70" /> : <Sun className="w-4 h-4 opacity-70" />}
                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-amber-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-4.5 translate-x-0.5' : 'left-0.5'}`} />
              </div>
            </button>

            <div className="my-1 border-t border-[var(--color-hidayah-border)]/30" />

            <button 
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-hidayah-dark)] hover:bg-[var(--color-hidayah-secondary)] transition-colors text-left font-medium"
              onClick={() => {
                setIsOpen(false);
                setIsAboutOpen(true);
              }}
            >
              <Settings className="w-4 h-4 opacity-70" />
              Settings
            </button>
            
            <button 
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-hidayah-dark)] hover:bg-[var(--color-hidayah-secondary)] transition-colors text-left font-medium"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 opacity-70" />
              Logout
            </button>
            
            <div className="my-1 border-t border-[var(--color-hidayah-border)]/30" />
            
            <button 
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left font-semibold"
              onClick={handleDeleteAccount}
            >
              <UserX className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        )}
      </div>

      <AboutUsModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
}

