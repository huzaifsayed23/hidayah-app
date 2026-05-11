


import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import QuizProgress from '@/models/QuizProgress';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import User from '@/models/User';
import { BADGES } from '@/constants/rewards';

async function getUserId(req?: Request) {
  let token = null;
  try {
    const cookieStore = (await cookies().catch(() => null));
    token = cookieStore?.get('hidayah_token')?.value;
  } catch (e) {}

  if (!token && req) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);
    return decoded.userId || decoded.id || decoded.email;
  } catch (e) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    let progress = await QuizProgress.findOne({ userId }).lean();

    if (!progress) {
      progress = await QuizProgress.create({
        userId,
        completedLevels: [],
        unlockedLevels: 1,
        totalQuestionsAnswered: 0,
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Quiz progress error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const { level, score, questionsCount } = body;
    const scoreNum = Number(score);
    const questionsCountNum = Number(questionsCount);
    const levelNum = level === 'mixed' ? 6 : Number(level);
    
    console.log(`[Quiz API] User ${userId} completed Level ${levelNum} with score ${scoreNum}/${questionsCountNum}`);

    await dbConnect();
    
    let progress = await QuizProgress.findOne({ userId });
    if (!progress) {
      progress = new QuizProgress({ userId });
    }

    progress.totalQuestionsAnswered += questionsCountNum;
    progress.lastScore = scoreNum;

    const isPassing = scoreNum / questionsCountNum >= 0.8;

    if (isPassing) {
      if (!progress.completedLevels.includes(levelNum)) {
        progress.completedLevels.push(levelNum);
      }
      
      const nextLevel = levelNum + 1;
      if (nextLevel <= 6 && progress.unlockedLevels < nextLevel) {
        progress.unlockedLevels = nextLevel;
        console.log(`[Quiz API] Unlocking Level ${nextLevel} for User ${userId}`);
      }
    }

    progress.updatedAt = new Date();
    await progress.save();

    // Reward Logic: Update User document if level passed
    let unlockedReward = null;
    if (isPassing) {
      const isEmail = userId.includes('@');
      const user = isEmail ? await User.findOne({ email: userId }) : await User.findById(userId);
      
      if (user) {
        let updated = false;
        if (!user.unlockedBadges) user.unlockedBadges = [];
        if (!user.unlockedBackgrounds) user.unlockedBackgrounds = [];

        const badge = BADGES.find(b => b.levelRequired === levelNum);
        if (badge && !user.unlockedBadges.includes(badge.id)) {
          user.unlockedBadges.push(badge.id);
          updated = true;
          unlockedReward = { type: 'badge', data: badge };
        }

        if (updated) {
          user.markModified('unlockedBadges');
          user.markModified('unlockedBackgrounds');
          await user.save();
        }
      }
    }

    return NextResponse.json({ 
      ...progress.toObject(), 
      unlockedReward 
    });
  } catch (error) {
    console.error('Update quiz progress error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    await QuizProgress.findOneAndDelete({ userId });

    return NextResponse.json({ message: 'Progress reset successfully' });
  } catch (error) {
    console.error('Reset quiz progress error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
