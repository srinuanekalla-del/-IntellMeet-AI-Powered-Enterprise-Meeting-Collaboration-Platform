import 'dotenv/config';
import aiRoutes from './routes/aiRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
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
import { metricsMiddleware, metricsHandler, trackSockets } from './metrics.js';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();
app.set('trust proxy', 1); // Render sits behind a proxy

// --- HTTP + Socket.io server (created early so controllers can use req.io) ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});
app.set('io', io);
registerSocketHandlers(io);
trackSockets(io);

// --- Core middleware ---
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(metricsMiddleware);

// Attach io to every request so controllers can trigger live notifications.
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// --- Health check and metrics ---
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));
app.get('/metrics', metricsHandler);

// --- Feature routes ---
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/meetings', aiRoutes); // must come before meetingRoutes
app.use('/api/meetings', meetingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', workspaceRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log('[Server] IntellMeet API running on port ' + PORT);
  });
};

start();
