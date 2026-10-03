import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['meeting-invite', 'meeting-starting', 'task-assigned', 'chat-mention'],
      required: true,
    },
    message: { type: String, required: true },
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
