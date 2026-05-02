import mongoose, { Schema, model, models } from 'mongoose';

const QuizProgressSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  completedLevels: {
    type: [Number],
    default: [],
  },
  lastScore: {
    type: Number,
    default: 0,
  },
  unlockedLevels: {
    type: Number,
    default: 1, // Start with level 1 unlocked
  },
  totalQuestionsAnswered: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

if (mongoose.models.QuizProgress) {
  delete mongoose.models.QuizProgress;
}

const QuizProgress = model('QuizProgress', QuizProgressSchema);

export default QuizProgress;
