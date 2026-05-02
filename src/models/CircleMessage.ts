import mongoose, { Schema, model, models } from 'mongoose';

const CircleMessageSchema = new Schema({
  circleId: {
    type: Schema.Types.ObjectId,
    ref: 'Circle',
    required: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: false, // Make text optional if there's an image
  },
  imageUrl: {
    type: String, // Base64 or URL
    required: false,
  },
  fileUrl: {
    type: String, // Base64 or URL
    required: false,
  },
  fileName: {
    type: String,
    required: false,
  },
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'CircleMessage',
    default: null,
  },
  reactions: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String }
  }],
  seenBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

CircleMessageSchema.index({ circleId: 1, createdAt: 1 });

// Clear cache in development to ensure schema changes are picked up
if (process.env.NODE_ENV === 'development') {
  delete (models as any).CircleMessage;
}

const CircleMessage = models.CircleMessage || model('CircleMessage', CircleMessageSchema);
export default CircleMessage;
