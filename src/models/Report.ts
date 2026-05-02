import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  postId?: mongoose.Types.ObjectId;
  reportedUserId?: mongoose.Types.ObjectId;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
}

const ReportSchema: Schema = new Schema({
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post' },
  reportedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  reason: { 
    type: String, 
    required: true,
    enum: ['Harassment', 'Misinformation', 'Disrespectful', 'Inappropriate Content', 'Spam', 'Other']
  },
  details: { type: String },
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Ensure a user can only report a specific post or user once
ReportSchema.index({ reporterId: 1, postId: 1 }, { unique: true, sparse: true });
ReportSchema.index({ reporterId: 1, reportedUserId: 1 }, { unique: true, sparse: true });

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
