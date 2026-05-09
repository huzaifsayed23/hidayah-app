import { categories, duas } from "@/data/duas";

export function generateStaticParams() {
  return categories.map((c) => ({ categoryId: c.id }));
}

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

export default async function DuaCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return notFound();

  const categoryDuas = duas.filter((d) => d.categoryId === categoryId);

  return (
    <main className="min-h-screen bg-hidayah-primary text-hidayah-dark p-6 sm:p-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <Link href="/duas" className="inline-flex items-center gap-2 text-hidayah-dark/70 hover:text-hidayah-gold transition-colors mb-8">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium tracking-widest uppercase">Categories</span>
          </Link>
          
          <div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-wide mb-2">
              {category.title}
            </h1>
            <p className="text-hidayah-dark/60 tracking-wide font-light">
              {categoryDuas.length} {categoryDuas.length === 1 ? 'Supplication' : 'Supplications'}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {categoryDuas.length === 0 ? (
            <div className="col-span-2 p-8 text-center bg-hidayah-secondary rounded-2xl border border-hidayah-border/30 text-hidayah-dark/50">
              Content coming soon...
            </div>
          ) : (
            categoryDuas.map((dua) => (
              <Link
                href={`/duas/${categoryId}/${dua.id}`}
                key={dua.id}
                className="group flex flex-col items-center text-center p-5 bg-hidayah-secondary rounded-2xl border border-hidayah-border/30 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-medium tracking-wide text-hidayah-dark group-hover:text-hidayah-gold transition-colors mb-2">
                    {dua.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-hidayah-dark/50 line-clamp-2">
                    {dua.translation}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 mt-4 text-hidayah-dark/30 group-hover:text-hidayah-gold group-hover:translate-x-1 transition-all" />
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
