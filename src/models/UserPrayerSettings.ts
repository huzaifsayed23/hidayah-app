import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPrayerSettings extends Document {
  userId: mongoose.Types.ObjectId;
  location: {
    lat: number;
    lng: number;
    city: string;
  };
  notificationsEnabled: boolean;
  preferredCalculationMethod: number;
}

const UserPrayerSettingsSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    city: { type: String }
  },
  notificationsEnabled: { type: Boolean, default: true },
  preferredCalculationMethod: { type: Number, default: 2 }
}, {
  timestamps: true
});

export default mongoose.models.UserPrayerSettings || mongoose.model<IUserPrayerSettings>('UserPrayerSettings', UserPrayerSettingsSchema);
