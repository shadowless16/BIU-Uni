const Joi = require("joi")
const logger = require("../utils/logger")

// Validation schemas
const schemas = {
  // Auth schemas
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("student", "department", "admin").required(),
    rememberMe: Joi.boolean().optional(),
  }),

  register: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().required(),
    studentId: Joi.string().trim().required(),
    phone: Joi.string()
      .pattern(/^(\+234|234|0)[789][01]\d{8}$/)
      .required(),
    password: Joi.string().min(6).required(),
    department: Joi.string().trim().required(),
    level: Joi.string().valid("100", "200", "300", "400", "500", "600").required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  // Student schemas
  updateProfile: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).optional(),
    lastName: Joi.string().trim().min(2).max(50).optional(),
    phone: Joi.string()
      .pattern(/^(\+234|234|0)[789][01]\d{8}$/)
      .optional(),
    emergencyContact: Joi.object({
      name: Joi.string().trim().max(100).optional(),
      phone: Joi.string()
        .pattern(/^(\+234|234|0)[789][01]\d{8}$/)
        .optional(),
      relationship: Joi.string().trim().max(50).optional(),
    }).optional(),
    address: Joi.object({
      street: Joi.string().trim().max(200).optional(),
      city: Joi.string().trim().max(100).optional(),
      state: Joi.string().trim().max(100).optional(),
      country: Joi.string().trim().max(100).optional(),
    }).optional(),
  }),

  applyClearance: Joi.object({
    departments: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
    clearanceType: Joi.string().valid("graduation", "transfer", "withdrawal", "semester").required(),
    documents: Joi.array().items(Joi.string().hex().length(24)).optional(),
  }),

  // Department schemas
  searchStudent: Joi.object({
    query: Joi.string().trim().min(3).required(),
  }),

  approveRejectClearance: Joi.object({
    studentId: Joi.string().hex().length(24).required(),
    departmentId: Joi.string().hex().length(24).required(),
    status: Joi.string().valid("approved", "rejected").required(),
    remarks: Joi.string().trim().max(500).optional(),
  }),

  // Admin schemas
  createStudent: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().required(),
    studentId: Joi.string().trim().required(),
    phone: Joi.string()
      .pattern(/^(\+234|234|0)[789][01]\d{8}$/)
      .required(),
    department: Joi.string().trim().required(),
    level: Joi.string().valid("100", "200", "300", "400", "500", "600").required(),
    faculty: Joi.string().trim().required(),
    matricNumber: Joi.string().trim().required(),
  }),

  createDepartment: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    code: Joi.string().trim().min(2).max(10).uppercase().required(),
    description: Joi.string().trim().max(500).optional(),
    faculty: Joi.string().trim().required(),
    requirements: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().trim().required(),
          description: Joi.string().trim().optional(),
          isRequired: Joi.boolean().optional(),
          documentRequired: Joi.boolean().optional(),
        }),
      )
      .optional(),
  }),

  bulkNotification: Joi.object({
    recipients: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
    title: Joi.string().trim().min(5).max(100).required(),
    message: Joi.string().trim().min(10).max(500).required(),
    type: Joi.string()
      .valid("clearance_submitted", "clearance_approved", "clearance_rejected", "system_announcement", "reminder")
      .required(),
    channels: Joi.array()
      .items(Joi.string().valid("email", "sms", "push", "in_app"))
      .min(1)
      .required(),
    priority: Joi.string().valid("low", "normal", "high", "urgent").optional(),
    scheduledFor: Joi.date().optional(),
  }),
}

// Validation middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName]

    if (!schema) {
      logger.error(`Validation schema '${schemaName}' not found`)
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    }

    // Sanitize phone number for register and updateProfile
    if (schemaName === "register" || schemaName === "updateProfile") {
      if (req.body.phone) {
        req.body.phone = req.body.phone.replace(/\D/g, "")
        if (req.body.phone.length === 11 && req.body.phone.startsWith("0")) {
          // OK
        } else if (req.body.phone.length === 13 && req.body.phone.startsWith("234")) {
          req.body.phone = "0" + req.body.phone.slice(3)
        } else if (req.body.phone.length === 14 && req.body.phone.startsWith("+234")) {
          req.body.phone = "0" + req.body.phone.slice(4)
        }
      }
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context.value,
      }))

      logger.warn(`Validation failed for ${schemaName}:`, errors)

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      })
    }

    // Replace req.body with validated and sanitized data
    req.body = value
    next()
  }
}

// Query parameter validation
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context.value,
      }))

      return res.status(400).json({
        success: false,
        message: "Query validation failed",
        errors,
      })
    }

    req.query = value
    next()
  }
}

// Common query schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().optional(),
    order: Joi.string().valid("asc", "desc").default("desc"),
  }),

  search: Joi.object({
    q: Joi.string().trim().min(1).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  dateRange: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
}

module.exports = {
  validate,
  validateQuery,
  schemas,
  querySchemas,
}
