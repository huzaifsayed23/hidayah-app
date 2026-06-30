"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { HIDAYAH_API_URL, hidayahFetch } from "@/lib/api";


export function SplashScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Determine theme from localStorage
    const savedTheme = localStorage.getItem('hidayah-theme');
    if (savedTheme === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }

    const checkAuthAndRedirect = async () => {
      // Short delay for the splash animation
      const timer = setTimeout(async () => {
        try {
          const token = localStorage.getItem('hidayah_token');
          if (!token) {
            setIsVisible(false);
            setTimeout(() => router.push("/auth"), 100);
            return;
          }

          const res = await hidayahFetch("/api/auth/me");
          const data = await res.json();
          
          setIsVisible(false);
          
          setTimeout(() => {
            if (res.ok && data.authenticated) {
              router.push("/community");
            } else {
              router.push("/auth");
            }
          }, 100);
        } catch (error) {
          setIsVisible(false);
          setTimeout(() => router.push("/auth"), 100);
        }
      }, 800);

      return () => clearTimeout(timer);
    };

    checkAuthAndRedirect();
  }, [router]);

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}

          className={cn(
            "fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-colors duration-700",
            isDark ? "bg-[#0a0a0a]" : "bg-[#F5F5DC]"
          )}
        >
          {/* Spotlight Effect */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            isDark 
              ? "bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1)_0%,transparent_70%)]" 
              : "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.6)_0%,transparent_70%)]"
          )} />

          {/* Main Logo Container */}
          <div
            className="relative flex flex-col items-center"
            style={{ 
              animation: 'fadeInScale 1.2s ease-out forwards',
            }}
          >
            {/* Logo with Shimmer */}
            <div className="relative group">
              <Logo 
                showText={false} 
                className={cn(
                  "w-28 h-28 sm:w-36 sm:h-36 transition-colors duration-700",
                  isDark ? "text-[#D4AF37] drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]" : "text-[#B8860B] drop-shadow-[0_4px_12px_rgba(184,134,11,0.2)]"
                )} 
              />
              
              {/* Shimmer Light Streak */}
              <div 
                className={cn(
                  "absolute inset-0 pointer-events-none overflow-hidden",
                  isDark 
                    ? "bg-gradient-to-r from-transparent via-white/20 to-transparent" 
                    : "bg-gradient-to-r from-transparent via-white/40 to-transparent"
                )}
                style={{
                  width: '200%',
                  transform: 'skewX(-20deg)',
                  animation: 'shimmer 2s infinite linear',
                  animationDelay: '1s'
                }}
              />
            </div>

            {/* Typography */}
            <h1
              className={cn(
                "mt-8 font-serif tracking-[12px] sm:tracking-[18px] font-light uppercase text-center transition-colors duration-700",
                isDark ? "text-[#D4AF37] text-2xl sm:text-4xl" : "text-[#2E2A26] text-3xl sm:text-5xl",
                isDark ? "drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]" : "drop-shadow-[0_2px_4px_rgba(46,42,38,0.1)]"
              )}
              style={{ fontFamily: "'Playfair Display', serif", animation: 'fadeIn 1.5s ease-out 0.5s both' }}
            >
              HIDAYAH
            </h1>

            {/* Tarteel Style Subtitle */}
            <p
              className={cn(
                "mt-4 text-[11px] sm:text-xs tracking-[5px] font-medium uppercase transition-colors duration-700",
                isDark ? "text-[#D4AF37] opacity-40" : "text-[#2E2A26] opacity-60"
              )}
              style={{ animation: 'fadeIn 1.5s ease-out 1.2s both' }}
            >
              THE DIGITAL SANCTUARY
            </p>
          </div>

          {/* Seamless Transition Loading Indicator */}
          <div className={cn(
            "absolute bottom-16 w-40 h-[1px] rounded-full overflow-hidden transition-colors duration-700",
            isDark ? "bg-[#D4AF37]/10" : "bg-[#2E2A26]/10"
          )}>
            <div 
              className={cn(
                "h-full w-full transition-colors duration-700",
                isDark ? "bg-[#D4AF37]/40" : "bg-[#B8860B]/40"
              )}
              style={{
                transform: 'translateX(-100%)',
                animation: 'loadingProgress 3s linear forwards'
              }}
            />
          </div>

          <style>{`
            @keyframes fadeInScale {
              from { opacity: 0; transform: scale(0.9); }
              to { opacity: 1; transform: scale(1); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes shimmer {
              0% { transform: translateX(-150%) skewX(-20deg); }
              100% { transform: translateX(150%) skewX(-20deg); }
            }
            @keyframes loadingProgress {
              from { transform: translateX(-100%); }
              to { transform: translateX(0%); }
            }
          `}</style>
        </motion.div>


      )}
    </AnimatePresence>
  );
}
