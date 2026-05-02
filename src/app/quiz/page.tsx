"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, CheckCircle2, BookOpen, GraduationCap, Users, History, Sparkles, RotateCcw } from 'lucide-react';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { BADGES, REFLECTION_THEMES } from '@/constants/rewards';
import { NatureBackground } from '@/components/NatureBackground';
import { Trophy, Image as ImageIcon, Eye } from 'lucide-react';
import { ThemePreviewModal } from '@/components/ThemePreviewModal';
import { hidayahFetch } from '@/lib/api';


const LEVELS = [
  {
    id: 1,
    title: 'Foundations of Islam',
    description: 'Learn about the Five Pillars, Salah basics, and fundamental Islamic beliefs.',
    icon: GraduationCap,
    topics: ['Pillars', 'Salah', 'Quran Basics']
  },
  {
    id: 2,
    title: 'Quran Knowledge',
    description: 'Discover facts about Surahs, Ayahs, Juz, and the history of revelation.',
    icon: BookOpen,
    topics: ['Surahs', 'History', 'Structure']
  },
  {
    id: 3,
    title: 'Prophets of Allah',
    description: 'Explore the lives and teachings of the noble Prophets from Adam (AS) to Muhammad (SAW).',
    icon: Sparkles,
    topics: ['Adam (AS)', 'Nuh (AS)', 'Musa (AS)', 'Isa (AS)']
  },
  {
    id: 4,
    title: 'Sahabah & Early Islam',
    description: 'Learn about the companions of the Prophet (SAW) and the birth of the Ummah.',
    icon: Users,
    topics: ['Khulafa-e-Rashidun', 'Mubashirun', 'Battles']
  },
  {
    id: 5,
    title: 'Advanced Islamic History',
    description: 'A deeper look into Islamic history, Caliphates, and advanced theology.',
    icon: History,
    topics: ['Caliphates', 'Events', 'Hadith Basics']
  }
];

export default function QuizSelectionPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewTheme, setPreviewTheme] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    hidayahFetch(`/api/quiz/progress?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setProgress(data);
        setIsLoading(false);
      })

      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleStartLevel = (levelId: number) => {
    if (progress?.unlockedLevels >= levelId) {
      router.push(`/quiz/${levelId}`);
    }
  };

  const isLevelUnlocked = (levelId: number) => {
    return progress?.unlockedLevels >= levelId;
  };

  const isLevelCompleted = (levelId: number) => {
    return progress?.completedLevels?.includes(levelId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hidayah-primary flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Logo className="mb-4 opacity-50" />
          <p className="text-hidayah-dark/40 font-serif italic">Preparing your learning journey...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-hidayah-primary pb-24">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-12 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Logo className="mb-6 mx-auto" />
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-hidayah-dark mb-4">Islamic Knowledge Journey</h1>
          <p className="text-hidayah-dark/50 max-w-md mx-auto">
            Deepen your understanding of Deen through our peaceful educational quiz levels.
          </p>
        </motion.div>

        {/* Levels Grid */}
        <div className="w-full space-y-6 mt-8">
          {LEVELS.map((level, index) => {
            const unlocked = isLevelUnlocked(level.id);
            const completed = isLevelCompleted(level.id);
            const Icon = level.icon;

            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleStartLevel(level.id)}
                className={`w-full text-left p-6 sm:p-8 rounded-[32px] border transition-all duration-500 flex flex-col sm:flex-row items-center gap-6 group relative overflow-hidden ${
                  unlocked 
                    ? 'bg-[var(--color-hidayah-secondary)] border-hidayah-border/30 shadow-sm hover:shadow-md cursor-pointer' 
                    : 'bg-[var(--color-hidayah-secondary)]/50 border-transparent opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                   <svg viewBox="0 0 100 100" className="w-full h-full fill-hidayah-dark">
                      <path d="M50 0L61.2 38.8H100L68.8 61.2L80 100L50 77.6L20 100L31.2 61.2L0 38.8H38.8L50 0Z" />
                   </svg>
                </div>

                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                  completed ? 'bg-green-50 text-green-600' : unlocked ? 'bg-hidayah-primary text-hidayah-gold group-hover:bg-hidayah-gold group-hover:text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {completed ? <CheckCircle2 className="w-8 h-8" /> : <Icon className="w-8 h-8" />}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-hidayah-gold">Level {level.id}</span>
                    <h3 className="text-xl font-bold text-hidayah-dark">{level.title}</h3>
                  </div>
                  <p className="text-sm text-hidayah-dark/60 leading-relaxed mb-4">{level.description}</p>
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    {level.topics.map(topic => (
                      <span key={topic} className="px-3 py-1 rounded-full bg-hidayah-secondary text-[10px] font-bold text-hidayah-dark/40 uppercase tracking-tight">
                        {topic}
                      </span>
                    ))}
                  </div>

                  {/* Rewards Preview */}
                  <div className="mt-4 flex flex-wrap gap-4">
                    {BADGES.find(b => b.levelRequired === level.id) && (
                      <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${completed ? 'text-green-600' : 'text-hidayah-gold'}`}>
                        <Trophy className="w-3 h-3" />
                        {BADGES.find(b => b.levelRequired === level.id)?.name}
                      </div>
                    )}
                    {REFLECTION_THEMES.find(t => t.levelRequired === level.id) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTheme(REFLECTION_THEMES.find(t => t.levelRequired === level.id));
                          setIsPreviewOpen(true);
                        }}
                        className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors hover:text-hidayah-gold ${completed ? 'text-green-600' : 'text-hidayah-dark/30'}`}
                      >
                        <Eye className="w-3 h-3" />
                        Preview {REFLECTION_THEMES.find(t => t.levelRequired === level.id)?.name} Theme
                      </button>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center gap-2">
                  {!unlocked && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-400 text-xs font-bold uppercase tracking-widest">
                      <Lock className="w-3 h-3" />
                      Locked
                    </div>
                  )}
                  {unlocked && !completed && (
                    <div className="px-6 py-3 rounded-full bg-hidayah-dark text-[var(--color-hidayah-primary)] text-xs font-bold uppercase tracking-widest group-hover:bg-hidayah-gold transition-colors">
                      Start Journey
                    </div>
                  )}
                  {completed && (
                    <div className="px-6 py-3 rounded-full border border-green-200 text-green-600 text-xs font-bold uppercase tracking-widest">
                      Completed
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Master Level */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => {
              if (progress?.completedLevels?.length >= 5) {
                router.push('/quiz/mixed');
              }
            }}
            className={`w-full p-8 rounded-[40px] transition-all duration-500 flex flex-col items-center gap-6 group overflow-hidden relative ${
              progress?.completedLevels?.length >= 5
                ? 'bg-gradient-to-br from-hidayah-dark to-black text-white shadow-xl hover:shadow-2xl cursor-pointer'
                : 'bg-[var(--color-hidayah-secondary)]/50 border border-transparent opacity-60 cursor-not-allowed'
            }`}
          >
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
               progress?.completedLevels?.length >= 5 ? 'bg-hidayah-gold animate-pulse' : 'bg-gray-100 text-gray-400'
             }`}>
               <Sparkles className={`w-8 h-8 ${progress?.completedLevels?.length >= 5 ? 'text-white' : 'text-gray-400'}`} />
             </div>
             <div className="text-center relative z-10">
               <h3 className={`text-2xl font-bold font-serif mb-2 ${progress?.completedLevels?.length >= 5 ? 'text-white' : 'text-hidayah-dark'}`}>Master Level</h3>
                <p className={`${progress?.completedLevels?.length >= 5 ? 'text-white/60' : 'text-hidayah-dark/40'} text-sm max-w-sm mb-4`}>
                  {progress?.completedLevels?.length >= 5 
                    ? 'A comprehensive challenge with 30 random questions from all levels.' 
                    : 'After completing all levels, this level will be unlocked that combines all level questions.'}
                </p>
                
                {/* Master Level Rewards Preview */}
                <div className="flex justify-center gap-4 mt-2">
                   {REFLECTION_THEMES.filter(t => t.levelRequired === 6).map(theme => (
                     <button
                       key={theme.id}
                       type="button"
                       onClick={(e) => {
                         e.stopPropagation();
                         setPreviewTheme(theme);
                         setIsPreviewOpen(true);
                       }}
                       className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-hidayah-gold hover:text-white transition-colors relative z-20"
                     >
                       <ImageIcon className="w-3 h-3" />
                       Preview {theme.name}
                     </button>
                   ))}
                </div>
              </div>
             
             {progress?.completedLevels?.length < 5 ? (
               <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-400 text-xs font-bold uppercase tracking-widest">
                 <Lock className="w-3 h-3" />
                 Locked
               </div>
             ) : (
               <div className="px-8 py-3 rounded-full bg-[var(--color-hidayah-primary)] text-hidayah-dark text-sm font-bold uppercase tracking-[0.2em] group-hover:scale-105 transition-transform">
                 Begin Master Journey
               </div>
             )}
          </motion.div>
        </div>

        {/* Back Navigation & Reset */}
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/onboarding"
            className="flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--color-hidayah-secondary)] border border-hidayah-border/30 text-hidayah-dark hover:text-hidayah-gold transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-[0.2em]">Back to Explore</span>
          </Link>

          <button
            onClick={async () => {
              if (confirm('Are you sure you want to reset your quiz journey? This will relock all levels.')) {
                await hidayahFetch('/api/quiz/progress', { method: 'DELETE' });
                window.location.reload();
              }
            }}

            className="flex items-center gap-2 px-8 py-4 rounded-full border border-red-200 text-red-400 hover:bg-red-50 transition-all duration-300"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-[0.2em]">Reset Journey</span>
          </button>
        </div>
      </div>
      <ThemePreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        theme={previewTheme} 
      />
    </main>
  );
}


