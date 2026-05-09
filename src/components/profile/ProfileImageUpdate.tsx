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
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
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
      
      <label 
        htmlFor="profile-image-upload" 
        className="absolute bottom-4 right-0 p-2 rounded-full bg-[var(--color-hidayah-gold)] text-white cursor-pointer shadow-lg hover:scale-110 transition-transform flex items-center justify-center border-2 border-[var(--color-hidayah-primary)]"
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
  );
}
