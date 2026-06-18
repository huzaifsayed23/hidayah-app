

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Circle from '@/models/Circle';
import Notification from '@/models/Notification';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getAuthUser() {
  const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
  const token = cookieStore.get('hidayah_token')?.value;
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    return jwt.verify(token, secret) as any;
  } catch(e) {
    return null;
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let user = null;
    try {
      user = await getAuthUser();
    } catch (e) {
      // Ignore during build
    }

    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    
    // Try to find by slug first, then by title regex, then by ID
    let circle = await Circle.findOne({ slug: id }).populate('memberIds', 'username email image isOnline lastSeen').lean();
    
    if (!circle) {
      circle = await Circle.findOne({ 
        title: { $regex: new RegExp(id.replace(/-/g, ' '), 'i') } 
      }).populate('memberIds', 'username email image isOnline lastSeen').lean();
    }
    
    if (!circle && mongoose.isValidObjectId(id)) {
      circle = await Circle.findById(id).populate('memberIds', 'username email image isOnline lastSeen').lean();
      
      // Migration: If found by ID but missing slug, generate one now
      if (circle && !circle.slug) {
        let newSlug = circle.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const exists = await Circle.findOne({ slug: newSlug });
        if (exists) newSlug = `${newSlug}-${Math.random().toString(36).substring(2, 5)}`;
        
        await Circle.updateOne({ _id: circle._id }, { $set: { slug: newSlug } });
        circle.slug = newSlug;
      }
    }
    
    if (!circle) return NextResponse.json({ message: 'Circle not found' }, { status: 404 });

    // If private, check membership
    if (circle.privacy === 'private' && !circle.memberIds.some((m: any) => m._id.toString() === user.userId)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ circle });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching circle details' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    
    let circle = await Circle.findOne({ slug: id });
    
    if (!circle) {
      circle = await Circle.findOne({ 
        title: { $regex: new RegExp(id.replace(/-/g, ' '), 'i') } 
      });
    }

    if (!circle && mongoose.isValidObjectId(id)) {
      circle = await Circle.findById(id);
    }

    if (!circle) return NextResponse.json({ message: 'Circle not found' }, { status: 404 });

    // Only creator can delete the circle
    if (circle.creatorId.toString() !== user.userId && circle.creatorId.toString() !== user.email && circle.creatorId.toString() !== user.username) {
      return NextResponse.json({ message: 'Only the founder can disband this circle' }, { status: 403 });
    }

    // Delete the circle
    await Circle.findByIdAndDelete(circle._id);

    // Optional: Cleanup associated notifications
    await Notification.deleteMany({ circleId: id });

    return NextResponse.json({ message: 'Circle disbanded successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Error disbanding circle' }, { status: 500 });
  }
}
