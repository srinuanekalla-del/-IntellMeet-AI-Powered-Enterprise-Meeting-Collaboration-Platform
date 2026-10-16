import { useEffect, useState } from 'react';
import type { ActionItem, MeetingSummary, Project } from '../types/workspace';
import { errorMessage, getProject, getProjects, taskFromActionItem } from '../api/workspace';

interface Props { summary: MeetingSummary; item: ActionItem; onClose: () => void; onCreated: () => void }

export default function CreateTaskModal({ summary, item, onClose, onCreated }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [assignee, setAssignee] = useState('');
  const [due, setDue] = useState(item.dueDate ? item.dueDate.slice(0, 10) : '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { getProjects().then(setProjects).catch((e) => setError(errorMessage(e))); }, []);

  const pickProject = async (id: string) => {
    setAssignee('');
    setProject(id ? await getProject(id) : null);
    // Pre-select the member whose name matches the AI-detected assignee.
  };
  useEffect(() => {
    if (!project) return;
    const m = project.members.find((u) => u.name.toLowerCase() === item.assignee.toLowerCase());
    if (m) setAssignee(m._id);
  }, [project, item.assignee]);

  const submit = async () => {
    if (!project) return setError('Choose a project first.');
    setBusy(true); setError(null);
    try {
      await taskFromActionItem({ summaryId: summary._id, itemId: item._id, projectId: project._id, assignee: assignee || undefined, dueDate: due || undefined });
      onCreated();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-900">Create task</h2>
        <p className="rounded-md bg-slate-50 p-2 text-slate-700">{item.text}</p>
        <label className="block text-sm text-slate-700">Project
          <select className="mt-1 w-full rounded-md border border-slate-300 p-2" value={project?._id ?? ''} onChange={(e) => pickProject(e.target.value)}>
            <option value="">Select a project</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </label>
        <label className="block text-sm text-slate-700">Assignee
          <select className="mt-1 w-full rounded-md border border-slate-300 p-2 disabled:bg-slate-100" disabled={!project} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Unassigned</option>
            {project?.members.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
          {item.assignee !== 'Unassigned' && <span className="text-xs text-slate-500">AI heard: {item.assignee}</span>}
        </label>
        <label className="block text-sm text-slate-700">Due date
          <input type="date" className="mt-1 w-full rounded-md border border-slate-300 p-2" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100">Cancel</button>
          <button onClick={submit} disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">Create task</button>
        </div>
      </div>
    </div>
  );
}
