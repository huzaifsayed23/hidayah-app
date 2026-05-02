"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, LogOut, CheckCircle2 } from "lucide-react";
import { hidayahFetch } from "@/lib/api";
import { Logo } from "@/components/Logo";


export default function AgreementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAgree = async () => {
    setIsLoading(true);
    try {
      const res = await hidayahFetch("/api/auth/accept-terms", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/onboarding");
      } else {
        console.error("Failed to accept terms");
      }
    } catch (error) {
      console.error("Error accepting terms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExit = async () => {
    try {
      await hidayahFetch("/api/auth/logout", { method: "POST" });
      router.push("/auth");
    } catch (error) {
      router.push("/auth");
    }
  };


  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-hidayah-primary)] selection:bg-hidayah-gold/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-2xl flex flex-col items-center"
      >
        <Logo className="mb-12" />

        <div className="w-full bg-[var(--color-hidayah-secondary)] p-8 sm:p-12 rounded-[40px] shadow-2xl border border-[var(--color-hidayah-border)]/50 relative overflow-hidden">
          {/* Subtle decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-hidayah-gold/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-hidayah-gold/5 rounded-full blur-3xl -ml-16 -mb-16" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-hidayah-gold/10 flex items-center justify-center text-hidayah-gold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-hidayah-dark)]">
                Welcome to HIDAYAH: The Digital Sanctuary
              </h1>
            </div>

            <div className="space-y-6 text-[var(--color-hidayah-dark)]/80 leading-relaxed text-sm sm:text-base">
              <p className="font-medium text-[var(--color-hidayah-dark)]">
                By entering this space, you agree to the following terms and conditions:
              </p>

              <section className="bg-[var(--color-hidayah-primary)]/40 p-5 rounded-2xl border border-[var(--color-hidayah-border)]/20">
                <h3 className="font-bold text-[var(--color-hidayah-dark)] mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-hidayah-gold" />
                  Purpose of Use
                </h3>
                <p>HIDAYAH is an educational and spiritual platform. You agree to use this app for personal growth, learning, and reflection.</p>
              </section>

              <section className="bg-[var(--color-hidayah-primary)]/40 p-5 rounded-2xl border border-[var(--color-hidayah-border)]/20">
                <h3 className="font-bold text-[var(--color-hidayah-dark)] mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-hidayah-gold" />
                  Community Conduct
                </h3>
                <p>In the "List" and "Community" sections, you agree to post only respectful, truthful, and spiritually uplifting content. Harassment, misinformation, or disrespectful behavior will result in the loss of your "Noor" level and account access.</p>
              </section>

              <section className="bg-[var(--color-hidayah-primary)]/40 p-5 rounded-2xl border border-[var(--color-hidayah-border)]/20">
                <h3 className="font-bold text-[var(--color-hidayah-dark)] mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-hidayah-gold" />
                  Intellectual Property
                </h3>
                <p>All visual elements, including unique badges, the leveling system, and "HIDAYAH" original content, are the property of the developer. You may not replicate or sell these assets.</p>
              </section>

              <section className="bg-[var(--color-hidayah-primary)]/40 p-5 rounded-2xl border border-[var(--color-hidayah-border)]/20">
                <h3 className="font-bold text-[var(--color-hidayah-dark)] mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-hidayah-gold" />
                  Data & Privacy
                </h3>
                <p>Your progress, earned badges, and custom color selections are stored securely to provide your personalized experience.</p>
              </section>

              <section className="bg-[var(--color-hidayah-primary)]/40 p-5 rounded-2xl border border-[var(--color-hidayah-border)]/20">
                <h3 className="font-bold text-[var(--color-hidayah-dark)] mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-hidayah-gold" />
                  Accuracy of Knowledge
                </h3>
                <p>While we strive for absolute accuracy in our Hadith and Prophet stories through verified APIs, users are encouraged to consult scholarly sources for deep legal rulings.</p>
              </section>

              <div className="pt-6 border-t border-[var(--color-hidayah-border)]/50 mt-8">
                <p className="italic font-serif text-lg text-center text-[var(--color-hidayah-dark)]">
                  Do you accept the path of knowledge and the rules of the sanctuary?
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <button
                  onClick={handleAgree}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-[var(--color-hidayah-dark)] text-[var(--color-hidayah-primary)] font-bold text-lg hover:bg-black transition-all shadow-xl hover:shadow-hidayah-gold/10 group disabled:opacity-70"
                >
                  <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>{isLoading ? "Entering..." : "I AGREE"}</span>
                </button>
                <button
                  onClick={handleExit}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-transparent border-2 border-[var(--color-hidayah-dark)]/20 text-[var(--color-hidayah-dark)] font-bold text-lg hover:bg-[var(--color-hidayah-dark)]/5 transition-all group disabled:opacity-70"
                >
                  <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span>EXIT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
