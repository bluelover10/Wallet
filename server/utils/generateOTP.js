// Generates a 6-digit numeric OTP string, e.g. "042913"
// Uses crypto for unpredictability — Math.random is not suitable for security tokens.
import crypto from 'crypto';

const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

export default generateOTP;
