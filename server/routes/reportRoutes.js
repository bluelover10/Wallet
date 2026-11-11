import express from 'express';
import { exportCSV, exportExcel, exportPDF } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/csv', protect, exportCSV);
router.get('/excel', protect, exportExcel);
router.get('/pdf', protect, exportPDF);

export default router;
