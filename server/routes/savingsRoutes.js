import express from 'express';
import {
  getSavings,
  addSaving,
  updateSaving,
  deleteSaving,
} from '../controllers/savingsController.js';
import { protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import { savingSchema } from '../validators/schemas.js';

const router = express.Router();

router.route('/')
  .get(protect, getSavings)
  .post(protect, validate(savingSchema), addSaving);

router.route('/:id')
  .put(protect, validate(savingSchema.partial()), updateSaving)
  .delete(protect, deleteSaving);

export default router;
