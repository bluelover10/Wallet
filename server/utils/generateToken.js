import jwt from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === 'production';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction, // only require HTTPS in production so localhost HTTP works
  sameSite: isProduction ? 'strict' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});

const generateToken = (res, userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.cookie('jwt', token, getCookieOptions());
};

export const clearTokenCookie = (res) => {
  res.cookie('jwt', '', {
    ...getCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
};

export default generateToken;
