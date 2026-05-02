export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import QuizProgress from '@/models/QuizProgress';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import User from '@/models/User';
import { BADGES, REFLECTION_THEMES } from '@/constants/rewards';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('hidayah_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);
    const userId = decoded.userId || decoded.email;

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
    const cookieStore = await cookies();
    const token = cookieStore.get('hidayah_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);
    const userId = decoded.userId || decoded.email;

    const { level, score, questionsCount } = await req.json();
    const scoreNum = Number(score);
    const questionsCountNum = Number(questionsCount);
    const levelNum = Number(level);
    
    console.log(`[Quiz API] User ${userId} completed Level ${levelNum} with score ${scoreNum}/${questionsCountNum}`);

    await dbConnect();
    
    // Use atomic update to avoid race conditions and ensure defaults are applied
    const update: any = {
      $inc: { totalQuestionsAnswered: questionsCount },
      $set: { lastScore: score, updatedAt: new Date() }
    };

    // If score is passing (7/10 or more), add to completed and potentially unlock next
    if (score >= 7) {
      update.$addToSet = { completedLevels: level };
      
      // Calculate what the new unlocked level should be
      // If we just completed our current highest unlocked level, unlock the next one
      const nextLevel = level + 1;
      if (nextLevel <= 5) {
        // We'll update unlockedLevels only if the new level is higher than current
        // Note: This logic will be handled better by fetching current progress first or using $max
      }
    }

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
      if (nextLevel <= 5 && progress.unlockedLevels < nextLevel) {
        progress.unlockedLevels = nextLevel;
        console.log(`[Quiz API] Unlocking Level ${nextLevel} for User ${userId}`);
      }
    }

    progress.updatedAt = new Date();
    await progress.save();

    // Reward Logic: Update User document if level passed
    let unlockedReward = null;
    if (isPassing) {
      // Handle fallback where userId might be an email or an ObjectId string
      const isEmail = userId.includes('@');
      const user = isEmail ? await User.findOne({ email: userId }) : await User.findById(userId);
      console.log(`[Quiz API] Checking rewards for user ${userId}, found: ${!!user}`);
      
      if (user) {
        let updated = false;
        
        // Ensure arrays exist
        if (!user.unlockedBadges) user.unlockedBadges = [];
        if (!user.unlockedBackgrounds) user.unlockedBackgrounds = [];

        // Check for badge unlock
        const badge = BADGES.find(b => b.levelRequired === levelNum);
        if (badge && !user.unlockedBadges.includes(badge.id)) {
          user.unlockedBadges.push(badge.id);
          updated = true;
          unlockedReward = { type: 'badge', data: badge };
          console.log(`[Quiz API] Unlocked Badge: ${badge.id}`);
        }

        // Check for background unlock
        const themes = REFLECTION_THEMES.filter(t => t.levelRequired === levelNum);
        for (const theme of themes) {
          if (!user.unlockedBackgrounds.includes(theme.id)) {
            user.unlockedBackgrounds.push(theme.id);
            updated = true;
            if (!unlockedReward) {
               unlockedReward = { type: 'theme', data: theme };
            } else if (unlockedReward.type === 'theme') {
               // If multiple themes, we'll just show the first one in the popup for now
               // but both are unlocked. Or we could enhance the popup.
            } else if (unlockedReward.type === 'badge') {
               unlockedReward = { ...unlockedReward, theme: theme };
            }
            console.log(`[Quiz API] Unlocked Theme: ${theme.id}`);
          }
        }

        if (updated) {
          // Explicitly mark as modified for mixed/array types
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

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('hidayah_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    const decoded: any = jwt.verify(token, secret);
    const userId = decoded.userId || decoded.email;

    await dbConnect();
    await QuizProgress.findOneAndDelete({ userId });

    return NextResponse.json({ message: 'Progress reset successfully' });
  } catch (error) {
    console.error('Reset quiz progress error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
