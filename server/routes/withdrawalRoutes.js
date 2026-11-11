import express from 'express';
import {
  getWithdrawals,
  addWithdrawal,
  updateWithdrawal,
  deleteWithdrawal,
} from '../controllers/withdrawalController.js';
import { protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import { withdrawalSchema } from '../validators/schemas.js';

const router = express.Router();

router.route('/')
  .get(protect, getWithdrawals)
  .post(protect, validate(withdrawalSchema), addWithdrawal);

router.route('/:id')
  .put(protect, validate(withdrawalSchema.partial()), updateWithdrawal)
  .delete(protect, deleteWithdrawal);

export default router;
