import { Router } from 'express';
import multer from 'multer';

import { protect } from '../middleware/auth.js';

import {
  transcribeMeeting,
  summarizeMeeting,
  listSummaries,
  getSummary,
} from '../controllers/meetingAIController.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

// Protect all AI meeting routes
router.use(protect);

// Get all meeting summaries
router.get('/summaries', listSummaries);

// Get a specific summary
router.get('/summaries/:id', getSummary);

// Upload and transcribe meeting audio
router.post(
  '/room/:roomId/transcribe',
  upload.single('audio'),
  transcribeMeeting
);

// Summarize a meeting
router.post(
  '/room/:roomId/summarize',
  summarizeMeeting
);

export default router;