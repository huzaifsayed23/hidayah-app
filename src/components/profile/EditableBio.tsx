"use client";

import React, { useState } from 'react';
import { Check, Edit2, X } from 'lucide-react';

interface EditableBioProps {
  initialBio: string;
}

export default function EditableBio({ initialBio }: EditableBioProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(initialBio);
  const [tempBio, setTempBio] = useState(initialBio);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (tempBio === bio) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: tempBio }),
      });

      if (res.ok) {
        setBio(tempBio);
        setIsEditing(false);
      } else {
        throw new Error('Failed to update bio');
      }
    } catch (error) {
      alert("Failed to update bio. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="w-full max-w-md mt-2 flex flex-col items-center gap-3">
        <textarea
          autoFocus
          value={tempBio}
          onChange={(e) => setTempBio(e.target.value)}
          className="w-full p-3 rounded-xl bg-[var(--color-hidayah-secondary)] border border-[var(--color-hidayah-gold)] text-sm text-[var(--color-hidayah-dark)] outline-none resize-none min-h-[80px]"
          placeholder="Write a short bio..."
          maxLength={150}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-2 rounded-full bg-[var(--color-hidayah-gold)] text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => { setTempBio(bio); setIsEditing(false); }}
            className="p-2 rounded-full bg-black/5 text-[var(--color-hidayah-dark)]/50 hover:bg-black/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative mt-2 flex flex-col items-center">
      <div className="relative">
        <p className="text-[var(--color-hidayah-dark)] opacity-70 max-w-md text-balance text-sm px-6">
          {bio}
        </p>
        <button 
          onClick={() => setIsEditing(true)}
          className="absolute -right-2 top-0 p-1.5 rounded-full bg-[var(--color-hidayah-secondary)] text-[var(--color-hidayah-gold)] shadow-sm hover:scale-110 transition-all border border-[var(--color-hidayah-border)]/30"
          title="Edit Bio"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
