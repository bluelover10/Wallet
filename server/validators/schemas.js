import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Please provide a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email'),
  otp: z.string().trim().length(6, 'OTP must be 6 digits'),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  password: z.string().min(6).max(128).optional().or(z.literal('')),
});

export const savingSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  date: z.coerce.date().optional(),
  month: z.string().trim().min(1, 'Month is required'),
  year: z.coerce.number().int().min(2000).max(2100),
  paymentMethod: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Wallet', 'Other']).optional(),
  referenceNumber: z.string().trim().max(100).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  type: z.enum(['Monthly', 'Extra']).optional(),
  goal: objectId.optional().or(z.literal('')).or(z.null()),
});

export const withdrawalSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  reason: z.string().trim().min(1, 'Reason is required').max(200),
  date: z.coerce.date().optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const goalSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required').max(150),
  targetAmount: z.coerce.number().positive('Target amount must be greater than 0'),
  deadline: z.coerce.date(),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  status: z.enum(['In Progress', 'Achieved', 'Cancelled']).optional(),
  // Accept true/false booleans plus "true"/"false" strings — z.coerce.boolean()
  // treats ANY non-empty string (including "false") as true, so handle it explicitly.
  archived: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'string' ? v === 'true' : v))
    .optional(),
});
