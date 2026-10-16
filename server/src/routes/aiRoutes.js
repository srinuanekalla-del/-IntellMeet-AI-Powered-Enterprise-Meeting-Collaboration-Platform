import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { transcribeMeeting, summarizeMeeting, listSummaries, getSummary } from '../controllers/meetingAIController.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const router = Router();
router.use(protect);

router.get('/summaries', listSummaries);
router.get('/summaries/:id', getSummary);
router.post('/room/:roomId/transcribe', upload.single('audio'), transcribeMeeting);
router.post('/room/:roomId/summarize', summarizeMeeting);

export default router;
