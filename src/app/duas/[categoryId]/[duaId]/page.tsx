import Link from "next/link";
import { categories, duas } from "@/data/duas";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function DuaDetailPage({
  params,
}: {
  params: Promise<{ categoryId: string; duaId: string }>;
}) {
  const { categoryId, duaId } = await params;
  
  const category = categories.find((c) => c.id === categoryId);
  const dua = duas.find((d) => d.id === duaId && d.categoryId === categoryId);
  
  if (!category || !dua) return notFound();

  return (
    <main className="min-h-screen bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] p-6 sm:p-12 flex flex-col items-center transition-colors duration-500">
      <div className="w-full max-w-3xl flex-grow flex flex-col">
        <header className="mb-10 w-full">
          <Link href="/duas" className="inline-flex items-center gap-2 text-[var(--color-hidayah-dark)]/70 hover:text-hidayah-gold transition-colors mb-8">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium tracking-widest uppercase">Categories</span>
          </Link>
          
          <h1 className="text-2xl sm:text-3xl font-light tracking-wide text-center text-hidayah-gold">
            {dua.title}
          </h1>
        </header>

        <div className="flex-grow flex flex-col items-center justify-center space-y-12 w-full">
          {/* Arabic Text (IndoPak Readability) */}
          <div 
            className="w-full text-center px-4"
            dir="rtl"
          >
            <p className="font-arabic text-3xl sm:text-4xl md:text-5xl text-[var(--color-hidayah-dark)] leading-[2.5] break-words align-middle" style={{ wordSpacing: '0.15em' }}>
              {dua.arabic}
            </p>
          </div>

          <div className="w-full max-w-2xl space-y-8 px-4 text-center">
            {/* Transliteration */}
            <div className="space-y-2">
              <h3 className="text-xs tracking-[0.2em] uppercase text-hidayah-gold/80 font-medium">Pronunciation</h3>
              <p className="text-lg sm:text-xl text-[var(--color-hidayah-dark)]/90 font-light italic leading-relaxed">
                "{dua.transliteration}"
              </p>
            </div>

            <div className="w-16 h-px bg-[var(--color-hidayah-dark)]/10 mx-auto" />

            {/* Translation */}
            <div className="space-y-2">
              <h3 className="text-xs tracking-[0.2em] uppercase text-hidayah-gold/80 font-medium">Translation</h3>
              <p className="text-lg sm:text-xl text-[var(--color-hidayah-dark)]/80 font-light leading-relaxed">
                {dua.translation}
              </p>
            </div>
          </div>
        </div>

        {/* Reference */}
        <footer className="mt-16 w-full text-center border-t border-hidayah-border/50 pt-8 pb-4">
          <p className="text-sm text-[var(--color-hidayah-dark)]/40 tracking-wider">
            {dua.reference}
          </p>
        </footer>
      </div>
    </main>
  );
}
