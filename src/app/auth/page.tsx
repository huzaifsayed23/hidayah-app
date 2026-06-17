"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight, Sparkles, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { hidayahFetch } from '@/lib/api';
import { safeStorage } from '@/lib/storage';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = safeStorage.getItem("hidayah_token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Clear old token before trying new auth to prevent header conflicts
      safeStorage.removeItem("hidayah_token");

      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const body = isLogin ? { email, password } : { email, password, username: name };

      const res = await hidayahFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (data.token) {
        safeStorage.setItem("hidayah_token", data.token);
      }

      if (data.acceptedTerms === false) {
        router.push("/agreement");
      } else {
        router.push("/dashboard"); 
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-hidayah-primary)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-hidayah-gold blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-hidayah-gold blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--color-hidayah-secondary)]/50 backdrop-blur-xl rounded-[40px] p-8 sm:p-12 border border-hidayah-border/30 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-hidayah-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-hidayah-gold" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-hidayah-dark mb-2">
            {isLogin ? "Welcome Back" : "Begin Your Journey"}
          </h1>
          <p className="text-hidayah-dark/50 text-sm italic">
            {isLogin ? "Continue your spiritual reflections." : "Join our sanctuary of wisdom."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-hidayah-dark/40 uppercase tracking-widest ml-2">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-hidayah-dark/20" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-hidayah-primary/50 border border-transparent focus:border-hidayah-gold transition-all outline-none"
                  placeholder="Enter a username"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-hidayah-dark/40 uppercase tracking-widest ml-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-hidayah-dark/20" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-hidayah-primary/50 border border-transparent focus:border-hidayah-gold transition-all outline-none"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-hidayah-dark/40 uppercase tracking-widest ml-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-hidayah-dark/20" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-hidayah-primary/50 border border-transparent focus:border-hidayah-gold transition-all outline-none"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-hidayah-dark/30 hover:text-hidayah-gold transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 rounded-2xl bg-hidayah-dark text-hidayah-primary font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-hidayah-dark/10"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span>{isLogin ? "Sign In" : "Create Account"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-hidayah-border/20 text-center">
          <p className="text-hidayah-dark/40 text-sm mb-4">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-hidayah-gold font-bold text-sm uppercase tracking-widest hover:underline"
          >
            {isLogin ? "Create Account" : "Sign In Instead"}
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-hidayah-dark/30 font-bold uppercase tracking-widest">
          <ShieldCheck className="w-3 h-3" />
          Secure Sanctuary Access
        </div>
      </motion.div>
    </main>
  );
}
