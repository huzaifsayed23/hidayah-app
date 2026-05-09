import mongoose, { Schema, model, models } from 'mongoose';

const PostSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  authorImage: {
    type: String,
    default: null,
  },
  content: {
    type: String,
    required: false,
  },
  moodTag: {
    type: String,
    default: 'Reflective',
  },
  backdropVariant: {
    type: Number,
    default: 0,
  },
  themePalette: {
    type: String,
    default: 'Reflective',
  },
  reflectionThemeId: {
    type: String,
    default: null,
  },
  textColor: {
    type: String,
    default: null,
  },
  customBackgroundImage: {
    type: String,
    default: null,
  },
  verse: {
    surah: String,
    ayah: Number,
    text: String,
    translation: String,
  },
  hadith: {
    hadithArabic: String,
    hadithEnglish: String,
    bookName: String,
    hadithNumber: String,
    status: String,
  },
  ameenCount: {
    type: Number,
    default: 0,
  },
  ameens: [{
    type: String, // Array of userIds who liked it
  }],
  commentCount: {
    type: Number,
    default: 0,
  },
  replies: [{
    author: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  isVisible: {
    type: Boolean,
    default: true,
  },
  reportCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ isVisible: 1, createdAt: -1 });


// Delete the existing model to ensure schema changes are applied during hot-reload
if (mongoose.models.Post) {
  delete mongoose.models.Post;
}

const Post = model('Post', PostSchema);

export default Post;
