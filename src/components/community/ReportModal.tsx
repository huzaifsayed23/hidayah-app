"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface ReportModalProps {
  postId?: string;
  messageId?: string;
  reportedUserId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const REASONS = [
  'Harassment',
  'Misinformation',
  'Disrespectful',
  'Inappropriate Content',
  'Spam',
  'Other'
];

export default function ReportModal({ postId, messageId, reportedUserId, isOpen, onClose, onSuccess }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason) {
      setError("Please select a reason");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, messageId, reportedUserId, reason, details })
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess(data.message || "Thank you for helping keep our sanctuary safe.");
        onClose();
      } else {
        setError(data.message || "Failed to submit report");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#FAF9F6] rounded-[2.5rem] shadow-2xl overflow-hidden border border-[var(--color-hidayah-border)]/30"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[var(--color-hidayah-dark)]">Report Reflection</h2>
                    <p className="text-xs text-[var(--color-hidayah-dark)]/40 font-medium">Protecting the community</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X className="w-5 h-5 text-[var(--color-hidayah-dark)]/40" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[var(--color-hidayah-dark)]/40 uppercase tracking-widest px-1">Reason for report</label>
                  <div className="grid grid-cols-2 gap-2">
                    {REASONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setReason(r)}
                        className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${reason === r ? 'bg-[var(--color-hidayah-dark)] text-white border-transparent shadow-md' : 'bg-white text-[var(--color-hidayah-dark)]/60 border-[var(--color-hidayah-border)]/30 hover:border-[var(--color-hidayah-gold)]/50'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[var(--color-hidayah-dark)]/40 uppercase tracking-widest px-1">Additional details (Optional)</label>
                  <textarea 
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Provide context if necessary..."
                    rows={3}
                    className="w-full px-5 py-4 rounded-2xl bg-white border border-[var(--color-hidayah-border)]/30 focus:border-[var(--color-hidayah-gold)] outline-none text-sm transition-all resize-none leading-relaxed text-[var(--color-hidayah-dark)]"
                  />
                </div>

                {error && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>
                )}

                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !reason}
                  className="w-full py-4 rounded-2xl bg-[var(--color-hidayah-dark)] text-white font-bold text-sm shadow-lg shadow-black/10 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Submit Report
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
