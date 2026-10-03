import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { uploadAvatar } from '../services/cloudinary.js';
import {
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
  inviteTeammate,
} from '../controllers/profileController.js';

const router = Router();

router.use(protect); // every route below requires a valid access token

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);
router.post('/avatar', uploadAvatar.single('avatar'), uploadMyAvatar);
router.post('/invite', inviteTeammate);

export default router;
