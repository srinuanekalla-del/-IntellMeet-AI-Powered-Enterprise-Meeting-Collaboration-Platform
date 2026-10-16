import mongoose from 'mongoose';

const actionItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  assignee: { type: String, default: 'Unassigned' },
  dueDate: { type: Date, default: null },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null }, // set once converted to a task
});

const meetingSummarySchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transcript: { type: String, default: '' },
    summary: { type: String, default: '' },
    actionItems: [actionItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model('MeetingSummary', meetingSummarySchema);
