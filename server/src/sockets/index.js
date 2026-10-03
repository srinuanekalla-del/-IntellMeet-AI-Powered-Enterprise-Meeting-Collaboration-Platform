import jwt from 'jsonwebtoken';

/**
 * Socket.io middleware: verifies the JWT access token sent by the client
 * during connection (socket.handshake.auth.token) and attaches the user
 * id to the socket, so every handler below knows who's talking.
 */
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No auth token provided'));

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.userId = decoded.sub;
    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
};

export const registerSocketHandlers = (io) => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`[Socket] connected: ${socket.id} (user ${socket.userId})`);

    // Every user gets a personal room so we can push notifications
    // to them directly, on any device/tab they're connected from.
    socket.join(`user:${socket.userId}`);

    // --- Meeting room presence ---
    socket.on('join-room', ({ roomId, user }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.user = user;
      socket.to(roomId).emit('user-joined', { socketId: socket.id, user });
    });

    // --- WebRTC signaling relay ---
    socket.on('webrtc-offer', ({ to, offer }) => {
      io.to(to).emit('webrtc-offer', { from: socket.id, offer });
    });

    socket.on('webrtc-answer', ({ to, answer }) => {
      io.to(to).emit('webrtc-answer', { from: socket.id, answer });
    });

    socket.on('webrtc-ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('webrtc-ice-candidate', { from: socket.id, candidate });
    });

    // --- In-meeting chat ---
    socket.on('chat-message', ({ roomId, message, user }) => {
      io.to(roomId).emit('chat-message', {
        message,
        user,
        timestamp: new Date().toISOString(),
      });
    });

    // --- Typing indicator ---
    socket.on('typing', ({ roomId, user, isTyping }) => {
      socket.to(roomId).emit('typing', { user, isTyping });
    });

    // --- Cleanup ---
    socket.on('disconnect', () => {
      const { roomId, user } = socket.data;
      if (roomId) {
        socket.to(roomId).emit('user-left', { socketId: socket.id, user });
      }
      console.log(`[Socket] disconnected: ${socket.id}`);
    });
  });
};