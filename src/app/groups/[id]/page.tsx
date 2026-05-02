"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Info, Send, Loader2, MoreVertical, Reply, 
  Copy, Flag, Check, User, Smile, X, Trash2, ShieldAlert,
  CheckCheck, Image as ImageIcon, Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPusherClient } from '@/lib/pusher';
import PresenceAvatar from '@/components/PresenceAvatar';
import { HIDAYAH_API_URL, hidayahFetch } from '@/lib/api';

import { clsx } from 'clsx';

import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const REACTION_EMOJIS = ['🤲', '🌙', '❤️', '✨', '📖', '🌿', '👍'];

export default function CircleChatPage() {
  const router = useRouter();
  const { id } = useParams();
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      let base64 = reader.result as string;
      const isImage = file.type.startsWith('image/');
      
      // Compress image if it's too large
      if (isImage && file.size > 1 * 1024 * 1024) {
        try {
          base64 = await compressImage(base64);
        } catch (e) {
          console.error("Compression failed", e);
        }
      }
      
      try {
        const formData = new FormData();
        formData.append('imageUrl', isImage ? base64 : '');
        formData.append('fileUrl', !isImage ? base64 : '');
        formData.append('fileName', file.name);
        formData.append('replyToId', replyTo?._id || '');

        const res = await hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/messages`, {
          method: 'POST',
          body: formData
        });


        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Upload failed");
        }
        setReplyTo(null);
      } catch (err: any) {
        console.error(err);
        alert(err.message || "Failed to send file. The file might be too large.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // 0.7 quality
      };
      img.onerror = reject;
    });
  };

  const [presenceMembers, setPresenceMembers] = useState<Set<string>>(new Set());
  const [memberDetails, setMemberDetails] = useState<{[key: string]: any}>({});
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const fetchMuteStatus = async () => {
      try {
        const res = await hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/mute`);
        const data = await res.json();
        if (res.ok) setIsMuted(data.isMuted);

      } catch (err) {
        console.error(err);
      }
    };

    fetchMuteStatus();
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, circleRes, msgRes] = await Promise.all([
          hidayahFetch(`${HIDAYAH_API_URL}/api/auth/me`),
          hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}`),
          hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/messages`)
        ]);



        const [meData, circleData, msgData] = await Promise.all([
          meRes.json(),
          circleRes.json(),
          msgRes.json()
        ]);

        if (meRes.ok) setCurrentUser(meData);
        if (circleRes.ok) {
          setCircle(circleData.circle);
          // Pre-populate member details if available
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

    // Pusher Real-time
    const pusherClient = getPusherClient();
    
    // Regular Channel for messages
    const channel = pusherClient.subscribe(`circle-${id}`);

    // Presence Channel for online status
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
      setMemberDetails(prev => ({ 
        ...prev, 
        [member.id]: { ...(prev[member.id] || {}), isOnline: false, lastSeen: new Date() } 
      }));
    });

    channel.bind('new-message', async (data: any) => {
      let finalMessage = data;

      // If the message has a pending attachment (due to Pusher size limits), fetch full data
      if (data.imageUrl === 'PENDING' || data.fileUrl === 'PENDING') {
        try {
          const res = await hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/messages/${data._id}`);
          const resData = await res.json();

          if (res.ok) finalMessage = resData.message;
        } catch (err) {
          console.error("Error fetching full message attachment:", err);
        }
      }


      setMessages(prev => {
        if (prev.some(m => m._id === finalMessage._id)) {
          // Update the message if it was already there (optimistic or pending)
          return prev.map(m => m._id === finalMessage._id ? finalMessage : m);
        }
        
        // Show notification if window is not focused and not muted
        if (
          !isMuted && 
          document.visibilityState === 'hidden' && 
          String(finalMessage.senderId?._id || finalMessage.senderId) !== String(currentUser?.id)
        ) {
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(`New message from ${finalMessage.senderName}`, {
              body: finalMessage.text || (finalMessage.imageUrl ? "Sent an image" : "Sent a file"),
              icon: '/favicon.ico',
            });
          }
        }
        
        return [...prev, finalMessage];
      });
    });

    channel.bind('USER_STATUS_CHANGED', (data: any) => {
      setMemberDetails(prev => ({
        ...prev,
        [data.userId]: { 
          ...(prev[data.userId] || {}), 
          isOnline: data.status === 'online',
          lastSeen: data.lastSeen || new Date()
        }
      }));
    });

    channel.bind('typing', (data: any) => {
      if (data.userId === currentUser?.id) return;
      setTypingUsers(prev => {
        if (data.isTyping) {
          if (prev.includes(data.username)) return prev;
          return [...prev, data.username];
        } else {
          return prev.filter(u => u !== data.username);
        }
      });
    });

    channel.bind('reaction', (data: any) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId ? { ...m, reactions: data.reactions } : m
      ));
    });

    channel.bind('delete-message', (data: any) => {
      setMessages(prev => prev.filter(m => m._id !== data.messageId));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      presenceChannel.unbind_all();
      presenceChannel.unsubscribe();
    };
  }, [id, currentUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    const tempId = 'temp-' + Date.now();
    
    // Create optimistic message
    const optimisticMessage = {
      _id: tempId,
      text: messageText,
      senderId: { _id: currentUser?.id },
      senderName: currentUser?.username || currentUser?.email?.split('@')[0],
      createdAt: new Date().toISOString(),
      reactions: [],
      replyTo: replyTo ? {
        senderName: replyTo.senderName,
        text: replyTo.text
      } : null,
      isSending: true
    };

    // Optimistically add message and clear input
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    setReplyTo(null);
    setShowEmojiPicker(null);

    try {
      const formData = new FormData();
      formData.append('text', messageText);
      if (replyTo?._id) formData.append('replyToId', replyTo._id);

      const res = await hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/messages`, {
        method: 'POST',
        body: formData
      });


      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send message");
      }
      // Note: We don't need to manually replace the message here 
      // because Pusher will broadcast the real message and our 
      // useEffect handles deduplication by ID (if we update the tempId logic)
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(m => m._id !== tempId));
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/typing`, { 
        method: 'POST', 
        body: JSON.stringify({ 
          isTyping: true, 
          username: currentUser?.username || currentUser?.email?.split('@')[0] 
        }) 
      });


    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/typing`, { 
        method: 'POST', 
        body: JSON.stringify({ 
          isTyping: false, 
          username: currentUser?.username || currentUser?.email?.split('@')[0] 
        }) 
      });


    }, 2000);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    setShowEmojiPicker(null);
    setContextMenu(null);

    // Get current message
    const message = messages.find(m => m._id === messageId);
    if (!message) return;

    // Optimistic Update
    const oldReactions = [...(message.reactions || [])];
    const userAlreadyReacted = oldReactions.find(r => r.userId === currentUser?.id && r.emoji === emoji);
    
    let newReactions;
    if (userAlreadyReacted) {
      newReactions = oldReactions.filter(r => !(r.userId === currentUser?.id && r.emoji === emoji));
    } else {
      newReactions = [...oldReactions, { userId: currentUser?.id, emoji }];
    }

    setMessages(prev => prev.map(m => 
      m._id === messageId ? { ...m, reactions: newReactions } : m
    ));

    try {
      const res = await hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });


      if (!res.ok) {
        // Revert on error
        setMessages(prev => prev.map(m => 
          m._id === messageId ? { ...m, reactions: oldReactions } : m
        ));
      } else {
        const data = await res.json();
        // Update with real data from server
        setMessages(prev => prev.map(m => 
          m._id === messageId ? { ...m, reactions: data.reactions } : m
        ));
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, reactions: oldReactions } : m
      ));
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this reflection?")) return;
    try {
      const res = await hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/messages/${messageId}`, {

        method: 'DELETE'
      });

      if (res.ok) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
        setContextMenu(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCircle = async () => {
    if (!confirm("Are you sure you want to DELETE this circle? This will erase everything forever.")) return;
    try {
      const res = await hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}`, { method: 'DELETE' });

      if (res.ok) {

        router.push('/groups');
      } else {
        const data = await res.json();
        alert(data.message || "Error deleting circle");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };

  const groupMessagesByDay = () => {
    const groups: { [key: string]: any[] } = {};
    messages.forEach(msg => {
      const dateKey = new Date(msg.createdAt).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    });
    return groups;
  };

  const msgGroups = groupMessagesByDay();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-hidayah-primary)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-hidayah-gold)]" />
      </div>
    );
  }

  const isCreator = currentUser && circle && (
    String(circle.creatorId) === String(currentUser.id) || 
    String(circle.creatorId) === String(currentUser.email)
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--color-hidayah-primary)]">
      {/* Header */}
      <header className="bg-[var(--color-hidayah-primary)] border-b border-[var(--color-hidayah-border)]/50 px-4 py-4 shrink-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-[var(--color-hidayah-dark)]" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--color-hidayah-gold)]/10 flex items-center justify-center text-[var(--color-hidayah-gold)] border border-[var(--color-hidayah-gold)]/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-serif font-bold text-[var(--color-hidayah-dark)] line-clamp-1">{circle?.title}</h1>
              </div>
            </div>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowEmojiPicker(showEmojiPicker === 'header' ? null : 'header')}
              className="p-2.5 hover:bg-[var(--color-hidayah-secondary)] rounded-xl transition-colors border border-transparent hover:border-[var(--color-hidayah-border)]/30"
            >
              <MoreVertical className="w-5 h-5 text-[var(--color-hidayah-dark)] opacity-70" />
            </button>
            <AnimatePresence>
              {showEmojiPicker === 'header' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-hidayah-primary)] rounded-2xl shadow-2xl border border-[var(--color-hidayah-border)]/20 overflow-hidden z-[100]"
                >
                  <div className="p-1.5 flex flex-col">
                    <button 
                      onClick={() => { setShowEmojiPicker(null); router.push(`/groups/${id}/info`); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-[var(--color-hidayah-secondary)] rounded-xl text-sm font-medium transition-colors text-[var(--color-hidayah-dark)]"
                    >
                      <Info className="w-4 h-4 opacity-60" /> Circle Info
                    </button>
                    {isCreator && (
                      <button 
                        onClick={() => { setShowEmojiPicker(null); handleDeleteCircle(); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors text-red-600 border-t border-gray-50 mt-1"
                      >
                        <Trash2 className="w-4 h-4 opacity-60" /> Delete Circle
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth bg-[var(--color-hidayah-primary)] relative">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none dark:opacity-[0.02]" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0L55.8 32.7L88.2 25L75 55.8L93.3 88.2L61.8 75L50 100L38.2 75L6.7 88.2L25 55.8L11.8 25L44.2 32.7L50 0Z' fill='%23C5A267' fill-opacity='0.2'/%3E%3C/svg%3E")`, backgroundSize: '80px 80px' }} 
        />
        <div className="max-w-4xl mx-auto space-y-8">
          {Object.entries(msgGroups).map(([day, dayMessages]) => (
            <div key={day} className="space-y-6">
              <div className="flex justify-center">
                <span className="px-4 py-1.5 rounded-full bg-[var(--color-hidayah-secondary)] border border-hidayah-border/10 text-[10px] font-bold text-[var(--color-hidayah-dark)]/60 uppercase tracking-[0.2em] shadow-sm">
                  {formatDateLabel(day)}
                </span>
              </div>
              
              {dayMessages.map((msg, idx) => {
                const isMe = String(msg.senderId?._id || msg.senderId) === String(currentUser?.id) || 
                             (currentUser?.username && msg.senderName?.toLowerCase() === currentUser.username.toLowerCase());
                
                return (
                  <div 
                    key={msg._id} 
                    className={cn(
                      "flex gap-3 max-w-[90%] sm:max-w-[75%]",
                      isMe ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
                    )}
                  >
                    {!isMe && (
                      <div className="mt-1">
                        <PresenceAvatar 
                          size="sm"
                          showLastSeen={false}
                          user={{
                            username: msg.senderName,
                            image: memberDetails[msg.senderId?._id || msg.senderId]?.image,
                            isOnline: presenceMembers.has(String(msg.senderId?._id || msg.senderId)),
                            lastSeen: memberDetails[msg.senderId?._id || msg.senderId]?.lastSeen || msg.createdAt
                          }} 
                        />
                      </div>
                    )}

                    <div className={cn(
                      "flex flex-col gap-1",
                      isMe ? "items-end" : "items-start"
                    )}>
                      {!isMe && (
                        <span className="text-[10px] font-bold text-[var(--color-hidayah-dark)]/40 ml-1 mb-1 uppercase tracking-widest">
                          {msg.senderName}
                        </span>
                      )}

                    {msg.replyTo && (
                      <div className={cn(
                        "px-3 py-2 rounded-2xl bg-black/5 border-l-2 border-[var(--color-hidayah-gold)] mb-1 max-w-full opacity-60",
                        isMe ? "mr-2" : "ml-2"
                      )}>
                        <p className="text-[9px] font-bold text-[var(--color-hidayah-gold)] truncate uppercase">
                          Replying to {msg.replyTo.senderName}
                        </p>
                        <p className="text-[10px] line-clamp-1 italic">{msg.replyTo.text}</p>
                      </div>
                    )}

                    <div 
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ id: msg._id, x: e.pageX, y: e.pageY });
                      }}
                      className={cn(
                        "relative group px-5 py-3.5 rounded-[2rem] text-[15px] leading-relaxed shadow-sm transition-all hover:shadow-md cursor-default flex flex-col gap-2",
                        isMe 
                          ? "bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] rounded-tr-none shadow-md" 
                          : "bg-[var(--color-hidayah-secondary)] text-[var(--color-hidayah-dark)] rounded-tl-none border border-[var(--color-hidayah-border)]/40 shadow-sm"
                      )}
                    >
                      {msg.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-white/20 shadow-inner">
                          <img 
                            src={msg.imageUrl} 
                            alt="Attachment" 
                            className="max-w-full h-auto object-cover hover:scale-[1.02] transition-transform cursor-pointer"
                            onClick={() => window.open(msg.imageUrl, '_blank')}
                          />
                        </div>
                      )}

                      {msg.fileUrl && (
                        <a 
                          href={msg.fileUrl} 
                          download={msg.fileName || 'file'}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10 no-underline"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[var(--color-hidayah-gold)] flex items-center justify-center text-white shrink-0">
                            <Paperclip className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate opacity-90">{msg.fileName || 'Attached File'}</p>
                            <p className="text-[10px] uppercase tracking-widest font-black opacity-40">Download File</p>
                          </div>
                        </a>
                      )}

                      {msg.text && <span>{msg.text}</span>}
                      
                      {/* Reactions Display */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className={cn(
                              "absolute -bottom-2 flex gap-0.5 bg-[var(--color-hidayah-primary)] rounded-full px-1.5 py-0.5 shadow-md border border-[var(--color-hidayah-border)]/20",
                              isMe ? "right-2" : "left-2"
                            )}>
                              {Array.from(new Set(msg.reactions.map((r: any) => r.emoji))).map((emoji: any) => (
                                <span key={emoji} className="text-[11px]">{emoji}</span>
                              ))}
                              <span className="text-[9px] font-bold ml-0.5 text-[var(--color-hidayah-dark)]/40 self-center">
                                {msg.reactions.length}
                              </span>
                            </div>
                          )}
                      
                      <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100",
                        isMe ? "-left-20 pr-2 flex-row-reverse" : "-right-20 pl-2"
                      )}>
                        <button 
                          onClick={() => setShowEmojiPicker(msg._id)}
                          className="p-1.5 hover:bg-[var(--color-hidayah-dark)]/5 rounded-full text-[var(--color-hidayah-dark)]/60 hover:text-[var(--color-hidayah-gold)] transition-colors"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setReplyTo(msg)}
                          className="p-1.5 hover:bg-[var(--color-hidayah-dark)]/5 rounded-full text-[var(--color-hidayah-dark)]/60 hover:text-[var(--color-hidayah-gold)] transition-colors"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                      </div>

                          <AnimatePresence>
                            {showEmojiPicker === msg._id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className={cn(
                                  "absolute bottom-full mb-4 p-2 bg-[var(--color-hidayah-primary)] rounded-2xl shadow-2xl border border-[var(--color-hidayah-border)]/20 flex gap-1 z-50",
                                  isMe ? "right-0" : "left-0"
                                )}
                              >
                                {REACTION_EMOJIS.map(emoji => (
                                  <button 
                                    key={emoji}
                                    onClick={() => handleReaction(msg._id, emoji)}
                                    className="text-lg hover:scale-125 transition-transform p-1.5 rounded-lg hover:bg-[var(--color-hidayah-secondary)]"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                    </div>
                    {/* Timestamp */}
                    <span className={cn(
                      "text-[9px] font-bold text-[var(--color-hidayah-dark)]/80 mt-1 px-2 mb-1",
                      isMe ? "text-right" : "text-left"
                    )}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Typing Indicators */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-hidayah-secondary)] border border-[var(--color-hidayah-border)]/50 shadow-sm w-fit mx-auto sticky bottom-2 z-10"
              >
                <div className="flex gap-1">
                  <span className="w-1 h-1 rounded-full bg-[var(--color-hidayah-gold)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-[var(--color-hidayah-gold)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-[var(--color-hidayah-gold)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] font-black text-[var(--color-hidayah-dark)]/60 uppercase tracking-widest">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0]} is typing...`
                    : typingUsers.length === 2 
                      ? `${typingUsers[0]} & ${typingUsers[1]} are typing...`
                      : `${typingUsers.length} people are typing...`
                  }
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-[var(--color-hidayah-primary)] border-t border-[var(--color-hidayah-border)]/50 p-6 shrink-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          {/* Reply Preview */}
          <AnimatePresence>
            {replyTo && (
              <motion.div 
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between bg-[#E5D5C0] px-4 py-3 rounded-[1.25rem] border-l-4 border-[var(--color-hidayah-gold)] shadow-sm">
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="text-[10px] font-bold text-[var(--color-hidayah-gold)] uppercase tracking-widest">
                      Replying to {replyTo.senderName}
                    </span>
                    <p className="text-xs text-[var(--color-hidayah-dark)] opacity-60 line-clamp-1 italic">
                      "{replyTo.text}"
                    </p>
                  </div>
                  <button 
                    onClick={() => setReplyTo(null)} 
                    className="p-1.5 hover:bg-black/5 rounded-full transition-colors ml-4"
                  >
                    <X className="w-4 h-4 text-[var(--color-hidayah-dark)] opacity-40" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {circle?.memberIds?.length < 3 ? (
            <div className="bg-[var(--color-hidayah-secondary)] px-8 py-6 rounded-[2.5rem] border border-dashed border-[var(--color-hidayah-border)]/50 text-center space-y-2">
              <ShieldAlert className="w-6 h-6 mx-auto text-amber-500/50" />
              <p className="text-sm font-bold text-[var(--color-hidayah-dark)]/60">Community Circle Pending</p>
              <p className="text-xs text-[var(--color-hidayah-dark)]/40 leading-relaxed">
                This circle needs at least 3 members to activate reflections. 
                Invite more brothers and sisters to begin.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-[var(--color-hidayah-dark)]/40 hover:text-[var(--color-hidayah-gold)] transition-colors hover:bg-[var(--color-hidayah-secondary)] rounded-full"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden" 
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
              </div>

              <div className="flex-1 relative group">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Share your reflection..."
                  disabled={isUploading}
                  className="w-full px-6 py-4 rounded-full bg-[var(--color-hidayah-secondary)] border border-[var(--color-hidayah-border)]/30 focus:border-[var(--color-hidayah-gold)] focus:bg-[var(--color-hidayah-primary)] transition-all outline-none text-[15px] font-bold text-[var(--color-hidayah-dark)] placeholder:text-[var(--color-hidayah-dark)]/40 shadow-inner"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => setShowEmojiPicker(showEmojiPicker === 'input' ? null : 'input')}
                    className="p-1.5 text-[var(--color-hidayah-dark)]/30 hover:text-[var(--color-hidayah-gold)] transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {showEmojiPicker === 'input' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute bottom-full right-0 mb-4 p-2 bg-[var(--color-hidayah-primary)] rounded-2xl shadow-2xl border border-[var(--color-hidayah-border)]/20 flex gap-2 z-50"
                      >
                        {REACTION_EMOJIS.map(emoji => (
                          <button 
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setNewMessage(prev => prev + emoji);
                              setShowEmojiPicker(null);
                            }}
                            className="text-xl hover:scale-125 transition-transform p-1.5 rounded-lg hover:bg-[var(--color-hidayah-secondary)]"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <button 
                disabled={(!newMessage.trim() && !isUploading) || isSending || isUploading}
                className="w-12 h-12 rounded-full bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-lg shadow-black/5 active:scale-90"
              >
                {isSending || isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 ml-0.5" />
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Context Menu / Long Press Overlay */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setContextMenu(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="fixed z-[101] w-56 bg-[var(--color-hidayah-primary)] rounded-2xl shadow-2xl border border-[var(--color-hidayah-border)]/30 overflow-hidden"
              style={{ top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 250 : 0), left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 240 : 0) }}
            >
              <div className="p-2 flex flex-col">
                <div className="flex justify-between px-2 py-2 mb-2 bg-[var(--color-hidayah-secondary)]/50 rounded-xl">
                  {REACTION_EMOJIS.map(emoji => (
                    <button 
                      key={emoji} 
                      onClick={() => handleReaction(contextMenu.id, emoji)}
                      className="text-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    const msg = messages.find(m => m._id === contextMenu.id);
                    setReplyTo(msg);
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-[var(--color-hidayah-secondary)] rounded-xl text-sm font-medium transition-colors text-[var(--color-hidayah-dark)]"
                >
                  <Reply className="w-4 h-4 opacity-60" /> Reply
                </button>
                <button 
                  onClick={() => {
                    const msg = messages.find(m => m._id === contextMenu.id);
                    navigator.clipboard.writeText(msg.text);
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-[var(--color-hidayah-secondary)] rounded-xl text-sm font-medium transition-colors text-[var(--color-hidayah-dark)]"
                >
                  <Copy className="w-4 h-4 opacity-60" /> Copy Text
                </button>
                <button className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-[var(--color-hidayah-secondary)] rounded-xl text-sm font-medium transition-colors text-red-500">
                  <ShieldAlert className="w-4 h-4 opacity-60" /> Report Message
                </button>
                {(String(messages.find(m => m._id === contextMenu.id)?.senderId?._id || messages.find(m => m._id === contextMenu.id)?.senderId) === String(currentUser?.id) || 
                  (currentUser?.username && messages.find(m => m._id === contextMenu.id)?.senderName?.toLowerCase() === currentUser.username.toLowerCase())) && (
                  <button 
                    onClick={() => handleDeleteMessage(contextMenu.id)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors text-red-600 mt-1"
                  >
                    <Trash2 className="w-4 h-4 opacity-60" /> Delete
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .scroll-smooth {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
