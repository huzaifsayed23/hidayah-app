"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Search, MessageSquare, Globe, Lock, Loader2, Bell, Trash2, LogOut, MoreVertical, X, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { hidayahFetch } from '@/lib/api';


export default function CirclesPage() {
  const router = useRouter();
  const [circles, setCircles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discover' | 'my'>('my');
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number, isCreator: boolean } | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      const res = await hidayahFetch('/api/auth/me');
      const data = await res.json();
      if (res.ok) setCurrentUser(data);
    };

    fetchMe();
  }, []);

  useEffect(() => {
    fetchCircles();
  }, [activeTab]);

  const fetchCircles = async () => {
    setIsLoading(true);
    try {
      const res = await hidayahFetch(`/api/circles?filter=${activeTab === 'my' ? 'mine' : 'discover'}`);
      const data = await res.json();
      if (res.ok) {
        setCircles(data.circles);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCircle = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setJoiningId(id);
    try {
      const res = await hidayahFetch(`/api/circles/${id}/join`, { method: 'POST' });

      if (res.ok) {
        // Remove from discover, maybe move to "my" or just show success
        setCircles(prev => prev.filter(c => c._id !== id));
        alert("Welcome to the circle! You can now find it in 'Your Circles'.");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to join circle");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJoiningId(null);
    }
  };

  const handleDeleteCircle = async (id: string) => {
    if (!confirm("Are you sure you want to DELETE this circle? This action cannot be undone.")) return;
    try {
      const res = await hidayahFetch(`/api/circles/${id}`, { method: 'DELETE' });

      if (res.ok) {
        setCircles(prev => prev.filter(c => c._id !== id));
        setContextMenu(null);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete circle");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaveCircle = async (id: string) => {
    if (!confirm("Are you sure you want to leave this circle?")) return;
    try {
      const res = await hidayahFetch(`/api/circles/${id}/members`, { method: 'DELETE' });

      if (res.ok) {
        setCircles(prev => prev.filter(c => c._id !== id));
        setContextMenu(null);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to leave circle");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, circle: any) => {
    e.preventDefault();
    setContextMenu({
      id: circle._id,
      x: e.pageX,
      y: e.pageY,
      isCreator: currentUser && (
        String(circle.creatorId) === String(currentUser.id) || 
        String(circle.creatorId) === String(currentUser.email)
      )
    });
  };

  const handleTouchStart = (circle: any) => {
    longPressTimer.current = setTimeout(() => {
      setContextMenu({
        id: circle._id,
        x: window.innerWidth / 2 - 100,
        y: window.innerHeight / 2 - 50,
        isCreator: currentUser && (
          String(circle.creatorId) === String(currentUser.id) || 
          String(circle.creatorId) === String(currentUser.email)
        )
      });
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const filteredCircles = circles.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-24 max-w-2xl mx-auto px-4 sm:px-6 pt-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif text-[var(--color-hidayah-dark)]">Circles</h1>
          <p className="text-sm text-[var(--color-hidayah-dark)] opacity-70 mt-1 leading-relaxed">
            Thoughtful community discussions.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 rounded-full hover:bg-[var(--color-hidayah-secondary)] transition-colors">
            <Search className="w-5 h-5 text-[var(--color-hidayah-dark)] opacity-70" />
          </button>
        </div>
      </header>

      <Link 
        href="/groups/create"
        className="w-full mb-8 p-6 bg-[var(--color-hidayah-dark)] rounded-[32px] flex items-center justify-between group hover:opacity-90 transition-all shadow-md"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-hidayah-primary)]/10 flex items-center justify-center text-[var(--color-hidayah-gold)] group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[var(--color-hidayah-primary)] font-bold text-lg">Create a Circle</h3>
            <p className="text-[var(--color-hidayah-primary)]/60 text-xs">Start a new community discussion</p>
          </div>
        </div>
        <div className="px-4 py-1 rounded-full bg-[var(--color-hidayah-primary)]/10 text-[var(--color-hidayah-primary)]/40 text-[10px] font-bold uppercase tracking-widest group-hover:bg-[var(--color-hidayah-primary)]/20 transition-colors">
          Start
        </div>
      </Link>

      <div className="flex gap-3 mb-6 p-1 bg-[var(--color-hidayah-secondary)] rounded-2xl">
        <button 
          onClick={() => setActiveTab('my')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'my' ? 'bg-[var(--color-hidayah-primary)] shadow-sm text-[var(--color-hidayah-dark)]' : 'text-[var(--color-hidayah-dark)]/50 hover:text-[var(--color-hidayah-dark)]'}`}
        >
          Your Circles
        </button>
        <button 
          onClick={() => setActiveTab('discover')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'discover' ? 'bg-[var(--color-hidayah-primary)] shadow-sm text-[var(--color-hidayah-dark)]' : 'text-[var(--color-hidayah-dark)]/50 hover:text-[var(--color-hidayah-dark)]'}`}
        >
          Discover
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-hidayah-dark)] opacity-40" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab === 'my' ? 'your' : 'all'} circles...`} 
          className="w-full pl-11 pr-4 py-3 bg-[var(--color-hidayah-secondary)] border-transparent focus:border-[var(--color-hidayah-gold)] border rounded-2xl text-sm transition-all outline-none"
        />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-hidayah-gold)]" />
            <p className="text-sm font-medium opacity-50">Calibrating your circles...</p>
          </div>
        ) : filteredCircles.length > 0 ? (
          filteredCircles.map((circle) => (
            <div key={circle._id} className="relative group/item">
              <Link
                href={activeTab === 'my' ? `/groups/${circle._id}` : '#'}
                onClick={(e) => activeTab === 'discover' && e.preventDefault()}
                onContextMenu={(e) => activeTab === 'my' && handleContextMenu(e, circle)}
                onTouchStart={() => activeTab === 'my' && handleTouchStart(circle)}
                onTouchEnd={handleTouchEnd}
                className="block bg-[var(--color-hidayah-secondary)] p-5 md:p-6 rounded-[24px] group hover:scale-[1.01] transition-transform border border-transparent hover:border-[var(--color-hidayah-border)]/50 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--color-hidayah-primary)] flex items-center justify-center text-[var(--color-hidayah-gold)] shrink-0 shadow-sm">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[var(--color-hidayah-dark)] text-lg leading-tight">
                          {circle.title}
                        </h3>
                        {circle.privacy === 'private' ? <Lock className="w-3.5 h-3.5 opacity-30" /> : <Globe className="w-3.5 h-3.5 opacity-30" />}
                      </div>
                      <p className="text-xs text-[var(--color-hidayah-dark)] opacity-50 mt-0.5 line-clamp-1">{circle.description}</p>
                    </div>
                  </div>
                  {activeTab === 'discover' ? (
                    <button 
                      onClick={(e) => handleJoinCircle(e, circle._id)}
                      disabled={joiningId === circle._id}
                      className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                        circle.privacy === 'public' 
                          ? 'bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] hover:opacity-90' 
                          : 'bg-[var(--color-hidayah-primary)] border border-[var(--color-hidayah-gold)] text-[var(--color-hidayah-gold)] hover:bg-[var(--color-hidayah-gold)]/5'
                      }`}
                    >
                      {joiningId === circle._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : circle.privacy === 'public' ? (
                        'Join Circle'
                      ) : (
                        'Request to Join'
                      )}
                    </button>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--color-hidayah-primary)] flex items-center justify-center text-[var(--color-hidayah-dark)] group-hover:bg-[var(--color-hidayah-gold)] group-hover:text-[var(--color-hidayah-primary)] transition-colors">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-hidayah-border)]/20">
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-hidayah-dark)]/40">
                    <span className="px-2 py-0.5 rounded bg-[var(--color-hidayah-gold)]/10 text-[var(--color-hidayah-gold)]">{circle.category}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {circle.memberIds?.length || 0} Members
                    </span>
                  </div>
                  {activeTab === 'my' && (
                    <button 
                      onClick={(e) => { e.preventDefault(); handleContextMenu(e as any, circle); }}
                      className="p-1 hover:bg-black/5 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-[var(--color-hidayah-secondary)] rounded-[32px] border border-dashed border-[var(--color-hidayah-border)]">
            <Users className="w-12 h-12 mx-auto text-[var(--color-hidayah-dark)] opacity-10 mb-4" />
            <p className="text-[var(--color-hidayah-dark)] opacity-50 font-medium">No circles found.</p>
            {activeTab === 'my' && (
              <p className="text-xs opacity-40 mt-1">Join one from 'Discover' or create your own.</p>
            )}
          </div>
        )}
      </div>

      {/* Context Menu Overlay */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setContextMenu(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-[101] w-52 bg-[var(--color-hidayah-primary)] rounded-2xl shadow-2xl border border-[var(--color-hidayah-border)]/20 overflow-hidden"
              style={{ 
                top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 150 : 0), 
                left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 220 : 0) 
              }}
            >
              <div className="p-1.5 flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50 mb-1">
                  <span className="text-[10px] font-bold text-[var(--color-hidayah-dark)]/40 uppercase tracking-widest">Options</span>
                  <X className="w-3 h-3 opacity-30 cursor-pointer" onClick={() => setContextMenu(null)} />
                </div>
                {contextMenu.isCreator ? (
                  <button 
                    onClick={() => handleDeleteCircle(contextMenu.id)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors text-red-600"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Circle
                  </button>
                ) : (
                  <button 
                    onClick={() => handleLeaveCircle(contextMenu.id)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors text-red-600"
                  >
                    <LogOut className="w-4 h-4" /> Leave Circle
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
