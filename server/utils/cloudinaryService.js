import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

const AVATAR_FOLDER = 'ledgerpro/avatars';

// Upload a multer memory buffer to Cloudinary, return { url, publicId }
export const uploadAvatarBuffer = (buffer, { userId, mimetype }) =>
  new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      reject(new Error('Cloudinary is not configured'));
      return;
    }
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: AVATAR_FOLDER,
        public_id: `user_${userId}_${Date.now()}`,
        resource_type: 'image',
        transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face' }],
      },
      (err, result) => {
        if (err) reject(err);
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    upload.end(buffer);
  });

// Extract public_id from a Cloudinary delivery URL (returns null for non-cloudinary URLs / base64)
export const publicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('data:')) return null;
  if (!url.includes('res.cloudinary.com')) return null;
  // .../upload/v1234/folder/file.jpg -> folder/file (strip version + extension)
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return m ? m[1] : null;
};

export const deleteByPublicId = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn(`[Cloudinary] Failed to delete ${publicId}:`, err.message);
  }
};

export { isCloudinaryConfigured };
