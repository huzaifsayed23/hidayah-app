export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Circle from '@/models/Circle';
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { targetUserId } = await req.json();

    if (!targetUserId) return NextResponse.json({ message: 'Target User ID is required' }, { status: 400 });

    await dbConnect();
    const circle = await Circle.findById(id);
    if (!circle) return NextResponse.json({ message: 'Circle not found' }, { status: 404 });

    // Only founder can manage admins
    if (circle.creatorId.toString() !== user.userId) {
      return NextResponse.json({ message: 'Only the founder can assign admins' }, { status: 403 });
    }

    const isAdmin = circle.adminIds.includes(targetUserId);

    if (isAdmin) {
      // Demote
      circle.adminIds = circle.adminIds.filter((id: any) => id.toString() !== targetUserId);
    } else {
      // Promote
      circle.adminIds.push(targetUserId);
    }

    await circle.save();

    return NextResponse.json({ 
      success: true, 
      isAdmin: !isAdmin,
      message: isAdmin ? 'Member demoted from admin' : 'Member promoted to admin' 
    });
  } catch (error) {
    console.error('Admin Management Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
