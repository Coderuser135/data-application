import multer from 'multer';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(new Error('Only JPG, PNG and WEBP images are allowed'));
    }
    callback(null, true);
  },
});

export default upload;
