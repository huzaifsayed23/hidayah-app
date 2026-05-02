import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Circle from '@/models/Circle';
import Notification from '@/models/Notification';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getAuthUser() {
  const cookieStore = await cookies();
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
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const circle = await Circle.findById(id).populate('memberIds', 'username email image isOnline lastSeen').lean();
    
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
    const circle = await Circle.findById(id);
    if (!circle) return NextResponse.json({ message: 'Circle not found' }, { status: 404 });

    // Only creator can delete the circle
    if (circle.creatorId.toString() !== user.userId) {
      return NextResponse.json({ message: 'Only the founder can disband this circle' }, { status: 403 });
    }

    // Delete the circle
    await Circle.findByIdAndDelete(id);

    // Optional: Cleanup associated notifications
    await Notification.deleteMany({ circleId: id });

    return NextResponse.json({ message: 'Circle disbanded successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Error disbanding circle' }, { status: 500 });
  }
}
