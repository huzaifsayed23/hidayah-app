import mongoose, { Schema, model, models } from 'mongoose';

const QuizQuestionSchema = new Schema({
  level: {
    type: Number,
    required: true,
    index: true,
  },
  category: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
    required: true,
  }],
  correctAnswer: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

if (mongoose.models.QuizQuestion) {
  delete mongoose.models.QuizQuestion;
}

const QuizQuestion = model('QuizQuestion', QuizQuestionSchema);

export default QuizQuestion;
