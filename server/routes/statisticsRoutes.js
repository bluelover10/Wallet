import express from 'express';
import { getDashboardStats } from '../controllers/statisticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getDashboardStats);

export default router;
