"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Search, Bell, Plus, UserCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import CommunityFeed from '@/components/community/CommunityFeed';
import BottomNav from '@/components/BottomNav';
import { hidayahFetch } from '@/lib/api';
import { SPIRITUAL_THEMES } from '@/lib/gradients';

const MOODS = ["All", ...SPIRITUAL_THEMES];

function CommunityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMood = searchParams.get('mood') || "All";
  
  const [posts, setPosts] = useState<any[]>([]);
  const [userName, setUserName] = useState("User");
  const [currentUserId, setCurrentUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Auth Check
        const meRes = await hidayahFetch("/api/auth/me");
        if (!meRes.ok) {
          router.push("/auth");
          return;
        }
        const meData = await meRes.json();
        if (!meData.authenticated) {
          router.push("/auth");
          return;
        }

        // 2. Profile Data (for username and terms check)
        const profileRes = await hidayahFetch("/api/users/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const user = profileData.user;
          
          if (user.acceptedTerms === false) {
            router.push("/agreement");
            return;
          }

          setCurrentUserId(user._id);
          if (user.username) {
            setUserName(`@${user.username}`);
          } else {
            const prefix = user.email.split('@')[0];
            setUserName(prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[0-9]/g, ''));
          }
        }

        // 3. Posts Data
        const postsRes = await hidayahFetch(`/api/posts?mood=${currentMood === 'All' ? '' : currentMood}`);
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData.posts);
        }
      } catch (e) {
        console.error("Community page fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentMood, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-hidayah-primary)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-hidayah-gold)]" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--color-hidayah-primary)]">
      <div className="flex-1 mobile-scroll-container px-4 sm:px-6 pt-0 pb-[120px] custom-scrollbar max-w-2xl mx-auto w-full">
        <CommunityFeed 
          initialPosts={posts} 
          userName={userName} 
          currentUserId={currentUserId}
          moods={MOODS}
          currentMood={currentMood}
        />
      </div>
    </div>
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
