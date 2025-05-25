class ErrorHandler extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  
  export const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal server error";
  
    // Handle specific mongoose and JWT errors
    if (err.name === "CastError") {
      const message = `Invalid ${err.path}`;
      err = new ErrorHandler(message, 400);
    }
  
    if (err.code === 11000) {
      const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
      err = new ErrorHandler(message, 400);
    }
  
    if (err.name === "JsonWebTokenError") {
      const message = "Invalid token, please log in again";
      err = new ErrorHandler(message, 401); // Changed status code to 401 for token issues
    }
  
    if (err.name === "TokenExpiredError") { // Removed extra space
      const message = "Token has expired, please log in again";
      err = new ErrorHandler(message, 401); // Changed status code to 401 for expired token
    }
  
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }
  
  export default ErrorHandler;
  