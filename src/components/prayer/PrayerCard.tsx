"use client";

import React, { useState, useEffect } from 'react';
import { Clock, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export default function PrayerCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<string>("");
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string } | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("Detecting...");

  useEffect(() => {
    const fetchPrayerTimes = async (lat: number, lng: number) => {
      try {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=2`);
        const data = await res.json();
        if (data.code === 200) {
          const timings = data.data.timings;
          setTimes({
            Fajr: timings.Fajr,
            Sunrise: timings.Sunrise,
            Dhuhr: timings.Dhuhr,
            Asr: timings.Asr,
            Maghrib: timings.Maghrib,
            Isha: timings.Isha,
          });
          
          // Reverse geocode to get city name
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const geoData = await geoRes.json();
          const city = geoData.address.city || geoData.address.town || geoData.address.village || "My Location";
          setLocationName(city);
        } else {
          setError("Failed to fetch timings");
        }
      } catch (err) {
        setError("Error fetching prayer times");
      } finally {
        setLoading(false);
      }
    };

    const getLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchPrayerTimes(position.coords.latitude, position.coords.longitude);
          },
          (err) => {
            setError("Location access denied. Using default.");
            // Fallback to a default location (e.g., Makkah)
            fetchPrayerTimes(21.4225, 39.8262);
            setLocationName("Makkah");
          }
        );
      } else {
        setError("Geolocation not supported");
        setLoading(false);
      }
    };

    getLocation();
  }, []);

  useEffect(() => {
    if (!times) return;

    const updatePrayerStatus = () => {
      const now = new Date();
      const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
      const currentTime = now.getHours() * 60 + now.getMinutes();

      let current = "Isha";
      let next = { name: "Fajr", time: times.Fajr };

      for (let i = 0; i < prayerNames.length; i++) {
        const [hours, minutes] = (times as any)[prayerNames[i]].split(':').map(Number);
        const prayerTime = hours * 60 + minutes;

        if (currentTime < prayerTime) {
          next = { name: prayerNames[i], time: (times as any)[prayerNames[i]] };
          current = i === 0 ? "Isha" : prayerNames[i - 1];
          break;
        }
        
        if (i === prayerNames.length - 1) {
            // After Isha
            current = "Isha";
            next = { name: "Fajr", time: times.Fajr };
        }
      }

      setCurrentPrayer(current);
      setNextPrayer(next);

      // Countdown logic
      const [nHours, nMinutes] = next.time.split(':').map(Number);
      let nextDate = new Date();
      nextDate.setHours(nHours, nMinutes, 0);
      
      if (nextDate < now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }

      const diff = nextDate.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${hours}h ${mins}m`);
    };

    updatePrayerStatus();
    const interval = setInterval(updatePrayerStatus, 60000);
    return () => clearInterval(interval);
  }, [times]);

  if (loading) {
    return (
      <div className="w-full bg-[var(--color-hidayah-secondary)] rounded-[32px] p-8 border border-[var(--color-hidayah-border)]/30 flex items-center justify-center min-h-[160px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-[var(--color-hidayah-gold)] animate-spin" />
          <p className="text-sm text-[var(--color-hidayah-dark)]/50 font-medium">Calculating prayer times...</p>
        </div>
      </div>
    );
  }

  if (error && !times) {
      return (
        <div className="w-full bg-[var(--color-hidayah-secondary)] rounded-[32px] p-6 border border-[var(--color-hidayah-border)]/30">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      );
  }

  return (
    <Link href="/prayer">
      <motion.div 
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-[var(--color-hidayah-secondary)] rounded-[32px] p-6 sm:p-8 border border-[var(--color-hidayah-border)]/30 shadow-sm relative overflow-hidden group cursor-pointer"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Clock className="w-24 h-24 text-[var(--color-hidayah-dark)]" />
        </div>

        <div className="flex flex-col gap-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full border border-[var(--color-hidayah-border)]/30">
              <MapPin className="w-3.5 h-3.5 text-[var(--color-hidayah-gold)]" />
              <span className="text-xs font-bold text-[var(--color-hidayah-dark)]/70 uppercase tracking-wider">{locationName}</span>
            </div>
            <div className="p-2 rounded-full bg-[var(--color-hidayah-gold)]/10 text-[var(--color-hidayah-gold)]">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-sm font-medium text-[var(--color-hidayah-dark)]/50 mb-1">Current Prayer</p>
            <h2 className="text-3xl font-serif font-bold text-[var(--color-hidayah-dark)]">{currentPrayer}</h2>
          </div>

          <div className="flex items-end justify-between border-t border-[var(--color-hidayah-border)]/20 pt-6">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-[var(--color-hidayah-dark)]/40 uppercase tracking-widest">Next: {nextPrayer?.name}</p>
              <p className="text-xl font-bold text-[var(--color-hidayah-gold)]">{nextPrayer?.time}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-[var(--color-hidayah-dark)]/40 uppercase tracking-widest mb-1">In</p>
              <p className="text-sm font-bold bg-[var(--color-hidayah-dark)] text-white px-3 py-1 rounded-full">{countdown}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
