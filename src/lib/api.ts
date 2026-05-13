import { Capacitor, CapacitorHttp, HttpOptions } from '@capacitor/core';

const QDC_API_URL = "https://api.qurancdn.com/api/qdc";
const PRIMARY_URL = "https://hidayah-lpqy.vercel.app";
const FALLBACK_URL = "https://hidayah-app.vercel.app";
export const HIDAYAH_API_URL = (process.env.NEXT_PUBLIC_HIDAYAH_API_URL || PRIMARY_URL).replace(/\/$/, '');

/**
 * Universal bridge for mobile connectivity with deep error trapping
 */
async function universalFetch(url: string, options: RequestInit = {}, retries = 1) {
  const isNative = Capacitor.isNativePlatform();

  try {
    if (isNative) {
      const optionsHeaders = (options.headers as Record<string, string>) || {};
      const headers: Record<string, string> = { ...optionsHeaders };

      const isGet = !options.method || options.method.toUpperCase() === 'GET';
      if (!isGet && !headers['Content-Type'] && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      let data = options.body;
      if (typeof data === 'string' && headers['Content-Type'] === 'application/json') {
        try { data = JSON.parse(data); } catch (e) {}
      }

      const httpOptions: HttpOptions = {
        url: url.startsWith('http') ? url : `${PRIMARY_URL}${url}`,
        method: options.method || 'GET',
        headers: headers,
        data: data,
        connectTimeout: 20000,
        readTimeout: 20000,
      };

      try {
        const response = await CapacitorHttp.request(httpOptions);
        
        // Handle Success
        if (response.status >= 200 && response.status < 300) {
          return {
            ok: true,
            status: response.status,
            json: async () => typeof response.data === 'string' ? JSON.parse(response.data) : response.data,
            clone: function() { return this; }
          } as any;
        }

        // Handle Server Errors (404, 500, etc.)
        let errorMsg = `Server Error (${response.status})`;
        if (typeof response.data === 'string' && response.data.includes('message')) {
          try { errorMsg = JSON.parse(response.data).message || errorMsg; } catch(e) {}
        } else if (response.data?.message) {
          errorMsg = response.data.message;
        }

        return {
          ok: false,
          status: response.status,
          json: async () => ({ message: errorMsg }),
          clone: function() { return this; }
        } as any;

      } catch (err: any) {
        throw new Error(`Device connection failed.`);
      }
    }

    return fetch(url, options);
  } catch (error: any) {
    if (retries > 0) return universalFetch(url, options, retries - 1);
    throw error;
  }
}

let authCache: { data: any, timestamp: number } | null = null;
const responseCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 30000; // 30 seconds cache for same-session navigation speed

export async function hidayahFetch(url: string, options: RequestInit = {}) {
  const isInternal = url.startsWith('/') || url.startsWith(HIDAYAH_API_URL) || url.includes('vercel.app');
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const isWeb = typeof window !== 'undefined';
  const isLocalhost = isWeb && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const isNative = Capacitor.isNativePlatform();

  if (isInternal) {
    let path = url.replace(HIDAYAH_API_URL, '').replace(PRIMARY_URL, '').replace(FALLBACK_URL, '');
    if (!path.startsWith('/')) path = '/' + path;
    
    // Client-side cache check to prevent "hanging" during rapid navigation
    if (isGet && isWeb) {
      const cacheKey = path;
      const now = Date.now();
      
      // Special handling for auth/me to make it instant
      if (path === '/api/auth/me/' || path === '/api/auth/me') {
        if (authCache && (now - authCache.timestamp < CACHE_TTL)) {
          return {
            ok: true,
            status: 200,
            json: async () => JSON.parse(JSON.stringify(authCache!.data)),
            clone: function() { return this; }
          } as any;
        }
      } else if (responseCache[cacheKey] && (now - responseCache[cacheKey].timestamp < 10000)) {
        // Cache other GET requests for 10 seconds to smooth out transitions
        const cached = responseCache[cacheKey];
        return {
          ok: true,
          status: 200,
          json: async () => JSON.parse(JSON.stringify(cached.data)),
          clone: function() { return this; }
        } as any;
      }
    }

    // Add trailing slash for internal API routes
    if (!path.includes('.')) {
      const queryIndex = path.indexOf('?');
      if (queryIndex !== -1) {
        const basePath = path.substring(0, queryIndex);
        if (!basePath.endsWith('/')) {
          path = basePath + '/' + path.substring(queryIndex);
        }
      } else if (!path.endsWith('/')) {
        path += '/';
      }
    }

    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('hidayah_token');
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const baseUrl = (isLocalhost && !isNative) ? window.location.origin : HIDAYAH_API_URL;

    try {
      const res = await universalFetch(`${baseUrl}${path}`, { ...options, headers });
      
      // Cache successful GET responses
      if (res.ok && isGet && isWeb) {
        const cacheKey = path;
        const clonedRes = res.clone ? res.clone() : res;
        try {
          const data = await clonedRes.json();
          const cacheEntry = { data, timestamp: Date.now() };
          if (path === '/api/auth/me/' || path === '/api/auth/me') {
            authCache = cacheEntry;
          } else {
            responseCache[cacheKey] = cacheEntry;
          }
        } catch (e) {}
      }

      if (res.ok) return res;
      if (isLocalhost && !isNative) return res;

      if (baseUrl !== FALLBACK_URL && res.status >= 400) {
        const fbRes = await universalFetch(`${FALLBACK_URL}${path}`, { ...options, headers });
        if (fbRes.ok) return fbRes;
      }
      return res;
    } catch (e) {
      if (isLocalhost) {
        console.error(`[Hidayah API] Primary Request Failed (${baseUrl}${path}):`, e);
      }
      if (isLocalhost && !isNative) throw e;
      if (baseUrl !== FALLBACK_URL) {
        return universalFetch(`${FALLBACK_URL}${path}`, { ...options, headers });
      }
      throw e;
    }
  }

  return universalFetch(url, options);
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
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  translated_name: { name: string };
}

export interface Verse {
  id: number;
  verse_key: string;
  text_indopak: string;
  page_number: number;
  translations?: { text: string }[];
}

export async function getJuzs(): Promise<Juz[]> {
  const res = await hidayahFetch(`${QDC_API_URL}/juzs`);
  const data = await res.json();
  return data.juzs || [];
}

export async function getChapters(): Promise<Chapter[]> {
  const res = await hidayahFetch(`${QDC_API_URL}/chapters?language=en`);
  const data = await res.json();
  return data.chapters || [];
}

export async function getVersesByPage(page: number): Promise<Verse[]> {
  try {
    // Attempt 1: QDC API (Official)
    const res = await hidayahFetch(`${QDC_API_URL}/verses/by_page/${page}?words=false&fields=text_indopak&per_page=50`);
    if (res.ok) {
      const data = await res.json();
      if (data.verses && data.verses.length > 0) return data.verses.map((v: any) => ({ ...v, page_number: v.page_number || page }));
    }
    
    // Fallback attempt: QDC API v4
    const v4Res = await hidayahFetch(`https://api.quran.com/api/v4/verses/by_page/${page}?words=false&fields=text_indopak&per_page=50`);
    if (v4Res.ok) {
      const v4Data = await v4Res.json();
      if (v4Data.verses && v4Data.verses.length > 0) return v4Data.verses.map((v: any) => ({ ...v, page_number: v.page_number || page }));
    }

    throw new Error("QDC API empty or failed");
  } catch (error) {
    console.warn("QDC failed, trying AlQuran Cloud for page", page);
    try {
      // Attempt 2: AlQuran Cloud (Fallback)
      const arRes = await hidayahFetch(`https://api.alquran.cloud/v1/page/${page}/quran-indopak`);
      const arData = await arRes.json();
      
      if (arData.data && arData.data.ayahs) {
        return arData.data.ayahs.map((ayah: any) => ({
          id: ayah.number,
          verse_key: `${ayah.surah.number}:${ayah.numberInSurah}`,
          text_indopak: ayah.text,
          page_number: page
        }));
      }
    } catch (fallbackError) {
      console.error("All Quran APIs failed:", fallbackError);
    }
    return [];
  }
}

export async function getVersesByJuz(juz: number): Promise<Verse[]> {
  try {
    const res = await hidayahFetch(`${QDC_API_URL}/verses/by_juz/${juz}?words=false&fields=text_indopak&per_page=500`);
    if (res.ok) {
      const data = await res.json();
      if (data.verses && data.verses.length > 0) return data.verses;
    }
    
    const v4Res = await hidayahFetch(`https://api.quran.com/api/v4/verses/by_juz/${juz}?words=false&fields=text_indopak&per_page=500`);
    if (v4Res.ok) {
      const v4Data = await v4Res.json();
      if (v4Data.verses && v4Data.verses.length > 0) return v4Data.verses;
    }
    
    throw new Error("QDC API failed");
  } catch (error) {
    console.warn("Falling back to AlQuran Cloud for juz", juz);
    try {
      const arRes = await hidayahFetch(`https://api.alquran.cloud/v1/juz/${juz}/quran-indopak`);
      const arData = await arRes.json();
      if (arData.data && arData.data.ayahs) {
        return arData.data.ayahs.map((ayah: any) => ({
          id: ayah.number,
          verse_key: `${ayah.surah.number}:${ayah.numberInSurah}`,
          text_indopak: ayah.text,
          page_number: ayah.page
        }));
      }
    } catch (fallbackError) {
      console.error("Fallback API also failed:", fallbackError);
    }
    return [];
  }
}

export async function getVersesByChapter(chapterId: number): Promise<Verse[]> {
  try {
    const res = await hidayahFetch(`${QDC_API_URL}/verses/by_chapter/${chapterId}?words=false&translations=131,20&fields=text_indopak&per_page=500`);
    if (res.ok) {
      const data = await res.json();
      if (data.verses && data.verses.length > 0) return data.verses;
    }
    throw new Error("QDC API failed");
  } catch (error) {
    console.warn("Falling back to AlQuran Cloud for chapter", chapterId);
    try {
      const arRes = await hidayahFetch(`https://api.alquran.cloud/v1/surah/${chapterId}/quran-indopak`);
      const arData = await arRes.json();
      if (arData.data && arData.data.ayahs) {
        return arData.data.ayahs.map((ayah: any) => ({
          id: ayah.number,
          verse_key: `${chapterId}:${ayah.numberInSurah}`,
          text_indopak: ayah.text
        }));
      }
    } catch (fallbackError) {
      console.error("Fallback API also failed:", fallbackError);
    }
    return [];
  }
}
