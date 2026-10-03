import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    roomId: { type: String, default: () => randomUUID(), unique: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    scheduledAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'scheduled',
    },
    recordingUrl: { type: String, default: '' },
    transcript: { type: String, default: '' },
    summary: { type: String, default: '' },
    actionItems: [
      {
        text: String,
        assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        done: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export const Meeting = mongoose.model('Meeting', meetingSchema);
