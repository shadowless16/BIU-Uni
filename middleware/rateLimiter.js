const rateLimit = require("express-rate-limit")
const logger = require("../utils/logger")

// Create different rate limiters for different endpoints
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 400, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, URL: ${req.originalUrl}`)
      res.status(429).json(options.message || defaultOptions.message)
    },
  }

  return rateLimit({ ...defaultOptions, ...options })
}

// Specific rate limiters
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 400, // 400 login attempts per 15 minutes
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
})

const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    message: "Upload limit exceeded, please try again later.",
  },
})

const searchLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    success: false,
    message: "Search limit exceeded, please slow down.",
  },
})

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: {
    success: false,
    message: "API rate limit exceeded, please try again later.",
  },
})

const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes for sensitive operations
  message: {
    success: false,
    message: "Rate limit exceeded for this operation.",
  },
})

module.exports = {
  createRateLimiter,
  authLimiter,
  uploadLimiter,
  searchLimiter,
  apiLimiter,
  strictLimiter,
}
