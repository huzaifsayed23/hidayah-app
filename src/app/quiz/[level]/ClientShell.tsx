"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, Info, Trophy, RotateCcw, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import QuizRewardOverlay from '@/components/quiz/QuizRewardOverlay';
import { hidayahFetch } from '@/lib/api';


interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  category: string;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const level = params.level as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unlockedReward, setUnlockedReward] = useState<any>(null);
  const [showRewardOverlay, setShowRewardOverlay] = useState(false);

  useEffect(() => {
    hidayahFetch(`/api/quiz/questions/${level}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setQuestions(data);
        }
        setIsLoading(false);
      })

      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [level]);

  const handleOptionSelect = (option: string) => {
    if (showFeedback) return;
    setSelectedOption(option);
    setShowFeedback(true);

    if (option === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    setIsSubmitting(true);
    try {
      const levelNum = level === 'mixed' ? 6 : parseInt(level);
      const response = await hidayahFetch('/api/quiz/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: levelNum,
          score: score,
          questionsCount: questions.length
        })
      });

      const data = await response.json();
      
      if (data.unlockedReward) {
        setUnlockedReward(data.unlockedReward);
        setShowRewardOverlay(true);
      }

      router.refresh();
      setIsCompleted(true);
    } catch (error) {
      console.error(error);
      setIsCompleted(true); // Still show results screen even if saving fails
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hidayah-primary flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 bg-hidayah-gold/20 rounded-full mx-auto mb-4 border-2 border-hidayah-gold border-t-transparent animate-spin"></div>
          <p className="text-hidayah-dark/40 font-serif italic">Gathering wisdom...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-hidayah-primary flex items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-2xl font-serif font-bold text-hidayah-dark mb-4">Questions coming soon</h2>
          <Link href="/quiz" className="text-hidayah-gold font-bold uppercase tracking-widest text-sm">Back to Selection</Link>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    const isPassing = score / questions.length >= 0.8;
    return (
      <main className="min-h-screen bg-hidayah-primary flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[var(--color-hidayah-secondary)] rounded-[40px] p-8 sm:p-12 text-center shadow-xl border border-hidayah-border/30 relative overflow-hidden"
        >
          {/* Achievement particles/background effect */}
          <div className="absolute top-0 left-0 w-full h-2 bg-hidayah-gold"></div>
          
          <div className="w-24 h-24 bg-hidayah-primary rounded-full flex items-center justify-center mx-auto mb-8">
            <Trophy className={`w-12 h-12 ${isPassing ? 'text-hidayah-gold' : 'text-hidayah-dark/30'}`} />
          </div>

          <h2 className="text-3xl font-serif font-bold text-hidayah-dark mb-2">
            {isPassing ? 'Mubarak!' : 'Keep Learning'}
          </h2>
          <p className="text-hidayah-dark/50 mb-8">
            {isPassing 
              ? "Mubarak! You've successfully passed this level and unlocked your rewards." 
              : "Knowledge takes time and patience. You need at least 80% (12/15 correct) to unlock rewards and the next level."}
          </p>

          <div className="bg-hidayah-secondary rounded-[32px] p-8 mb-8">
            <div className="text-sm font-bold text-hidayah-dark/40 uppercase tracking-widest mb-1">Your Score</div>
            <div className="text-5xl font-serif font-bold text-hidayah-dark">{score}<span className="text-2xl text-hidayah-dark/30"> / {questions.length}</span></div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 rounded-full bg-hidayah-dark text-[var(--color-hidayah-primary)] font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Try Another Set
            </button>
            <Link
              href="/quiz"
              className="w-full py-4 rounded-full bg-[var(--color-hidayah-primary)] border border-hidayah-border/30 text-[var(--color-hidayah-dark)] font-bold uppercase tracking-widest text-sm hover:opacity-80 transition-opacity"
            >
              Continue Journey
            </Link>
          </div>
        </motion.div>

        <QuizRewardOverlay 
          isOpen={showRewardOverlay} 
          onClose={() => setShowRewardOverlay(false)} 
                    badgeName={unlockedReward?.data?.name}
          badgeIcon={unlockedReward?.data?.icon}
          levelName={level === 'mixed' ? 'Mushkil' : `Level ${level}`} 
          level={level}
        />
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <main className="min-h-screen bg-hidayah-primary p-6 pt-12 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/quiz" className="p-3 rounded-full hover:bg-[var(--color-hidayah-secondary)] transition-colors text-[var(--color-hidayah-dark)]/60 hover:text-[var(--color-hidayah-dark)]">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hidayah-gold mb-1">
              Level {level === 'mixed' ? 'Mixed' : level}
            </span>
            <div className="text-xs font-bold text-hidayah-dark/40">
              Question <span className="text-hidayah-dark">{currentIndex + 1}</span> / {questions.length}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[var(--color-hidayah-secondary)] rounded-full mb-12 overflow-hidden border border-hidayah-border/10">
          <motion.div 
            className="h-full bg-hidayah-gold"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Question Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-8"
          >
            <div className="space-y-4">
              <span className="px-4 py-1.5 rounded-full bg-hidayah-gold/10 text-hidayah-gold text-[10px] font-bold uppercase tracking-widest">
                {currentQuestion.category}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-hidayah-dark leading-snug">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {currentQuestion.options.map((option, i) => {
                const isSelected = selectedOption === option;
                const isCorrect = showFeedback && option === currentQuestion.correctAnswer;
                const isWrong = showFeedback && isSelected && option !== currentQuestion.correctAnswer;
                
                return (
                  <button
                    key={i}
                    onClick={() => handleOptionSelect(option)}
                    disabled={showFeedback}
                    className={`w-full p-4 sm:p-6 rounded-[24px] text-left transition-all duration-300 flex flex-col justify-between border relative overflow-hidden group ${
                      isCorrect 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : isWrong 
                          ? 'bg-red-50 border-red-200 text-red-700' 
                          : isSelected 
                            ? 'bg-[var(--color-hidayah-primary)] border-hidayah-gold shadow-md' 
                            : 'bg-[var(--color-hidayah-secondary)]/50 border-hidayah-border/30 hover:border-hidayah-gold/50'
                    }`}
                  >
                    <div className="flex-1 mb-4">
                      <span className="font-medium text-sm sm:text-lg relative z-10 leading-tight">{option}</span>
                    </div>
                    
                    <div className="relative z-10 self-end">
                      {isCorrect && <Check className="w-5 h-5 text-green-600" />}
                      {isWrong && <X className="w-5 h-5 text-red-600" />}
                      {!showFeedback && (
                        <div className={`w-5 h-5 rounded-full border transition-colors ${isSelected ? 'border-hidayah-gold bg-hidayah-gold' : 'border-hidayah-border/50 group-hover:border-hidayah-gold'}`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white mx-auto mt-0.5" />}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Feedback Section */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10"
            >
              <div className="bg-hidayah-secondary/50 rounded-[32px] p-8 border border-hidayah-border/20">
                <div className="flex items-center gap-3 mb-4 text-hidayah-gold">
                  <Info className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Educational Insight</span>
                </div>
                <p className="text-hidayah-dark/70 text-sm leading-relaxed mb-8">
                  {currentQuestion.explanation}
                </p>
                <button
                  onClick={handleNext}
                  className="w-full py-4 rounded-full bg-hidayah-dark text-[var(--color-hidayah-primary)] font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group"
                >
                  {currentIndex < questions.length - 1 ? 'Continue Journey' : 'Complete Quest'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <QuizRewardOverlay 
        isOpen={showRewardOverlay} 
        onClose={() => setShowRewardOverlay(false)} 
                  badgeName={unlockedReward?.data?.name}
          badgeIcon={unlockedReward?.data?.icon}
          levelName={level === 'mixed' ? 'Mushkil' : `Level ${level}`} 
        level={level}
      />
    </main>
  );
}

