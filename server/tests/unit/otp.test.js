import { describe, it, expect } from 'vitest';
import { verifyOtpSchema, resendOtpSchema } from '../../validators/schemas.js';
import generateOTP from '../../utils/generateOTP.js';

describe('verifyOtpSchema', () => {
  it('accepts a valid email + 6-digit otp payload', () => {
    const result = verifyOtpSchema.safeParse({ email: 'Ananya@Example.com', otp: '123456' });
    expect(result.success).toBe(true);
    expect(result.data.email).toBe('ananya@example.com');
  });

  it('rejects an otp shorter than 6 digits', () => {
    const result = verifyOtpSchema.safeParse({ email: 'a@b.com', otp: '123' });
    expect(result.success).toBe(false);
  });

  it('rejects an otp longer than 6 digits', () => {
    const result = verifyOtpSchema.safeParse({ email: 'a@b.com', otp: '1234567' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = verifyOtpSchema.safeParse({ email: 'not-an-email', otp: '123456' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing otp', () => {
    const result = verifyOtpSchema.safeParse({ email: 'a@b.com' });
    expect(result.success).toBe(false);
  });
});

describe('resendOtpSchema', () => {
  it('accepts a valid email', () => {
    const result = resendOtpSchema.safeParse({ email: 'Ananya@Example.com' });
    expect(result.success).toBe(true);
    expect(result.data.email).toBe('ananya@example.com');
  });

  it('rejects an invalid email', () => {
    const result = resendOtpSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing email', () => {
    const result = resendOtpSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('generateOTP', () => {
  it('generates a 6-character numeric string', () => {
    const otp = generateOTP();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('generates a value within the 100000-999999 range', () => {
    const otp = Number(generateOTP());
    expect(otp).toBeGreaterThanOrEqual(100000);
    expect(otp).toBeLessThanOrEqual(999999);
  });

  it('generates different values across many calls (not hardcoded)', () => {
    const values = new Set(Array.from({ length: 20 }, () => generateOTP()));
    expect(values.size).toBeGreaterThan(1);
  });
});
