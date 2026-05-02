"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Bell, BellOff, Calendar, Clock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export default function PrayerDetailsPage() {
  const router = useRouter();
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [locationName, setLocationName] = useState("Detecting...");
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

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setToday(date.toLocaleDateString('en-US', options));

    const fetchTimes = async (lat: number, lng: number) => {
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

          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const geoData = await geoRes.json();
          setLocationName(geoData.address.city || geoData.address.town || "My Location");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchTimes(pos.coords.latitude, pos.coords.longitude),
        () => {
          fetchTimes(21.4225, 39.8262); // Makkah fallback
          setLocationName("Makkah");
        }
      );
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
      <header className="px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-[var(--color-hidayah-secondary)] rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-[var(--color-hidayah-dark)]" />
          </button>
          <div className="flex flex-col items-center">
             <div className="flex items-center gap-1.5 text-[var(--color-hidayah-dark)]/50 text-xs font-bold uppercase tracking-widest">
                <MapPin className="w-3 h-3" />
                {locationName}
             </div>
          </div>
          <div className="w-10" />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-[var(--color-hidayah-gold)] mb-1 flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            {today}
          </p>
          <h1 className="text-4xl font-serif font-bold text-[var(--color-hidayah-dark)] mt-2">Prayer Times</h1>
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
