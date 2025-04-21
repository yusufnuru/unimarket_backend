import multer, { type Multer, StorageEngine } from 'multer';

const storage: StorageEngine = multer.memoryStorage();
const uploadImages: Multer = multer({
  storage: storage,
  limits: {
    files: 5, // Maximum number of files (Multer will reject if more than 5)
  },
});

// Use array() without enforcing an exact number of files
export const uploadMultipleImages = () => uploadImages.array('images');
