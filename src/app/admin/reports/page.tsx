"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ShieldAlert, Trash2, CheckCircle2, 
  Loader2, AlertTriangle, ExternalLink, User, MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
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
      const res = await fetch(`/api/reports/${reportId}`, {
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
    <div className="min-h-screen bg-[var(--color-hidayah-primary)] pb-12">
      <header className="sticky top-0 z-50 bg-[var(--color-hidayah-primary)]/80 backdrop-blur-md border-b border-[var(--color-hidayah-border)]/30 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-[var(--color-hidayah-dark)]" />
          </button>
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <h1 className="text-xl font-serif font-bold text-[var(--color-hidayah-dark)]">Moderation Dashboard</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-hidayah-gold)]" />
            <p className="text-sm font-medium opacity-50 font-serif italic">Loading reported content...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center bg-[var(--color-hidayah-secondary)] rounded-[2.5rem] border border-[var(--color-hidayah-border)]/10 shadow-sm">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 opacity-20 mb-4" />
            <p className="text-[var(--color-hidayah-dark)] opacity-50 font-medium font-serif italic">Sanctuary is clean.</p>
            <p className="text-xs opacity-40 mt-1 px-8">No pending reports at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-[10px] font-bold text-[var(--color-hidayah-dark)]/40 uppercase tracking-[0.2em] px-2">
              Pending Reports ({reports.length})
            </h2>
            
            <div className="grid gap-4">
              {reports.map((report) => (
                <motion.div 
                  key={report._id}
                  layout
                  className="bg-[var(--color-hidayah-secondary)] p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-red-500/10 shadow-sm flex flex-col gap-6"
                >
                  {/* Report Info */}
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 uppercase tracking-wider">
                            {report.reason}
                          </span>
                          <span className="text-[9px] opacity-30 font-bold uppercase tracking-widest bg-black/5 px-2 py-1 rounded-lg">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--color-hidayah-dark)] font-medium">
                          Reported by <span className="font-bold text-[var(--color-hidayah-gold)]">@{report.reporterId?.username}</span>
                        </p>
                        {report.details && (
                          <div className="mt-3 p-3 rounded-2xl bg-white/40 border border-white/20 italic text-[11px] text-[var(--color-hidayah-dark)]/70 leading-relaxed">
                            "{report.details}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post Content Preview */}
                  {report.postId ? (
                    <div className="bg-[var(--color-hidayah-primary)] p-5 rounded-3xl border border-[var(--color-hidayah-border)]/20">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-3.5 h-3.5 opacity-40" />
                        <span className="text-xs font-bold opacity-60">Posted by @{report.postId?.authorName}</span>
                      </div>
                      <p className="text-sm font-serif italic text-[var(--color-hidayah-dark)]/80 line-clamp-3">
                        {report.postId?.content}
                      </p>
                      {report.postId?.hadith && (
                        <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--color-hidayah-gold)] font-bold uppercase">
                          <MessageSquare className="w-3 h-3" /> Includes Hadith
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-200/30 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-bold text-[var(--color-hidayah-dark)] shadow-sm">
                        {report.reportedUserId?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-0.5">Reported Member</div>
                        <div className="text-sm font-bold text-[var(--color-hidayah-dark)]">@{report.reportedUserId?.username}</div>
                        <div className="text-xs text-[var(--color-hidayah-dark)]/50">{report.reportedUserId?.email}</div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      {report.postId ? (
                        <button 
                          onClick={() => handleAction(report._id, 'delete')}
                          disabled={actionId === report._id}
                          className="bg-red-500 text-white py-4 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-red-600 transition-all disabled:opacity-50 uppercase tracking-widest"
                        >
                          {actionId === report._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Delete
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleAction(report._id, 'suspend')}
                          disabled={actionId === report._id}
                          className="bg-red-600 text-white py-4 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-50 uppercase tracking-widest"
                        >
                          {actionId === report._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                          Suspend
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleAction(report._id, 'warn')}
                        disabled={actionId === report._id}
                        className="bg-amber-500 text-white py-4 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-amber-600 transition-all disabled:opacity-50 uppercase tracking-widest"
                      >
                        {actionId === report._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                        Warn
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleAction(report._id, 'dismiss')}
                        disabled={actionId === report._id}
                        className="bg-[var(--color-hidayah-dark)] text-white py-4 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 uppercase tracking-widest"
                      >
                        {actionId === report._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Dismiss
                      </button>
                      
                      {!report.reportedUserId && report.postId && (
                        <button 
                          onClick={() => handleAction(report._id, 'suspend')}
                          disabled={actionId === report._id}
                          className="border-2 border-red-500/30 text-red-500 py-4 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-red-50 transition-all disabled:opacity-50 uppercase tracking-widest"
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
      </main>
    </div>
  );
}
