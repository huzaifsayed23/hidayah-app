import Link from "next/link";
import { categories, duas } from "@/data/duas";
import * as LucideIcons from "lucide-react";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function DuasCategoriesPage() {
  return (
    <main className="min-h-screen bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] p-6 sm:p-12 transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-[var(--color-hidayah-dark)]/70 hover:text-hidayah-gold transition-colors mb-8">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium tracking-widest uppercase">Home</span>
          </Link>
          
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto text-hidayah-gold mb-6" strokeWidth={1.5} />
            <h1 className="text-4xl font-light tracking-wide mb-4">
              Daily Duas
            </h1>
            <p className="text-[var(--color-hidayah-dark)]/60 tracking-wide font-light max-w-md mx-auto">
              Fortress of the Muslim. Find peace and protection in His remembrance.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category) => {
            // @ts-ignore
            const Icon = LucideIcons[category.iconName] || LucideIcons.BookOpen;
            const categoryDua = duas.find(d => d.categoryId === category.id);
            const targetHref = categoryDua ? `/duas/${category.id}/${categoryDua.id}` : `/duas/${category.id}`;

            return (
              <Link
                href={targetHref}
                key={category.id}
                className="group flex flex-col items-center justify-center gap-4 p-6 bg-[var(--color-hidayah-secondary)] rounded-3xl border border-hidayah-border/30 hover:border-hidayah-gold transition-all duration-300 hover:shadow-xl hover:shadow-hidayah-gold/5 text-center"
              >
                <Icon
                  className="w-8 h-8 text-hidayah-gold group-hover:scale-110 transition-transform duration-300"
                  strokeWidth={1.5}
                />
                <span className="font-medium tracking-wide text-sm sm:text-base text-[var(--color-hidayah-dark)] group-hover:text-hidayah-gold">
                  {category.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
