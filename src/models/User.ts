import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true, // Explicit index for faster regex search
  },
  bio: {
    type: String,
    default: "Seeking knowledge and patience. Striving to be better than I was yesterday.",
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  savedPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  savedHadiths: [{
    bookSlug: String,
    bookName: String,
    hadithNumber: String,
    hadithArabic: String,
    hadithEnglish: String,
    status: String,
    addedAt: { type: Date, default: Date.now }
  }],
  lastReadPage: {
    type: Number,
    default: 1,
  },
  bookmarks: [{
    chapterId: Number,
    verseNumber: Number,
    pageNumber: Number,
    verseKey: String,
    addedAt: { type: Date, default: Date.now }
  }],
  image: {
    type: String,
    default: null,
  },
  unlockedBadges: [{
    type: String, // IDs from BADGES constant
  }],
  unlockedBackgrounds: [{
    type: String, // IDs from REFLECTION_THEMES constant
  }],
  acceptedTerms: {
    type: Boolean,
    default: false,
  },
  isSuspended: {
    type: Boolean,
    default: false,
  },
  warningCount: {
    type: Number,
    default: 0,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
    index: true, // Important for cleaning up inactive presence
  },
  mutedCircles: [{
    type: Schema.Types.ObjectId,
    ref: 'Circle'
  }],
  fcmTokens: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = models.User || model('User', UserSchema);

export default User;
