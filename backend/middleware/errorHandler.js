const logger = require("../../utils/logger")

const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  logger.error(`Error ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    user: req.user ? req.user._id : "Anonymous",
  })

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Invalid ID format"
    error = {
      message,
      statusCode: 400,
    }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `${field} already exists`
    error = {
      message,
      statusCode: 400,
    }
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ")
    error = {
      message,
      statusCode: 400,
    }
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = {
      message: "Invalid token",
      statusCode: 401,
    }
  }

  if (err.name === "TokenExpiredError") {
    error = {
      message: "Token expired",
      statusCode: 401,
    }
  }

  // File upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    error = {
      message: "File too large",
      statusCode: 400,
    }
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    error = {
      message: "Unexpected file field",
      statusCode: 400,
    }
  }

  // Rate limiting errors
  if (err.status === 429) {
    error = {
      message: "Too many requests, please try again later",
      statusCode: 429,
    }
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500
  const message = error.message || "Server Error"

  // Don't leak error details in production
  const response = {
    success: false,
    message,
  }

  // Add error details in development
  if (process.env.NODE_ENV === "development") {
    response.error = err
    response.stack = err.stack
  }

  // Add request ID for tracking
  if (req.requestId) {
    response.requestId = req.requestId
  }

  res.status(statusCode).json(response)
}

module.exports = errorHandler
