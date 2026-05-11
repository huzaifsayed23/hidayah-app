import { NextResponse, connection } from 'next/server';

export async function GET() {
  await connection().catch(() => {});
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}