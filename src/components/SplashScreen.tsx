"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

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
      // 3-second timer
      const timer = setTimeout(async () => {
        try {
          const res = await fetch("/api/auth/me");
          const data = await res.json();
          
          setIsVisible(false);
          
          // Cross-Fade transition: Delay for exit animation to complete
          setTimeout(() => {
            if (data.authenticated) {
              router.push("/dashboard");
            } else {
              router.push("/auth");
            }
          }, 1000);
        } catch (error) {
          console.error("Auth check failed:", error);
          setIsVisible(false);
          setTimeout(() => router.push("/auth"), 1000);
        }
      }, 3000);

      return () => clearTimeout(timer);
    };

    checkAuthAndRedirect();
  }, [router]);

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: [1, 1.02, 0.98, 1],
            }}
            transition={{ 
              opacity: { duration: 1, ease: "easeOut" },
              scale: { 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut",
                times: [0, 0.5, 0.75, 1]
              }
            }}
            className="relative flex flex-col items-center"
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
              <motion.div 
                initial={{ x: "-200%", skewX: -20 }}
                animate={{ x: "200%" }}
                transition={{ 
                  duration: 1.5, 
                  delay: 1, 
                  ease: "easeInOut" 
                }}
                className={cn(
                  "absolute inset-0 pointer-events-none",
                  isDark 
                    ? "bg-gradient-to-r from-transparent via-white/20 to-transparent" 
                    : "bg-gradient-to-r from-transparent via-white/40 to-transparent"
                )}
              />
            </div>

            {/* Typography */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className={cn(
                "mt-8 font-serif tracking-[12px] sm:tracking-[18px] font-light uppercase text-center transition-colors duration-700",
                isDark ? "text-[#D4AF37] text-2xl sm:text-4xl" : "text-[#2E2A26] text-3xl sm:text-5xl",
                isDark ? "drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]" : "drop-shadow-[0_2px_4px_rgba(46,42,38,0.1)]"
              )}
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              HIDAYAH
            </motion.h1>

            {/* Tarteel Style Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: isDark ? 0.4 : 0.6 }}
              transition={{ duration: 1.2, delay: 1.2 }}
              className={cn(
                "mt-4 text-[11px] sm:text-xs tracking-[5px] font-medium uppercase transition-colors duration-700",
                isDark ? "text-[#D4AF37]" : "text-[#2E2A26]"
              )}
            >
              THE DIGITAL SANCTUARY
            </motion.p>
          </motion.div>

          {/* Seamless Transition Loading Indicator */}
          <div className={cn(
            "absolute bottom-16 w-40 h-[1px] rounded-full overflow-hidden transition-colors duration-700",
            isDark ? "bg-[#D4AF37]/10" : "bg-[#2E2A26]/10"
          )}>
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 3, ease: "linear" }}
              className={cn(
                "h-full w-full transition-colors duration-700",
                isDark ? "bg-[#D4AF37]/40" : "bg-[#B8860B]/40"
              )}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
