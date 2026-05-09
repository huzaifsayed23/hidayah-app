"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Info, Send, Loader2, MoreVertical, Reply, 
  Copy, ShieldAlert, User, Users, Smile, X, Trash2,
  Paperclip
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
  const params = useParams();
  const id = params?.id as string;
  
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      let base64 = reader.result as string;
      const isImage = file.type.startsWith('image/');
      
      // Optimistic message for the file
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
        const formData = new FormData();
        formData.append('imageUrl', isImage ? base64 : '');
        formData.append('fileUrl', !isImage ? base64 : '');
        formData.append('fileName', file.name);
        if (replyTo?._id) formData.append('replyToId', replyTo._id);

        const res = await hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/messages`, {
          method: 'POST',
          body: formData
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Upload failed");
        }
        
        // Remove optimistic message when real one arrives via Pusher
        setMessages(prev => prev.filter(m => m._id !== tempId));
        setReplyTo(null);
      } catch (err: any) {
        console.error(err);
        setMessages(prev => prev.filter(m => m._id !== tempId));
        alert(err.message || "Failed to send file. Ensure it is under 4MB.");
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
    if (!id) return;
    const fetchData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hidayah_token') : null;
      if (!token) {
        router.push('/auth');
        return;
      }

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
      setMessages(prev => {
        if (prev.some(m => m._id === data._id)) return prev;
        return [...prev, data];
      });
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
      const formData = new FormData();
      formData.append('text', messageText);
      if (replyTo?._id) formData.append('replyToId', replyTo._id);

      const res = await hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/messages`, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) {
        throw new Error("Failed to send");
      }
      
      // We don't remove optimistic here, we let Pusher handle it or use the result
      const data = await res.json();
      if (data.message) {
        setMessages(prev => prev.map(m => m._id === tempId ? data.message : m));
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setNewMessage(messageText); // Restore text for retry
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!isTyping && id) {
      setIsTyping(true);
      hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/typing`, { 
        method: 'POST', 
        body: JSON.stringify({ isTyping: true, username: currentUser?.username }) 
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (id) {
        hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/typing`, { 
          method: 'POST', 
          body: JSON.stringify({ isTyping: false, username: currentUser?.username }) 
        });
      }
    }, 2000);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!id) return;
    try {
      await hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      const res = await hidayahFetch(`${HIDAYAH_API_URL}/api/circles/${id}/messages/${messageId}`, { method: 'DELETE' });
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
            className="fixed z-[100] bg-white rounded-2xl shadow-2xl border border-[var(--color-hidayah-border)]/50 p-1 min-w-[140px]"
            style={{ 
              top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 80 : 0), 
              left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 150 : 0) 
            }}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); handleDeleteMessage(contextMenu.id); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold"
            >
              <Trash2 className="w-4 h-4" />
              Delete Message
            </button>
          </motion.div>
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
          <button onClick={() => router.push(`/community/${id}/info`)} className="p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-xl transition-colors">
            <Info className="w-5 h-5 text-[var(--color-hidayah-dark)] opacity-70" />
          </button>
        </div>
      </header>

      {/* Message List */}
      <div className="flex-1 mobile-scroll-container px-4 py-6 bg-[var(--color-hidayah-primary)] relative">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => {
            const isMe = String(msg.senderId?._id || msg.senderId) === String(currentUser?.id);
            const isOnline = presenceMembers.has(String(msg.senderId?._id || msg.senderId));
            
            return (
              <div 
                key={msg._id} 
                className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}
                onContextMenu={(e) => isMe && handleRightClick(msg._id, e)}
                onTouchStart={(e) => isMe && handleTouchStart(msg._id, e)}
                onTouchEnd={handleTouchEnd}
                onContextMenuCapture={(e) => e.preventDefault()}
              >
                <div className={cn("flex items-end gap-2 max-w-[85%]", isMe ? "flex-row-reverse" : "flex-row")}>
                  <div className="relative shrink-0 mb-5">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-hidayah-secondary)] flex items-center justify-center font-bold text-[10px] border border-white">
                      {msg.senderName?.charAt(0).toUpperCase()}
                    </div>
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[var(--color-hidayah-primary)]" />
                    )}
                  </div>
                  
                  <div className={cn(
                    "px-4 py-3 rounded-2xl shadow-sm border", 
                    isMe 
                      ? "bg-[var(--color-hidayah-dark)] text-white rounded-br-none border-[var(--color-hidayah-dark)]" 
                      : "bg-[var(--color-hidayah-secondary)] text-[var(--color-hidayah-dark)] rounded-tl-none border-[var(--color-hidayah-border)]/20"
                  )}>
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
      <div className="bg-[var(--color-hidayah-primary)] border-t border-[var(--color-hidayah-border)]/30 p-4 shrink-0">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2">
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
            className="w-11 h-11 rounded-full bg-[var(--color-hidayah-secondary)] text-[var(--color-hidayah-dark)] flex items-center justify-center active:scale-90 transition-all hover:bg-[var(--color-hidayah-border)]/20"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
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
            className="w-11 h-11 rounded-full bg-[var(--color-hidayah-dark)] text-white flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
