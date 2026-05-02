import mongoose, { Schema, Document } from "mongoose";

export interface ISavedSurah extends Document {
  userId: mongoose.Types.ObjectId;
  surahId: number;
  lastAyahRead: number;
  updatedAt: Date;
}

const SavedSurahSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    surahId: { type: Number, required: true },
    lastAyahRead: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Ensure unique combination of user and surah
SavedSurahSchema.index({ userId: 1, surahId: 1 }, { unique: true });

export default mongoose.models.SavedSurah || mongoose.model<ISavedSurah>("SavedSurah", SavedSurahSchema);
