"use client";

import React from 'react';
import { X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (platform: 'whatsapp' | 'instagram' | 'snapchat') => void;
  isProcessing: boolean;
}

export default function ShareReflectionModal({
  isOpen,
  onClose,
  onShare,
  isProcessing
}: ShareReflectionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-[var(--color-hidayah-secondary)] rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
          >
            {/* Header */}
            <div className="p-6 flex justify-between items-center border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Share Reflection</h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options */}
            <div className="p-8 space-y-6">
              <p className="text-white/60 text-center text-sm mb-2">
                Choose where you'd like to share this reflection as a story.
              </p>

              <div className="grid grid-cols-3 gap-4">
                {/* WhatsApp Status */}
                <button
                  onClick={() => onShare('whatsapp')}
                  disabled={isProcessing}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 group-active:scale-95 transition-all">
                    <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.886 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.415-8.411z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Status</span>
                </button>

                {/* Instagram Story */}
                <button
                  onClick={() => onShare('instagram')}
                  disabled={isProcessing}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center shadow-lg shadow-pink-500/20 group-active:scale-95 transition-all">
                    <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.56.216.96.474 1.38.894.42.42.678.82.894 1.38.163.422.358 1.057.412 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.249 1.805-.412 2.227-.216.56-.474.96-.894 1.38-.42.42-.82.678-1.38.894-.422.163-1.057.358-2.227.412-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.805-.249-2.227-.412-.56-.216-.96-.474-1.38-.894-.42-.42-.678-.82-.894-1.38-.163-.422-.358-1.057-.412-2.227-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.054-1.17.249-1.805.412-2.227.216-.56.474-.96.894-1.38.42-.42.82-.678 1.38-.894.422-.163 1.057-.358 2.227-.412 1.266-.058 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126s1.337 1.079 2.126 1.384c.766.296 1.636.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384s1.079-1.338 1.384-2.126c.296-.765.499-1.636.558-2.913.058-1.28.072-1.687.072-4.947s-.014-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126s-1.338-1.079-2.126-1.384c-.765-.296-1.636-.499-2.913-.558C15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Stories</span>
                </button>

                {/* Snapchat Story */}
                <button
                  onClick={() => onShare('snapchat')}
                  disabled={isProcessing}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#FFFC00] flex items-center justify-center shadow-lg shadow-yellow-500/20 group-active:scale-95 transition-all">
                    <svg className="w-8 h-8 text-black fill-current" viewBox="0 0 24 24">
                      <path d="M12 0c-.864 0-1.728.168-2.592.504-2.592 1.008-3.024 4.032-3.024 4.032 0 .432-.432 1.296-.864 1.728s-1.296.864-1.296 1.728-.432 1.296 0 1.728.864.864.864 1.728-1.296 1.728-1.296 3.456 1.728 3.456 5.184 3.888 2.16 2.592 3.024 2.592 2.16-2.592 3.024-2.592 5.184-.432 5.184-3.888-1.296-2.592-1.296-3.456.864-1.296.864-1.728-.432-1.296 0-1.728-1.296-.864-1.296-1.728-.864-1.296-.864-1.728-.432-3.024-3.024-4.032c-.864-.336-1.728-.504-2.592-.504z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Stories</span>
                </button>
              </div>

              {isProcessing && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span className="text-xs text-white/60">Capturing your reflection...</span>
                </div>
              )}
            </div>

            {/* Footer Tip */}
            <div className="bg-white/5 p-4 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">
                Hidayah • Share the Light
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
