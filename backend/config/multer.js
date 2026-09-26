const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directories exist
const evidenceDir = path.resolve(__dirname, '../uploads/evidence');
const documentsDir = path.resolve(__dirname, '../uploads/documents');

[evidenceDir, documentsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Evidence storage
const evidenceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, evidenceDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const randomHex = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    cb(null, `evidence_${timestamp}_${safeBase}_${randomHex}${ext}`);
  },
});

// Official document storage (for investigation reports, chargesheets, etc.)
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const randomHex = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    cb(null, `doc_${timestamp}_${safeBase}_${randomHex}${ext}`);
  },
});

// Allowed file types
const allowedMimeTypes = [
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  // Documents & PDFs
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
  // Audio / Video
  'video/mp4',
  'video/x-msvideo',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/mp3',
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type "${file.mimetype}" is not supported. Please upload Images, PDF, Word documents, Audio or Video files.`
      ),
      false
    );
  }
};

const uploadEvidence = multer({
  storage: evidenceStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
    files: 10, // Max 10 files per submission
  },
  fileFilter,
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
    files: 5,
  },
  fileFilter,
});

// Helper to compute sha256 hash
function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

module.exports = {
  uploadEvidence,
  uploadDocument,
  calculateFileHash,
  evidenceDir,
  documentsDir,
};
