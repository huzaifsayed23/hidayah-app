export const dynamic = 'force-dynamic';
import Link from "next/link";
import { getVersesByPage, getChapters } from "@/lib/api";
import { ChevronLeft, ChevronRight, X, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import dbConnect from "@/lib/mongodb";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import BookmarkButton from "@/components/quran/BookmarkButton";
import QuranReaderTools from "@/components/quran/QuranReaderTools";
import InteractiveVerse from "@/components/quran/InteractiveVerse";

function toArabicIndic(num: number): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num.toString().split("").map((c) => digits[parseInt(c)]).join("");
}

export default async function QuranReadPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const pageNum = parseInt(page);
  
  if (isNaN(pageNum) || pageNum < 1 || pageNum > 604) {
    return <div>Invalid Page</div>;
  }

  const verses = await getVersesByPage(pageNum);
  const chapters = await getChapters();

  let userBookmarks: string[] = [];
  const cookieStore = await cookies();
  const token = cookieStore.get('hidayah_token')?.value;
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
      const decoded: any = jwt.verify(token, secret);
      await dbConnect();
      const User = (await import('@/models/User')).default;
      const user = await User.findById(decoded.userId).select('bookmarks');
      if (user) {
        userBookmarks = user.bookmarks.map((b: any) => b.verseKey);
      }
    } catch(e) {}
  }

  // Find unique chapters on this page
  const chapterIds = Array.from(new Set(verses.map((v) => parseInt(v.verse_key.split(":")[0]))));
  const pageChapters = chapterIds.map((id) => chapters.find((c) => c.id === id));

  // Determine primary chapter and juz for header
  const primaryChapter = pageChapters[0];
  const juzNumber = verses.length > 0 ? verses[0].juz_number : "";

  return (
    <main className="min-h-screen bg-hidayah-primary flex flex-col items-center justify-center p-4 sm:p-8">
      <QuranReaderTools pageNumber={pageNum} />
      {/* Top Navigation */}
      <div className="w-full max-w-[600px] flex items-center justify-between mb-6 text-hidayah-dark/60">
        <Link href="/quran" className="p-2 hover:text-hidayah-gold transition-colors">
          <X className="w-6 h-6" />
        </Link>
        <div className="text-sm tracking-widest uppercase font-medium">
          Juz {juzNumber}
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Mushaf Page Container */}
      <div className="w-full max-w-[600px] bg-[#fbf8f1] rounded-lg shadow-2xl shadow-hidayah-dark/5 border-2 border-hidayah-border/30 overflow-hidden relative flex flex-col">
        {/* Page Header (Surah Names) */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-hidayah-border/20 bg-hidayah-secondary/30">
          <div className="text-hidayah-gold font-arabic text-xl">
            {primaryChapter?.name_arabic}
          </div>
          <div className="text-xs uppercase tracking-widest text-hidayah-dark/50">
            {primaryChapter?.name_simple}
          </div>
        </div>

        {/* Quran Text */}
        <div 
          className="p-6 sm:p-8 flex-grow text-justify flex flex-col justify-center"
          dir="rtl"
        >
          <div className="text-[#2D241E] leading-[2.2] text-2xl sm:text-3xl md:text-4xl font-arabic break-words align-middle" style={{ textAlignLast: 'center', wordSpacing: '0.1em' }}>
            {verses.map((verse, index) => {
              const verseNum = parseInt(verse.verse_key.split(":")[1]);
              const isFirstVerse = verseNum === 1;
              const chapterId = parseInt(verse.verse_key.split(":")[0]);
              
              return (
                <span key={verse.id}>
                  {/* Surah Separator */}
                  {isFirstVerse && chapterId !== 1 && chapterId !== 9 && (
                    <div className="my-8 text-center block w-full text-hidayah-gold font-arabic text-4xl">
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                    </div>
                  )}
                  <InteractiveVerse 
                    verse={verse} 
                    initialIsBookmarked={userBookmarks.includes(verse.verse_key)}
                    verseNum={verseNum}
                  >
                    {verse.text_indopak?.replace(/[\u0000-\u001F\u007F-\u009F]/g, "")}
                  </InteractiveVerse>
                </span>
              );
            })}
          </div>
        </div>

        {/* Page Footer */}
        <div className="px-6 py-3 border-t border-hidayah-border/20 text-center bg-hidayah-secondary/30">
          <span className="text-[#2D241E]/50 font-arabic text-lg">
            {toArabicIndic(pageNum)}
          </span>
        </div>
      </div>

      {/* Bottom Pagination */}
      <div className="w-full max-w-[600px] flex items-center justify-between mt-8">
        {pageNum < 604 ? (
          <Link
            href={`/quran/read/${pageNum + 1}`}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-hidayah-secondary hover:bg-hidayah-gold hover:text-white transition-all duration-300 border border-hidayah-border/50 text-hidayah-dark group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium tracking-wider text-sm uppercase">Next Page</span>
          </Link>
        ) : <div />}

        {pageNum > 1 ? (
          <Link
            href={`/quran/read/${pageNum - 1}`}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-hidayah-secondary hover:bg-hidayah-gold hover:text-white transition-all duration-300 border border-hidayah-border/50 text-hidayah-dark group"
          >
            <span className="font-medium tracking-wider text-sm uppercase">Prev Page</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : <div />}
      </div>
    </main>
  );
}
