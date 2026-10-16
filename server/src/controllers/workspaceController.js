import Project from '../models/Project.js';
import Task from '../models/Task.js';
import MeetingSummary from '../models/MeetingSummary.js';
import { User } from '../models/User.js';
import { notify } from '../utils/notify.js';

const uid = (req) => String(req.user._id ?? req.user.id);
const isMember = (p, id) => String(p.owner) === id || p.members.some((m) => String(m._id ?? m) === id);

async function loadProject(req, res) {
  const project = await Project.findById(req.params.projectId ?? req.body.projectId);
  if (!project) { res.status(404).json({ message: 'Project not found.' }); return null; }
  if (!isMember(project, uid(req))) { res.status(403).json({ message: 'Not a member of this project.' }); return null; }
  return project;
}

/* ---------- Projects ---------- */
export const listProjects = async (req, res) => {
  const id = uid(req);
  res.json(await Project.find({ $or: [{ owner: id }, { members: id }] }).sort({ createdAt: -1 }));
};

export const createProject = async (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Project name is required.' });
  const project = await Project.create({ name, description, owner: uid(req), members: [uid(req)] });
  res.status(201).json(project);
};

export const getProject = async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  await project.populate('members', 'name email');
  res.json(project);
};

export const addMember = async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  const user = await User.findOne({ email: String(req.body.email || '').toLowerCase() });
  if (!user) return res.status(404).json({ message: 'No user with that email.' });
  if (!project.members.some((m) => String(m) === String(user._id))) project.members.push(user._id);
  await project.save();
  await project.populate('members', 'name email');
  res.json(project);
};

/* ---------- Tasks ---------- */
export const listTasks = async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  res.json(await Task.find({ project: project._id }).populate('assignee', 'name email').sort({ createdAt: 1 }));
};

async function createTaskDoc(req, project, data) {
  if (data.assignee && !isMember(project, String(data.assignee))) {
    const err = new Error('Assignee must be a project member.'); err.status = 400; throw err;
  }
  const task = await Task.create({ ...data, project: project._id, createdBy: uid(req) });
  if (task.assignee && String(task.assignee) !== uid(req)) {
    await notify(req.app.get('io'), {
      user: task.assignee,
      type: 'task_assigned',
      message: `${req.user.name || 'Someone'} assigned you: ${task.title}`,
      link: `/projects/${project._id}`,
    });
  }
  return task.populate('assignee', 'name email');
}

export const createTask = async (req, res) => {
  try {
    const project = await loadProject(req, res);
    if (!project) return;
    const { title, description, assignee, dueDate } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Task title is required.' });
    res.status(201).json(await createTaskDoc(req, project, { title, description, assignee: assignee || null, dueDate: dueDate || null }));
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

// POST /tasks/from-action-item  { summaryId, itemId, projectId, assignee, title?, dueDate? }
export const createTaskFromActionItem = async (req, res) => {
  try {
    const project = await loadProject(req, res);
    if (!project) return;
    const summary = await MeetingSummary.findOne({ _id: req.body.summaryId, createdBy: uid(req) });
    const item = summary?.actionItems.id(req.body.itemId);
    if (!item) return res.status(404).json({ message: 'Action item not found.' });
    if (item.task) return res.status(409).json({ message: 'This action item already has a task.' });
    const task = await createTaskDoc(req, project, {
      title: req.body.title || item.text,
      description: `From meeting summary ${summary._id}`,
      assignee: req.body.assignee || null,
      dueDate: req.body.dueDate || item.dueDate || null,
      sourceSummary: summary._id,
    });
    item.task = task._id;
    await summary.save();
    res.status(201).json({ task, summary });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

export const updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  const project = await Project.findById(task.project);
  if (!project || !isMember(project, uid(req))) return res.status(403).json({ message: 'Not allowed.' });
  const prevAssignee = String(task.assignee || '');
  for (const k of ['title', 'description', 'status', 'assignee', 'dueDate']) if (k in req.body) task[k] = req.body[k] || (k === 'status' ? task.status : null);
  await task.save();
  if (task.assignee && String(task.assignee) !== prevAssignee && String(task.assignee) !== uid(req)) {
    await notify(req.app.get('io'), { user: task.assignee, type: 'task_assigned', message: `You were assigned: ${task.title}`, link: `/projects/${project._id}` });
  }
  res.json(await task.populate('assignee', 'name email'));
};

export const deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  const project = await Project.findById(task.project);
  if (!project || !isMember(project, uid(req))) return res.status(403).json({ message: 'Not allowed.' });
  await task.deleteOne();
  res.json({ ok: true });
};

