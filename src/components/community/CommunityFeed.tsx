"use client";

import React, { useState, useEffect, useRef } from 'react';
import CommunityHeader from './CommunityHeader';
import FeedCard from './FeedCard';
import UserSearchResult from './UserSearchResult';
import Link from 'next/link';
import { Users, BookOpen } from 'lucide-react';
import { hidayahFetch } from '@/lib/api';

interface CommunityFeedProps {
  initialPosts: any[];
  userName: string;
  currentUserId: string;
  moods: string[];
  currentMood: string;
}

export default function CommunityFeed({ initialPosts, userName, currentUserId, moods, currentMood }: CommunityFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<'reflections' | 'users'>('reflections');

  const filteredPosts = initialPosts.filter(post => 
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.verse?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.verse?.surah?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (searchQuery.length >= 2) {
      // Auto-switch to users tab if query starts with @ or looks like a username search
      if (searchQuery.startsWith('@') && activeTab !== 'users') {
        setActiveTab('users');
      }

      const timer = setTimeout(async () => {
        setIsSearchingUsers(true);
        try {
          const res = await hidayahFetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          setUserResults(data.users || []);
          
          // Intelligent switch: If no posts match but users ARE found, switch to users tab
          if (filteredPosts.length === 0 && data.users?.length > 0 && activeTab === 'reflections') {
            setActiveTab('users');
          }
        } catch (e) {
          console.error("User search failed", e);
        } finally {
          setIsSearchingUsers(false);
        }
      }, 400); // 400ms debounce
      return () => clearTimeout(timer);
    } else {
      setUserResults([]);
    }
  }, [searchQuery, activeTab, filteredPosts.length]);

  return (
    <>
      <CommunityHeader 
        userName={userName} 
        onSearch={setSearchQuery} 
      />

      {/* Welcome Statement (Hidden when searching members) */}
      {!(searchQuery.length > 0 && activeTab === 'users') && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <p className="text-sm md:text-base text-[var(--color-hidayah-dark)] font-semibold tracking-tight">
            Latest reflections from the community
          </p>
          <div className="h-1 w-8 bg-[var(--color-hidayah-gold)] mt-1.5 rounded-full"></div>
        </div>
      )}

      {/* Search Type Tabs (Only shown when searching) */}
      {searchQuery.length > 0 && (
        <div className="flex gap-2 mb-6 p-1 bg-[var(--color-hidayah-secondary)] rounded-2xl border border-[var(--color-hidayah-border)]/30">
          <button 
            onClick={() => setActiveTab('reflections')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'reflections' ? 'bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] shadow-sm' : 'text-[var(--color-hidayah-dark)] opacity-40 hover:opacity-100'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Reflections
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] shadow-sm' : 'text-[var(--color-hidayah-dark)] opacity-40 hover:opacity-100'}`}
          >
            <Users className="w-3.5 h-3.5" />
            Members
          </button>
        </div>
      )}

      {/* Member Peek (Only shown when on reflections tab but members found) */}
      {searchQuery.length > 0 && activeTab === 'reflections' && userResults.length > 0 && (
        <div className="mb-8 p-4 bg-[var(--color-hidayah-gold)]/5 rounded-[32px] border border-[var(--color-hidayah-gold)]/20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-hidayah-gold)]">Matching Members</h4>
            <button onClick={() => setActiveTab('users')} className="text-[10px] font-bold text-[var(--color-hidayah-dark)] opacity-40 hover:opacity-100">View All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-1">
            {userResults.slice(0, 5).map(user => (
              <Link key={user.id} href={`/profile?u=${user.username}`} className="flex flex-col items-center shrink-0 gap-1.5 group">
                <div className="w-11 h-11 rounded-full bg-white border border-[var(--color-hidayah-border)]/20 overflow-hidden flex items-center justify-center font-bold text-xs shadow-sm group-hover:border-[var(--color-hidayah-gold)] transition-colors">
                   {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : user.username?.charAt(0).toUpperCase()}
                </div>
                <span className="text-[9px] font-bold text-[var(--color-hidayah-dark)] opacity-60 group-hover:opacity-100 transition-opacity truncate w-14 text-center">@{user.username}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mood Filter (Hidden when searching members) */}
      {!(searchQuery.length > 0 && activeTab === 'users') && (
        <div className="flex gap-2.5 mb-8 horizontal-slider hide-scrollbar pb-2">
          {moods.map((m) => (
            <Link
              key={m}
              href={`/community${m === "All" ? "" : `?mood=${encodeURIComponent(m)}`}`}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 shrink-0 ${
                currentMood === m
                  ? "bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] shadow-md"
                  : "bg-[var(--color-hidayah-secondary)] text-[var(--color-hidayah-dark)] border border-[var(--color-hidayah-border)]/40 hover:border-[var(--color-hidayah-gold)]/60 hover:bg-[#E5D7C3]"
              }`}
            >
              {m}
            </Link>
          ))}
        </div>
      )}

      {/* Feed Content */}
      <div className="flex flex-col gap-6">
        {searchQuery.length > 0 && activeTab === 'users' ? (
          <div className="flex flex-col gap-2 pr-1 pb-4">
            {isSearchingUsers ? (
              <div className="py-12 text-center animate-pulse">
                <p className="text-[var(--color-hidayah-dark)] opacity-40 font-medium text-sm">Searching community members...</p>
              </div>
            ) : userResults.length > 0 ? (
              userResults.map((user) => (
                <UserSearchResult key={user.id} user={user} />
              ))
            ) : (
              <div className="py-12 text-center bg-[var(--color-hidayah-secondary)] rounded-[32px] border border-dashed border-[var(--color-hidayah-border)]/40">
                <h3 className="text-[var(--color-hidayah-dark)] font-bold text-sm mb-1">No members found</h3>
                <p className="text-[var(--color-hidayah-dark)] opacity-40 text-xs">Try searching by username</p>
              </div>
            )}
          </div>
        ) : (
          filteredPosts.length > 0 ? (
            <div className="flex flex-col gap-6">
              {filteredPosts.slice(0, 4).map((post: any) => (
                <FeedCard key={post._id} id={post._id} {...post} currentUserId={currentUserId} currentUserName={userName} />
              ))}
              {filteredPosts.length > 4 && (
                <PacedFeed 
                  posts={filteredPosts.slice(4)} 
                  currentUserId={currentUserId} 
                  currentUserName={userName}
                />
              )}
            </div>
          ) : (
            <div className="py-20 text-center bg-[var(--color-hidayah-secondary)] rounded-[32px] border border-dashed border-[var(--color-hidayah-border)]">
              <p className="text-[var(--color-hidayah-dark)] opacity-50 font-medium">No reflections found matching your search.</p>
            </div>
          )
        )}
      </div>
    </>
  );
}

function PacedFeed({ posts, currentUserId, currentUserName }: { posts: any[], currentUserId: string, currentUserName?: string }) {
  const [chunksToReveal, setChunksToReveal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  
  const chunkSize = 4;
  const totalChunks = Math.ceil(posts.length / chunkSize);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoading && chunksToReveal < totalChunks) {
        setIsLoading(true);
        setTimeout(() => {
          setChunksToReveal(prev => prev + 1);
          setIsLoading(false);
        }, 600);
      }
    }, { threshold: 0.1 });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [chunksToReveal, isLoading, totalChunks]);

  return (
    <div className="flex flex-col gap-6">
      {posts.slice(0, chunksToReveal * chunkSize).map((post: any) => (
        <FeedCard key={post._id} id={post._id} {...post} currentUserId={currentUserId} currentUserName={currentUserName} />
      ))}
      {chunksToReveal < totalChunks && (
        <div ref={observerRef} className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--color-hidayah-gold)] border-t-transparent rounded-full animate-spin opacity-40" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-hidayah-dark)] opacity-30">
            Gathering more reflections...
          </p>
        </div>
      )}
    </div>
  );
}
