"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Chat Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-hidayah-primary)] p-4 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-xl font-serif font-bold text-[var(--color-hidayah-dark)] mb-4">
        Something went wrong!
      </h2>
      <p className="text-sm text-red-600 max-w-md mx-auto bg-red-50 p-4 rounded-xl border border-red-100 break-words font-mono text-left mb-6">
        {error.message || "Unknown error"}
        {error.stack && (
          <span className="block mt-2 text-xs opacity-70">
            {error.stack.split('\n')[1]}
          </span>
        )}
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 bg-[var(--color-hidayah-dark)] text-white font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
      >
        Try again
      </button>
    </div>
  );
}
