import { useEffect, useState } from 'react';
import type { ActionItem, MeetingSummary } from '../types/workspace';
import { errorMessage, getSummaries } from '../api/workspace';
import CreateTaskModal from '../components/CreateTaskModal';

export default function PostMeetingDashboard() {
  const [list, setList] = useState<MeetingSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<ActionItem | null>(null);

  const load = () =>
    getSummaries()
      .then((d) => { setList(d); setSelectedId((id) => id ?? d[0]?._id ?? null); })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const selected = list.find((s) => s._id === selectedId) ?? null;

  if (loading) return <p className="p-6 text-slate-600">Loading your meetings…</p>;
  if (error) return <p className="m-6 rounded-md bg-red-50 p-3 text-red-700">{error}</p>;
  if (!list.length) return <p className="p-6 text-slate-600">No summaries yet. Record a clip in a meeting room and the summary will appear here.</p>;

  return (
    <div className="grid gap-6 p-6 md:grid-cols-[280px_1fr]">
      <aside className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Meeting summaries</h1>
        {list.map((s) => (
          <button key={s._id} onClick={() => setSelectedId(s._id)}
            className={`block w-full rounded-lg border p-3 text-left ${s._id === selectedId ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
            <span className="block text-sm text-slate-500">{new Date(s.createdAt).toLocaleString()}</span>
            <span className="line-clamp-2 text-slate-800">{s.summary || 'No summary'}</span>
            <span className="text-xs text-slate-500">{s.actionItems.length} action item(s)</span>
          </button>
        ))}
      </aside>

      {selected && (
        <main className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
            <p className="mt-1 max-w-prose text-slate-700">{selected.summary}</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900">Action items</h2>
            {selected.actionItems.length === 0 && <p className="mt-1 text-slate-500">None found for this meeting.</p>}
            <ul className="mt-2 space-y-2">
              {selected.actionItems.map((a) => (
                <li key={a._id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="text-slate-900">{a.text}</p>
                    <p className="text-sm text-slate-500">{a.assignee}{a.dueDate ? ` · due ${new Date(a.dueDate).toLocaleDateString()}` : ''}</p>
                  </div>
                  {a.task
                    ? <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">Task created</span>
                    : <button onClick={() => setTarget(a)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Create task</button>}
                </li>
              ))}
            </ul>
          </section>
          <details>
            <summary className="cursor-pointer text-sm text-slate-600">Full transcript</summary>
            <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm text-slate-700">{selected.transcript}</p>
          </details>
        </main>
      )}

      {selected && target && (
        <CreateTaskModal summary={selected} item={target} onClose={() => setTarget(null)} onCreated={() => { setTarget(null); load(); }} />
      )}
    </div>
  );
}
