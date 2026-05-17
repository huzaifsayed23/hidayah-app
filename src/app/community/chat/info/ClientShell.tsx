"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Users, ShieldCheck, LogOut, Plus, 
  Search, Loader2, Info, User, Check, X, 
  MessageCircle, Share2, Bell, BellOff, Ban, MoreVertical, UserPlus, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PresenceAvatar from '@/components/PresenceAvatar';
import { getPusherClient } from '@/lib/pusher';
import { hidayahFetch } from '@/lib/api';


export default function CircleInfoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const [circle, setCircle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [presenceMembers, setPresenceMembers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    
    const pusherClient = getPusherClient();
    const presenceChannel = pusherClient.subscribe(`presence-circle-${id}`);

    presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
      const onlineIds = new Set<string>();
      members.each((member: any) => onlineIds.add(member.id));
      setPresenceMembers(onlineIds);
    });

    presenceChannel.bind('pusher:member_added', (member: any) => {
      setPresenceMembers(prev => new Set(prev).add(member.id));
    });

    presenceChannel.bind('pusher:member_removed', (member: any) => {
      setPresenceMembers(prev => {
        const newSet = new Set(prev);
        newSet.delete(member.id);
        return newSet;
      });
    });

    return () => {
      pusherClient.unsubscribe(`presence-circle-${id}`);
    };
  }, [id]);

  useEffect(() => {
    const fetchMe = async () => {
      const meRes = await hidayahFetch('/api/auth/me');
      const meData = await meRes.json();
      if (meRes.ok) setCurrentUser(meData);
    };

    fetchMe();
    fetchCircle();
    fetchMuteStatus();
  }, [id]);

  const fetchMuteStatus = async () => {
    try {
      const res = await hidayahFetch(`/api/circles/${id}/mute`);
      const data = await res.json();
      if (res.ok) setIsMuted(data.isMuted);

    } catch (err) {
      console.error(err);
    }
  };

  const fetchCircle = async () => {
    try {
      const res = await hidayahFetch(`/api/circles/${id}`);
      const data = await res.json();
      if (res.ok) setCircle(data.circle);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await hidayahFetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (res.ok) {

          const filtered = data.users.filter((u: any) => 
            !circle?.memberIds?.some((m: any) => m._id === u._id)
          );
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    const timeout = setTimeout(searchUsers, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery, circle]);

  const handleMuteToggle = async () => {
    try {
      const res = await hidayahFetch(`/api/circles/${id}/mute`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {

        setIsMuted(data.isMuted);
        // Request notification permission if unmuting
        if (!data.isMuted && typeof window !== 'undefined' && 'Notification' in window) {
          Notification.requestPermission();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    const url = window.location.origin + `/community/chat?id=${circle?.slug || id}`;
    navigator.clipboard.writeText(url);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleAddMember = async (userId: string) => {
    if (invitedUserIds.includes(userId)) return;
    try {
      const res = await hidayahFetch(`/api/circles/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (res.ok) {
        setInvitedUserIds(prev => [...prev, userId]);
      } else {
        const data = await res.json();
        alert(data.message || "Error sending invitation");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this circle?")) return;
    setIsLeaving(true);
    try {
      const res = await hidayahFetch(`/api/circles/${id}/members`, {
        method: 'DELETE'
      });

      if (res.ok) {
        router.push('/community/circles');
      } else {
        const data = await res.json();
        alert(data.message || "Error leaving circle");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteCircle = async () => {
    if (!confirm("Are you sure you want to DELETE this circle? This will erase all reflections and data forever.")) return;
    setIsDeleting(true);
    try {
      const res = await hidayahFetch(`/api/circles/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        router.push('/community/circles');
      } else {
        const data = await res.json();
        alert(data.message || "Error deleting circle");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm("Remove this member from the circle?")) return;
    try {
      const res = await hidayahFetch(`/api/circles/${id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      if (res.ok) {
        setCircle((prev: any) => ({
          ...prev,
          memberIds: prev.memberIds.filter((m: any) => m._id !== targetUserId),
          adminIds: (prev.adminIds || []).filter((id: any) => id.toString() !== targetUserId)
        }));
      } else {
        const data = await res.json();
        alert(data.message || "Error removing member");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAdmin = async (targetUserId: string) => {
    try {
      const res = await hidayahFetch(`/api/circles/${id}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      if (res.ok) {
        const data = await res.json();
        setCircle((prev: any) => {
          const currentAdmins = prev.adminIds || [];
          const newAdmins = data.isAdmin 
            ? [...currentAdmins, targetUserId]
            : currentAdmins.filter((id: any) => id.toString() !== targetUserId);
          
          return { ...prev, adminIds: newAdmins };
        });
      } else {
        const data = await res.json();
        alert(data.message || "Error updating admin status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isCreator = currentUser && circle && (
    String(circle.creatorId?._id || circle.creatorId) === String(currentUser.id) || 
    currentUser.email?.toLowerCase() === 'huzaifsayed454@gmail.com'
  );

  const isAdmin = currentUser && circle && (
    isCreator || circle.adminIds?.some((id: any) => String(id) === String(currentUser.id))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-hidayah-primary)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-hidayah-gold)]" />
      </div>
    );
  }

  const rules = circle?.rules || [
    "Respectful discussion",
    "No spam",
    "Stay on topic",
    "Islamic-focused conversation"
  ];

  return (
    <div className="min-h-screen bg-[var(--color-hidayah-primary)] pb-24 transition-colors duration-500">
      <header className="sticky top-0 z-50 bg-[var(--color-hidayah-primary)]/80 backdrop-blur-md px-4 pb-4 pt-[max(env(safe-area-inset-top),1rem)] border-b border-[var(--color-hidayah-border)]/10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-[var(--color-hidayah-dark)]" />
            </button>
            <h1 className="text-xl font-serif font-bold text-[var(--color-hidayah-dark)]">Circle Info</h1>
          </div>
          <button 
            onClick={() => router.push(`/community/chat?id=${circle?.slug || id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] rounded-full text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            <MessageCircle className="w-4 h-4" /> Open Chat
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-8 space-y-12">
        <section className="text-center space-y-6">
          <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--color-hidayah-gold)]/5 flex items-center justify-center text-[var(--color-hidayah-gold)] mx-auto mb-4 border border-[var(--color-hidayah-gold)]/10 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-[var(--color-hidayah-gold)]/5 animate-pulse" />
            <User className="w-10 h-10 relative z-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-serif font-bold text-[var(--color-hidayah-dark)]">{circle?.title}</h2>
            <p className="text-sm text-[var(--color-hidayah-dark)]/60 leading-relaxed px-8">
              {circle?.description}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleShare}
            className="flex flex-col items-center gap-2 p-4 bg-[var(--color-hidayah-secondary)] rounded-3xl border border-[var(--color-hidayah-border)]/10 shadow-sm hover:bg-[var(--color-hidayah-primary)] transition-colors group relative"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--color-hidayah-secondary)] flex items-center justify-center text-[var(--color-hidayah-dark)]/60 group-hover:text-[var(--color-hidayah-gold)]">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
              {showCopied ? "Copied!" : "Share"}
            </span>
          </button>
          <button 
            onClick={handleMuteToggle}
            className={`flex flex-col items-center gap-2 p-4 rounded-3xl border border-[var(--color-hidayah-border)]/10 shadow-sm transition-colors group ${isMuted ? 'bg-[var(--color-hidayah-gold)]/10' : 'bg-[var(--color-hidayah-secondary)] hover:bg-[var(--color-hidayah-primary)]'}`}
          >
            <div className={`w-10 h-10 rounded-full bg-[var(--color-hidayah-secondary)] flex items-center justify-center ${isMuted ? 'text-[var(--color-hidayah-gold)]' : 'text-[var(--color-hidayah-dark)]/60 group-hover:text-[var(--color-hidayah-gold)]'}`}>
              {isMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isMuted ? 'text-[var(--color-hidayah-gold)] opacity-100' : 'opacity-60'}`}>
              {isMuted ? "Muted" : "Mute"}
            </span>
          </button>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-[var(--color-hidayah-dark)]/40 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Circle Covenant
          </h3>
          <div className="bg-[var(--color-hidayah-secondary)] rounded-[2.5rem] p-8 space-y-4 border border-[var(--color-hidayah-border)]/10 shadow-sm">
            {rules.map((rule: string, i: number) => (
              <div key={i} className="flex gap-4 text-sm text-[var(--color-hidayah-dark)]/80 leading-relaxed group">
                <span className="text-[var(--color-hidayah-gold)] font-serif italic text-lg opacity-40">0{i + 1}.</span>
                <p className="pt-1">{rule}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold text-[var(--color-hidayah-dark)]/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Members ({circle?.memberIds?.length})
            </h3>
            {isAdmin && (
              <button 
                onClick={() => setShowAddMember(true)}
                className="text-[9px] font-bold text-[var(--color-hidayah-gold)] uppercase tracking-wider flex items-center gap-1.5 px-4 py-2 bg-[var(--color-hidayah-gold)]/10 rounded-full hover:bg-[var(--color-hidayah-gold)]/20 transition-all active:scale-95"
              >
                <UserPlus className="w-3 h-3" /> Invite Member
              </button>
            )}
          </div>
          
          <div className="bg-[var(--color-hidayah-secondary)] rounded-[2.5rem] overflow-hidden border border-[var(--color-hidayah-border)]/10 shadow-sm divide-y divide-[var(--color-hidayah-border)]/5">
            {circle?.memberIds?.map((member: any) => (
              <div key={member._id} className="flex items-center justify-between p-5 px-8 hover:bg-[var(--color-hidayah-secondary)]/30 transition-colors">
                <div className="flex items-center gap-4">
                  <PresenceAvatar 
                    size="md"
                    user={{
                      username: member.username,
                      image: member.image,
                      isOnline: presenceMembers.has(member._id),
                      lastSeen: member.lastSeen || new Date()
                    }}
                  />
                  <div>
                    <p className="text-sm font-bold text-[var(--color-hidayah-dark)]">@{member.username}</p>
                    <div className="flex items-center gap-1.5">
                      {presenceMembers.has(member._id) ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[9px] font-bold text-green-600/60 uppercase tracking-widest">Online</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          <span className="text-[9px] font-bold text-[var(--color-hidayah-dark)]/30 uppercase tracking-widest italic">Offline</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {(String(circle.creatorId?._id || circle.creatorId) === String(member._id)) ? (
                    <span className="text-[8px] font-bold text-[var(--color-hidayah-gold)] uppercase tracking-[0.2em] bg-[var(--color-hidayah-gold)]/10 px-3 py-1 rounded-md border border-[var(--color-hidayah-gold)]/20">
                      Founder
                    </span>
                  ) : circle.adminIds?.some((id: any) => String(id) === String(member._id)) ? (
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-[0.2em] bg-blue-500/10 px-3 py-1 rounded-md border border-blue-500/20">
                      Admin
                    </span>
                  ) : null}

                  {isCreator && String(member._id) !== String(currentUser?.id) && (
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        onClick={() => handleToggleAdmin(member._id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${
                          circle.adminIds?.some((id: any) => String(id) === String(member._id)) 
                            ? 'bg-blue-100 text-blue-600 border border-blue-200' 
                            : 'bg-gray-100 text-gray-400 border border-transparent hover:border-blue-200 hover:text-blue-500'
                        }`}
                        title={circle.adminIds?.some((id: any) => String(id) === String(member._id)) ? "Demote from Admin" : "Promote to Admin"}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {circle.adminIds?.some((id: any) => String(id) === String(member._id)) ? 'Admin' : 'Make Admin'}
                      </button>
                      <button 
                        onClick={() => handleRemoveMember(member._id)}
                        className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-6 pb-12 space-y-4">
          {isCreator ? (
            <button 
              onClick={handleDeleteCircle}
              disabled={isDeleting}
              className="w-full py-5 rounded-[2rem] bg-red-500/10 text-red-500 font-bold text-sm flex items-center justify-center gap-3 hover:bg-red-500/20 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Circle
            </button>
          ) : (
            <button 
              onClick={handleLeave}
              disabled={isLeaving}
              className="w-full py-5 rounded-[2rem] bg-[var(--color-hidayah-secondary)] border border-red-500/30 text-red-500 font-bold text-sm flex items-center justify-center gap-3 hover:bg-red-500/5 transition-all shadow-sm shadow-red-500/5 active:scale-95 disabled:opacity-50"
            >
              {isLeaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Leave Circle
            </button>
          )}
          <p className="text-center text-[10px] text-[var(--color-hidayah-dark)]/30 px-8 leading-relaxed">
            {isCreator 
              ? "Founders can disband the circle at any time. This action is irreversible."
              : "Note: A Circle requires a minimum of 3 members to stay active."}
          </p>
        </section>
      </main>

      <AnimatePresence>
        {showAddMember && (
          <div key="invite-modal">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMember(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 top-[15%] max-w-lg mx-auto bg-[var(--color-hidayah-secondary)] rounded-[3rem] shadow-2xl z-[61] overflow-hidden border border-[var(--color-hidayah-border)]/20"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[var(--color-hidayah-dark)]">Invite Member</h2>
                    <p className="text-xs text-[var(--color-hidayah-dark)]/50 mt-1">Send a reflection invitation</p>
                  </div>
                  <button onClick={() => setShowAddMember(false)} className="p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-hidayah-dark)]/30" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by username..."
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[var(--color-hidayah-secondary)] border border-transparent focus:border-[var(--color-hidayah-gold)] outline-none transition-all"
                    />
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-2 rounded-2xl">
                    {searchResults.map(user => (
                      <button 
                        key={user._id}
                        onClick={() => handleAddMember(user._id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-hidayah-secondary)] transition-colors rounded-2xl group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-hidayah-gold)]/10 flex items-center justify-center text-[var(--color-hidayah-gold)]">
                            <UserPlus className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[var(--color-hidayah-dark)]">@{user.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {invitedUserIds.includes(user._id) ? (
                            <>
                              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Sent</span>
                              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                                <Check className="w-4 h-4" />
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-[10px] font-bold text-[var(--color-hidayah-gold)] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Invite</span>
                              <div className="w-8 h-8 rounded-full bg-[var(--color-hidayah-gold)] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <UserPlus className="w-4 h-4" />
                              </div>
                            </>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

