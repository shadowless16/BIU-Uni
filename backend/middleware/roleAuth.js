const roleAuth = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      })
    }

    // Check if user role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      })
    }

    next()
  }
}

// Specific role middleware functions
const requireStudent = roleAuth("student")
const requireDepartment = roleAuth("department")
const requireAdmin = roleAuth("admin")
const requireAdminOrDepartment = roleAuth("admin", "department")

module.exports = {
  roleAuth,
  requireStudent,
  requireDepartment,
  requireAdmin,
  requireAdminOrDepartment,
}
