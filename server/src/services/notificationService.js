import { Notification } from '../models/Notification.js';

export const notifyUser = async (io, { recipient, type, message, meeting }) => {
  const notification = await Notification.create({ recipient, type, message, meeting });
  io.to(`user:${recipient}`).emit('notification:new', notification);
  return notification;
};