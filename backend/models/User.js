const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["student", "department", "admin"],
      required: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: function () {
        return this.role === "student"
      },
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    // Department-specific fields
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: function () {
        return this.role === "department"
      },
    },
    // Student-specific fields
    studentId: {
      type: String,
      required: function () {
        return this.role === "student"
      },
      unique: true,
      sparse: true,
      index: true,
    },
    department: {
      type: String,
      required: function () {
        return this.role === "student"
      },
    },
    level: {
      type: String,
      required: function () {
        return this.role === "student"
      },
    },
    // Security fields
    refreshTokens: [
      {
        token: String,
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 604800, // 7 days
        },
      },
    ],
    passwordResetToken: String,
    passwordResetExpires: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    profilePicture: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password
        delete ret.refreshTokens
        delete ret.passwordResetToken
        delete ret.passwordResetExpires
        delete ret.loginAttempts
        delete ret.lockUntil
        return ret
      },
    },
  },
)

// Indexes for performance
userSchema.index({ email: 1, role: 1 })
userSchema.index({ phone: 1 }, { sparse: true })
userSchema.index({ studentId: 1 }, { sparse: true })
userSchema.index({ createdAt: -1 })

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`
})

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Method to check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now())
}

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    })
  }

  const updates = { $inc: { loginAttempts: 1 } }

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 } // 2 hours
  }

  return this.updateOne(updates)
}

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  })
}

// Static method to normalize phone number
userSchema.statics.normalizePhone = (phone) => {
  if (!phone) return null

  // Remove all non-digits
  const normalized = phone.replace(/\D/g, "")

  // Handle different formats
  if (normalized.startsWith("234")) {
    // Already in international format without +
    return normalized
  } else if (normalized.startsWith("0")) {
    // Nigerian format starting with 0
    return "234" + normalized.substring(1)
  } else if (normalized.length === 10) {
    // 10 digits, assume Nigerian without leading 0
    return "234" + normalized
  }

  return normalized
}

module.exports = mongoose.model("User", userSchema)
