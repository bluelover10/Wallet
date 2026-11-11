import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import savingsRoutes from './routes/savingsRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import statisticsRoutes from './routes/statisticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('WARNING: JWT_SECRET is missing or too short — set a long random string (>=32 chars) in server/.env');
}

connectDB();

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Strip any keys starting with '$' or containing '.' from body/params to
// prevent Mongo operator injection. req.query is a read-only getter in
// Express 5 (express-mongo-sanitize@2 crashes trying to reassign it), so
// query strings are excluded here; controllers coerce query values with
// Number()/String() before use instead of passing them straight into Mongo
// operators, which achieves the same protection for that surface.
const sanitizeObjectInPlace = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
      continue;
    }
    if (obj[key] && typeof obj[key] === 'object') {
      sanitizeObjectInPlace(obj[key]);
    }
  }
};

app.use((req, res, next) => {
  sanitizeObjectInPlace(req.body);
  sanitizeObjectInPlace(req.params);
  next();
});

// General API rate limiter — generous enough for normal use, blocks abuse/scripted floods
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
