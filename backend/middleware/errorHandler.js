function errorHandler(err, req, res, next) {
  // Safe logging without leaking sensitive payloads
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File upload failed: File size exceeds the maximum limit (50 MB).',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'File upload failed: Exceeded maximum allowed number of files.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // Database unique constraint violation (e.g. 23505 in PostgreSQL)
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this unique identifier or email already exists.',
    });
  }

  // Database foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference: The referenced resource does not exist.',
    });
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
  });
}

module.exports = {
  errorHandler,
};
