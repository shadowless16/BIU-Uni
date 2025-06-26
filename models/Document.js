const mongoose = require("mongoose")
const path = require("path")

const documentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clearanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clearance",
      index: true,
    },
    documentType: {
      type: String,
      enum: ["transcript", "certificate", "receipt", "form", "identification", "passport", "other"],
      default: "other",
    },
    category: {
      type: String,
      enum: ["clearance_document", "profile_document", "system_document"],
      default: "clearance_document",
    },
    status: {
      type: String,
      enum: ["uploaded", "processing", "verified", "rejected"],
      default: "uploaded",
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,
    rejectionReason: String,
    metadata: {
      compressed: {
        type: Boolean,
        default: false,
      },
      originalSize: Number,
      compressionRatio: Number,
      virusScanned: {
        type: Boolean,
        default: false,
      },
      scanResult: String,
      scannedAt: Date,
      thumbnailPath: String,
      extractedText: String,
      ocrProcessed: {
        type: Boolean,
        default: false,
      },
    },
    accessLog: [
      {
        accessedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        accessedAt: {
          type: Date,
          default: Date.now,
        },
        action: {
          type: String,
          enum: ["view", "download", "delete", "verify"],
          required: true,
        },
        ipAddress: String,
        userAgent: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
documentSchema.index({ uploadedBy: 1, createdAt: -1 })
documentSchema.index({ clearanceId: 1, documentType: 1 })
documentSchema.index({ status: 1, createdAt: -1 })
documentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Virtual for file extension
documentSchema.virtual("extension").get(function () {
  return path.extname(this.originalName).toLowerCase()
})

// Virtual for formatted file size
documentSchema.virtual("formattedSize").get(function () {
  const bytes = this.size
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
})

// Method to log access
documentSchema.methods.logAccess = function (userId, action, ipAddress, userAgent) {
  this.accessLog.push({
    accessedBy: userId,
    action,
    ipAddress,
    userAgent,
    accessedAt: new Date(),
  })

  return this.save()
}

// Method to verify document
documentSchema.methods.verify = function (verifiedBy, approved = true, reason = null) {
  this.status = approved ? "verified" : "rejected"
  this.verifiedBy = verifiedBy
  this.verifiedAt = new Date()

  if (!approved && reason) {
    this.rejectionReason = reason
  }

  return this.save()
}

// Static method to get user documents
documentSchema.statics.getUserDocuments = function (userId, category = null, page = 1, limit = 20) {
  const query = { uploadedBy: userId, isActive: true }

  if (category) {
    query.category = category
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("verifiedBy", "firstName lastName")
}

// Static method to get clearance documents
documentSchema.statics.getClearanceDocuments = function (clearanceId) {
  return this.find({
    clearanceId,
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .populate("uploadedBy", "firstName lastName")
    .populate("verifiedBy", "firstName lastName")
}

// Static method for file cleanup
documentSchema.statics.cleanupExpiredDocuments = async function () {
  const expiredDocs = await this.find({
    expiresAt: { $lt: new Date() },
    isActive: true,
  })

  const fs = require("fs").promises
  let deletedCount = 0

  for (const doc of expiredDocs) {
    try {
      // Delete physical file
      await fs.unlink(doc.path)

      // Delete thumbnail if exists
      if (doc.metadata.thumbnailPath) {
        await fs.unlink(doc.metadata.thumbnailPath)
      }

      // Mark as inactive
      doc.isActive = false
      await doc.save()

      deletedCount++
    } catch (error) {
      console.error(`Failed to delete document ${doc._id}:`, error)
    }
  }

  return deletedCount
}

module.exports = mongoose.model("Document", documentSchema)
