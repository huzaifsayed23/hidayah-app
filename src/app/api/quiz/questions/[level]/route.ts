]; }

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import QuizQuestion from '@/models/QuizQuestion';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ level: string }> }
) {
  try {
    try {
      await dbConnect();
    } catch (e) {
      return NextResponse.json({ message: 'Static build' });
    }
    const { level } = await params;

    let questions;
    
    if (level === 'mixed') {
      // Get 30 random questions from all levels
      questions = await QuizQuestion.aggregate([
        { $sample: { size: 30 } }
      ]);
    } else {
      const levelNum = parseInt(level);
      // Get 15 random questions for a specific level
      questions = await QuizQuestion.aggregate([
        { $match: { level: levelNum } },
        { $sample: { size: 15 } }
      ]);
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ message: 'No questions found' }, { status: 404 });
    }

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Fetch quiz questions error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
