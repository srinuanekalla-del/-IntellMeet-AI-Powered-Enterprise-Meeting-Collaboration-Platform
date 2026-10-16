import {api} from '../lib/api'; // <-- point this at your existing axios instance (the one that sends the auth token)
import type { MeetingSummary, Project, Task, TaskStatus, AppNotification } from '../types/workspace';

const msg = (e: any) => e?.response?.data?.message || e?.message || 'Something went wrong.';
export const errorMessage = msg;

export const getSummaries = async () => (await api.get<MeetingSummary[]>('/meetings/summaries')).data;
export const getProjects = async () => (await api.get<Project[]>('/projects')).data;
export const createProject = async (name: string) => (await api.post<Project>('/projects', { name })).data;
export const getProject = async (id: string) => (await api.get<Project>(`/projects/${id}`)).data;
export const addMember = async (id: string, email: string) => (await api.post<Project>(`/projects/${id}/members`, { email })).data;

export const getTasks = async (projectId: string) => (await api.get<Task[]>(`/projects/${projectId}/tasks`)).data;
export const createTask = async (projectId: string, body: { title: string; assignee?: string; dueDate?: string }) =>
  (await api.post<Task>(`/projects/${projectId}/tasks`, body)).data;
export const updateTask = async (id: string, body: Partial<{ status: TaskStatus; assignee: string }>) =>
  (await api.patch<Task>(`/tasks/${id}`, body)).data;
export const deleteTask = async (id: string) => api.delete(`/tasks/${id}`);
export const taskFromActionItem = async (body: {
  summaryId: string; itemId: string; projectId: string; assignee?: string; dueDate?: string;
}) => (await api.post('/tasks/from-action-item', body)).data;

export const getNotifications = async () => (await api.get<{ items: AppNotification[]; unread: number }>('/notifications')).data;
export const markRead = async (id: string) => api.patch(`/notifications/${id}/read`);
export const markAllRead = async () => api.patch('/notifications/read-all');

// Used by the recording flow in the meeting room.
export const uploadRecording = async (roomId: string, blob: Blob) => {
  const form = new FormData();
  form.append('audio', blob, 'recording.webm');
  return (await api.post<MeetingSummary>(`/meetings/room/${roomId}/transcribe`, form)).data;
};
