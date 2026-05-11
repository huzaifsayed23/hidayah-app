import mongoose, { Schema, model, models } from 'mongoose';

const CircleSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  memberIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  }],
  adminIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  }],
  rules: [{
    type: String,
  }],
  imageUrl: {
    type: String,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  lastMessageText: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Circle = models.Circle || model('Circle', CircleSchema);
export default Circle;
