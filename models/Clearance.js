const mongoose = require("mongoose")

const clearanceItemSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    departmentName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "not_required"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    remarks: String,
    requirements: [
      {
        name: String,
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
        notes: String,
      },
    ],
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  },
)

const clearanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    academicSession: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      enum: ["first", "second"],
      required: true,
    },
    clearanceType: {
      type: String,
      enum: ["graduation", "transfer", "withdrawal", "semester"],
      required: true,
    },
    overallStatus: {
      type: String,
      enum: ["draft", "submitted", "in_progress", "completed", "rejected"],
      default: "draft",
      index: true,
    },
    departments: [clearanceItemSchema],
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    submittedAt: Date,
    completedAt: Date,
    deadline: Date,
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalDepartments: {
      type: Number,
      default: 0,
    },
    approvedDepartments: {
      type: Number,
      default: 0,
    },
    pendingDepartments: {
      type: Number,
      default: 0,
    },
    rejectedDepartments: {
      type: Number,
      default: 0,
    },
    timeline: [
      {
        action: {
          type: String,
          required: true,
        },
        description: String,
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],
    notifications: [
      {
        type: {
          type: String,
          enum: ["email", "sms", "push", "in_app"],
          required: true,
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["sent", "delivered", "failed"],
          default: "sent",
        },
        message: String,
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
clearanceSchema.index({ studentId: 1, academicSession: 1 })
clearanceSchema.index({ overallStatus: 1, createdAt: -1 })
clearanceSchema.index({ "departments.departmentId": 1, "departments.status": 1 })
clearanceSchema.index({ completedAt: -1 })
clearanceSchema.index({ deadline: 1 })

// Pre-save middleware to calculate statistics
clearanceSchema.pre("save", function (next) {
  if (this.isModified("departments")) {
    this.totalDepartments = this.departments.length
    this.approvedDepartments = this.departments.filter((d) => d.status === "approved").length
    this.pendingDepartments = this.departments.filter((d) => d.status === "pending").length
    this.rejectedDepartments = this.departments.filter((d) => d.status === "rejected").length

    // Calculate completion percentage
    if (this.totalDepartments > 0) {
      this.completionPercentage = Math.round((this.approvedDepartments / this.totalDepartments) * 100)
    }

    // Update overall status
    if (this.approvedDepartments === this.totalDepartments && this.totalDepartments > 0) {
      this.overallStatus = "completed"
      if (!this.completedAt) {
        this.completedAt = new Date()
      }
    } else if (this.rejectedDepartments > 0) {
      this.overallStatus = "rejected"
    } else if (this.approvedDepartments > 0 || this.pendingDepartments > 0) {
      this.overallStatus = "in_progress"
    }
  }
  next()
})

// Method to add timeline entry
clearanceSchema.methods.addTimelineEntry = function (action, description, performedBy, metadata = {}) {
  this.timeline.push({
    action,
    description,
    performedBy,
    metadata,
    timestamp: new Date(),
  })
  // Do NOT call this.save() here!
}

// Method to update department status
clearanceSchema.methods.updateDepartmentStatus = function (departmentId, status, approvedBy, remarks) {
  const department = this.departments.id(departmentId)
  if (!department) {
    throw new Error("Department not found in clearance")
  }

  department.status = status
  department.remarks = remarks

  if (status === "approved") {
    department.approvedBy = approvedBy
    department.approvedAt = new Date()
  }

  // Add timeline entry (just push, don't save)
  this.addTimelineEntry(`department_${status}`, `${department.departmentName} ${status}`, approvedBy, {
    departmentId,
    remarks,
  })

  return this.save()
}

// Static method to generate application number
clearanceSchema.statics.generateApplicationNumber = async function () {
  const year = new Date().getFullYear()
  const count = await this.countDocuments({
    applicationNumber: new RegExp(`^CLR${year}`),
  })

  return `CLR${year}${String(count + 1).padStart(6, "0")}`
}

// Static method for analytics
clearanceSchema.statics.getAnalytics = async function (startDate, endDate) {
  const pipeline = [
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: "$overallStatus",
        count: { $sum: 1 },
        avgCompletionTime: {
          $avg: {
            $cond: [{ $ne: ["$completedAt", null] }, { $subtract: ["$completedAt", "$submittedAt"] }, null],
          },
        },
      },
    },
  ]

  return this.aggregate(pipeline)
}

module.exports = mongoose.model("Clearance", clearanceSchema)
