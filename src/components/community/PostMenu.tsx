"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Trash2, Flag, CheckCircle2, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportModal from './ReportModal';

interface PostMenuProps {
  postId: string;
  onDelete?: () => Promise<void>;
  onUnsave?: () => void;
  isDeleting?: boolean;
  isSaved?: boolean;
  hasGradient?: boolean;
  showDelete?: boolean;
}

export default function PostMenu({ 
  postId, 
  onDelete, 
  onUnsave,
  isDeleting = false, 
  isSaved = false,
  hasGradient, 
  showDelete = false 
}: PostMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (onDelete) {
      setIsOpen(false);
      await onDelete();
    }
  };

  const handleReportSuccess = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 4000);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-full transition-all ${
          hasGradient 
            ? 'hover:bg-white/10 text-white/70 hover:text-white' 
            : 'hover:bg-black/5 text-[var(--color-hidayah-dark)]/50 hover:text-[var(--color-hidayah-dark)]'
        }`}
        aria-label="More post options"
      >
        <MoreHorizontal className="w-4 h-4 md:w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white rounded-2xl shadow-xl border border-[var(--color-hidayah-border)]/30 py-1.5 z-50 animate-in fade-in zoom-in duration-150">
          {showDelete && onDelete && (
            <button 
              className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] text-red-500 hover:bg-red-50 transition-colors text-left font-bold uppercase tracking-wider"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting...' : 'Delete Reflection'}
            </button>
          )}

          {isSaved && onUnsave && (
            <button 
              className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] text-red-500 hover:bg-red-50 transition-colors text-left font-bold uppercase tracking-wider"
              onClick={() => { setIsOpen(false); onUnsave(); }}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Unsave from Profile
            </button>
          )}
          
          <button 
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[var(--color-hidayah-dark)] hover:bg-[var(--color-hidayah-secondary)] transition-colors text-left font-semibold"
            onClick={() => { setIsOpen(false); setIsReportModalOpen(true); }}
          >
            <Flag className="w-3.5 h-3.5 opacity-40" />
            Report Content
          </button>
        </div>
      )}

      <ReportModal 
        postId={postId}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={handleReportSuccess}
      />

      {/* Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110]">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="px-6 py-3 bg-[var(--color-hidayah-dark)] text-white rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-medium border border-white/10"
            >
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              {toastMessage}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
