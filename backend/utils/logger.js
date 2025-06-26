const winston = require("winston")
const path = require("path")

// Create logs directory if it doesn't exist
const fs = require("fs")
const logDir = "logs"
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
)

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "clearance-system" },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Write audit logs
    new winston.transports.File({
      filename: path.join(logDir, "audit.log"),
      level: "info",
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
})

// Add console transport in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  )
}

// Create audit logger for sensitive operations
const auditLogger = winston.createLogger({
  level: "info",
  format: logFormat,
  defaultMeta: { service: "clearance-system-audit" },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "audit.log"),
      maxsize: 10485760, // 10MB
      maxFiles: 20,
    }),
  ],
})

// Audit logging function
const audit = (action, userId, details = {}) => {
  auditLogger.info("AUDIT", {
    action,
    userId,
    timestamp: new Date().toISOString(),
    details,
  })
}

module.exports = {
  logger,
  audit,
}

// Export logger as default
module.exports = logger
module.exports.audit = audit
