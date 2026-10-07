const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hoanghieu_orders',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({
  storage,
  limits: {
    files: 4,
  },
});

const uploadCompletionPhotos = upload.array('completionPhotos', 4);

module.exports = {
  upload,
  uploadCompletionPhotos,
};
