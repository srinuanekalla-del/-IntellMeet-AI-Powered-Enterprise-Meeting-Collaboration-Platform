import MeetingSummary from '../models/MeetingSummary.js';
import { transcribeAudio, summarizeTranscript, toUserError } from '../services/aiService.js';
import { notify } from '../utils/notify.js';

const uid = (req) => req.user._id ?? req.user.id;

const toItems = (items) =>
  items.map((i) => ({
    text: i.text,
    assignee: i.assignee || 'Unassigned',
    dueDate: i.dueDate && !Number.isNaN(Date.parse(i.dueDate)) ? new Date(i.dueDate) : null,
  }));

async function saveAndNotify(req, roomId, transcript, result, existing) {
  const doc = existing || new MeetingSummary({ roomId, createdBy: uid(req) });
  doc.transcript = transcript;
  doc.summary = result.summary;
  doc.actionItems = toItems(result.actionItems);
  await doc.save();
  if (doc.actionItems.length) {
    await notify(req.app.get('io'), {
      user: uid(req),
      type: 'action_item',
      message: `${doc.actionItems.length} action item(s) extracted from your meeting`,
      link: `/meetings/summaries/${doc._id}`,
    });
  }
  return doc;
}

// POST /room/:roomId/transcribe  (multipart, field "audio")
export const transcribeMeeting = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No audio uploaded.' });
    const transcript = await transcribeAudio(req.file);
    if (!transcript?.trim()) return res.status(422).json({ message: 'No speech detected in the recording.' });
    const result = await summarizeTranscript(transcript);
    const doc = await saveAndNotify(req, req.params.roomId, transcript, result);
    console.log('[Transcribe] success', doc._id.toString());
    res.json(doc);
  } catch (err) {
    console.error('[Transcribe] failed:', err.status, err.message);
    const { status, message } = toUserError(err);
    res.status(status).json({ message });
  }
};

// POST /room/:roomId/summarize  body: { transcript? }  (re-runs the summary)
export const summarizeMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;
    let doc = null;
    let transcript = req.body?.transcript;
    if (!transcript) {
      doc = await MeetingSummary.findOne({ roomId, createdBy: uid(req) }).sort({ createdAt: -1 });
      if (!doc) return res.status(404).json({ message: 'No transcript found for this meeting.' });
      transcript = doc.transcript;
    }
    const result = await summarizeTranscript(transcript);
    res.json(await saveAndNotify(req, roomId, transcript, result, doc));
  } catch (err) {
    console.error('[Summarize] failed:', err.status, err.message);
    const { status, message } = toUserError(err);
    res.status(status).json({ message });
  }
};

// GET /summaries  -> post-meeting dashboard list
export const listSummaries = async (req, res) => {
  const docs = await MeetingSummary.find({ createdBy: uid(req) }).sort({ createdAt: -1 }).limit(50);
  res.json(docs);
};

// GET /summaries/:id
export const getSummary = async (req, res) => {
  const doc = await MeetingSummary.findOne({ _id: req.params.id, createdBy: uid(req) });
  if (!doc) return res.status(404).json({ message: 'Summary not found.' });
  res.json(doc);
};
