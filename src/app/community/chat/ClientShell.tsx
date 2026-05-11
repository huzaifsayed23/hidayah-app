"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Info, Send, Loader2, MoreVertical, Reply, 
  Copy, ShieldAlert, User, Users, Smile, X, Trash2,
  Paperclip, Plus, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPusherClient } from '@/lib/pusher';
import PresenceAvatar from '@/components/PresenceAvatar';
import { HIDAYAH_API_URL, hidayahFetch } from '@/lib/api';
import { safeStorage } from '@/lib/storage';
import ReportModal from '@/components/community/ReportModal';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const REACTION_EMOJIS = ['🤲', '🌙', '🕋', '🕌', '📿', '❤️', '✨', '👍'];

export default function CircleChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  
  const [circle, setCircle] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // messageId
  const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size should be less than 10MB");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      let base64 = reader.result as string;
      const isImage = file.type.startsWith('image/');
      
      // Client-side compression for smoothness & reliability
      if (isImage) {
        try {
          const img = new Image();
          img.src = base64;
          await new Promise(resolve => img.onload = resolve);
          
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max 1200px for chat images
          if (width > 1200) {
            height = Math.round((height * 1200) / width);
            width = 1200;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          base64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality JPEG is perfect
        } catch (e) {
          console.warn("Compression failed, using original", e);
        }
      }

      const tempId = 'temp-' + Date.now();
      const optimisticMsg = {
        _id: tempId,
        senderId: currentUser?.id,
        senderName: currentUser?.username || 'Me',
        text: '',
        imageUrl: isImage ? base64 : null,
        fileUrl: !isImage ? base64 : null,
        fileName: file.name,
        createdAt: new Date().toISOString(),
        isPending: true
      };
      setMessages(prev => [...prev, optimisticMsg]);

      try {
        const res = await hidayahFetch(`/api/circles/${id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: isImage ? base64 : '',
            fileUrl: !isImage ? base64 : '',
            fileName: file.name,
            replyToId: replyTo?._id
          })
        });
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({ message: "Server error" }));
          throw new Error(data.message || "Upload failed");
        }
        
        const data = await res.json();
        if (data.message) {
          setMessages(prev => prev.map(m => m._id === tempId ? data.message : m));
        }
        setReplyTo(null);
      } catch (err: any) {
        console.error("Upload failed:", err);
        setMessages(prev => prev.filter(m => m._id !== tempId));
        alert(err.message || "Failed to send file. Please ensure you have a stable connection.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const [presenceMembers, setPresenceMembers] = useState<Set<string>>(new Set());
  const [memberDetails, setMemberDetails] = useState<{[key: string]: any}>({});
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchMuteStatus = async () => {
      try {
        const res = await hidayahFetch(`/api/circles/${id}/mute`);
        const data = await res.json();
        if (res.ok) setIsMuted(data.isMuted);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMuteStatus();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const token = safeStorage.getItem('hidayah_token');
      if (!token) {
        router.push('/auth');
        return;
      }

      try {
        const [meRes, circleRes, msgRes] = await Promise.all([
          hidayahFetch('/api/auth/me'),
          hidayahFetch(`/api/circles/${id}`),
          hidayahFetch(`/api/circles/${id}/messages`)
        ]);

        const [meData, circleData, msgData] = await Promise.all([
          meRes.ok ? meRes.json() : Promise.resolve(null),
          circleRes.ok ? circleRes.json() : Promise.resolve(null),
          msgRes.ok ? msgRes.json() : Promise.resolve(null)
        ]);

        if (meRes.ok) setCurrentUser(meData);
        if (circleRes.ok) {
          setCircle(circleData.circle);
          const details: any = {};
          circleData.circle.members?.forEach((m: any) => {
            details[m._id] = m;
          });
          setMemberDetails(details);
        }
        if (msgRes.ok) setMessages(msgData.messages);
      } catch (err) {
        console.error("CircleChatPage data fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    const pusherClient = getPusherClient();
    const channel = pusherClient.subscribe(`circle-${id}`);
    const presenceChannel = pusherClient.subscribe(`presence-circle-${id}`);

    presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
      const onlineIds = new Set<string>();
      members.each((member: any) => onlineIds.add(member.id));
      setPresenceMembers(onlineIds);
    });

    presenceChannel.bind('pusher:member_added', (member: any) => {
      setPresenceMembers(prev => new Set(prev).add(member.id));
      setMemberDetails(prev => ({ ...prev, [member.id]: { ...member.info, isOnline: true } }));
    });

    presenceChannel.bind('pusher:member_removed', (member: any) => {
      setPresenceMembers(prev => {
        const newSet = new Set(prev);
        newSet.delete(member.id);
        return newSet;
      });
      setMemberDetails(prev => {
        const newDetails = { ...prev };
        if (newDetails[member.id]) {
          newDetails[member.id] = { ...newDetails[member.id], isOnline: false };
        }
        return newDetails;
      });
    });

    channel.bind('new-message', async (data: any) => {
      // If it's our own message, the POST response will handle the full update
      if (data.senderId === currentUser?.id || data.senderId?._id === currentUser?.id) {
        return;
      }

      if (data.imageUrl === 'PENDING' || data.fileUrl === 'PENDING') {
        // Fetch full message list to get the base64 media
        try {
          const res = await hidayahFetch(`/api/circles/${id}/messages`);
          if (res.ok) {
            const msgData = await res.json();
            setMessages(msgData.messages);
          }
        } catch (e) {
          console.error("Failed to fetch messages after media notification");
        }
        return;
      }

      setMessages(prev => {
        if (prev.some(m => m._id === data._id)) return prev;
        return [...prev, data];
      });
    });

    channel.bind('reaction', (data: any) => {
      setMessages(prev => prev.map(m => {
        if (m._id === data.messageId) {
          return { ...m, reactions: data.reactions };
        }
        return m;
      }));
    });

    channel.bind('delete-message', (data: any) => {
      setMessages(prev => prev.filter(m => m._id !== data.messageId));
    });

    channel.bind('typing', (data: any) => {
      if (data.username === currentUser?.username) return;
      setTypingUsers(prev => {
        if (data.isTyping) {
          if (prev.includes(data.username)) return prev;
          return [...prev, data.username];
        } else {
          return prev.filter(u => u !== data.username);
        }
      });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      presenceChannel.unbind_all();
      presenceChannel.unsubscribe();
    };
  }, [id, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !id) return;

    const messageText = newMessage.trim();
    const tempId = 'temp-' + Date.now();
    
    // Optimistic Update
    const optimisticMsg = {
      _id: tempId,
      senderId: currentUser?.id,
      senderName: currentUser?.username || 'Me',
      text: messageText,
      createdAt: new Date().toISOString(),
      isPending: true
    };

    setNewMessage("");
    setReplyTo(null);
    setIsSending(true);
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await hidayahFetch(`/api/circles/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: messageText,
          replyToId: replyTo?._id
        })
      });
      
      const data = await res.json().catch(() => ({ message: "Connection error or invalid response" }));

      if (!res.ok) {
        throw new Error(data.message || data.details || "Failed to send");
      }
      
      if (data.message) {
        setMessages(prev => prev.map(m => m._id === tempId ? data.message : m));
      }
    } catch (err: any) {
      console.error("Send message error:", err);
      // Remove the optimistic message on failure
      setMessages(prev => prev.filter(m => m._id !== tempId));
      // Restore the text so the user can try again
      setNewMessage(messageText); 
      
      const errorMessage = err.message || "Please check your internet connection.";
      alert(`Message failed: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!isTyping && id) {
      setIsTyping(true);
      hidayahFetch(`/api/circles/${id}/typing`, { 
        method: 'POST', 
        body: JSON.stringify({ isTyping: true, username: currentUser?.username }) 
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (id) {
        hidayahFetch(`/api/circles/${id}/typing`, { 
          method: 'POST', 
          body: JSON.stringify({ isTyping: false, username: currentUser?.username }) 
        });
      }
    }, 2000);
  };

  const handleClearMyReactions = async (messageId: string) => {
    if (!currentUser) return;
    
    // Optimistic Update
    setMessages(prev => prev.map(msg => {
      if (msg._id === messageId) {
        return {
          ...msg,
          reactions: msg.reactions.filter((r: any) => String(r.userId?._id || r.userId) !== String(currentUser.id))
        };
      }
      return msg;
    }));

    try {
      await hidayahFetch(`/api/circles/${id}/messages/${messageId}/react/clear`, {
        method: 'POST'
      });
    } catch (err) {
      console.error("Failed to clear reactions:", err);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!id || !currentUser) return;
    
    // Optimistic Update
    setMessages(prev => prev.map(m => {
      if (m._id === messageId) {
        const reactions = [...(m.reactions || [])];
        const existingIndex = reactions.findIndex((r: any) => 
          String(r.userId?._id || r.userId) === String(currentUser.id) && r.emoji === emoji
        );
        
        if (existingIndex > -1) {
          reactions.splice(existingIndex, 1);
        } else {
          reactions.push({ userId: currentUser.id, emoji });
        }
        return { ...m, reactions };
      }
      return m;
    }));

    try {
      await hidayahFetch(`/api/circles/${id}/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
    } catch (err) {
      console.error("Reaction sync failed:", err);
      // We don't revert here because Pusher might eventually sync it, 
      // and it's better to keep the UI snappy.
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      const res = await hidayahFetch(`/api/circles/${id}/messages/${messageId}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
        setContextMenu(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const longPressRef = useRef<any>(null);
  const handleTouchStart = (msgId: string, e: any) => {
    longPressRef.current = setTimeout(() => {
      setContextMenu({ id: msgId, x: e.touches[0].clientX, y: e.touches[0].clientY });
    }, 600); // 600ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  const handleRightClick = (msgId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ id: msgId, x: e.clientX, y: e.clientY });
  };

  const handleReportSuccess = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 4000);
  };

  if (isLoading || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-hidayah-primary)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-hidayah-gold)]" />
      </div>
    );
  }

  const isCreator = currentUser && circle && String(circle.creatorId) === String(currentUser.id);

  return (
    <div 
      className="flex flex-col h-[100dvh] bg-[var(--color-hidayah-primary)] overflow-hidden"
      onClick={() => setContextMenu(null)}
    >
      {/* Context Menu Overlay */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[100] bg-[var(--color-hidayah-primary)] rounded-2xl shadow-2xl border border-[var(--color-hidayah-border)] p-1 min-w-[200px]"
            style={{ 
              top: contextMenu.y < 100 ? 100 : Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 250 : 0), 
              left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 220 : 0) 
            }}
          >
            {/* Reaction Emojis Row */}
            <div className="flex items-center gap-1 p-2 border-b border-[var(--color-hidayah-border)]/30 mb-1">
              {REACTION_EMOJIS.map(emoji => (
                <button 
                  key={emoji}
                  onClick={(e) => { e.stopPropagation(); handleReaction(contextMenu.id, emoji); setContextMenu(null); }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-[var(--color-hidayah-secondary)] rounded-full transition-transform active:scale-75 text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                handleClearMyReactions(contextMenu.id);
                setContextMenu(null); 
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[var(--color-hidayah-dark)] hover:bg-[var(--color-hidayah-secondary)] rounded-xl transition-colors text-sm font-bold"
            >
              <Smile className="w-4 h-4 opacity-50" />
              Clear My Reactions
            </button>

            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                const msg = messages.find(m => m._id === contextMenu.id);
                if (msg) setReplyTo(msg);
                setContextMenu(null); 
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[var(--color-hidayah-dark)] hover:bg-[var(--color-hidayah-secondary)] rounded-xl transition-colors text-sm font-bold"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>

            {(() => {
              const msg = messages.find(m => m._id === contextMenu.id);
              if (!msg) return null;
              const isMsgOwner = String(msg.senderId?._id || msg.senderId) === String(currentUser?.id);
              const isCircleOwner = currentUser && circle && (String(circle.creatorId?._id || circle.creatorId) === String(currentUser.id));
              
              if (isMsgOwner || isCircleOwner) {
                return (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteMessage(contextMenu.id); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                );
              }
              return null;
            })()}

            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setReportMessageId(contextMenu.id);
                setContextMenu(null); 
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[var(--color-hidayah-dark)] hover:bg-[var(--color-hidayah-secondary)] rounded-xl transition-colors text-sm font-bold"
            >
              <ShieldAlert className="w-4 h-4 opacity-50" />
              Report Message
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ReportModal 
        messageId={reportMessageId || undefined}
        isOpen={!!reportMessageId}
        onClose={() => setReportMessageId(null)}
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

      {/* Header */}
      <header className="bg-[var(--color-hidayah-primary)] border-b border-[var(--color-hidayah-border)]/50 px-4 py-3 shrink-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/community/circles')} className="p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-[var(--color-hidayah-dark)]" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-hidayah-gold)]/10 flex items-center justify-center text-[var(--color-hidayah-gold)] border border-[var(--color-hidayah-gold)]/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-serif font-bold text-[var(--color-hidayah-dark)] line-clamp-1">{circle?.title}</h1>
                <p className="text-[10px] text-green-600 font-bold opacity-60">
                  {presenceMembers.size} Online
                </p>
              </div>
            </div>
          </div>
          <button onClick={() => router.push(`/community/chat/info?id=${id}`)} className="p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-xl transition-colors">
            <Info className="w-5 h-5 text-[var(--color-hidayah-dark)] opacity-70" />
          </button>
        </div>
      </header>

      {/* Message List */}
      <div className="flex-1 internal-scroll-container px-4 py-6 bg-[var(--color-hidayah-primary)] relative">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => {
            const isMe = String(msg.senderId?._id || msg.senderId) === String(currentUser?.id);
            const isOnline = presenceMembers.has(String(msg.senderId?._id || msg.senderId));
            
            return (
              <div 
                key={msg._id} 
                className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}
              >
                <div 
                  className={cn("flex items-end gap-2 max-w-[85%] cursor-pointer active:scale-[0.98] transition-transform", isMe ? "flex-row-reverse" : "flex-row")}
                  onContextMenu={(e) => { e.preventDefault(); setContextMenu({ id: msg._id, x: e.clientX, y: e.clientY }); }}
                  onTouchStart={(e) => handleTouchStart(msg._id, e)}
                  onTouchEnd={handleTouchEnd}
                  onClick={(e: any) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX || rect.left + rect.width / 2;
                    const y = e.clientY || rect.top;
                    setContextMenu({ id: msg._id, x, y: y - 10 });
                  }}
                >
                  <div className="relative shrink-0 mb-5">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-hidayah-secondary)] flex items-center justify-center font-bold text-[10px] border border-white">
                      {msg.senderName?.charAt(0).toUpperCase()}
                    </div>
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[var(--color-hidayah-primary)]" />
                    )}
                  </div>
                  
                  <div className={cn(
                    "px-4 py-3 rounded-2xl shadow-sm border relative group/bubble", 
                    isMe 
                      ? "bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] rounded-br-none border-[var(--color-hidayah-dark)]" 
                      : "bg-[var(--color-hidayah-secondary)] text-[var(--color-hidayah-dark)] rounded-tl-none border-[var(--color-hidayah-border)]/20"
                  )}>
                    {/* Inline Quick Actions */}
                    <div className={cn(
                      "absolute top-0 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1 bg-[var(--color-hidayah-primary)] border border-[var(--color-hidayah-border)] rounded-full p-1 shadow-md z-20",
                      isMe ? "-left-16" : "-right-16"
                    )}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setReplyTo(msg); }}
                        className="p-1.5 hover:bg-[var(--color-hidayah-secondary)] rounded-full text-[var(--color-hidayah-dark)] transition-colors"
                      >
                        <Reply className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e: any) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setContextMenu({ id: msg._id, x: rect.left, y: rect.top - 50 });
                        }}
                        className="p-1.5 hover:bg-[var(--color-hidayah-secondary)] rounded-full text-[var(--color-hidayah-dark)] transition-colors"
                      >
                        <Smile className="w-3 h-3" />
                      </button>
                    </div>
                    {msg.replyTo && (
                      <div className="mb-2 p-2 rounded-xl bg-black/10 border-l-2 border-[var(--color-hidayah-gold)] text-xs">
                        <p className="font-bold opacity-70 text-[10px]">
                          Replying to @{msg.replyTo.senderId?.username || msg.replyTo.senderName || 'Unknown'}
                        </p>
                        <p className="truncate opacity-50">{msg.replyTo.text || 'Media message'}</p>
                      </div>
                    )}
                    {!isMe && <p className="text-[9px] font-bold opacity-40 mb-1 uppercase tracking-widest">{msg.senderName}</p>}
                    {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                    
                    {/* Media Attachments */}
                    {msg.imageUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-white/20 shadow-sm">
                        <img src={msg.imageUrl} className="max-w-full h-auto block" alt="Shared" />
                      </div>
                    )}
                    {msg.fileUrl && (
                      <a 
                        href={msg.fileUrl} 
                        download={msg.fileName || 'file'} 
                        className="mt-2 flex items-center gap-3 p-3 bg-black/5 rounded-xl hover:bg-black/10 transition-colors border border-black/5"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold truncate">{msg.fileName || 'Document.pdf'}</p>
                          <p className="text-[8px] opacity-40 uppercase">Click to download</p>
                        </div>
                      </a>
                    )}
                    
                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Array.from(new Set(msg.reactions.map((r: any) => r.emoji))).map(emoji => (
                          <button 
                            key={emoji as string} 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReaction(msg._id, emoji as string);
                            }}
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] transition-all active:scale-90",
                              msg.reactions.some((r: any) => String(r.userId?._id || r.userId) === String(currentUser?.id) && r.emoji === emoji)
                                ? "bg-[var(--color-hidayah-gold)]/20 text-[var(--color-hidayah-gold)] border border-[var(--color-hidayah-gold)]/30"
                                : "bg-black/10 text-inherit opacity-60"
                            )}
                          >
                            {emoji as string} {msg.reactions.filter((r: any) => r.emoji === emoji).length}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[9px] opacity-30 px-2">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Typing Indicator */}
      <div className="max-w-4xl mx-auto px-6 h-6 flex items-center shrink-0">
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="text-[10px] font-bold text-[var(--color-hidayah-dark)]/40 italic flex items-center gap-2"
            >
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-[var(--color-hidayah-gold)] rounded-full animate-bounce" />
                <span className="w-1 h-1 bg-[var(--color-hidayah-gold)] rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1 h-1 bg-[var(--color-hidayah-gold)] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="bg-[var(--color-hidayah-primary)] border-t border-[var(--color-hidayah-border)]/30 p-4 shrink-0 flex flex-col gap-2">
        {replyTo && (
          <div className="max-w-4xl mx-auto w-full px-4 py-2 bg-[var(--color-hidayah-secondary)] rounded-xl flex items-center justify-between border border-[var(--color-hidayah-gold)]/30">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[var(--color-hidayah-gold)] uppercase tracking-widest">
                Replying to @{replyTo.senderName || replyTo.senderId?.username || 'Unknown'}
              </p>
              <p className="text-xs text-[var(--color-hidayah-dark)] truncate opacity-70">
                {replyTo.text || 'Media attachment'}
              </p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-2 hover:bg-[var(--color-hidayah-border)]/20 rounded-full transition-colors text-[var(--color-hidayah-dark)] opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto w-full flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,application/pdf"
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-11 h-11 rounded-full bg-[var(--color-hidayah-secondary)] text-[var(--color-hidayah-gold)] flex items-center justify-center active:scale-90 transition-all hover:bg-[var(--color-hidayah-gold)]/10 border border-[var(--color-hidayah-gold)]/20"
            title="Send Image or File"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
          </button>
          <input 
            type="text" 
            value={newMessage}
            onChange={handleTyping}
            placeholder="Share your reflection..."
            className="flex-1 px-5 py-3 rounded-full bg-[var(--color-hidayah-secondary)] outline-none text-sm font-bold shadow-inner placeholder:text-[var(--color-hidayah-dark)]/20"
          />
          <button 
            type="submit"
            disabled={isSending || (!newMessage.trim() && !isUploading)}
            className="w-11 h-11 rounded-full bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
