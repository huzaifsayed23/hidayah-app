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
      <div className="text-xs text-red-600 max-w-md mx-auto bg-red-50 p-4 rounded-xl border border-red-100 break-words font-mono text-left mb-6 overflow-auto max-h-64">
        <p className="font-bold mb-2">Message: {error?.message || "None"}</p>
        <p className="font-bold mb-2">Name: {error?.name || "None"}</p>
        <p className="font-bold mb-2">Digest: {error?.digest || "None"}</p>
        {error?.stack && (
          <div className="mt-2 opacity-80 whitespace-pre-wrap">
            {error.stack}
          </div>
        )}
        <div className="mt-2 opacity-80 whitespace-pre-wrap">
          {JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}
        </div>
      </div>
      <button
        onClick={() => reset()}
        className="px-6 py-3 bg-[var(--color-hidayah-dark)] text-white font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
      >
        Try again
      </button>
    </div>
  );
}
