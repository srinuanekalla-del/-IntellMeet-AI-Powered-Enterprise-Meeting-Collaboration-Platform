import { Router } from 'express';
import { protect } from '../middleware/auth.js';
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

export default router;