"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Search, Bell, Plus, UserCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import CommunityFeed from '@/components/community/CommunityFeed';
import BottomNav from '@/components/BottomNav';
import { hidayahFetch } from '@/lib/api';
import { safeStorage } from '@/lib/storage';
import { motion } from 'framer-motion';
import { SPIRITUAL_THEMES } from '@/lib/gradients';
import PullToRefresh from '@/components/PullToRefresh';

const MOODS = ["All", ...SPIRITUAL_THEMES];

function CommunityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMood = searchParams.get('mood') || "All";
  
  const [posts, setPosts] = useState<any[]>([]);
  const [userName, setUserName] = useState("User");
  const [currentUserId, setCurrentUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    // If we don't have cache, show loader
    if (!safeStorage.getItem('hidayah_community_cache')) setIsLoading(true);
    
    try {
      const meRes = await hidayahFetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/auth");
        return;
      }

      const [profileRes, postsRes] = await Promise.all([
        hidayahFetch("/api/users/profile"),
        hidayahFetch(`/api/posts?mood=${currentMood === 'All' ? '' : currentMood}`)
      ]);

      let userId = "";
      let uName = "User";
      let fetchedPosts = [];

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const user = profileData.user;
        userId = user._id;
        uName = user.username ? `@${user.username}` : user.email.split('@')[0];
        setCurrentUserId(userId);
        setUserName(uName);
        // Save for components that rely on localStorage fallback
        safeStorage.setItem('hidayah_user', JSON.stringify(user));
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        fetchedPosts = postsData.posts;
        setPosts(fetchedPosts);
      }

      // Update cache for next time - limit to first 10 posts to save space
      safeStorage.setItem('hidayah_community_cache', JSON.stringify({
        posts: fetchedPosts.slice(0, 10),
        userName: uName,
        userId: userId,
        timestamp: Date.now()
      }));

    } catch (e) {
      console.error("Community page fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Instant load from localStorage cache if available
    const cachedPosts = safeStorage.getItem('hidayah_community_cache');
    if (cachedPosts) {
      try {
        const parsed = JSON.parse(cachedPosts);
        setPosts(parsed.posts || []);
        setUserName(parsed.userName || "User");
        setCurrentUserId(parsed.userId || "");
        setIsLoading(false); // Hide spinner if we have cached data
      } catch (e) {}
    }

    fetchData();
  }, [currentMood, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-hidayah-primary)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-hidayah-gold)]" />
      </div>
    );
  }

  const handleRefresh = async () => {
    await fetchData();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-[var(--color-hidayah-primary)]">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col"
      >
        <div className="flex-1 px-4 sm:px-6 pt-0 pb-[120px] custom-scrollbar max-w-2xl mx-auto w-full">
          <CommunityFeed 
            initialPosts={posts} 
            userName={userName} 
            currentUserId={currentUserId}
            moods={MOODS}
            currentMood={currentMood}
          />
        </div>
      </motion.div>
    </PullToRefresh>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-hidayah-primary)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-hidayah-gold)]" />
      </div>
    }>
      <CommunityContent />
    </Suspense>
  );
}
