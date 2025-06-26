const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
const http = require("http")
const socketIo = require("socket.io")
require("dotenv").config()

// Import middleware
const errorHandler = require("./middleware/errorHandler")
const logger = require("./utils/logger")

// Import routes
const authRoutes = require("./routes/auth")
const studentRoutes = require("./routes/student")
const departmentRoutes = require("./routes/department")
const adminRoutes = require("./routes/admin")

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "https://biu-uni.vercel.app",
    methods: ["GET", "POST"],
  },
})

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://biu-uni.vercel.app",
    credentials: true,
  }),
)
app.use(compression())
app.use(limiter)

// Logging middleware
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Static files
app.use("/uploads", express.static("uploads"))

// Database connection
const dbConnect = require('./lib/db')

dbConnect()
  .then(() => {
    logger.info('Connected to MongoDB')
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error)
    process.exit(1)
  })

// Socket.io connection handling
io.on("connection", (socket) => {
  logger.info(`User connected: ${socket.id}`)

  socket.on("join_room", (userId) => {
    socket.join(`user_${userId}`)
    logger.info(`User ${userId} joined their room`)
  })

  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${socket.id}`)
  })
})

// Make io available to routes
app.set("io", io)

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  })
})

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/student", studentRoutes)
app.use("/api/department", departmentRoutes) // For department dashboard/statistics endpoints
app.use("/api", departmentRoutes) // For student endpoints like /api/departments
app.use("/api/admin", adminRoutes)

// Global error handler
app.use(errorHandler)

// 404 handler (should be last)
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully")
  server.close(() => {
    mongoose.connection.close()
    process.exit(0)
  })
})

module.exports = app
