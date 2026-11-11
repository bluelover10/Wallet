import express from 'express';
import { updateUserProfile, updateUserAvatar } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import uploadAvatar from '../middleware/uploadAvatarMiddleware.js';
import { updateProfileSchema } from '../validators/schemas.js';

const router = express.Router();

router.put('/profile', protect, validate(updateProfileSchema), updateUserProfile);
router.put('/profile/avatar', protect, uploadAvatar.single('avatar'), updateUserAvatar);

export default router;
