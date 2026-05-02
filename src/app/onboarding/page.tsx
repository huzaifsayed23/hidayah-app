"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { BookOpen, Moon, Heart, Clock, Users, ArrowRight, ShieldAlert, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const INTERESTS = [
  { id: "quran", label: "Quran", subtitle: "Full Juz-based reader", icon: BookOpen },
  { id: "hadith", label: "Hadith", subtitle: "Daily prophetic sayings", icon: Moon },
  { id: "duas", label: "Duas", subtitle: "Authentic supplications", icon: Heart },
  { id: "surahs", label: "Surahs", subtitle: "Read individual Surahs", icon: BookOpen, primary: true },
  { id: "prayer", label: "Prayer Times", subtitle: "Stay connected", icon: Clock },
  { id: "quiz", label: "Quiz", subtitle: "Learn Deen through knowledge", icon: GraduationCap, primary: true },
  { id: "community", label: "Community Feed", subtitle: "Connect with Ummah", icon: Users },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.isAdmin) setIsAdmin(true);
      })
      .catch(console.error);
  }, []);

  const currentInterests = [...INTERESTS];
  if (isAdmin) {
    currentInterests.unshift({ id: "admin", label: "Admin Panel", subtitle: "Manage system", icon: ShieldAlert });
  }

  const handleSelect = (id: string) => {
    if (id === "admin") {
      router.push("/admin");
    } else if (id === "community") {
      router.push("/community");
    } else if (id === "quran") {
      router.push("/quran");
    } else if (id === "duas") {
      router.push("/duas");
    } else if (id === "surahs") {
      router.push("/surahs");
    } else if (id === "prayer") {
      router.push("/prayer");
    } else if (id === "hadith") {
      router.push("/hadith");
    } else if (id === "quiz") {
      router.push("/quiz");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 selection:bg-hidayah-gold/20 bg-[var(--color-hidayah-primary)] transition-colors duration-500">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-4xl flex flex-col items-center"
      >
        <Logo className="mb-12" />

        <h1 className="text-3xl sm:text-4xl text-center font-serif font-bold mb-4 text-[var(--color-hidayah-dark)]">
          Explore Daily
        </h1>
        <p className="text-[var(--color-hidayah-dark)]/50 mb-12 text-center max-w-md">
          Select a path to begin your spiritual journey for today.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 w-full mb-16">
          {currentInterests.map((interest: any, index) => {
            const Icon = interest.icon;

            return (
               <motion.button
                key={interest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => handleSelect(interest.id)}
                className="flex flex-col items-start text-left gap-3 sm:gap-4 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] bg-[var(--color-hidayah-secondary)] border border-[var(--color-hidayah-border)]/30 shadow-sm hover:shadow-md transition-all duration-500 group relative overflow-hidden"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[var(--color-hidayah-primary)] text-hidayah-gold flex items-center justify-center transition-colors duration-300">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                </div>
                
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[var(--color-hidayah-dark)] group-hover:text-hidayah-gold transition-colors leading-tight">
                    {interest.label}
                  </h3>
                  <p className="text-[10px] sm:text-sm text-[var(--color-hidayah-dark)]/50 font-medium mt-1">
                    {interest.subtitle}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </main>
  );
}
