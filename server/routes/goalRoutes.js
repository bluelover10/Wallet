import express from 'express';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal
} from '../controllers/goalController.js';
import { protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import { goalSchema } from '../validators/schemas.js';

const router = express.Router();

router.route('/')
  .get(protect, getGoals)
  .post(protect, validate(goalSchema), createGoal);

router.route('/:id')
  .put(protect, validate(goalSchema.partial()), updateGoal)
  .delete(protect, deleteGoal);

export default router;
