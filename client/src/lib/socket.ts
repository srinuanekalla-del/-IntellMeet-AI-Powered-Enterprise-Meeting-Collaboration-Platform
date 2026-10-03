import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

let socket: Socket | null = null;

// Lazily creates a single shared socket connection, authenticated with the
// current access token. Call this after login; call disconnectSocket() on logout.
export const getSocket = (): Socket => {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token: useAuthStore.getState().accessToken },
    autoConnect: true,
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
