"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { X, Heart, Sparkles, BookOpen, GraduationCap, Users, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';

const SECTION_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-20px" },
  transition: { duration: 0.8, ease: "easeOut" }
} as const;

export default function AboutPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] pb-24">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-hidayah-gold/5 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-hidayah-gold/5 rounded-full blur-[120px] -ml-64 -mb-64" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-12">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-20">
          <button
            onClick={() => router.back()}
            className="p-3 rounded-full bg-hidayah-secondary hover:bg-hidayah-border/20 transition-all shadow-sm group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <Logo />
          <div className="w-11" />
        </div>

        <div className="flex flex-col items-center text-center">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mb-24 flex flex-col items-center"
          >
            <div className="flex items-center gap-2 text-hidayah-gold font-bold uppercase tracking-[0.4em] text-[10px] mb-6">
              <Sparkles className="w-3 h-3" />
              The Digital Sanctuary
            </div>
            
            <h1 className="text-4xl md:text-7xl font-serif font-bold mb-8 tracking-tight">
              HIDAYAH
            </h1>
            
            <p className="text-xl md:text-2xl font-serif italic opacity-60 max-w-2xl">
              "A space for the focused seeker, built upon the principles of peace, knowledge, and reflection."
            </p>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "120px" }}
              transition={{ delay: 0.5, duration: 1.5, ease: "easeInOut" }}
              className="h-px bg-hidayah-gold mt-12"
            />
          </motion.div>

          {/* Grid Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left mb-24">
            {/* Purpose Section */}
            <motion.section {...SECTION_ANIMATION} className="bg-hidayah-secondary/30 p-8 rounded-[32px] border border-hidayah-border/20">
              <div className="w-12 h-12 rounded-2xl bg-hidayah-gold/10 flex items-center justify-center mb-6">
                <Heart className="w-6 h-6 text-hidayah-gold" />
              </div>
              <h2 className="text-2xl font-serif font-bold mb-4 italic">The Purpose</h2>
              <p className="text-base font-sans leading-relaxed opacity-70">
                HIDAYAH is built for the focused seeker. It provides a quiet, 
                distraction-free environment to engage with the Quran, 
                understand the Surahs deeply, and reflect on the Hadith daily.
              </p>
            </motion.section>

            {/* Learning Path Section */}
            <motion.section 
              {...SECTION_ANIMATION} 
              transition={{ ...SECTION_ANIMATION.transition, delay: 0.2 }}
              className="bg-hidayah-secondary/30 p-8 rounded-[32px] border border-hidayah-border/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-hidayah-gold/10 flex items-center justify-center mb-6">
                <GraduationCap className="w-6 h-6 text-hidayah-gold" />
              </div>
              <h2 className="text-2xl font-serif font-bold mb-4 italic">The Learning Path</h2>
              <p className="text-base font-sans leading-relaxed opacity-70">
                Knowledge is tested through a structured 5-level journey, 
                culminating in a comprehensive Master Level challenge. 
                No noise, no distractions—just you and the pursuit of wisdom.
              </p>
            </motion.section>

            {/* Objective Section */}
            <motion.section 
              {...SECTION_ANIMATION}
              transition={{ ...SECTION_ANIMATION.transition, delay: 0.4 }}
              className="bg-hidayah-secondary/30 p-8 rounded-[32px] border border-hidayah-border/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-hidayah-gold/10 flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6 text-hidayah-gold" />
              </div>
              <h2 className="text-2xl font-serif font-bold mb-4 italic">The Objective</h2>
              <p className="text-base font-sans leading-relaxed opacity-70">
                Our goal is simplicity. We believe that digital tools should serve the text, 
                not overshadow it. HIDAYAH offers a clean space to read, learn, 
                and verify your understanding of the foundational sciences.
              </p>
            </motion.section>

            {/* Community Section */}
            <motion.section 
              {...SECTION_ANIMATION}
              transition={{ ...SECTION_ANIMATION.transition, delay: 0.6 }}
              className="bg-hidayah-secondary/30 p-8 rounded-[32px] border border-hidayah-border/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-hidayah-gold/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-hidayah-gold" />
              </div>
              <h2 className="text-2xl font-serif font-bold mb-4 italic">The Community</h2>
              <p className="text-base font-sans leading-relaxed opacity-70">
                HIDAYAH is more than a solo journey. Connect with friends in Circles, 
                share reflections, and learn about the Deen from each other 
                in a safe, peaceful environment built for mutual growth.
              </p>
            </motion.section>
          </div>

          {/* Footer Quote */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 pt-12 border-t border-hidayah-border/20 w-full max-w-md"
          >
            <p className="font-serif italic opacity-40 text-lg">
              "Guide us to the straight path." (1:6)
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
