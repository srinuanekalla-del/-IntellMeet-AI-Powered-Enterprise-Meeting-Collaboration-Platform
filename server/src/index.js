import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';

import { connectDB } from './config/db.js';
import './config/redis.js'; // side-effect: connects Redis and logs status
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { registerSocketHandlers } from './sockets/index.js';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

// --- HTTP + Socket.io server (created early so we can attach req.io below) ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});
registerSocketHandlers(io);

// --- TEMP DEBUG: log every incoming request ---
app.use((req, _res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl} (origin: ${req.headers.origin})`);
  next();
});

// --- Core middleware ---
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Attach io to every request so controllers can trigger live notifications,
// e.g. req.io.to(`user:${id}`).emit(...) or via notifyUser(req.io, ...).
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// --- Health check ---
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// --- Feature routes ---
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/notifications', notificationRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`[Server] IntellMeet API running on port ${PORT}`);
  });
};

start();
