import { Suspense } from 'react';
import { getChapters } from "@/lib/api";
import SurahReaderPage from "./ClientShell";

export async function generateStaticParams() {
  try {
    const chapters = await getChapters();
    return chapters.map((chapter) => ({
      id: chapter.id.toString(),
    }));
  } catch (error) {
    console.error("Error generating static params for surahs:", error);
    // Return a safe fallback list if API fails during build
    return Array.from({ length: 114 }, (_, i) => ({ id: (i + 1).toString() }));
  }
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-hidayah-primary" />}>
      <SurahReaderPage />
    </Suspense>
  );
}
