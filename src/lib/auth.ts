import { cookies, headers } from 'next/headers';
import { connection } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * Universal server-side auth helper for Next.js API routes.
 * Supports both cookies (Web) and Authorization headers (Mobile Bridge).
 */
export async function getAuthUser() {
  await connection().catch(() => {});
  let token = null;
  
  try {
    // 1. Try Cookies (standard web)
    const cookieStore = await cookies().catch(() => null);
    if (cookieStore) {
      token = cookieStore.get('hidayah_token')?.value;
    }
  } catch (e) {
    // Ignore build-time or environment errors
  }

  if (!token) {
    try {
      // 2. Try Authorization Header (Capacitor/Mobile)
      const headerList = await headers().catch(() => null);
      if (headerList) {
        const authHeader = headerList.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.slice(7);
        }
      }
    } catch (e) {
      // Ignore environment errors
    }
  }

  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    return jwt.verify(token, secret) as any;
  } catch (e) {
    return null;
  }
}
