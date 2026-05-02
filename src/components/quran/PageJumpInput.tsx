"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PageJumpInput() {
  const [page, setPage] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(page);
    if (p >= 1 && p <= 604) {
      router.push(`/quran/read/${p}`);
    } else {
      alert("Please enter a page number between 1 and 604");
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="number"
        name="page"
        placeholder="Jump to Page (1-604)..."
        value={page}
        onChange={(e) => setPage(e.target.value)}
        className="w-full px-6 py-4 rounded-2xl bg-[var(--color-hidayah-secondary)] border border-[var(--color-hidayah-border)]/40 focus:border-hidayah-gold focus:outline-none focus:ring-1 focus:ring-hidayah-gold transition-all shadow-sm text-[var(--color-hidayah-dark)] placeholder:text-[var(--color-hidayah-dark)]/40"
      />
      <button 
        type="submit" 
        onClick={handleSubmit}
        className="px-6 py-2 bg-hidayah-gold text-white rounded-2xl font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        Go
      </button>
    </div>
  );
}
