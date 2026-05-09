import { Capacitor, CapacitorHttp, HttpOptions } from '@capacitor/core';

const BASE_URL = "https://api.quran.com/api/v4";
const FOUNDATION_BASE_URL = "https://apis.quran.foundation/content/api/v4";
export const HIDAYAH_API_URL = "https://hidayah-lgq6.vercel.app";

/**
 * Universal fetch that uses CapacitorHttp on native platforms for better connectivity
 * and standard fetch on web/server.
 */
async function universalFetch(url: string, options: RequestInit = {}) {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Prepare data
    let data = options.body;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        // Keep as string if not JSON
      }
    }

    const httpOptions: HttpOptions = {
      url: url.startsWith('http') ? url : (url.startsWith('/') ? `${HIDAYAH_API_URL}${url}` : `${HIDAYAH_API_URL}/${url}`),
      method: options.method || 'GET',
      headers: headers,
      data: data,
    };

    try {
      const response = await CapacitorHttp.request(httpOptions);
      
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.status.toString(),
        headers: new Headers(response.headers as any),
        json: async () => {
          if (!response.data) return null;
          if (typeof response.data === 'string') {
            try {
              return JSON.parse(response.data);
            } catch (e) {
              console.error('Failed to parse JSON string:', response.data);
              return { error: 'Invalid JSON', raw: response.data };
            }
          }
          return response.data;
        },
        text: async () => typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        clone: function() { return this; }
      } as Response;
    } catch (error) {
      console.error(`CapacitorHttp failed for ${url}:`, error);
      throw error;
    }
  }

  // Fallback to standard fetch
  return fetch(url, options);
}

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
  const res = await universalFetch(`${BASE_URL}/juzs`);
  if (!res.ok) throw new Error("Failed to fetch juzs");
  const data = await res.json();
  return data.juzs;
}

export async function getChapters(): Promise<Chapter[]> {
  const res = await universalFetch(`${FOUNDATION_BASE_URL}/chapters`);
  if (!res.ok) {
    const fallback = await universalFetch(`${BASE_URL}/chapters`);
    if (!fallback.ok) throw new Error("Failed to fetch chapters");
    const data = await fallback.json();
    return data.chapters;
  }
  const data = await res.json();
  return data.chapters;
}

export async function getVersesByPage(page: number): Promise<Verse[]> {
  const res = await universalFetch(`${BASE_URL}/verses/by_page/${page}?fields=text_indopak`);
  if (!res.ok) throw new Error("Failed to fetch verses for page");
  const data = await res.json();
  return data.verses;
}

export async function getVersesByChapter(chapterId: number): Promise<Verse[]> {
  const [arabicRes, translationRes] = await Promise.all([
    universalFetch(`${BASE_URL}/quran/verses/indopak?chapter_number=${chapterId}`),
    universalFetch(`${BASE_URL}/quran/translations/20?chapter_number=${chapterId}`)
  ]);

  if (!arabicRes.ok || !translationRes.ok) {
    throw new Error("Failed to fetch verses or translations");
  }

  const arabicData = await arabicRes.json();
  const translationData = await translationRes.json();

  const mergedVerses = arabicData.verses.map((verse: any, index: number) => {
    const translation = translationData.translations[index];
    return {
      ...verse,
      translations: translation ? [{ resource_id: 20, text: translation.text }] : []
    };
  });

  return mergedVerses;
}

/**
 * Standard fetch wrapper that attaches auth token via both cookies AND
 * Authorization header (from localStorage) for maximum localhost reliability.
 */
export async function hidayahFetch(url: string, options: RequestInit = {}) {
  let path = url;
  if (HIDAYAH_API_URL && url.startsWith(HIDAYAH_API_URL)) {
    path = url.replace(HIDAYAH_API_URL, '');
  }
  
  // Strip trailing slash for API consistency
  if (path.includes('/api/') && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  let fullUrl = path;
  if (!path.startsWith('http')) {
    const isBrowser = typeof window !== 'undefined';
    const isNative = Capacitor.isNativePlatform();

    if (HIDAYAH_API_URL && (!isBrowser || isNative)) {
      fullUrl = `${HIDAYAH_API_URL}${path.startsWith('/') ? path : `/${path}`}`;
    } else {
      fullUrl = path.startsWith('/') ? path : `/${path}`;
    }
  }

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hidayah_token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await universalFetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include',
    } as any);

    if (response.ok && typeof window !== 'undefined') {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const cloned = response.clone();
        try {
          const data = await cloned.json();
          if (data.token) {
            localStorage.setItem('hidayah_token', data.token);
          }
        } catch {
          // Ignore
        }
      }
    }

    return response;
  } catch (error) {
    console.error(`hidayahFetch failed for ${fullUrl}:`, error);
    throw error;
  }
}
