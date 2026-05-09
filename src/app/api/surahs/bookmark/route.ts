export function generateStaticParams() { return []; }

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import SavedSurah from "@/models/SavedSurah";

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';

async function getUserId() {
  const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
  const token = cookieStore.get("hidayah_token")?.value;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const bookmarks = await SavedSurah.find({ userId });
  return NextResponse.json(bookmarks);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { surahId, lastAyahRead } = await req.json();

  await dbConnect();
  const bookmark = await SavedSurah.findOneAndUpdate(
    { userId, surahId },
    { lastAyahRead, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  return NextResponse.json(bookmark);
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { surahId } = await req.json();

  await dbConnect();
  await SavedSurah.deleteOne({ userId, surahId });

  return NextResponse.json({ message: "Deleted" });
}
