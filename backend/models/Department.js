const mongoose = require("mongoose")

const requirementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  isRequired: {
    type: Boolean,
    default: true,
  },
  documentRequired: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
})

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: String,
    faculty: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    requirements: [requirementSchema],
    officers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["head", "officer", "assistant"],
          default: "officer",
        },
        permissions: [
          {
            type: String,
            enum: ["approve", "reject", "view", "edit"],
          },
        ],
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    settings: {
      autoApproval: {
        type: Boolean,
        default: false,
      },
      requireRemarks: {
        type: Boolean,
        default: false,
      },
      maxProcessingDays: {
        type: Number,
        default: 7,
      },
      notificationEnabled: {
        type: Boolean,
        default: true,
      },
    },
    statistics: {
      totalProcessed: {
        type: Number,
        default: 0,
      },
      totalApproved: {
        type: Number,
        default: 0,
      },
      totalRejected: {
        type: Number,
        default: 0,
      },
      averageProcessingTime: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    contactInfo: {
      email: String,
      phone: String,
      office: String,
      workingHours: String,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
departmentSchema.index({ name: 1, isActive: 1 })
departmentSchema.index({ code: 1 })
departmentSchema.index({ faculty: 1 })
departmentSchema.index({ "officers.userId": 1 })

// Method to add officer
departmentSchema.methods.addOfficer = function (userId, role = "officer", permissions = ["view", "approve", "reject"]) {
  // Check if user is already an officer
  const existingOfficer = this.officers.find(
    (officer) => officer.userId.toString() === userId.toString() && officer.isActive,
  )

  if (existingOfficer) {
    throw new Error("User is already an officer in this department")
  }

  this.officers.push({
    userId,
    role,
    permissions,
    assignedAt: new Date(),
    isActive: true,
  })

  return this.save()
}

// Method to remove officer
departmentSchema.methods.removeOfficer = function (userId) {
  const officer = this.officers.find((officer) => officer.userId.toString() === userId.toString())

  if (!officer) {
    throw new Error("Officer not found in this department")
  }

  officer.isActive = false
  return this.save()
}

// Method to update statistics
departmentSchema.methods.updateStatistics = async function () {
  const Clearance = mongoose.model("Clearance")

  const stats = await Clearance.aggregate([
    {
      $match: {
        "departments.departmentId": this._id,
      },
    },
    {
      $unwind: "$departments",
    },
    {
      $match: {
        "departments.departmentId": this._id,
        "departments.status": { $in: ["approved", "rejected"] },
      },
    },
    {
      $group: {
        _id: "$departments.status",
        count: { $sum: 1 },
        avgTime: {
          $avg: {
            $subtract: ["$departments.approvedAt", "$departments.createdAt"],
          },
        },
      },
    },
  ])

  let totalProcessed = 0
  let totalApproved = 0
  let totalRejected = 0
  let totalTime = 0

  stats.forEach((stat) => {
    totalProcessed += stat.count
    if (stat._id === "approved") {
      totalApproved = stat.count
      totalTime = stat.avgTime
    } else if (stat._id === "rejected") {
      totalRejected = stat.count
    }
  })

  this.statistics = {
    totalProcessed,
    totalApproved,
    totalRejected,
    averageProcessingTime: totalTime / (1000 * 60 * 60 * 24), // Convert to days
    lastUpdated: new Date(),
  }

  return this.save()
}

// Static method to get department performance
departmentSchema.statics.getPerformanceReport = async (startDate, endDate) => {
  const Clearance = mongoose.model("Clearance")

  return Clearance.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $unwind: "$departments",
    },
    {
      $group: {
        _id: "$departments.departmentId",
        departmentName: { $first: "$departments.departmentName" },
        totalRequests: { $sum: 1 },
        approved: {
          $sum: { $cond: [{ $eq: ["$departments.status", "approved"] }, 1, 0] },
        },
        rejected: {
          $sum: { $cond: [{ $eq: ["$departments.status", "rejected"] }, 1, 0] },
        },
        pending: {
          $sum: { $cond: [{ $eq: ["$departments.status", "pending"] }, 1, 0] },
        },
        avgProcessingTime: {
          $avg: {
            $cond: [
              { $ne: ["$departments.approvedAt", null] },
              { $subtract: ["$departments.approvedAt", "$createdAt"] },
              null,
            ],
          },
        },
      },
    },
    {
      $addFields: {
        approvalRate: {
          $multiply: [{ $divide: ["$approved", "$totalRequests"] }, 100],
        },
      },
    },
    {
      $sort: { approvalRate: -1 },
    },
  ])
}

let Department
try {
  Department = mongoose.models.Department || mongoose.model("Department", departmentSchema)
} catch (e) {
  Department = mongoose.model("Department")
}

module.exports = Department
