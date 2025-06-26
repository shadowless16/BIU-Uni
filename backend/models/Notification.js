const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "clearance_submitted",
        "clearance_approved",
        "clearance_rejected",
        "clearance_completed",
        "document_uploaded",
        "reminder",
        "system_announcement",
        "deadline_approaching",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      clearanceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clearance",
      },
      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
      actionUrl: String,
      metadata: mongoose.Schema.Types.Mixed,
    },
    channels: [
      {
        type: {
          type: String,
          enum: ["email", "sms", "push", "in_app"],
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "sent", "delivered", "failed"],
          default: "pending",
        },
        sentAt: Date,
        deliveredAt: Date,
        error: String,
        attempts: {
          type: Number,
          default: 0,
        },
        maxAttempts: {
          type: Number,
          default: 3,
        },
      },
    ],
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    scheduledFor: {
      type: Date,
      index: true,
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

// TTL index for automatic cleanup of old notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ type: 1, createdAt: -1 })
notificationSchema.index({ priority: 1, scheduledFor: 1 })
notificationSchema.index({ "channels.status": 1, "channels.type": 1 })

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true
  this.readAt = new Date()
  return this.save()
}

// Method to update channel status
notificationSchema.methods.updateChannelStatus = function (channelType, status, error = null) {
  const channel = this.channels.find((c) => c.type === channelType)
  if (channel) {
    channel.status = status
    if (status === "sent") {
      channel.sentAt = new Date()
    } else if (status === "delivered") {
      channel.deliveredAt = new Date()
    } else if (status === "failed") {
      channel.error = error
      channel.attempts += 1
    }
  }
  return this.save()
}

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
  const {
    recipient,
    sender,
    type,
    title,
    message,
    channels = ["in_app"],
    priority = "normal",
    scheduledFor,
    expiresAt,
    data: notificationData = {},
  } = data

  // Set default expiration (30 days from now)
  const defaultExpiration = new Date()
  defaultExpiration.setDate(defaultExpiration.getDate() + 30)

  const notification = new this({
    recipient,
    sender,
    type,
    title,
    message,
    channels: channels.map((channel) => ({
      type: channel,
      status: "pending",
    })),
    priority,
    scheduledFor: scheduledFor || new Date(),
    expiresAt: expiresAt || defaultExpiration,
    data: notificationData,
  })

  return notification.save()
}

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    scheduledFor: { $lte: new Date() },
  })
}

// Static method to get notifications with pagination
notificationSchema.statics.getNotifications = function (userId, page = 1, limit = 20, unreadOnly = false) {
  const query = {
    recipient: userId,
    scheduledFor: { $lte: new Date() },
  }

  if (unreadOnly) {
    query.isRead = false
  }

  return this.find(query)
    .populate("sender", "firstName lastName")
    .sort({ priority: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
}

// Static method for bulk notifications
notificationSchema.statics.createBulkNotifications = async function (recipients, notificationData) {
  const notifications = recipients.map((recipient) => ({
    ...notificationData,
    recipient,
    channels: notificationData.channels.map((channel) => ({
      type: channel,
      status: "pending",
    })),
  }))

  return this.insertMany(notifications)
}

module.exports = mongoose.model("Notification", notificationSchema)
