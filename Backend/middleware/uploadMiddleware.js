const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Cloudinary storage for persistent uploads (complaints, avatars)
const cloudinaryStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'smartpanchayat',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
    },
});

// Memory storage for chatbot (image sent to AI as base64, not stored)
const memoryStorage = multer.memoryStorage();

// File filter to allow only jpg, jpeg, png
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = allowedTypes.test(file.mimetype);
    const extName = allowedTypes.test(ext);

    if (mimeType && extName) {
        return cb(null, true);
    } else {
        cb(new Error('Only allowed image formats are .jpeg, .jpg and .png!'), false);
    }
};

// Upload to Cloudinary (for complaints & avatars)
const upload = multer({
    storage: cloudinaryStorage,
    limits: { fileSize: 4 * 1024 * 1024 },
    fileFilter,
});

// Upload to memory (for chatbot vision - no cloud storage needed)
const uploadMemory = multer({
    storage: memoryStorage,
    limits: { fileSize: 4 * 1024 * 1024 },
    fileFilter,
});

module.exports = { upload, uploadMemory };
