const multer = require('multer');
const path = require('path');

const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /mp3|wav|m4a|mpeg|webm|ogg/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mimeOk = allowed.test(file.mimetype);
  const extOk = allowed.test(ext);
  if (mimeOk || extOk) return cb(null, true);
  cb(new Error('Only audio formats are allowed (.mp3, .wav, .m4a, .webm, .ogg)'), false);
};

const uploadAudioMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

module.exports = { uploadAudioMemory };

