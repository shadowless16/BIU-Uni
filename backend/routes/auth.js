const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const User = require("../models/User")
const Student = require("../models/Student")
const Department = require("../models/Department")
const authMiddleware = require("../middleware/authMiddleware")
const { validate } = require("../middleware/validation")
const { authLimiter, strictLimiter } = require("../middleware/rateLimiter")
const logger = require("../utils/logger")
const { audit } = require("../utils/logger")
const { uploadSingle } = require("../middleware/upload")

const router = express.Router()

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "15m" })

  const refreshToken = jwt.sign({ userId, type: "refresh" }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  })

  return { accessToken, refreshToken }
}

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", authLimiter, validate("login"), async (req, res) => {
  try {
    const { email, password, role, rememberMe } = req.body

    // Debug: Log incoming login payload
    console.log("LOGIN ATTEMPT:", { email, role })

    // Find user by email and role
    const user = await User.findOne({
      email: email.toLowerCase(),
      role,
      isActive: true,
    })

    // Debug: Log user found or not
    if (!user) {
      console.log("LOGIN FAILED: User not found", { email, role })
      audit("LOGIN_FAILED", null, { email, role, reason: "User not found" })
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    } else {
      console.log("LOGIN USER FOUND:", user.email, user.role)
    }

    // Check if account is locked
    if (user.isLocked()) {
      audit("LOGIN_FAILED", user._id, { email, role, reason: "Account locked" })
      return res.status(423).json({
        success: false,
        message: "Account is temporarily locked due to multiple failed login attempts",
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    console.log("PASSWORD CHECK:", { input: password, hash: user.password, isMatch })

    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts()
      audit("LOGIN_FAILED", user._id, { email, role, reason: "Invalid password" })

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts()
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id)

    // Store refresh token
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
    })

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Log successful login
    audit("LOGIN_SUCCESS", user._id, { email, role })

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.fullName,
          profileComplete: user.profileComplete,
        },
        token: accessToken,
        refreshToken: rememberMe ? refreshToken : undefined,
      },
    })
  } catch (error) {
    logger.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during login",
    })
  }
})

// @route   POST /api/auth/register
// @desc    Register student
// @access  Public
router.post(
  "/register",
  ...uploadSingle("profilePicture"), // Use helper to handle file and fields
  validate("register"),
  authLimiter,
  async (req, res) => {
    console.log("REGISTER route hit")
    try {
      // Debug logs to inspect incoming data
      console.log('REGISTER req.body:', req.body)
      console.log('REGISTER req.file:', req.file)

      const { firstName, lastName, email, studentId, phone, password, department, level } = req.body
      let profilePicture = null
      if (req.file) {
        profilePicture = req.file.filename
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { studentId }],
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email or student ID already exists",
        })
      }

      // Normalize phone number
      const normalizedPhone = User.normalizePhone(phone)

      // Check if phone number is already registered
      const existingPhone = await User.findOne({
        phone: normalizedPhone,
      })

      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "Phone number is already registered",
        })
      }

      // Check if profile picture is provided
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Profile picture is required. Please upload a profile picture to register.",
        })
      }

      // Create user
      const user = new User({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password,
        role: "student",
        phone: normalizedPhone,
        studentId,
        department,
        level,
        profileComplete: true,
        profilePicture,
      })

      await user.save()

      // Create student profile
      const student = new Student({
        userId: user._id,
        studentId,
        phone: normalizedPhone,
        normalizedPhone,
        department,
        level,
        faculty: "Engineering", // This should be determined based on department
        matricNumber: studentId, // Assuming studentId is the matric number
        admissionYear: new Date().getFullYear(),
        academicSession: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      })

      await student.save()

      // Log registration
      audit("USER_REGISTERED", user._id, { email, studentId, department })

      res.status(201).json({
        success: true,
        message: "Registration successful. Please login to continue.",
        data: {
          userId: user._id,
          email: user.email,
          studentId: user.studentId,
        },
      })
    } catch (error) {
      logger.error("Registration error:", error)

      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0]
        return res.status(400).json({
          success: false,
          message: `${field} already exists`,
        })
      }

      res.status(500).json({
        success: false,
        message: "Server error during registration",
      })
    }
  }
)

// @route   POST /api/auth/register-department
// @desc    Register a new department
// @access  Public
router.post("/register-department", async (req, res) => {
  try {
    const { departmentName, departmentCode, email, password } = req.body;
    if (!departmentName || !departmentCode || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Check if department already exists
    const existing = await Department.findOne({ code: departmentCode });
    if (existing) {
      return res.status(400).json({ message: "Department code already exists" });
    }
    // Create department (add more fields as needed)
    const newDept = new Department({
      name: departmentName,
      code: departmentCode,
      email,
      faculty: "General", // You can update this to accept from frontend
      isActive: true,
    });
    await newDept.save();

    // Also create a User record for department login
    // Pass plain password, let User model hash it
    const user = new User({
      email,
      password, // plain password
      role: "department",
      isActive: true,
      fullName: departmentName,
      firstName: departmentName, // Use department name as first name
      lastName: departmentCode,  // Use department code as last name
      departmentId: newDept._id, // Link to department
    });
    await user.save();

    res.status(201).json({ message: "Department registered successfully" });
  } catch (err) {
      console.error("Register Department Error:", err); // Add this line
      res.status(500).json({ message: "Server error", error: err.message });
  }
})

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      })
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
      })
    }

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId)

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      })
    }

    const tokenExists = user.refreshTokens.some((token) => token.token === refreshToken)

    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      })
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id)

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter((token) => token.token !== refreshToken)
    user.refreshTokens.push({
      token: newRefreshToken,
      createdAt: new Date(),
    })

    await user.save()

    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: newRefreshToken,
      },
    })
  } catch (error) {
    logger.error("Token refresh error:", error)

    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error during token refresh",
    })
  }
})

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const { refreshToken } = req.body
    const user = req.user

    // Remove refresh token if provided
    if (refreshToken) {
      user.refreshTokens = user.refreshTokens.filter((token) => token.token !== refreshToken)
      await user.save()
    }

    // Log logout
    audit("LOGOUT", user._id, {})

    res.json({
      success: true,
      message: "Logout successful",
    })
  } catch (error) {
    logger.error("Logout error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    })
  }
})

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post("/forgot-password", strictLimiter, validate("forgotPassword"), async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    })

    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: "If the email exists, a password reset link has been sent",
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    // Set reset token and expiration (10 minutes)
    user.passwordResetToken = hashedToken
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000
    await user.save()

    // TODO: Send email with reset link
    // const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    // await sendPasswordResetEmail(user.email, resetUrl);

    // Log password reset request
    audit("PASSWORD_RESET_REQUESTED", user._id, { email })

    res.json({
      success: true,
      message: "Password reset link sent to your email",
    })
  } catch (error) {
    logger.error("Forgot password error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during password reset request",
    })
  }
})

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post("/change-password", authMiddleware, validate("changePassword"), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword)

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    // Update password
    user.password = newPassword

    // Clear all refresh tokens to force re-login
    user.refreshTokens = []

    await user.save()

    // Log password change
    audit("PASSWORD_CHANGED", user._id, {})

    res.json({
      success: true,
      message: "Password changed successfully. Please login again.",
    })
  } catch (error) {
    logger.error("Change password error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during password change",
    })
  }
})

// @route   GET /api/auth/verify
// @desc    Verify token and get user data
// @access  Private
router.get("/verify", authMiddleware, async (req, res) => {
  try {
    const user = req.user

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.fullName,
          profileComplete: user.profileComplete,
          lastLogin: user.lastLogin,
        },
      },
    })
  } catch (error) {
    logger.error("Token verification error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during token verification",
    })
  }
})

module.exports = router
