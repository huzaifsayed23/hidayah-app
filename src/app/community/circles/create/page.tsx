"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, X, Users, Check, Loader2, Info, Lock, Globe, Plus, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { hidayahFetch } from '@/lib/api';


export default function CreateCirclePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Quran Reflection");
  const [privacy, setPrivacy] = useState("public");
  
  // Member Search State
  const [memberQuery, setMemberQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const categories = [
    "Quran Reflection",
    "Daily Reminders",
    "Student Discussion",
    "Prophetic Biography",
    "Character Building",
    "New Muslim Support"
  ];

  useEffect(() => {
    const searchUsers = async () => {
      if (memberQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await hidayahFetch(`/api/users/search?q=${encodeURIComponent(memberQuery)}`);

        const data = await res.json();
        if (res.ok) {
          const filtered = data.users.filter((u: any) => 
            !selectedMembers.some(sm => (sm._id || sm.id) === (u._id || u.id))
          );
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [memberQuery, selectedMembers]);

  const handleAddMember = (user: any) => {
    setSelectedMembers([...selectedMembers, user]);
    setMemberQuery("");
    setSearchResults([]);
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter(m => (m._id || m.id) !== userId));
  };

  const handleCreate = async () => {
    if (!title || !description) {
      setError("Please fill in the title and description.");
      return;
    }

    if (privacy === 'private' && selectedMembers.length < 2) {
      setError("Private circles require at least 2 invited members (total 3).");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await hidayahFetch('/api/circles', {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          privacy,
          memberIds: privacy === 'private' ? selectedMembers.map(m => m._id || m.id) : []
        })
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/community/circles`);
      } else {
        setError(data.message || "Failed to create circle");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep1Continue = () => {
    if (privacy === 'public') {
      handleCreate();
    } else {
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-hidayah-primary)] pb-12">
      <header className="sticky top-0 z-50 bg-[var(--color-hidayah-primary)]/80 backdrop-blur-md border-b border-[var(--color-hidayah-border)]/30 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-[var(--color-hidayah-dark)]" />
          </button>
          <h1 className="text-xl font-serif font-bold text-[var(--color-hidayah-dark)]">Create New Circle</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= 1 ? 'bg-[var(--color-hidayah-gold)] text-white' : 'bg-[var(--color-hidayah-secondary)] text-[var(--color-hidayah-dark)]/40'}`}>1</div>
          {privacy === 'private' && (
            <>
              <div className={`h-0.5 w-12 rounded-full ${step >= 2 ? 'bg-[var(--color-hidayah-gold)]' : 'bg-[var(--color-hidayah-secondary)]'}`} />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= 2 ? 'bg-[var(--color-hidayah-gold)] text-white' : 'bg-[var(--color-hidayah-secondary)] text-[var(--color-hidayah-dark)]/40'}`}>2</div>
            </>
          )}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-hidayah-dark)] opacity-70 uppercase tracking-wider">Circle Name</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Quran Reflection Circle"
                  className="w-full px-6 py-4 rounded-2xl bg-[var(--color-hidayah-secondary)] border border-transparent focus:border-[var(--color-hidayah-gold)] transition-all outline-none text-lg font-serif text-[var(--color-hidayah-dark)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-hidayah-dark)] opacity-70 uppercase tracking-wider">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this circle about?"
                  rows={4}
                  className="w-full px-6 py-4 rounded-2xl bg-[var(--color-hidayah-secondary)] border border-transparent focus:border-[var(--color-hidayah-gold)] transition-all outline-none resize-none leading-relaxed text-[var(--color-hidayah-dark)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--color-hidayah-dark)] opacity-70 uppercase tracking-wider">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-[var(--color-hidayah-secondary)] border border-transparent focus:border-[var(--color-hidayah-gold)] outline-none appearance-none cursor-pointer text-[var(--color-hidayah-dark)]"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--color-hidayah-dark)] opacity-70 uppercase tracking-wider">Privacy</label>
                  <div className="flex p-1 bg-[var(--color-hidayah-secondary)] rounded-2xl gap-1">
                    <button 
                      onClick={() => setPrivacy('public')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${privacy === 'public' ? 'bg-[var(--color-hidayah-primary)] shadow-sm text-[var(--color-hidayah-gold)] font-bold' : 'text-[var(--color-hidayah-dark)]/50'}`}
                    >
                      <Globe className="w-4 h-4" /> Public
                    </button>
                    <button 
                      onClick={() => setPrivacy('private')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${privacy === 'private' ? 'bg-[var(--color-hidayah-primary)] shadow-sm text-[var(--color-hidayah-gold)] font-bold' : 'text-[var(--color-hidayah-dark)]/50'}`}
                    >
                      <Lock className="w-4 h-4" /> Private
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                  {error}
                </div>
              )}

              <button 
                onClick={handleStep1Continue}
                disabled={!title || !description || isLoading}
                className="w-full py-5 rounded-2xl bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8 shadow-md flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span>{privacy === 'public' ? 'Create Public Circle' : 'Continue to Invite Members'}</span>
                    <Plus className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-[var(--color-hidayah-gold)]/10 p-4 rounded-2xl border border-[var(--color-hidayah-gold)]/20 flex gap-3">
                <Info className="w-5 h-5 text-[var(--color-hidayah-gold)] shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--color-hidayah-dark)]/80 leading-relaxed">
                  Private Circles require at least **3 members** (you + 2 invited) to start.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[var(--color-hidayah-dark)] opacity-70 uppercase tracking-wider">
                    Invite Members ({selectedMembers.length + 1}/3 min)
                  </label>
                  {selectedMembers.length + 1 < 3 && (
                    <span className="text-xs font-bold text-red-500 animate-pulse">Need {2 - selectedMembers.length} more</span>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-hidayah-dark)]/40" />
                  <input 
                    type="text" 
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    placeholder="Search people by username..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[var(--color-hidayah-secondary)] border border-transparent focus:border-[var(--color-hidayah-gold)] transition-all outline-none text-[var(--color-hidayah-dark)]"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 animate-spin text-[var(--color-hidayah-gold)]" />
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="bg-[var(--color-hidayah-secondary)] rounded-2xl shadow-xl border border-[var(--color-hidayah-border)]/30 overflow-hidden divide-y divide-[var(--color-hidayah-border)]/20 animate-in fade-in slide-in-from-top-2">
                    {searchResults.map(user => (
                      <button 
                        key={`user-${user.id}`}
                        onClick={() => handleAddMember(user)}
                        className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-hidayah-secondary)] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--color-hidayah-primary)] flex items-center justify-center font-bold text-[var(--color-hidayah-gold)]">
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-[var(--color-hidayah-dark)]">@{user.username}</p>
                          </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${selectedMembers.some(m => (m._id || m.id) === (user._id || user.id)) ? 'bg-green-500 text-white' : 'bg-[var(--color-hidayah-gold)]/10 text-[var(--color-hidayah-gold)]'}`}>
                          {selectedMembers.some(m => (m._id || m.id) === (user._id || user.id)) ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] text-sm font-bold shadow-sm">
                    <span>You</span>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  {selectedMembers.map(member => (
                    <motion.div 
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      key={`member-${member.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-hidayah-gold)]/20 text-[var(--color-hidayah-gold)] border border-[var(--color-hidayah-gold)]/30 text-sm font-bold shadow-sm"
                    >
                      <span>@{member.username}</span>
                      <button onClick={() => handleRemoveMember(member.id)}>
                        <X className="w-3.5 h-3.5 hover:text-red-500 transition-colors" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-4 mt-12">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 py-5 rounded-2xl border-2 border-[var(--color-hidayah-border)] text-[var(--color-hidayah-dark)] font-bold hover:bg-[var(--color-hidayah-secondary)] transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={isLoading}
                  className="flex-[2] py-5 rounded-2xl bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <span>Create Private Circle</span>
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
