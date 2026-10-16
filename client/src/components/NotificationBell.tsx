import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface AppNotification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const DESTINATION: Record<string, string> = {
  'task-assigned': '/projects',
  'action-item': '/summaries',
};

export const NotificationBell = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.read).length;

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<{ notifications: AppNotification[] }>('/notifications');
      setItems(data.notifications);
    } catch {
      /* keep the last list if the request fails */
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30000); // fallback if the socket drops
    const socket = getSocket();
    socket.on('notification:new', refresh);
    return () => {
      clearInterval(timer);
      socket.off('notification:new', refresh);
    };
  }, [refresh]);

  const openItem = (n: AppNotification) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      api.patch(`/notifications/${n._id}/read`).catch(() => refresh());
    }
    setOpen(false);
    const to = DESTINATION[n.type];
    if (to) navigate(to);
  };

  const markAllRead = async () => {
    const ids = items.filter((n) => !n.read).map((n) => n._id);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await Promise.all(ids.map((id) => api.patch(`/notifications/${id}/read`).catch(() => null)));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications, ${unread} unread`}
        className="relative rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
      >
        <span aria-hidden>🔔</span>
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-[20px] rounded-full bg-red-600 px-1 text-center text-xs text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 p-3">
            <span className="text-sm font-medium">Notifications</span>
            <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
              Mark all read
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 && <li className="p-4 text-sm text-slate-500">You're all caught up.</li>}
            {items.map((n) => (
              <li key={n._id}>
                <button
                  onClick={() => openItem(n)}
                  className={`block w-full p-3 text-left text-sm hover:bg-slate-50 ${
                    n.read ? 'text-slate-500' : 'font-medium text-slate-900'
                  }`}
                >
                  {n.message}
                  <span className="block text-xs font-normal text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;