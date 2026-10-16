import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import multer from 'multer';
import { transcribeMeeting, summarizeMeeting } from '../controllers/meetingController.js';
// In-memory storage: the file never touches disk, it's sent straight to
// Whisper and discarded. 50MB cap covers a reasonably long recorded clip.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
import {
  createMeeting,
  listMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  addParticipant,
} from '../controllers/meetingController.js';

const router = Router();

router.use(protect);

router.route('/').post(createMeeting).get(listMeetings);
router.route('/:id').get(getMeeting).patch(updateMeeting).delete(deleteMeeting);
router.post('/:id/participants', addParticipant);
router.post('/room/:roomId/transcribe', upload.single('audio'), transcribeMeeting);
router.post('/room/:roomId/summarize', summarizeMeeting);

export default router;