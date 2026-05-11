"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ShieldAlert, Trash2, CheckCircle2, 
  Loader2, AlertTriangle, ExternalLink, User, MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { hidayahFetch } from '@/lib/api';


export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await hidayahFetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);

      } else {
        // Redirect if not admin
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (reportId: string, action: 'delete' | 'dismiss' | 'warn' | 'suspend') => {
    setActionId(reportId);
    try {
      const res = await hidayahFetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });


      if (res.ok) {
        setReports(prev => prev.filter(r => r._id !== reportId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="h-[100dvh] bg-[var(--color-hidayah-primary)] overflow-hidden flex flex-col">
      <header className="sticky top-0 z-50 bg-[var(--color-hidayah-primary)]/80 backdrop-blur-md border-b border-[var(--color-hidayah-border)]/30 px-4 py-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 sm:w-6 h-6 text-[var(--color-hidayah-dark)]" />
          </button>
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 sm:w-6 h-6 text-red-500" />
            <h1 className="text-lg sm:text-xl font-serif font-bold text-[var(--color-hidayah-dark)]">Moderation</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>
 
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:pt-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-hidayah-gold)]" />
              <p className="text-xs sm:text-sm font-medium opacity-50 font-serif italic">Loading reported content...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-20 text-center bg-[var(--color-hidayah-secondary)] rounded-[2.5rem] border border-[var(--color-hidayah-border)]/10 shadow-sm px-6">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-green-500 opacity-20 mb-4" />
              <p className="text-[var(--color-hidayah-dark)] opacity-50 font-medium font-serif italic">Sanctuary is clean.</p>
              <p className="text-[10px] sm:text-xs opacity-40 mt-1">No pending reports at this time.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-[10px] font-bold text-[var(--color-hidayah-dark)]/40 uppercase tracking-[0.2em] px-2">
                Pending Reports ({reports.length})
              </h2>
              
              <div className="grid gap-6">
                {reports.map((report) => (
                  <motion.div 
                    key={report._id}
                    layout
                    className="bg-[var(--color-hidayah-secondary)] p-6 sm:p-8 rounded-[2.5rem] border border-red-500/10 shadow-sm flex flex-col gap-6"
                  >
                    {/* Report Info */}
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 uppercase tracking-wider">
                              {report.reason}
                            </span>
                            <span className="text-[8px] sm:text-[9px] opacity-30 font-bold uppercase tracking-widest bg-black/5 px-2 py-1 rounded-lg">
                              {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-[var(--color-hidayah-dark)] font-medium">
                            Reported by <span className="font-bold text-[var(--color-hidayah-gold)]">@{report.reporterId?.username}</span>
                          </p>
                          {report.details && (
                            <div className="mt-3 p-3 rounded-2xl bg-white/40 border border-white/20 italic text-[10px] sm:text-[11px] text-[var(--color-hidayah-dark)]/70 leading-relaxed">
                              "{report.details}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
  
                    {/* Post Content Preview */}
                    {report.postId ? (
                      <div className="bg-[var(--color-hidayah-primary)] p-4 sm:p-5 rounded-[1.5rem] sm:rounded-3xl border border-[var(--color-hidayah-border)]/20">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="w-3.5 h-3.5 opacity-40" />
                          <span className="text-[10px] sm:text-xs font-bold opacity-60">Posted by @{report.postId?.authorName}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-serif italic text-[var(--color-hidayah-dark)]/80 line-clamp-3">
                          {report.postId?.content}
                        </p>
                        {report.postId?.hadith && (
                          <div className="mt-3 flex items-center gap-2 text-[9px] sm:text-[10px] text-[var(--color-hidayah-gold)] font-bold uppercase">
                            <MessageSquare className="w-3 h-3" /> Includes Hadith
                          </div>
                        )}
                      </div>
                    ) : report.messageId ? (
                      <div className="bg-[var(--color-hidayah-primary)] p-4 sm:p-5 rounded-[1.5rem] sm:rounded-3xl border border-[var(--color-hidayah-border)]/20">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="w-3.5 h-3.5 opacity-40" />
                          <span className="text-[10px] sm:text-xs font-bold opacity-60">Chat message from @{report.messageId?.senderName}</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-black/5 border border-black/5 text-xs sm:text-sm font-medium text-[var(--color-hidayah-dark)]">
                          {report.messageId?.text || (report.messageId?.fileUrl ? "📷 Media Attachment" : "No text content")}
                        </div>
                        <p className="mt-2 text-[9px] opacity-40 italic">Reported from Circle Chat</p>
                      </div>
                    ) : (
                      <div className="bg-amber-50/50 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-3xl border border-amber-200/30 flex items-center gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center font-bold text-[var(--color-hidayah-dark)] shadow-sm shrink-0">
                          {report.reportedUserId?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-widest text-amber-600 mb-0.5">Reported Member</div>
                          <div className="text-xs sm:text-sm font-bold text-[var(--color-hidayah-dark)]">@{report.reportedUserId?.username}</div>
                          <div className="text-[10px] text-[var(--color-hidayah-dark)]/50">{report.reportedUserId?.email}</div>
                        </div>
                      </div>
                    )}
  
                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        {report.postId || report.messageId ? (
                          <button 
                            onClick={() => handleAction(report._id, 'delete')}
                            disabled={actionId === report._id}
                            className="bg-red-500 text-white py-3 sm:py-4 rounded-2xl text-[9px] sm:text-[10px] font-black flex items-center justify-center gap-2 hover:bg-red-600 transition-all disabled:opacity-50 uppercase tracking-widest"
                          >
                            {actionId === report._id ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />}
                            Delete
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleAction(report._id, 'suspend')}
                            disabled={actionId === report._id}
                            className="bg-red-600 text-white py-3 sm:py-4 rounded-2xl text-[9px] sm:text-[10px] font-black flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-50 uppercase tracking-widest"
                          >
                            {actionId === report._id ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <ShieldAlert className="w-3 h-3 sm:w-4 sm:h-4" />}
                            Suspend
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleAction(report._id, 'warn')}
                          disabled={actionId === report._id}
                          className="bg-amber-500 text-white py-3 sm:py-4 rounded-2xl text-[9px] sm:text-[10px] font-black flex items-center justify-center gap-2 hover:bg-amber-600 transition-all disabled:opacity-50 uppercase tracking-widest"
                        >
                          {actionId === report._id ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />}
                          Warn
                        </button>
                      </div>
  
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => handleAction(report._id, 'dismiss')}
                          disabled={actionId === report._id}
                          className="bg-[var(--color-hidayah-dark)] text-white py-3 sm:py-4 rounded-2xl text-[9px] sm:text-[10px] font-black flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 uppercase tracking-widest"
                        >
                          {actionId === report._id ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />}
                          Dismiss
                        </button>
                        
                        {!report.reportedUserId && (report.postId || report.messageId) && (
                          <button 
                            onClick={() => handleAction(report._id, 'suspend')}
                            disabled={actionId === report._id}
                            className="border-2 border-red-500/30 text-red-500 py-3 sm:py-4 rounded-2xl text-[9px] sm:text-[10px] font-black flex items-center justify-center gap-2 hover:bg-red-50 transition-all disabled:opacity-50 uppercase tracking-widest"
                          >
                            Ban Author
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          <div className="h-20" />
        </div>
      </main>
    </div>
  );
}
