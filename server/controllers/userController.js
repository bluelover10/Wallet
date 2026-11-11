import User from '../models/User.js';
import { logActivity } from '../utils/activityLogger.js';
import { uploadAvatarBuffer, publicIdFromUrl, deleteByPublicId, isCloudinaryConfigured } from '../utils/cloudinaryService.js';

export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (req.body.name !== undefined) {
      user.name = req.body.name;
    }
    if (req.body.email !== undefined && req.body.email !== user.email) {
      const existing = await User.findOne({ email: req.body.email });
      if (existing && existing._id.toString() !== user._id.toString()) {
        res.status(400);
        throw new Error('Email is already in use');
      }
      user.email = req.body.email;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    await logActivity({
      user: user._id,
      action: 'Updated Profile',
      details: 'User updated their profile information.',
      icon: 'User'
    });

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload/update the current user's profile picture
//          Primary: Cloudinary (512x512 face-crop). Fallback: base64 data URI
//          in MongoDB when Cloudinary env is missing.
// @route   PUT /api/users/profile/avatar
// @access  Private
export const updateUserAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No image file uploaded');
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const oldPublicId = publicIdFromUrl(user.avatar);

    if (isCloudinaryConfigured()) {
      try {
        const { url } = await uploadAvatarBuffer(req.file.buffer, {
          userId: user._id.toString(),
          mimetype: req.file.mimetype,
        });
        user.avatar = url;
        if (oldPublicId) await deleteByPublicId(oldPublicId);
      } catch (cloudErr) {
        console.error('[Cloudinary] Avatar upload failed, falling back to base64:', cloudErr.message);
        const base64Image = req.file.buffer.toString('base64');
        user.avatar = `data:${req.file.mimetype};base64,${base64Image}`;
      }
    } else {
      const base64Image = req.file.buffer.toString('base64');
      user.avatar = `data:${req.file.mimetype};base64,${base64Image}`;
    }

    const updatedUser = await user.save();

    await logActivity({
      user: user._id,
      action: 'Updated Profile Picture',
      details: 'User updated their profile picture.',
      icon: 'ImageIcon',
    });

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
    });
  } catch (error) {
    next(error);
  }
};
