import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 2,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Receipts / payment proofs may also be PDFs, so this uploader is a little more
// permissive (and allows a bigger file) than the profile picture one above.
export const docUpload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only image or PDF files are allowed"), false);
    }
  },
});

/**
 * Wraps a multer single-file middleware so upload errors come back as a clean
 * JSON 400 instead of bubbling into the generic error handler as a 500.
 */
export const singleFile = (multerInstance, field) => (req, res, next) => {
  multerInstance.single(field)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

export default upload;
