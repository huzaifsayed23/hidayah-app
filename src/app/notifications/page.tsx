"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Heart, MessageSquare, Loader2, 
  Users, Check, X, Bell, UserPlus, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOOD_PALETTES, generateMeshGradient } from '@/lib/gradients';
import { hidayahFetch } from '@/lib/api';


export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await hidayahFetch('/api/notifications');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications);
        hidayahFetch('/api/notifications', { method: 'POST' });
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleResponse = async (notificationId: string, action: 'accept' | 'deny') => {
    setIsResponding(notificationId);
    try {
      const res = await hidayahFetch(`/api/notifications/${notificationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => 
          n._id === notificationId ? { ...n, status: action === 'accept' ? 'accepted' : 'denied' } : n
        ));
        
        if (action === 'accept') {
          const notification = notifications.find(n => n._id === notificationId);
          if (notification.type === 'circle_invite') {
            router.push(`/community/${notification.circleId}`);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResponding(null);
    }
  };

  const pendingRequests = notifications.filter(n => 
    (n.type === 'circle_invite' || n.type === 'circle_request') && n.status === 'pending'
  );
  
  const otherNotifications = notifications.filter(n => 
    !((n.type === 'circle_invite' || n.type === 'circle_request') && n.status === 'pending')
  );

  return (
    <div className="min-h-screen bg-[#F9F7F2] pb-24">
      <header className="sticky top-0 z-50 bg-[var(--color-hidayah-primary)]/90 backdrop-blur-md px-4 py-4 border-b border-[var(--color-hidayah-border)]/10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-[var(--color-hidayah-dark)]" />
          </button>
          <h1 className="text-xl font-serif font-bold text-[var(--color-hidayah-dark)]">Notifications</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-6 space-y-8">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-hidayah-gold)]" />
            <p className="text-sm font-medium opacity-50 font-serif italic">Gathering your reflections...</p>
          </div>
        ) : (
          <>
            {pendingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-[10px] font-bold text-[var(--color-hidayah-dark)]/40 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                  <UserPlus className="w-3.5 h-3.5" /> Circle Requests
                </h2>
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <motion.div 
                      key={req._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[var(--color-hidayah-secondary)] p-5 rounded-[2.5rem] border border-[var(--color-hidayah-gold)]/20 shadow-sm shadow-gold/5 flex flex-col gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${req.type === 'circle_invite' ? 'bg-[var(--color-hidayah-gold)]/10 text-[var(--color-hidayah-gold)] border-[var(--color-hidayah-gold)]/20' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>
                          {req.type === 'circle_invite' ? <Users className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--color-hidayah-dark)] leading-relaxed">
                            {req.type === 'circle_invite' ? (
                              <>
                                <span className="font-bold">@{req.senderName}</span> invited you to join the 
                                <span className="font-serif font-bold text-[var(--color-hidayah-gold)] ml-1">"{req.circleTitle}"</span> Circle.
                              </>
                            ) : (
                              <>
                                <span className="font-bold">@{req.senderName}</span> requested to join your 
                                <span className="font-serif font-bold text-blue-600 ml-1">"{req.circleTitle}"</span> Circle.
                              </>
                            )}
                          </p>
                          <p className="text-[10px] font-medium opacity-30 mt-1 uppercase tracking-wider">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 mt-1">
                        <button 
                          onClick={() => handleResponse(req._id, 'accept')}
                          disabled={isResponding === req._id}
                          className="flex-1 bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isResponding === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          {req.type === 'circle_invite' ? 'Join Circle' : 'Accept Request'}
                        </button>
                        <button 
                          onClick={() => handleResponse(req._id, 'deny')}
                          disabled={isResponding === req._id}
                          className="flex-1 bg-[var(--color-hidayah-primary)] border border-[var(--color-hidayah-border)]/30 text-[var(--color-hidayah-dark)] py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-hidayah-secondary)] transition-all active:scale-95 disabled:opacity-50"
                        >
                          <X className="w-4 h-4 opacity-40" />
                          Deny
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h2 className="text-[10px] font-bold text-[var(--color-hidayah-dark)]/40 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" /> Recent Activity
              </h2>
              {otherNotifications.length > 0 ? (
                <div className="bg-[var(--color-hidayah-secondary)] rounded-[2.5rem] border border-[var(--color-hidayah-border)]/10 shadow-sm overflow-hidden divide-y divide-[var(--color-hidayah-border)]/5">
                  {otherNotifications.map((notification) => {
                    // Logic for post thumbnail
                    const hasThumbnail = notification.moodTag && notification.backdropVariant !== undefined;
                    const colors = hasThumbnail ? (MOOD_PALETTES[notification.moodTag] || MOOD_PALETTES["Reflective"]) : null;
                    const gradient = (hasThumbnail && colors) ? generateMeshGradient(colors, notification.backdropVariant) : '';

                    return (
                      <motion.div 
                        key={notification._id}
                        layout
                        className={`flex items-center justify-between p-3 sm:p-4 transition-colors hover:bg-[var(--color-hidayah-secondary)]/30 ${!notification.isRead ? 'bg-[var(--color-hidayah-gold)]/5' : ''}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-[var(--color-hidayah-secondary)] flex items-center justify-center font-bold text-[var(--color-hidayah-dark)]/60 shrink-0 border border-white text-sm shadow-sm">
                            {notification.senderName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--color-hidayah-dark)]/80 leading-tight">
                              <span className="font-bold text-[var(--color-hidayah-dark)]">@{notification.senderName}</span>{' '}
                              {notification.type === 'like' ? 'liked your reflection.' : 
                               notification.type === 'comment' ? 'commented on your reflection.' :
                               notification.type === 'circle_invite' ? `invitation ${notification.status}.` : 
                               notification.type === 'circle_request' ? `join request ${notification.status}.` : 'interacted with you.'}
                            </p>
                            <p className="text-[9px] font-medium opacity-30 mt-1 uppercase tracking-wider">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Visual Thumbnail with Post Preview */}
                        <div className="ml-4 shrink-0 flex items-center gap-3">
                          {hasThumbnail ? (
                            <div 
                              className="w-14 h-14 rounded-xl border border-white shadow-sm overflow-hidden flex items-center justify-center p-2 relative group"
                              style={{ 
                                backgroundImage: gradient,
                                backgroundColor: colors ? colors[4] : 'transparent' 
                              }}
                            >
                              {/* Dark overlay for text legibility */}
                              <div className="absolute inset-0 bg-black/20" />
                              <span className="relative z-10 text-[8px] leading-[10px] text-center font-serif text-white line-clamp-3 italic">
                                "{notification.postExcerpt}"
                              </span>
                            </div>
                          ) : (
                            <>
                              {notification.type === 'like' ? (
                                <Heart className="w-5 h-5 text-red-500 fill-red-500 opacity-20" />
                              ) : notification.type === 'comment' ? (
                                <MessageSquare className="w-5 h-5 text-[var(--color-hidayah-gold)] fill-[var(--color-hidayah-gold)] opacity-20" />
                              ) : (
                                <Users className="w-5 h-5 text-[var(--color-hidayah-dark)] opacity-20" />
                              )}
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center bg-[var(--color-hidayah-secondary)] rounded-[2.5rem] border border-[var(--color-hidayah-border)]/10 shadow-sm">
                  <Bell className="w-12 h-12 mx-auto text-[var(--color-hidayah-dark)] opacity-10 mb-4" />
                  <p className="text-[var(--color-hidayah-dark)] opacity-50 font-medium font-serif italic">Silence is golden...</p>
                  <p className="text-xs opacity-40 mt-1 px-8">No recent activities on your reflections yet.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
