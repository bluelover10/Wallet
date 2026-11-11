import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import generateToken, { clearTokenCookie } from '../utils/generateToken.js';
import generateOTP from '../utils/generateOTP.js';
import { sendOtpEmail } from '../utils/mailer.js';
import { logActivity } from '../utils/activityLogger.js';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// @desc    Register a new user (creates unverified account, issues OTP)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const otp = generateOTP();

    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      verificationOTP: otp,
      verificationOTPExpireAt: Date.now() + OTP_EXPIRY_MS,
    });

    if (user) {
      await logActivity({
        user: user._id,
        action: 'Registered',
        details: `${user.name} joined the workspace`,
        icon: 'UserPlus',
      });

      // Send OTP via Gmail (Nodemailer). Never include OTP in API response.
      // Falls back to console log if mail is not configured or SMTP fails.
      const mail = await sendOtpEmail({ to: user.email, otp, name: user.name });
      if (!mail.delivered) {
        console.log(`[DEV OTP] Verification code for ${user.email}: ${otp} (${mail.reason || 'not delivered'})`);
      }

      res.status(201).json({
        message: mail.delivered
          ? 'Registration successful. Please verify the OTP sent to your email.'
          : 'Registration successful. OTP logged to server console (mail not delivered).',
        email: user.email,
        mailDelivered: mail.delivered,
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and complete registration login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      throw new Error('Email and OTP are required');
    }

    const user = await User.findOne({ email }).select('+verificationOTP +verificationOTPExpireAt');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.isVerified) {
      res.status(400);
      throw new Error('User is already verified');
    }

    if (
      !user.verificationOTP ||
      user.verificationOTP !== otp ||
      !user.verificationOTPExpireAt ||
      user.verificationOTPExpireAt < Date.now()
    ) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpireAt = undefined;
    await user.save();

    // Verification complete — log the user in now.
    generateToken(res, user._id);

    await logActivity({
      user: user._id,
      action: 'Verified Email',
      details: `${user.name} verified their account`,
      icon: 'ShieldCheck',
    });

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP to an unverified user
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.isVerified) {
      res.status(400);
      throw new Error('User is already verified');
    }

    const otp = generateOTP();
    user.verificationOTP = otp;
    user.verificationOTPExpireAt = Date.now() + OTP_EXPIRY_MS;
    await user.save();

    const mail = await sendOtpEmail({ to: user.email, otp, name: user.name });
    if (!mail.delivered) {
      console.log(`[DEV OTP] Resent verification code for ${user.email}: ${otp} (${mail.reason || 'not delivered'})`);
    }

    res.status(200).json({
      message: mail.delivered ? 'A new OTP has been sent.' : 'A new OTP was generated (mail not delivered, check server console).',
      email: user.email,
      mailDelivered: mail.delivered,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
        // Issue a fresh OTP so the user can verify right away.
        const otp = generateOTP();
        user.verificationOTP = otp;
        user.verificationOTPExpireAt = Date.now() + OTP_EXPIRY_MS;
        await user.save();

        const mail = await sendOtpEmail({ to: user.email, otp, name: user.name });
        if (!mail.delivered) {
          console.log(`[DEV OTP] Verification code for ${user.email}: ${otp} (${mail.reason || 'not delivered'})`);
        }

        res.status(403).json({
          message: mail.delivered
            ? 'Account not verified. A new OTP has been sent.'
            : 'Account not verified. OTP logged to server console (mail not delivered).',
          requiresVerification: true,
          email: user.email,
        });
        return;
      }

      generateToken(res, user._id);
      await logActivity({
        user: user._id,
        action: 'Logged In',
        icon: 'LogIn',
      });
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res) => {
  try {
    const token = req.cookies?.jwt;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await logActivity({ user: decoded.userId, action: 'Logged Out', icon: 'LogOut' });
    }
  } catch (error) {
    // Token invalid/expired — nothing to log, still proceed with logout
  }

  clearTokenCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

export { registerUser, loginUser, logoutUser, getUserProfile, verifyOTP, resendOTP };
