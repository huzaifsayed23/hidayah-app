"use client";

import React, { useState, useEffect, useRef } from 'react';
import CommunityHeader from './CommunityHeader';
import FeedCard from './FeedCard';
import UserSearchResult from './UserSearchResult';
import Link from 'next/link';
import { Users, BookOpen } from 'lucide-react';

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

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(async () => {
        setIsSearchingUsers(true);
        try {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          setUserResults(data.users || []);
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
  }, [searchQuery]);

  const filteredPosts = initialPosts.filter(post => 
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.verse?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.verse?.surah?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Mood Filter (Hidden when searching members) */}
      {!(searchQuery.length > 0 && activeTab === 'users') && (
        <div className="flex flex-wrap gap-2.5 mb-8 overflow-x-auto pb-2 scrollbar-hide">
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
          // User Results (omitted for brevity, keep existing logic)
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
          // Post Results with Paced Scrolling
          filteredPosts.length > 0 ? (
            <div className="flex flex-col gap-6">
              {/* First 4 posts - Immediate */}
              {filteredPosts.slice(0, 4).map((post: any) => (
                <FeedCard key={post._id} id={post._id} {...post} currentUserId={currentUserId} />
              ))}

              {/* Subsequent posts - Revealed in chunks of 4 with a delay */}
              {filteredPosts.length > 4 && (
                <PacedFeed 
                  posts={filteredPosts.slice(4)} 
                  currentUserId={currentUserId} 
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

/**
 * PacedFeed Component: Handles revealing posts in chunks with a simple 1.5s delay
 */
function PacedFeed({ posts, currentUserId }: { posts: any[], currentUserId: string }) {
  const [chunksToReveal, setChunksToReveal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  
  const chunkSize = 4;
  const totalChunks = Math.ceil(posts.length / chunkSize);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoading && chunksToReveal < totalChunks) {
        setIsLoading(true);
        // Artificial 1.5s delay as requested
        setTimeout(() => {
          setChunksToReveal(prev => prev + 1);
          setIsLoading(false);
        }, 1500);
      }
    }, { threshold: 0.1 });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [chunksToReveal, isLoading, totalChunks]);

  return (
    <div className="flex flex-col gap-6">
      {/* Revealed Chunks */}
      {posts.slice(0, chunksToReveal * chunkSize).map((post: any) => (
        <FeedCard key={post._id} id={post._id} {...post} currentUserId={currentUserId} />
      ))}

      {/* Loading Indicator / Observer Target */}
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
