import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  verifyOTP,
  resendOTP,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema } from '../validators/schemas.js';

const router = express.Router();

// Stricter limiter for auth endpoints to prevent brute-force/credential-stuffing attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
});

router.post('/register', authLimiter, validate(registerSchema), registerUser);
router.post('/login', authLimiter, validate(loginSchema), loginUser);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), verifyOTP);
router.post('/resend-otp', authLimiter, validate(resendOtpSchema), resendOTP);
router.post('/logout', logoutUser);
router.get('/me', protect, getUserProfile);

export default router;
