import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';

const TYPE = { mention: 'chat-mention', task_assigned: 'task-assigned', action_item: 'action-item' };

export async function notify(io, { user, type, message }) {
  try {
    const doc = await Notification.create({ recipient: user, type: TYPE[type] || type, message });
    io?.to(`user:${user}`).emit('notification', doc);
    return doc;
  } catch (err) {
    console.error('[notify] failed:', err.message);
    return null;
  }
}

export async function notifyMentions(io, { text, fromUser, roomId }) {
  const names = [...text.matchAll(/@([\w.-]+)/g)].map((m) => m[1]);
  if (!names.length) return;
  const users = await User.find({ name: { $in: names.map((n) => new RegExp(`^${n}$`, 'i')) } });
  await Promise.all(
    users
      .filter((u) => String(u._id) !== String(fromUser._id))
      .map((u) => notify(io, { user: u._id, type: 'mention', message: `${fromUser.name} mentioned you in a meeting chat` }))
  );
}
