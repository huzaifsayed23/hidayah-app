export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = (await cookies().catch(() => null));
  if (cookieStore) {
    try {
      cookieStore.delete('hidayah_token');
    } catch (e) {}
  }
  
  return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
}
