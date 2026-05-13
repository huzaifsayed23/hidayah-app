"use client";

import React, { useState } from 'react';
import { Camera, Loader2, UserCircle } from 'lucide-react';
import { hidayahFetch } from '@/lib/api';

interface ProfileImageUpdateProps {
  initialImage: string | null;
  userInitial: string;
}

export default function ProfileImageUpdate({ initialImage, userInitial }: ProfileImageUpdateProps) {
  const [image, setImage] = useState<string | null>(initialImage);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setImage(base64);
        
        // Upload to API
        setIsUploading(true);
        try {
          const res = await hidayahFetch('/api/users/profile-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });
          if (!res.ok) {
            throw new Error('Failed to update image');
          }
        } catch (error) {
          console.error(error);
          alert("Failed to save image. Please try again.");
          setImage(initialImage);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.confirm("Remove profile image?")) return;
    
    setIsUploading(true);
    try {
      const res = await hidayahFetch('/api/users/profile-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: null }),
      });
      if (res.ok) {
        setImage(null);
      } else {
        throw new Error('Failed to remove image');
      }
    } catch (error) {
      console.error(error);
      alert("Failed to remove image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="w-24 h-24 rounded-full bg-[#E5D7C3] flex items-center justify-center font-bold text-[var(--color-hidayah-dark)] text-4xl mb-4 shadow-sm border-4 border-[var(--color-hidayah-primary)] outline outline-1 outline-[var(--color-hidayah-border)] overflow-hidden relative">
        {image ? (
          <img src={image} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          userInitial
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>
      
      <div className="absolute -bottom-2 -right-2 flex gap-2">
        {image && (
          <button 
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="p-2 rounded-full bg-red-500 text-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center border-2 border-[var(--color-hidayah-primary)]"
            title="Remove profile image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
        )}
        
        <label 
          htmlFor="profile-image-upload" 
          className="p-2 rounded-full bg-[var(--color-hidayah-gold)] text-white cursor-pointer shadow-lg hover:scale-110 transition-transform flex items-center justify-center border-2 border-[var(--color-hidayah-primary)]"
        >
          <Camera className="w-4 h-4" />
          <input 
            type="file" 
            id="profile-image-upload" 
            accept="image/*" 
            onChange={handleImageChange} 
            className="hidden" 
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );
}
