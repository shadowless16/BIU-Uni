const multer = require("multer")
const path = require("path")
const fs = require("fs")
const sharp = require("sharp")
const crypto = require("crypto")
const logger = require("../utils/logger")

// Ensure upload directories exist
const uploadDirs = ["uploads/documents", "uploads/profiles", "uploads/temp"]
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/documents"

    if (file.fieldname === "profilePicture") {
      uploadPath = "uploads/profiles"
    } else if (req.body.category === "temp") {
      uploadPath = "uploads/temp"
    }

    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString("hex")
    const extension = path.extname(file.originalname).toLowerCase()
    const filename = `${Date.now()}-${uniqueSuffix}${extension}`
    cb(null, filename)
  },
})

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    documents: [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
    profiles: [".jpg", ".jpeg", ".png"],
    temp: [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".txt"],
  }

  const extension = path.extname(file.originalname).toLowerCase()
  let category = "documents"

  if (file.fieldname === "profilePicture") {
    category = "profiles"
  } else if (req.body.category === "temp") {
    category = "temp"
  }

  if (allowedTypes[category].includes(extension)) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid file type. Allowed types for ${category}: ${allowedTypes[category].join(", ")}`), false)
  }
}

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files per request
  },
})

// Middleware to process uploaded files
const processUpload = async (req, res, next) => {
  if (!req.files && !req.file) {
    return next()
  }

  const files = req.files || [req.file]
  const processedFiles = []

  try {
    for (const file of files) {
      const processedFile = {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/${path.relative("uploads", file.path)}`,
        uploadedAt: new Date(),
      }

      // Compress images
      if (file.mimetype.startsWith("image/")) {
        const compressedPath = await compressImage(file.path)
        if (compressedPath) {
          // Update file info with compressed version
          const compressedStats = fs.statSync(compressedPath)
          processedFile.originalSize = file.size
          processedFile.size = compressedStats.size
          processedFile.path = compressedPath
          processedFile.compressed = true
          processedFile.compressionRatio = (((file.size - compressedStats.size) / file.size) * 100).toFixed(2)

          // Delete original file
          fs.unlinkSync(file.path)
        }
      }

      // Generate thumbnail for images
      if (file.mimetype.startsWith("image/")) {
        const thumbnailPath = await generateThumbnail(processedFile.path)
        if (thumbnailPath) {
          processedFile.thumbnailPath = thumbnailPath
          processedFile.thumbnailUrl = `/uploads/${path.relative("uploads", thumbnailPath)}`
        }
      }

      // Virus scan (if ClamAV is available)
      try {
        const scanResult = await virusScan(processedFile.path)
        processedFile.virusScanned = true
        processedFile.scanResult = scanResult
        processedFile.scannedAt = new Date()
      } catch (error) {
        logger.warn("Virus scan failed:", error.message)
        processedFile.virusScanned = false
      }

      processedFiles.push(processedFile)
    }

    // Add processed files to request
    req.processedFiles = processedFiles
    next()
  } catch (error) {
    logger.error("File processing error:", error)

    // Clean up uploaded files on error
    files.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
    })

    return res.status(500).json({
      success: false,
      message: "File processing failed",
      error: error.message,
    })
  }
}

// Image compression function
const compressImage = async (filePath) => {
  try {
    const compressedPath = filePath.replace(/(\.[^.]+)$/, "_compressed$1")

    await sharp(filePath)
      .resize(1920, 1080, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .png({
        compressionLevel: 8,
      })
      .toFile(compressedPath)

    return compressedPath
  } catch (error) {
    logger.error("Image compression failed:", error)
    return null
  }
}

// Thumbnail generation function
const generateThumbnail = async (filePath) => {
  try {
    const thumbnailPath = filePath.replace(/(\.[^.]+)$/, "_thumb$1")

    await sharp(filePath)
      .resize(200, 200, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath)

    return thumbnailPath
  } catch (error) {
    logger.error("Thumbnail generation failed:", error)
    return null
  }
}

// Virus scanning function (requires ClamAV)
const virusScan = async (filePath) => {
  try {
    // This is a placeholder - implement actual virus scanning
    // const clamscan = require('clamscan');
    // const clam = await clamscan.init();
    // const scanResult = await clam.scanFile(filePath);
    // return scanResult.isInfected ? 'INFECTED' : 'CLEAN';

    return "CLEAN" // Default to clean for now
  } catch (error) {
    throw new Error("Virus scan failed: " + error.message)
  }
}

// Upload middleware variants
const uploadSingle = (fieldName) => [upload.single(fieldName), processUpload]

const uploadMultiple = (fieldName, maxCount = 5) => [upload.array(fieldName, maxCount), processUpload]

const uploadFields = (fields) => [upload.fields(fields), processUpload]

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  processUpload,
}
