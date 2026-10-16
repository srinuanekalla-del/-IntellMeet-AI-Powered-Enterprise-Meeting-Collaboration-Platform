import { useCallback, useState } from 'react';
import { api } from '@/lib/api';

export interface ActionItem {
  id?: string;
  text: string;
  assigneeName?: string | null;
  dueDate?: string | null;
  done: boolean;
}

type Status = 'idle' | 'transcribing' | 'summarizing' | 'done' | 'error';

export const useMeetingAI = (roomId: string) => {
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const processRecording = useCallback(
    async (blob: Blob) => {
      setError('');
      try {
        setStatus('transcribing');
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        // One call: the server transcribes, summarizes, saves, and returns everything.
        const { data } = await api.post(`/meetings/room/${roomId}/transcribe`, formData);

        setSummaryId(data._id);
        setTranscript(data.transcript || '');
        setSummary(data.summary || '');
        setActionItems(
          (data.actionItems || []).map((a: any) => ({
            id: a._id,
            text: a.text,
            assigneeName: a.assignee && a.assignee !== 'Unassigned' ? a.assignee : null,
            dueDate: a.dueDate ?? null,
            done: Boolean(a.task),
          }))
        );
        setStatus('done');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to process recording');
        setStatus('error');
      }
    },
    [roomId]
  );

  return { status, transcript, summary, actionItems, summaryId, error, processRecording };
};
export default useMeetingAI;