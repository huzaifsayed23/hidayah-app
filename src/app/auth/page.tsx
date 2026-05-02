"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Eye, EyeOff, Mail, Lock, ArrowRight, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic Validation
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isLogin && (!username.trim() || username.length < 3)) {
      setError("Username must be at least 3 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const bodyPayload = isLogin ? { email, password } : { username, email, password };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || 'Something went wrong');
        setIsLoading(false);
        return;
      }
      
      if (data.acceptedTerms === false) {
        router.push("/agreement");
      } else {
        router.push("/community");
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-hidayah-primary)] selection:bg-hidayah-gold/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-sm flex flex-col items-center"
      >
        <Logo className="mb-10" />
        
        <div className="w-full bg-[var(--color-hidayah-secondary)] p-6 sm:p-10 rounded-[32px] shadow-sm border border-[var(--color-hidayah-border)]/50">
          
          <div className="flex items-center gap-6 mb-8 border-b border-[var(--color-hidayah-border)]/50 pb-4">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setError(""); setPassword(""); setConfirmPassword(""); }}
              className={cn("text-xl font-serif font-bold transition-colors relative pb-2", isLogin ? "text-[var(--color-hidayah-dark)]" : "text-[var(--color-hidayah-dark)]/40")}
            >
              Sign In
              {isLogin && <motion.div layoutId="auth-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-hidayah-gold)]" />}
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setError(""); setPassword(""); setConfirmPassword(""); }}
              className={cn("text-xl font-serif font-bold transition-colors relative pb-2", !isLogin ? "text-[var(--color-hidayah-dark)]" : "text-[var(--color-hidayah-dark)]/40")}
            >
              Create Account
              {!isLogin && <motion.div layoutId="auth-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-hidayah-gold)]" />}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="text-red-500 text-sm font-bold text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20"
              >
                {error}
              </motion.p>
            )}

            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="relative flex items-center"
              >
                <UserCircle className="absolute left-4 w-5 h-5 text-[var(--color-hidayah-dark)]/40" />
                <input 
                  type="text" 
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-[var(--color-hidayah-primary)] border border-[var(--color-hidayah-border)]/30 focus:border-[var(--color-hidayah-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--color-hidayah-gold)] transition-all text-[var(--color-hidayah-dark)] placeholder:text-[var(--color-hidayah-dark)]/40 text-base"
                />
              </motion.div>
            )}
            
            <div className="relative flex items-center">
              <Mail className="absolute left-4 w-5 h-5 text-[var(--color-hidayah-dark)]/40" />
              <input 
                type="email" 
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[var(--color-hidayah-primary)] border border-[var(--color-hidayah-border)]/30 focus:border-[var(--color-hidayah-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--color-hidayah-gold)] transition-all text-[var(--color-hidayah-dark)] placeholder:text-[var(--color-hidayah-dark)]/40 text-base"
              />
            </div>
            
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-5 h-5 text-[var(--color-hidayah-dark)]/40" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-12 pr-12 py-4 rounded-xl bg-[var(--color-hidayah-primary)] border border-[var(--color-hidayah-border)]/30 focus:border-[var(--color-hidayah-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--color-hidayah-gold)] transition-all text-[var(--color-hidayah-dark)] placeholder:text-[var(--color-hidayah-dark)]/40 text-base"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 p-2 rounded-md text-[var(--color-hidayah-dark)]/40 hover:text-[var(--color-hidayah-dark)] transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="relative flex items-center"
              >
                <Lock className="absolute left-4 w-5 h-5 text-[var(--color-hidayah-dark)]/40" />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-4 rounded-xl bg-[var(--color-hidayah-primary)] border border-[var(--color-hidayah-border)]/30 focus:border-[var(--color-hidayah-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--color-hidayah-gold)] transition-all text-[var(--color-hidayah-dark)] placeholder:text-[var(--color-hidayah-dark)]/40 text-base"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 p-2 rounded-md text-[var(--color-hidayah-dark)]/40 hover:text-[var(--color-hidayah-dark)] transition-colors focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] font-bold text-lg hover:bg-black transition-colors shadow-md group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}</span>
              {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
          
          {isLogin && (
            <div className="mt-6 text-center">
              <button type="button" className="text-sm font-medium text-[var(--color-hidayah-dark)]/60 hover:text-[var(--color-hidayah-gold)] transition-colors focus:outline-none">
                Forgot password?
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
