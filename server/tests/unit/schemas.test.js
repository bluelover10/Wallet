import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  savingSchema,
  withdrawalSchema,
  goalSchema,
} from '../../validators/schemas.js';

describe('registerSchema', () => {
  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({
      name: 'Ananya',
      email: 'Ananya@Example.com',
      password: 'secret123',
    });
    expect(result.success).toBe(true);
    // email is normalized to lowercase/trimmed
    expect(result.data.email).toBe('ananya@example.com');
  });

  it('rejects a name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ name: 'A', email: 'a@b.com', password: 'secret123' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({ name: 'Ananya', email: 'not-an-email', password: 'secret123' });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 6 characters', () => {
    const result = registerSchema.safeParse({ name: 'Ananya', email: 'a@b.com', password: '123' });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('requires a non-empty password but does not enforce a minimum length', () => {
    // Login should not leak info about password policy via a min-length rule
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  it('allows a completely empty payload (all fields optional)', () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });

  it('allows an empty-string password (treated as "no change")', () => {
    expect(updateProfileSchema.safeParse({ password: '' }).success).toBe(true);
  });

  it('rejects a too-short password when one is provided', () => {
    expect(updateProfileSchema.safeParse({ password: '123' }).success).toBe(false);
  });
});

describe('savingSchema', () => {
  it('accepts a minimal valid saving', () => {
    const result = savingSchema.safeParse({ amount: '500', month: 'July', year: 2026 });
    expect(result.success).toBe(true);
    // amount is coerced to a number
    expect(result.data.amount).toBe(500);
  });

  it('rejects a zero or negative amount', () => {
    expect(savingSchema.safeParse({ amount: 0, month: 'July', year: 2026 }).success).toBe(false);
    expect(savingSchema.safeParse({ amount: -50, month: 'July', year: 2026 }).success).toBe(false);
  });

  it('rejects a year outside the sane 2000-2100 range', () => {
    expect(savingSchema.safeParse({ amount: 100, month: 'July', year: 1999 }).success).toBe(false);
    expect(savingSchema.safeParse({ amount: 100, month: 'July', year: 2101 }).success).toBe(false);
  });

  it('rejects an invalid payment method not in the enum', () => {
    const result = savingSchema.safeParse({
      amount: 100, month: 'July', year: 2026, paymentMethod: 'Bitcoin',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed goal ObjectId but allows an empty string or null', () => {
    expect(savingSchema.safeParse({ amount: 100, month: 'July', year: 2026, goal: 'not-an-id' }).success).toBe(false);
    expect(savingSchema.safeParse({ amount: 100, month: 'July', year: 2026, goal: '' }).success).toBe(true);
    expect(savingSchema.safeParse({ amount: 100, month: 'July', year: 2026, goal: null }).success).toBe(true);
    expect(savingSchema.safeParse({ amount: 100, month: 'July', year: 2026, goal: '507f1f77bcf86cd799439011' }).success).toBe(true);
  });
});

describe('withdrawalSchema', () => {
  it('requires a reason', () => {
    expect(withdrawalSchema.safeParse({ amount: 100, reason: '' }).success).toBe(false);
    expect(withdrawalSchema.safeParse({ amount: 100, reason: 'Emergency repair' }).success).toBe(true);
  });

  it('rejects a reason longer than 200 characters', () => {
    const result = withdrawalSchema.safeParse({ amount: 100, reason: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe('goalSchema', () => {
  it('accepts a minimal valid goal', () => {
    const result = goalSchema.safeParse({
      name: 'Vacation fund',
      targetAmount: 50000,
      deadline: '2026-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-positive target amount', () => {
    expect(goalSchema.safeParse({ name: 'X', targetAmount: 0, deadline: '2026-12-31' }).success).toBe(false);
  });

  it('rejects a status outside the allowed enum', () => {
    const result = goalSchema.safeParse({
      name: 'X', targetAmount: 100, deadline: '2026-12-31', status: 'Deleted',
    });
    expect(result.success).toBe(false);
  });
});
