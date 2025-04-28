const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);
    console.error(err.stack);
  
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: {
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      }
    });
  };
  
 
class ApiError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      Error.captureStackTrace(this, this.constructor);
    }
}
  
module.exports = { errorHandler, ApiError };