"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Sparkles, BookOpen, GraduationCap, Users } from 'lucide-react';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTION_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-20px" },
  transition: { duration: 0.8, ease: "easeOut" }
} as const;

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 md:p-8"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] rounded-none sm:rounded-[40px] shadow-2xl border border-[var(--color-hidayah-border)]/30 custom-scrollbar"
            style={{ 
              backgroundColor: 'var(--color-hidayah-primary)',
              color: 'var(--color-hidayah-dark)'
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-20 group"
              aria-label="Close"
            >
              <X className="w-6 h-6 opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="flex flex-col items-center px-6 sm:px-12 md:px-24 py-20 text-center text-[var(--color-hidayah-dark)]">
              
              {/* Header Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="mb-24 flex flex-col items-center"
              >
                <div className="flex items-center gap-2 text-[#C9A86A] font-bold uppercase tracking-[0.4em] text-[10px] mb-6">
                  <Sparkles className="w-3 h-3" />
                  Welcome to the sanctuary
                </div>
                
                <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 tracking-tight">
                  HIDAYAH: Your Digital Sanctuary
                </h1>
                
                {/* Expanding Gold Divider */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100px" }}
                  transition={{ delay: 0.5, duration: 1.5, ease: "easeInOut" }}
                  className="h-px bg-[#C9A86A]"
                />
              </motion.div>

              {/* Purpose Section */}
              <motion.section {...SECTION_ANIMATION} className="mb-24 max-w-2xl">
                <div className="flex justify-center mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#C9A86A]/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-[#C9A86A]" />
                  </div>
                </div>
                <h2 className="text-2xl font-serif font-bold mb-6 italic opacity-80">The Purpose</h2>
                <p className="text-lg md:text-xl font-sans leading-relaxed opacity-70">
                  HIDAYAH is built for the focused seeker. It provides a quiet, 
                  distraction-free environment to engage with the Quran, 
                  understand the Surahs deeply, and reflect on the Hadith daily.
                </p>
              </motion.section>

              {/* Learning Path Section */}
              <motion.section 
                {...SECTION_ANIMATION} 
                transition={{ ...SECTION_ANIMATION.transition, delay: 0.2 }}
                className="mb-24 max-w-2xl"
              >
                <div className="flex justify-center mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#C9A86A]/10 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-[#C9A86A]" />
                  </div>
                </div>
                <h2 className="text-2xl font-serif font-bold mb-6 italic opacity-80">The Learning Path</h2>
                <p className="text-lg md:text-xl font-sans leading-relaxed opacity-70">
                  Knowledge is tested through a structured 5-level journey, 
                  culminating in a comprehensive Master Level challenge. 
                  No noise, no distractions—just you and the pursuit of wisdom.
                </p>
              </motion.section>

              {/* Objective Section */}
              <motion.section 
                {...SECTION_ANIMATION}
                transition={{ ...SECTION_ANIMATION.transition, delay: 0.4 }}
                className="mb-24 max-w-2xl"
              >
                <div className="flex justify-center mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#C9A86A]/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-[#C9A86A]" />
                  </div>
                </div>
                <h2 className="text-2xl font-serif font-bold mb-6 italic opacity-80">The Objective</h2>
                <p className="text-lg md:text-xl font-sans leading-relaxed opacity-70">
                  Our goal is simplicity. We believe that digital tools should serve the text, 
                  not overshadow it. HIDAYAH offers a clean space to read, learn, 
                  and verify your understanding of the foundational sciences.
                </p>
              </motion.section>

              {/* Community Section */}
              <motion.section 
                {...SECTION_ANIMATION}
                transition={{ ...SECTION_ANIMATION.transition, delay: 0.6 }}
                className="mb-24 max-w-2xl"
              >
                <div className="flex justify-center mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#C9A86A]/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#C9A86A]" />
                  </div>
                </div>
                <h2 className="text-2xl font-serif font-bold mb-6 italic opacity-80">The Community</h2>
                <p className="text-lg md:text-xl font-sans leading-relaxed opacity-70">
                  HIDAYAH is more than a solo journey. Connect with friends in Circles, 
                  share reflections, and learn about the Deen from each other 
                  in a safe, peaceful environment built for mutual growth.
                </p>
              </motion.section>

              {/* Footer Quote */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mt-12 pt-12 border-t border-[#D1BFA6]/20 w-full max-w-md"
              >
                <p className="font-serif italic opacity-40 text-sm">
                  "Guide us to the straight path." (1:6)
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
