// Custom API Error class for consistent error handling
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// FFmpeg specific error handler
class FFmpegError extends ApiError {
  constructor(message, details) {
    super(`FFmpeg Error: ${message}`, 500);
    this.details = details;
    this.name = 'FFmpegError';
  }
}

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  
  // Specific handling for FFmpeg errors
  if (err.name === 'FFmpegError') {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        details: err.details,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      }
    });
  }
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = {
  ApiError,
  FFmpegError,
  errorHandler
};