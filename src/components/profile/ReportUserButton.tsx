"use client";

import React, { useState } from 'react';
import { Flag, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportModal from '../community/ReportModal';

interface ReportUserButtonProps {
  reportedUserId: string;
  username: string;
}

export default function ReportUserButton({ reportedUserId, username }: ReportUserButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleSuccess = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 4000);
  };

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="mt-6 flex items-center gap-2 px-6 py-2 rounded-full border border-red-500/20 text-red-500/60 hover:text-red-500 hover:bg-red-50 hover:border-red-500/40 transition-all text-[10px] font-bold uppercase tracking-widest mx-auto"
      >
        <Flag className="w-3 h-3" />
        Report @{username}
      </button>

      <ReportModal 
        reportedUserId={reportedUserId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />

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
    </>
  );
}
