import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

// Created lazily so the server doesn't crash on startup if the key isn't
// set yet — AI features will just return a clear error when actually used.
let openai = null;
const getClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Add it to your .env to use AI features.');
  }
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

// Transcribes an audio/video buffer using Whisper. Whisper accepts webm
// directly, so the recorded meeting clip can be sent as-is.
export const transcribeAudio = async (buffer, filename = 'recording.webm') => {
  const client = getClient();
  const file = await toFile(buffer, filename);
  const transcription = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
  });
  return transcription.text;
};

// Summarizes a transcript into a short summary plus structured action items.
// The model is asked to return JSON only; parsing is defensive in case it
// doesn't comply perfectly.
export const summarizeTranscript = async (transcript) => {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You summarize meeting transcripts for a business audience. ' +
          'Respond with ONLY valid JSON, no markdown fences, no extra text, ' +
          'in this exact shape: {"summary": string, "actionItems": [{"text": string, "assignee": string | null}]}. ' +
          'Keep the summary to 3-5 sentences. Extract action items only when the transcript ' +
          'clearly states a task or decision; assignee is the person named as responsible, or null if unclear.',
      },
      { role: 'user', content: transcript },
    ],
    temperature: 0.3,
  });

  const raw = response.choices[0]?.message?.content || '{}';
  try {
    return JSON.parse(raw);
  } catch {
    return { summary: raw.slice(0, 500), actionItems: [] };
  }
};