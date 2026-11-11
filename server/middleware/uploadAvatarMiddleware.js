import multer from 'multer';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
// Avatars go to Cloudinary (see utils/cloudinaryService) so we can allow a
// generous 5MB — Cloudinary resizes to 512x512. If Cloudinary is not
// configured we fall back to base64-in-Mongo, which is why the limit stays
// small enough to fit a 16MB Mongo document.
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only PNG, JPEG, JPG, and WEBP are allowed.'));
  }
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

export default uploadAvatar;
