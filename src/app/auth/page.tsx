"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Eye, EyeOff, Mail, Lock, ArrowRight, UserCircle } from "lucide-react";
import { HIDAYAH_API_URL, hidayahFetch } from "@/lib/api";

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
      const endpoint = isLogin
        ? `/api/auth/login`
        : `/api/auth/signup`;
      const bodyPayload = isLogin
        ? { email, password }
        : { username, email, password };

      // Debug Alert for Mobile Connectivity Testing
      try { alert('Connecting to: ' + endpoint); } catch(e) {}

      const res = await hidayahFetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res
        .json()
        .catch(() => ({ message: "Invalid response from server" }));

      if (!res.ok) {
        setError(
          data.message || "Authentication failed. Please check your credentials."
        );
        setIsLoading(false);
        return;
      }

      // Persist token to localStorage for bearer-header auth
      if (data.token) {
        try { localStorage.setItem("hidayah_token", data.token); } catch {}
      }

      if (data.acceptedTerms === false) {
        router.push("/agreement");
      } else {
        router.push("/community");
      }
    } catch (err: any) {
      console.error("Auth error details:", err);
      setError(
        `Connection Error: ${err?.message || "Could not connect to the server."}`
      );
      setIsLoading(false);
    }
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const switchToSignup = () => {
    setIsLogin(false);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: "var(--color-hidayah-primary)" }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .auth-card { animation: fadeInUp 0.5s ease-out both; }
        .auth-input {
          width: 100%;
          padding: 14px 14px 14px 48px;
          border-radius: 12px;
          border: 1px solid var(--color-hidayah-border, #d4c9a8);
          background: var(--color-hidayah-primary, #f5f5dc);
          color: var(--color-hidayah-dark, #2E2A26);
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .auth-input:focus { border-color: #D4AF37; }
        .auth-input::placeholder { color: rgba(46,42,38,0.4); }
        .auth-tab-active { 
          color: var(--color-hidayah-dark, #2E2A26); 
          border-bottom: 2px solid #D4AF37;
          padding-bottom: 8px;
        }
        .auth-tab-inactive { 
          color: rgba(46,42,38,0.35); 
          border-bottom: 2px solid transparent;
          padding-bottom: 8px;
        }
        .auth-submit-btn {
          width: 100%;
          padding: 16px;
          margin-top: 24px;
          border-radius: 12px;
          background: var(--color-hidayah-dark, #2E2A26);
          color: var(--color-hidayah-primary, #f5f5dc);
          font-weight: 700;
          font-size: 17px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s, opacity 0.2s;
        }
        .auth-submit-btn:hover { background: #000; }
        .auth-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-error {
          padding: 12px;
          border-radius: 10px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
        }
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 14px; width: 20px; height: 20px; color: rgba(46,42,38,0.4); pointer-events: none; }
        .input-eye { position: absolute; right: 12px; background: none; border: none; cursor: pointer; padding: 4px; color: rgba(46,42,38,0.4); }
        .input-eye:hover { color: var(--color-hidayah-dark, #2E2A26); }
        .slide-down { overflow: hidden; }
      `}</style>

      <div className="auth-card" style={{ width: "100%", maxWidth: "360px" }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
          <Logo />
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--color-hidayah-secondary, #eee8d0)",
            borderRadius: "28px",
            padding: "32px 28px",
            border: "1px solid rgba(212,175,55,0.2)",
            boxShadow: "0 4px 24px rgba(46,42,38,0.08)",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              marginBottom: "28px",
              borderBottom: "1px solid var(--color-hidayah-border, #d4c9a8)",
            }}
          >
            <button
              type="button"
              onClick={switchToLogin}
              className={isLogin ? "auth-tab-active" : "auth-tab-inactive"}
              style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "19px", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={switchToSignup}
              className={!isLogin ? "auth-tab-active" : "auth-tab-inactive"}
              style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "19px", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Error message */}
            {error && <div className="auth-error">{error}</div>}

            {/* Username (signup only) */}
            {!isLogin && (
              <div className="input-wrapper slide-down">
                <UserCircle className="input-icon" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                  autoComplete="username"
                  className="auth-input"
                  style={{ paddingLeft: "48px" }}
                />
              </div>
            )}

            {/* Email */}
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="auth-input"
                style={{ paddingLeft: "48px" }}
              />
            </div>

            {/* Password */}
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="auth-input"
                style={{ paddingLeft: "48px", paddingRight: "44px" }}
              />
              <button
                type="button"
                className="input-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Confirm Password (signup only) */}
            {!isLogin && (
              <div className="input-wrapper slide-down">
                <Lock className="input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="auth-input"
                  style={{ paddingLeft: "48px", paddingRight: "44px" }}
                />
                <button
                  type="button"
                  className="input-eye"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="auth-submit-btn"
            >
              <span>{isLoading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}</span>
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Forgot password */}
          {isLogin && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button
                type="button"
                style={{ fontSize: "13px", color: "rgba(46,42,38,0.5)", background: "none", border: "none", cursor: "pointer" }}
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
