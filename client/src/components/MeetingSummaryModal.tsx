import type { MeetingSummary } from '../types/workspace';

interface Props { open: boolean; loading: boolean; error: string | null; data: MeetingSummary | null; onClose: () => void; onOpenDashboard?: () => void }

export default function MeetingSummaryModal({ open, loading, error, data, onClose, onOpenDashboard }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">Meeting AI Summary</h2>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-slate-500 hover:text-slate-900">×</button>
        </div>
        {loading && <p className="text-slate-600">Transcribing and summarizing your recording…</p>}
        {error && <p className="rounded-md bg-red-50 p-3 text-red-700">{error}</p>}
        {data && (
          <div className="space-y-4">
            <section>
              <h3 className="font-medium text-slate-900">Summary</h3>
              <p className="mt-1 text-slate-700">{data.summary || 'No summary was produced.'}</p>
            </section>
            <section>
              <h3 className="font-medium text-slate-900">Action items</h3>
              {data.actionItems.length === 0 ? (
                <p className="mt-1 text-slate-500">No action items found.</p>
              ) : (
                <ul className="mt-1 space-y-2">
                  {data.actionItems.map((a) => (
                    <li key={a._id} className="rounded-md border border-slate-200 p-2 text-slate-800">
                      {a.text}
                      <span className="block text-sm text-slate-500">
                        {a.assignee}{a.dueDate ? ` · due ${new Date(a.dueDate).toLocaleDateString()}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <details>
              <summary className="cursor-pointer text-sm text-slate-600">Transcript</summary>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{data.transcript}</p>
            </details>
            {onOpenDashboard && (
              <button onClick={onOpenDashboard} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Turn action items into tasks
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
