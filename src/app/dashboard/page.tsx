"use client";

import { Logo } from "@/components/Logo";
import Link from "next/link";
import { BookOpen, Heart, Users, User as UserIcon, ArrowLeft, MessageSquare, Key, Clock, Moon, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Client-side auth check
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.isAdmin);
          if (data.authenticated && data.acceptedTerms === false) {
            router.push('/agreement');
          }
        }
      } catch (e) {
        console.error("Auth check failed", e);
      }
    };
    checkAuth();
  }, [router]);

  const MENU_ITEMS = [
    { label: "Community Feed", href: "/community", icon: Users },
    { label: "Group Discussions", href: "/community/circles", icon: MessageSquare },
    { label: "My Profile", href: "/profile", icon: UserIcon },
    { label: "Surah Library", href: "/surahs", icon: BookOpen },
    { label: "Quran Reader (Juz)", href: "/quran", icon: BookOpen },
    { label: "Daily Duas", href: "/duas", icon: Heart },
    { label: "Daily Hadith", href: "/hadith", icon: Moon },
    { label: "Islamic Quiz", href: "/quiz", icon: GraduationCap },
    { label: "Prayer Times", href: "/prayer", icon: Clock },
  ];

  if (isAdmin) {
    MENU_ITEMS.unshift({ label: "Admin Control Panel", href: "/admin", icon: Key });
  }

  return (
    <main className="min-h-screen bg-hidayah-primary flex flex-col items-center p-6 pt-12 pb-24 text-center">
      <Logo className="mb-10" />
      <h1 className="text-2xl sm:text-3xl font-light text-[var(--color-hidayah-dark)] mb-12 tracking-wide">
        Explore Hidayah
      </h1>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-lg mb-10">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center text-center gap-3 p-4 sm:p-5 rounded-[24px] bg-hidayah-secondary border border-hidayah-border/30 shadow-sm hover:shadow-md transition-colors text-hidayah-dark hover:text-hidayah-gold group"
            >
              <div className="w-10 h-10 rounded-full bg-hidayah-primary flex items-center justify-center group-hover:bg-hidayah-gold/10">
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-medium tracking-wide text-xs sm:text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      <Link 
        href="/auth"
        className="flex items-center gap-2 px-6 py-3 rounded-full border border-hidayah-border/50 text-hidayah-dark hover:bg-hidayah-gold hover:text-white hover:border-hidayah-gold transition-all duration-300 mt-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium tracking-widest uppercase">Start Over</span>
      </Link>
    </main>
  );
}
