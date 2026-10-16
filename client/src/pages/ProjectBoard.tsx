import { useEffect, useState } from 'react';
import type { Project, Task, TaskStatus } from '../types/workspace';
import { addMember, createProject, createTask, deleteTask, errorMessage, getProject, getProjects, getTasks, updateTask } from '../api/workspace';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
];

export default function ProjectBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);

  const guard = async (fn: () => Promise<void>) => { setError(null); try { await fn(); } catch (e) { setError(errorMessage(e)); } };

  useEffect(() => { guard(async () => setProjects(await getProjects())); }, []);

  const open = (id: string) => guard(async () => {
    if (!id) { setProject(null); setTasks([]); return; }
    const [p, t] = await Promise.all([getProject(id), getTasks(id)]);
    setProject(p); setTasks(t);
  });

  const onCreateProject = () => {
    const name = window.prompt('Project name');
    if (name) guard(async () => { const p = await createProject(name); setProjects((l) => [p, ...l]); await open(p._id); });
  };

  const onAddTask = () => project && newTitle.trim() && guard(async () => {
    const t = await createTask(project._id, { title: newTitle, assignee: newAssignee || undefined });
    setTasks((l) => [...l, t]); setNewTitle(''); setNewAssignee('');
  });

  const onDrop = (status: TaskStatus) => {
    const task = tasks.find((t) => t._id === dragId);
    setDragId(null);
    if (!task || task.status === status) return;
    const prev = tasks;
    setTasks((l) => l.map((t) => (t._id === task._id ? { ...t, status } : t))); // optimistic
    updateTask(task._id, { status }).catch((e) => { setTasks(prev); setError(errorMessage(e)); });
  };

  const onAddMember = () => project && memberEmail && guard(async () => {
    setProject(await addMember(project._id, memberEmail)); setMemberEmail('');
  });

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Project board</h1>
        <select className="rounded-md border border-slate-300 p-2" value={project?._id ?? ''} onChange={(e) => open(e.target.value)}>
          <option value="">Select a project</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <button onClick={onCreateProject} className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">New project</button>
      </div>
      {error && <p className="rounded-md bg-red-50 p-2 text-red-700">{error}</p>}

      {!project && <p className="text-slate-600">Pick a project, or create one to start planning.</p>}
      {project && (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <input className="min-w-[220px] flex-1 rounded-md border border-slate-300 p-2" placeholder="New task title" value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAddTask()} />
            <select className="rounded-md border border-slate-300 p-2" value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {project.members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
            <button onClick={onAddTask} className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">Add task</button>
            <input className="rounded-md border border-slate-300 p-2" placeholder="Invite by email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} />
            <button onClick={onAddMember} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50">Add member</button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {COLUMNS.map((col) => (
              <section key={col.id} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(col.id)}
                className="min-h-[240px] rounded-xl bg-slate-100 p-3">
                <h2 className="mb-2 font-medium text-slate-800">{col.label} ({tasks.filter((t) => t.status === col.id).length})</h2>
                <div className="space-y-2">
                  {tasks.filter((t) => t.status === col.id).map((t) => (
                    <article key={t._id} draggable onDragStart={() => setDragId(t._id)}
                      className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing">
                      <p className="text-slate-900">{t.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{t.assignee?.name ?? 'Unassigned'}{t.dueDate ? ` · due ${new Date(t.dueDate).toLocaleDateString()}` : ''}</p>
                      <button onClick={() => guard(async () => { await deleteTask(t._id); setTasks((l) => l.filter((x) => x._id !== t._id)); })}
                        className="mt-1 text-xs text-slate-500 hover:text-red-600">Delete</button>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
