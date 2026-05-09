import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';



export async function GET(req: Request) {
  try {
    let token = null;
    try {
      // Try cookie first
      const cookieStore = (await cookies().catch(() => null)); if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });
      token = cookieStore.get('hidayah_token')?.value;

      // Fallback: try Authorization Bearer header
      if (!token) {
        const authHeader = req.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.slice(7);
        }
      }
    } catch (e) {
      // During static export, cookies() might throw.
    }

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }



    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);



    await dbConnect();
    
    // Emergency cleanup for Guest/Invalid accounts (runs on admin or periodic checks)
    // Only triggered when a valid user checks their status to keep DB clean
    if (Math.random() < 0.1) { // 10% chance to run cleanup on check-ins
       await User.deleteMany({ 
         $or: [
           { username: { $regex: /Guest/i } },
           { email: { $not: { $regex: /@/ } } },
           { password: { $exists: false } }
         ]
       });
    }

    const user = await User.findById(decoded.userId).select('acceptedTerms');
    
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ 
      authenticated: true,
      id: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      acceptedTerms: user.acceptedTerms || false,
      isAdmin: decoded.email === 'huzaifsayed454@gmail.com'
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
