const BASE_URL = "https://api.quran.com/api/v4";
const FOUNDATION_BASE_URL = "https://apis.quran.foundation/content/api/v4";

export interface Juz {
  id: number;
  juz_number: number;
  verse_mapping: Record<string, string>;
  first_verse_id: number;
  last_verse_id: number;
  verses_count: number;
}

export interface Chapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    language_name: string;
    name: string;
  };
}

export interface Verse {
  id: number;
  verse_key: string;
  text_indopak: string;
  text_uthmani?: string;
  page_number: number;
  juz_number: number;
  hizb_number: number;
  rub_el_hizb_number: number;
  translations?: {
    id: number;
    resource_id: number;
    text: string;
  }[];
}

export async function getJuzs(): Promise<Juz[]> {
  const res = await fetch(`${BASE_URL}/juzs`);
  if (!res.ok) throw new Error("Failed to fetch juzs");
  const data = await res.json();
  return data.juzs;
}

export async function getChapters(): Promise<Chapter[]> {
  const res = await fetch(`${FOUNDATION_BASE_URL}/chapters`);
  if (!res.ok) {
    // Fallback to main API if foundation fails
    const fallback = await fetch(`${BASE_URL}/chapters`);
    if (!fallback.ok) throw new Error("Failed to fetch chapters");
    const data = await fallback.json();
    return data.chapters;
  }
  const data = await res.json();
  return data.chapters;
}

export async function getVersesByPage(page: number): Promise<Verse[]> {
  const res = await fetch(`${BASE_URL}/verses/by_page/${page}?fields=text_indopak`);
  if (!res.ok) throw new Error("Failed to fetch verses for page");
  const data = await res.json();
  return data.verses;
}

export async function getVersesByChapter(chapterId: number): Promise<Verse[]> {
  // Fetch Arabic text and translations separately for maximum reliability
  const [arabicRes, translationRes] = await Promise.all([
    fetch(`${BASE_URL}/quran/verses/indopak?chapter_number=${chapterId}`),
    fetch(`${BASE_URL}/quran/translations/20?chapter_number=${chapterId}`)
  ]);

  if (!arabicRes.ok || !translationRes.ok) {
    throw new Error("Failed to fetch verses or translations");
  }

  const arabicData = await arabicRes.json();
  const translationData = await translationRes.json();

  // Merge the data
  const mergedVerses = arabicData.verses.map((verse: any, index: number) => {
    const translation = translationData.translations[index];
    return {
      ...verse,
      translations: translation ? [{ resource_id: 20, text: translation.text }] : []
    };
  });

  return mergedVerses;
}
