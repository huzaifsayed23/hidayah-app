import mongoose, { Schema, model, models } from 'mongoose';

// Version: 1.0.1 - Added circle_invite and status
const NotificationSchema = new Schema({
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'circle_invite', 'circle_request'],
    required: true,
  },
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: false,
  },
  circleId: {
    type: Schema.Types.ObjectId,
    ref: 'Circle',
    required: false,
  },
  circleTitle: {
    type: String,
  },
  postExcerpt: {
    type: String,
  },
  commentText: {
    type: String,
  },
  moodTag: {
    type: String,
  },
  backdropVariant: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'denied'],
    default: 'pending',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

// Clear cache in development to ensure schema changes are picked up
if (process.env.NODE_ENV === 'development') {
  delete models.Notification;
}

const Notification = models.Notification || model('Notification', NotificationSchema);
export default Notification;
