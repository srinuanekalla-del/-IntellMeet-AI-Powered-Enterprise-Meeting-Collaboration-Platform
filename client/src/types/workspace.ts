export interface User { _id: string; name: string; email: string }
export interface ActionItem { _id: string; text: string; assignee: string; dueDate: string | null; task: string | null }
export interface MeetingSummary {
  _id: string; roomId: string; transcript: string; summary: string;
  actionItems: ActionItem[]; createdAt: string;
}
export interface Project { _id: string; name: string; description: string; members: User[] }
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export interface Task {
  _id: string; project: string; title: string; description: string;
  status: TaskStatus; assignee: User | null; dueDate: string | null;
}
export interface AppNotification {
  _id: string; type: 'mention' | 'action_item' | 'task_assigned';
  message: string; link: string; read: boolean; createdAt: string;
}
