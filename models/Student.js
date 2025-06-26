const mongoose = require("mongoose")

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    normalizedPhone: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    faculty: {
      type: String,
      required: true,
    },
    matricNumber: {
      type: String,
      required: true,
      unique: true,
    },
    admissionYear: {
      type: Number,
      required: true,
    },
    currentSemester: {
      type: String,
      enum: ["first", "second"],
      default: "first",
    },
    academicSession: {
      type: String,
      required: true,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 5,
    },
    profilePicture: {
      type: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: {
        type: String,
        default: "Nigeria",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    graduationStatus: {
      type: String,
      enum: ["active", "graduated", "withdrawn", "suspended"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
)

// Compound indexes for efficient searching
studentSchema.index({ studentId: 1, phone: 1 })
studentSchema.index({ normalizedPhone: 1 })
studentSchema.index({ matricNumber: 1 })
studentSchema.index({ department: 1, level: 1 })
studentSchema.index({ academicSession: 1, currentSemester: 1 })

// Pre-save middleware to normalize phone number
studentSchema.pre("save", function (next) {
  if (this.isModified("phone")) {
    this.normalizedPhone = this.constructor.normalizePhone(this.phone)
  }
  next()
})

// Static method to normalize phone number
studentSchema.statics.normalizePhone = (phone) => {
  if (!phone) return null

  const normalized = phone.replace(/\D/g, "")

  if (normalized.startsWith("234")) {
    return normalized
  } else if (normalized.startsWith("0")) {
    return "234" + normalized.substring(1)
  } else if (normalized.length === 10) {
    return "234" + normalized
  }

  return normalized
}

// Static method for fuzzy search
studentSchema.statics.fuzzySearch = async function (query) {
  const normalizedQuery = this.normalizePhone(query)

  // Create search conditions
  const searchConditions = [
    { studentId: new RegExp(query, "i") },
    { matricNumber: new RegExp(query, "i") },
    { phone: new RegExp(query, "i") },
  ]

  // Add normalized phone search if query looks like a phone number
  if (normalizedQuery && normalizedQuery !== query) {
    searchConditions.push({ normalizedPhone: normalizedQuery })
  }

  return this.find({
    $or: searchConditions,
    isActive: true,
  })
    .populate("userId", "firstName lastName email")
    .limit(20)
    .sort({ createdAt: -1 })
}

module.exports = mongoose.model("Student", studentSchema)
