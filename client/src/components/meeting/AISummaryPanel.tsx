import type { ActionItem } from '@/hooks/useMeetingAI';

interface AISummaryPanelProps {
  status: 'idle' | 'transcribing' | 'summarizing' | 'done' | 'error';
  transcript: string;
  summary: string;
  actionItems: ActionItem[];
  error: string;
  onClose: () => void;
}

export const AISummaryPanel = ({ status, transcript, summary, actionItems, error, onClose }: AISummaryPanelProps) => {
  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Meeting AI Summary</h2>
          {(status === 'done' || status === 'error') && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
          )}
        </div>

        {status === 'transcribing' && (
          <p className="text-sm text-slate-500">Transcribing your recording with Whisper…</p>
        )}
        {status === 'summarizing' && (
          <p className="text-sm text-slate-500">Generating summary and action items…</p>
        )}
        {status === 'error' && <p className="text-sm text-red-600">{error}</p>}

        {status === 'done' && (
          <div className="space-y-4">
            <div>
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Summary</h3>
              <p className="text-sm text-slate-700">{summary}</p>
            </div>

            <div>
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Action items</h3>
              {actionItems.length === 0 ? (
                <p className="text-sm text-slate-400">No action items detected.</p>
              ) : (
                <ul className="space-y-1">
                  {actionItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5">☐</span>
                      <span>
                        {item.text}
                        {item.assigneeName && <span className="ml-1 text-slate-400">— {item.assigneeName}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer">View full transcript</summary>
              <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap">{transcript}</p>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};
