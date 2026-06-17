


import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

import { getAuthUser } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    },
  });
}

async function getUserId() {
  const decoded = await getAuthUser();
  return decoded?.userId || decoded?.id || null;
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const bookmarkData = await req.json();
    const { verseKey, pageNumber, chapterId, verseNumber } = bookmarkData;
    
    await dbConnect();
    
    // Check if already bookmarked
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    
    const exists = user.bookmarks.some((b: any) => b.verseKey === verseKey);
    
    if (exists) {
      // Toggle logic: if exists, remove it
      await User.findByIdAndUpdate(userId, {
        $pull: { bookmarks: { verseKey: verseKey } }
      });
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // Add it with all metadata
      await User.findByIdAndUpdate(userId, {
        $push: { 
          bookmarks: { 
            verseKey, 
            pageNumber: pageNumber || 1, 
            chapterId: chapterId || parseInt(verseKey.split(':')[0]),
            verseNumber: verseNumber || parseInt(verseKey.split(':')[1]),
            addedAt: new Date()
          } 
        }
      });
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { verseKey } = await req.json();
    await dbConnect();
    
    await User.findByIdAndUpdate(userId, {
      $pull: { bookmarks: { verseKey: verseKey } }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
    try {
      const userId = await getUserId();
      if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  
      await dbConnect();
      const user = await User.findById(userId).select('bookmarks');
      if (!user) return NextResponse.json({ bookmarks: [] });
      return NextResponse.json({ bookmarks: user.bookmarks });
    } catch (error) {
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  }
