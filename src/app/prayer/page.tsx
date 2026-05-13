"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Bell, BellOff, Calendar, Clock, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { safeStorage } from '@/lib/storage';
import { Capacitor } from '@capacitor/core';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const PRESET_CITIES = [
  { name: "Makkah", lat: 21.4225, lng: 39.8262 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Delhi", lat: 28.6139, lng: 77.2090 },
];

export default function PrayerDetailsPage() {
  const router = useRouter();
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [locationName, setLocationName] = useState("Detecting...");
  const [isDefaultLocation, setIsDefaultLocation] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState("");
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState("");
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  });

  const fetchTimes = async (lat: number, lng: number, isDefault: boolean = false) => {
    try {
      const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=2`);
      const data = await res.json();
      if (data.code === 200) {
        setTimes(data.data.timings);
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
        let current = "Isha";

        for (let i = 0; i < prayerNames.length; i++) {
          const [hours, minutes] = (data.data.timings as any)[prayerNames[i]].split(':').map(Number);
          const prayerTime = hours * 60 + minutes;
          if (currentTime < prayerTime) {
            current = i === 0 ? "Isha" : prayerNames[i - 1];
            break;
          }
        }
        setCurrentPrayer(current);

        if (!isDefault) {
          try {
            const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
            const geoData = await geoRes.json();
            const city = geoData.city || geoData.principalSubdivision || "My Location";
            setLocationName(city);
            setIsDefaultLocation(false);
            safeStorage.setItem('hidayah_location', JSON.stringify({ lat, lng, name: city }));
          } catch (e) {
            setLocationName("My Location");
          }
        } else {
          setLocationName("Makkah (Default)");
          setIsDefaultLocation(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetect = async () => {
    setLoading(true);
    setLocationName("Detecting...");

    try {
      // 1. Native Capacitor Geolocation (Best for Android/iOS)
      if (Capacitor.isNativePlatform()) {
        const { Geolocation } = await import('@capacitor/geolocation');
        
        try {
          // Check/Request permissions first
          const permission = await Geolocation.checkPermissions();
          if (permission.location !== 'granted') {
            const req = await Geolocation.requestPermissions();
            if (req.location !== 'granted') throw new Error("Permission denied");
          }

          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000
          });

          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          await fetchTimes(lat, lng);
          return;
        } catch (nativeErr) {
          console.warn("Native geolocation failed, trying browser fallback", nativeErr);
        }
      }

      // 2. Standard Browser Geolocation Fallback
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            fetchTimes(lat, lng);
            safeStorage.setItem('hidayah_location', JSON.stringify({
              lat,
              lng,
              name: "My Location"
            }));
          },
          (err) => {
            console.warn("Browser Geolocation error:", err);
            fetchTimes(21.4225, 39.8262, true); 
            alert("Location access denied or timed out. Defaulting to Makkah.");
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      } else {
        throw new Error("No geolocation support");
      }
    } catch (err) {
      console.error("Critical location error:", err);
      fetchTimes(21.4225, 39.8262, true);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const date = new Date();
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setToday(date.toLocaleDateString('en-US', options));

      // 1. Try Cached Location First
      const cached = safeStorage.getItem('hidayah_location');
      if (cached) {
        try {
          const { lat, lng, name } = JSON.parse(cached);
          setLocationName(name);
          fetchTimes(lat, lng);
        } catch (e) {
          handleAutoDetect(); // Try auto-detect if cache is corrupt
        }
      } else {
        // No cache? Try to detect immediately for a premium experience
        handleAutoDetect();
      }
    }
  }, []);

  const toggleNotification = (prayer: string) => {
    setNotifications(prev => ({
      ...prev,
      [prayer]: !prev[prayer]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-hidayah-primary)] flex items-center justify-center">
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-[var(--color-hidayah-gold)]" />
        </motion.div>
      </div>
    );
  }

  const PRAYER_LIST = [
    { name: "Fajr", time: times?.Fajr, endsAt: times?.Sunrise },
    { name: "Sunrise", time: times?.Sunrise, isSunrise: true, endsAt: times?.Dhuhr },
    { name: "Dhuhr", time: times?.Dhuhr, endsAt: times?.Asr },
    { name: "Asr", time: times?.Asr, endsAt: times?.Maghrib },
    { name: "Maghrib", time: times?.Maghrib, endsAt: times?.Isha },
    { name: "Isha", time: times?.Isha, endsAt: times?.Fajr },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-hidayah-primary)] pb-12">
      <header className="px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-3 rounded-2xl bg-white shadow-sm border border-hidayah-border/30 text-hidayah-dark/70 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleAutoDetect}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs shadow-sm transition-all active:scale-95 ${isDefaultLocation ? 'bg-hidayah-gold text-white animate-pulse' : 'bg-white text-hidayah-gold border border-hidayah-gold/20'}`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {isDefaultLocation ? 'ALLOW LOCATION ACCESS' : 'UPDATE LOCATION'}
            <RefreshCw className={`w-3 h-3 ml-1 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quick City Selector */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-hidayah-dark/40 uppercase tracking-widest px-1">
            <RefreshCw className="w-3 h-3" />
            Quick Select Location
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar -mx-1 px-1 snap-x">
            {PRESET_CITIES.map((city) => {
              const isActive = locationName.includes(city.name);
              return (
                <button
                  key={city.name}
                  onClick={() => {
                    console.log("Selecting city:", city.name);
                    setLocationName(city.name);
                    fetchTimes(city.lat, city.lng, false); // False ensures it doesn't revert to "Makkah"
                    setIsDefaultLocation(false);
                    safeStorage.setItem('hidayah_location', JSON.stringify({ 
                      lat: city.lat, 
                      lng: city.lng, 
                      name: city.name 
                    }));
                  }}
                  className={`snap-start flex-shrink-0 px-6 py-3 rounded-2xl border transition-all active:scale-95 ${isActive 
                    ? 'bg-hidayah-gold text-white border-hidayah-gold shadow-md shadow-hidayah-gold/20' 
                    : 'bg-white text-hidayah-dark/60 border-hidayah-border/40 hover:border-hidayah-gold/30'}`}
                >
                  <span className="text-xs font-bold whitespace-nowrap tracking-wide">{city.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center text-center mb-10">
          <div className="flex items-center gap-2 mb-2 text-hidayah-gold opacity-80">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">{today}</span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-hidayah-dark mb-1">Prayer Times</h1>
          <div className="flex items-center gap-1.5 text-xs font-bold text-hidayah-dark/30 uppercase tracking-[0.2em]">
            <MapPin className="w-3 h-3" />
            {locationName}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--color-hidayah-secondary)] rounded-[32px] p-8 border border-[var(--color-hidayah-border)]/30 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-hidayah-gold)]" />
          <p className="text-xs font-bold text-[var(--color-hidayah-dark)]/40 uppercase tracking-[0.2em] mb-2">Active Prayer</p>
          <h2 className="text-3xl font-serif font-bold text-[var(--color-hidayah-dark)]">{currentPrayer}</h2>
        </motion.div>
      </header>

      <main className="px-6 space-y-4 max-w-2xl mx-auto">
        {PRAYER_LIST.map((prayer) => (
          <motion.div 
            key={prayer.name}
            whileHover={{ x: 4 }}
            className={`flex items-center justify-between p-6 rounded-[24px] border transition-all ${currentPrayer === prayer.name ? 'bg-[var(--color-hidayah-primary)] border-[var(--color-hidayah-gold)] shadow-md ring-1 ring-[var(--color-hidayah-gold)]/20' : 'bg-[var(--color-hidayah-secondary)]/50 border-[var(--color-hidayah-border)]/20'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${currentPrayer === prayer.name ? 'bg-[var(--color-hidayah-gold)] text-white' : 'bg-[var(--color-hidayah-secondary)] text-[var(--color-hidayah-gold)] shadow-sm'}`}>
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`font-bold ${currentPrayer === prayer.name ? 'text-[var(--color-hidayah-dark)]' : 'text-[var(--color-hidayah-dark)]/70'}`}>
                  {prayer.name}
                  {currentPrayer === prayer.name && <span className="ml-2 text-[10px] bg-[var(--color-hidayah-gold)]/10 text-[var(--color-hidayah-gold)] px-2 py-0.5 rounded-full uppercase tracking-tighter">Current</span>}
                </h3>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-[var(--color-hidayah-dark)]/30 font-bold">Starts</span>
                    <p className={`text-sm ${currentPrayer === prayer.name ? 'text-[var(--color-hidayah-gold)] font-bold' : 'text-[var(--color-hidayah-dark)]/60 font-medium'}`}>{prayer.time}</p>
                  </div>
                  <div className="w-px h-6 bg-[var(--color-hidayah-border)]/20 mx-1"></div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-[var(--color-hidayah-dark)]/30 font-bold">Ends</span>
                    <p className="text-sm text-[var(--color-hidayah-dark)]/40 font-medium">{prayer.endsAt}</p>
                  </div>
                </div>
              </div>
            </div>

            {!prayer.isSunrise && (
              <button 
                onClick={() => toggleNotification(prayer.name)}
                className={`p-3 rounded-xl transition-all ${notifications[prayer.name] ? 'bg-[var(--color-hidayah-gold)]/10 text-[var(--color-hidayah-gold)]' : 'bg-black/5 text-[var(--color-hidayah-dark)]/30'}`}
              >
                {notifications[prayer.name] ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>
            )}
          </motion.div>
        ))}
      </main>
    </div>
  );
}
