import OpenAI from 'openai';

// AI_PROVIDER = mock | openai | groq   (MOCK_AI=true is also accepted)
const PROVIDER = process.env.MOCK_AI === 'true' ? 'mock' : (process.env.AI_PROVIDER || 'groq');

const CONFIG = {
  openai: { baseURL: undefined, key: process.env.OPENAI_API_KEY, stt: 'whisper-1', llm: 'gpt-4o-mini' },
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    key: process.env.GROQ_API_KEY,
    stt: 'whisper-large-v3-turbo',
    llm: 'openai/gpt-oss-20b',
  },
};

const cfg = CONFIG[PROVIDER];
const client = cfg ? new OpenAI({ apiKey: cfg.key, baseURL: cfg.baseURL }) : null;

const MOCK_TRANSCRIPT =
  "Alice: Let's finalize the launch plan this week. Bob, can you prepare the demo by Friday? " +
  'Carol, please update the documentation before Monday. We also need to fix the login bug before release.';

const MOCK_RESULT = {
  summary:
    'The team discussed the launch plan. Bob will prepare the demo, Carol will update the docs, and the login bug must be fixed before release.',
  actionItems: [
    { text: 'Prepare the demo', assignee: 'Bob', dueDate: null },
    { text: 'Update the documentation', assignee: 'Carol', dueDate: null },
    { text: 'Fix the login bug', assignee: 'Unassigned', dueDate: null },
  ],
};

export async function transcribeAudio(file) {
  if (PROVIDER === 'mock') return MOCK_TRANSCRIPT;
  const audio = await OpenAI.toFile(file.buffer, file.originalname || 'audio.webm', { type: file.mimetype });
  const res = await client.audio.transcriptions.create({
    file: audio,
    model: cfg.stt,
    language: process.env.WHISPER_LANGUAGE || 'en',
  });
  return res.text;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_INDEX = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

const fmt = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Turns a phrase like "Wednesday", "next Friday", "tomorrow" or "before Monday" into a yyyy-mm-dd date.
// Done in code, because language models get weekday arithmetic wrong.
function resolveDue(phrase) {
  if (!phrase || typeof phrase !== 'string') return null;
  const p = phrase.toLowerCase().trim();
  const now = new Date();
  const add = (n) => {
    const d = new Date(now);
    d.setDate(now.getDate() + n);
    return fmt(d);
  };
  if (/\b(today|tonight)\b/.test(p)) return add(0);
  if (/\btomorrow\b/.test(p)) return add(1);
  if (/\bnext week\b/.test(p)) return add(7);
  const m = p.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (m) {
    let diff = (WEEKDAY_INDEX[m[1]] - now.getDay() + 7) % 7;
    if (diff === 0) diff = 7; // a bare weekday means the next one after today
    if (/\bnext\b/.test(p) && diff < 7) diff += 7; // "next Friday" means the Friday of the following week
    return add(diff);
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : null;
}

export async function summarizeTranscript(transcript, participants = []) {
  if (PROVIDER === 'mock') return MOCK_RESULT;
  const now = new Date();
  const today = `${DAYS[now.getDay()]} ${fmt(now)}`;
  const system = `You extract meeting notes. Today is ${today}.
Known participants: ${participants.join(', ') || 'unknown'}.
Return ONLY JSON: {"summary": string (2-4 sentences),
"actionItems": [{"text": string, "assignee": string ("Unassigned" if nobody was named), "due": string|null}]}.
For "due", copy the deadline words EXACTLY as spoken, such as "Wednesday", "next Friday", "tomorrow" or "before Monday". Do not convert them to dates. Use null if no deadline was mentioned.
In the summary, do not write calendar dates; refer to deadlines in the speaker's own words.
Include every task that someone committed to, was asked to do, or that was said "needs to be done" (use "Unassigned" when no one was named). Do not invent tasks, assignees or deadlines.`;
  const res = await client.chat.completions.create({
    model: cfg.llm,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: system }, { role: 'user', content: transcript }],
  });
  const data = JSON.parse(res.choices[0].message.content);
  const items = Array.isArray(data.actionItems) ? data.actionItems : [];
  return {
    summary: data.summary || '',
    actionItems: items.map((a) => ({
      text: a.text,
      assignee: a.assignee || 'Unassigned',
      dueDate: resolveDue(a.due ?? a.dueDate),
    })),
  };
}

export function toUserError(err) {
  if (err?.status === 429) {
    return { status: 503, message: 'AI summary is temporarily unavailable (provider quota exceeded).' };
  }
  if (err?.status === 401) {
    return { status: 500, message: 'AI provider key is invalid. Check the server configuration.' };
  }
  return { status: 500, message: 'Transcription failed. Please try again.' };
}