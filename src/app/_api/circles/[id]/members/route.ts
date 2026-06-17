

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Circle from '@/models/Circle';
import Notification from '@/models/Notification';
import User from '@/models/User';
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { userId } = await req.json();

    if (!userId) return NextResponse.json({ message: 'User ID is required' }, { status: 400 });

    await dbConnect();
    let circle = await Circle.findOne({ slug: id });
    if (!circle) {
      circle = await Circle.findOne({ title: { $regex: new RegExp(id.replace(/-/g, ' '), 'i') } });
    }
    if (!circle && mongoose.isValidObjectId(id)) {
      circle = await Circle.findById(id);
    }

    if (!circle) return NextResponse.json({ message: 'Circle not found' }, { status: 404 });

    // Only founder or admins can invite others
    const isFounder = circle.creatorId.toString() === user.userId;
    const isAdmin = circle.adminIds.some((id: any) => id.toString() === user.userId);
    
    if (!isFounder && !isAdmin) {
      return NextResponse.json({ message: 'Only admins can invite members' }, { status: 403 });
    }

    // Check if an invitation already exists
    const existingInvite = await Notification.findOne({
      recipientId: userId,
      circleId: id,
      type: 'circle_invite',
      status: 'pending'
    });

    if (existingInvite) {
      return NextResponse.json({ message: 'Invitation already sent' }, { status: 400 });
    }

    // Fetch current user details for the latest username
    const dbUser = await User.findById(user.userId);

    // Send invitation notification
    await Notification.create({
      recipientId: userId,
      senderId: user.userId,
      senderName: dbUser?.username || user.username || 'A brother/sister',
      type: 'circle_invite',
      circleId: id,
      circleTitle: circle.title,
      status: 'pending'
    });

    console.log(`Sent individual invitation to ${userId} for circle ${id}`);
    return NextResponse.json({ message: 'Invitation sent' });
  } catch (error) {
    return NextResponse.json({ message: 'Error adding member' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    let targetUserId = user.userId; // Default to self (leaving)
    
    // Check if a specific user is being removed (founder only)
    try {
      const body = await req.json();
      if (body.targetUserId) targetUserId = body.targetUserId;
    } catch (e) {
      // Body might be empty, ignore
    }

    await dbConnect();
    let circle = await Circle.findOne({ slug: id });
    if (!circle) {
      circle = await Circle.findOne({ title: { $regex: new RegExp(id.replace(/-/g, ' '), 'i') } });
    }
    if (!circle && mongoose.isValidObjectId(id)) {
      circle = await Circle.findById(id);
    }

    if (!circle) return NextResponse.json({ message: 'Circle not found' }, { status: 404 });

    // If removing someone else, must be founder or admin
    const isFounder = circle.creatorId.toString() === user.userId;
    const isAdmin = circle.adminIds.some((id: any) => id.toString() === user.userId);

    if (targetUserId !== user.userId && !isFounder && !isAdmin) {
      return NextResponse.json({ message: 'Only admins can remove members' }, { status: 403 });
    }

    // If leaving self, check membership
    if (targetUserId === user.userId && !circle.memberIds.includes(user.userId)) {
      return NextResponse.json({ message: 'Not a member' }, { status: 400 });
    }

    // Enforce min 3 members for leaving (not removing), unless it's a dead circle
    if (targetUserId === user.userId && circle.memberIds.length > 1 && circle.memberIds.length <= 3) {
      return NextResponse.json({ 
        message: 'A Circle requires minimum 3 members. If you want to end this circle, the founder must delete it.' 
      }, { status: 400 });
    }

    circle.memberIds = circle.memberIds.filter((m: any) => m.toString() !== targetUserId);
    await circle.save();

    return NextResponse.json({ 
      message: targetUserId === user.userId ? 'Left circle successfully' : 'Member removed successfully' 
    });
  } catch (error) {
    console.error('Error in member removal:', error);
    return NextResponse.json({ message: 'Error updating membership' }, { status: 500 });
  }
}
