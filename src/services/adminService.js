import { apiUtils } from "./api"

/**
 * Admin Service
 * Handles all admin-related API calls
 */
class AdminService {
  /**
   * Get admin dashboard with system-wide analytics
   * @returns {Promise<Object>} Dashboard data with analytics and system health
   */
  async getDashboard() {
    try {
      const data = await apiUtils.get("/admin/dashboard")
      return data
    } catch (error) {
      console.error("Failed to fetch admin dashboard:", error)
      throw error
    }
  }

  /**
   * Get system analytics
   * @param {Object} options - Query options
   * @param {string} options.startDate - Start date
   * @param {string} options.endDate - End date
   * @param {string} options.granularity - Data granularity (day, week, month)
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(options = {}) {
    try {
      const data = await apiUtils.get("/admin/analytics", options)
      return data
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
      throw error
    }
  }

  /**
   * Get all students with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search query
   * @param {string} options.department - Filter by department
   * @param {string} options.level - Filter by level
   * @param {string} options.status - Filter by status
   * @returns {Promise<Object>} Students data with pagination
   */
  async getStudents(options = {}) {
    try {
      const data = await apiUtils.get("/admin/students", options)
      return data
    } catch (error) {
      console.error("Failed to fetch students:", error)
      throw error
    }
  }

  /**
   * Create new student
   * @param {Object} studentData - Student data
   * @returns {Promise<Object>} Created student data
   */
  async createStudent(studentData) {
    try {
      // Normalize phone number
      const normalizedData = {
        ...studentData,
        phone: this.normalizePhoneNumber(studentData.phone),
      }

      const data = await apiUtils.post("/admin/students", normalizedData)
      return data
    } catch (error) {
      console.error("Failed to create student:", error)
      throw error
    }
  }

  /**
   * Update student
   * @param {string} studentId - Student ID
   * @param {Object} studentData - Updated student data
   * @returns {Promise<Object>} Updated student data
   */
  async updateStudent(studentId, studentData) {
    try {
      // Normalize phone number if provided
      const normalizedData = { ...studentData }
      if (studentData.phone) {
        normalizedData.phone = this.normalizePhoneNumber(studentData.phone)
      }

      const data = await apiUtils.put(`/admin/students/${studentId}`, normalizedData)
      return data
    } catch (error) {
      console.error("Failed to update student:", error)
      throw error
    }
  }

  /**
   * Delete student
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteStudent(studentId) {
    try {
      const data = await apiUtils.delete(`/admin/students/${studentId}`)
      return data
    } catch (error) {
      console.error("Failed to delete student:", error)
      throw error
    }
  }

  /**
   * Bulk import students from CSV/Excel
   * @param {File} file - Import file
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Import result
   */
  async bulkImportStudents(file, onProgress) {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const data = await apiUtils.upload("/admin/students/bulk-import", formData, onProgress)
      return data
    } catch (error) {
      console.error("Failed to bulk import students:", error)
      throw error
    }
  }

  /**
   * Export students data
   * @param {Object} options - Export options
   * @param {string} options.format - Export format (csv, excel, pdf)
   * @param {Object} options.filters - Export filters
   * @returns {Promise<Blob>} Export file blob
   */
  async exportStudents(options = {}) {
    try {
      const response = await apiUtils.get("/admin/students/export", {
        ...options,
        responseType: "blob",
      })

      return response
    } catch (error) {
      console.error("Failed to export students:", error)
      throw error
    }
  }

  /**
   * Get all departments
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>} Departments data
   */
  async getDepartments(options = {}) {
    try {
      const data = await apiUtils.get("/admin/departments", options)
      return data
    } catch (error) {
      console.error("Failed to fetch departments:", error)
      throw error
    }
  }

  /**
   * Create new department
   * @param {Object} departmentData - Department data
   * @returns {Promise<Object>} Created department data
   */
  async createDepartment(departmentData) {
    try {
      const data = await apiUtils.post("/admin/departments", departmentData)
      return data
    } catch (error) {
      console.error("Failed to create department:", error)
      throw error
    }
  }

  /**
   * Update department
   * @param {string} departmentId - Department ID
   * @param {Object} departmentData - Updated department data
   * @returns {Promise<Object>} Updated department data
   */
  async updateDepartment(departmentId, departmentData) {
    try {
      const data = await apiUtils.put(`/admin/departments/${departmentId}`, departmentData)
      return data
    } catch (error) {
      console.error("Failed to update department:", error)
      throw error
    }
  }

  /**
   * Delete department
   * @param {string} departmentId - Department ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteDepartment(departmentId) {
    try {
      const data = await apiUtils.delete(`/admin/departments/${departmentId}`)
      return data
    } catch (error) {
      console.error("Failed to delete department:", error)
      throw error
    }
  }

  /**
   * Manage department officers
   * @param {string} departmentId - Department ID
   * @param {Object} officerData - Officer management data
   * @param {string} officerData.action - Action (add, remove, update)
   * @param {string} officerData.userId - User ID
   * @param {string} officerData.role - Officer role
   * @param {string[]} officerData.permissions - Officer permissions
   * @returns {Promise<Object>} Management result
   */
  async manageDepartmentOfficers(departmentId, officerData) {
    try {
      const data = await apiUtils.post(`/admin/departments/${departmentId}/officers`, officerData)
      return data
    } catch (error) {
      console.error("Failed to manage department officers:", error)
      throw error
    }
  }

  /**
   * Get all clearance applications
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.status - Filter by status
   * @param {string} options.department - Filter by department
   * @param {string} options.startDate - Filter by start date
   * @param {string} options.endDate - Filter by end date
   * @returns {Promise<Object>} Clearance applications data
   */
  async getClearanceApplications(options = {}) {
    try {
      const data = await apiUtils.get("/admin/clearances", options)
      return data
    } catch (error) {
      console.error("Failed to fetch clearance applications:", error)
      throw error
    }
  }

  /**
   * Get clearance application details
   * @param {string} clearanceId - Clearance ID
   * @returns {Promise<Object>} Clearance details
   */
  async getClearanceDetails(clearanceId) {
    try {
      const data = await apiUtils.get(`/admin/clearances/${clearanceId}`)
      return data
    } catch (error) {
      console.error("Failed to fetch clearance details:", error)
      throw error
    }
  }

  /**
   * Override clearance status (admin privilege)
   * @param {string} clearanceId - Clearance ID
   * @param {Object} overrideData - Override data
   * @param {string} overrideData.status - New status
   * @param {string} overrideData.reason - Override reason
   * @returns {Promise<Object>} Override result
   */
  async overrideClearanceStatus(clearanceId, overrideData) {
    try {
      const data = await apiUtils.post(`/admin/clearances/${clearanceId}/override`, overrideData)
      return data
    } catch (error) {
      console.error("Failed to override clearance status:", error)
      throw error
    }
  }

  /**
   * Send bulk notifications
   * @param {Object} notificationData - Notification data
   * @param {string[]} notificationData.recipients - Recipient user IDs
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {string} notificationData.type - Notification type
   * @param {string[]} notificationData.channels - Delivery channels
   * @param {string} notificationData.priority - Priority level
   * @param {Date} notificationData.scheduledFor - Schedule time
   * @returns {Promise<Object>} Notification result
   */
  async sendBulkNotification(notificationData) {
    try {
      const data = await apiUtils.post("/admin/notifications/bulk", notificationData)
      return data
    } catch (error) {
      console.error("Failed to send bulk notification:", error)
      throw error
    }
  }

  /**
   * Get system reports
   * @param {Object} options - Report options
   * @param {string} options.type - Report type
   * @param {string} options.startDate - Start date
   * @param {string} options.endDate - End date
   * @param {string} options.format - Report format
   * @returns {Promise<Object|Blob>} Report data or file blob
   */
  async getSystemReports(options = {}) {
    try {
      const { format, ...queryParams } = options

      if (format && ["pdf", "excel", "csv"].includes(format)) {
        // Return blob for file downloads
        const response = await apiUtils.get("/admin/reports", {
          ...queryParams,
          format,
          responseType: "blob",
        })
        return response
      } else {
        // Return JSON data for display
        const data = await apiUtils.get("/admin/reports", queryParams)
        return data
      }
    } catch (error) {
      console.error("Failed to get system reports:", error)
      throw error
    }
  }

  /**
   * Get system health status
   * @returns {Promise<Object>} System health data
   */
  async getSystemHealth() {
    try {
      const data = await apiUtils.get("/admin/system/health")
      return data
    } catch (error) {
      console.error("Failed to fetch system health:", error)
      throw error
    }
  }

  /**
   * Get audit logs
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.action - Filter by action
   * @param {string} options.userId - Filter by user
   * @param {string} options.startDate - Start date
   * @param {string} options.endDate - End date
   * @returns {Promise<Object>} Audit logs data
   */
  async getAuditLogs(options = {}) {
    try {
      const data = await apiUtils.get("/admin/audit-logs", options)
      return data
    } catch (error) {
      console.error("Failed to fetch audit logs:", error)
      throw error
    }
  }

  /**
   * Get system settings
   * @returns {Promise<Object>} System settings
   */
  async getSystemSettings() {
    try {
      const data = await apiUtils.get("/admin/settings")
      return data
    } catch (error) {
      console.error("Failed to fetch system settings:", error)
      throw error
    }
  }

  /**
   * Update system settings
   * @param {Object} settings - Updated settings
   * @returns {Promise<Object>} Update result
   */
  async updateSystemSettings(settings) {
    try {
      const data = await apiUtils.put("/admin/settings", settings)
      return data
    } catch (error) {
      console.error("Failed to update system settings:", error)
      throw error
    }
  }

  /**
   * Backup system data
   * @param {Object} options - Backup options
   * @returns {Promise<Object>} Backup result
   */
  async backupSystem(options = {}) {
    try {
      const data = await apiUtils.post("/admin/system/backup", options)
      return data
    } catch (error) {
      console.error("Failed to backup system:", error)
      throw error
    }
  }

  /**
   * Get backup history
   * @returns {Promise<Object[]>} Backup history
   */
  async getBackupHistory() {
    try {
      const data = await apiUtils.get("/admin/system/backups")
      return data
    } catch (error) {
      console.error("Failed to fetch backup history:", error)
      throw error
    }
  }

  /**
   * Restore system from backup
   * @param {string} backupId - Backup ID
   * @returns {Promise<Object>} Restore result
   */
  async restoreFromBackup(backupId) {
    try {
      const data = await apiUtils.post(`/admin/system/restore/${backupId}`)
      return data
    } catch (error) {
      console.error("Failed to restore from backup:", error)
      throw error
    }
  }

  /**
   * Get user management data
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User management data
   */
  async getUserManagement(options = {}) {
    try {
      const data = await apiUtils.get("/admin/users", options)
      return data
    } catch (error) {
      console.error("Failed to fetch user management data:", error)
      throw error
    }
  }

  /**
   * Update user role and permissions
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @param {string} updateData.role - New role
   * @param {boolean} updateData.isActive - Active status
   * @returns {Promise<Object>} Update result
   */
  async updateUserRole(userId, updateData) {
    try {
      const data = await apiUtils.put(`/admin/users/${userId}/role`, updateData)
      return data
    } catch (error) {
      console.error("Failed to update user role:", error)
      throw error
    }
  }

  /**
   * Normalize phone number
   * @param {string} phone - Phone number
   * @returns {string} Normalized phone number
   * @private
   */
  normalizePhoneNumber(phone) {
    if (!phone) return ""

    const digits = phone.replace(/\D/g, "")

    if (digits.startsWith("234")) {
      return digits
    } else if (digits.startsWith("0")) {
      return "234" + digits.substring(1)
    } else if (digits.length === 10) {
      return "234" + digits
    }

    return digits
  }
}

// Create and export singleton instance
const adminService = new AdminService()
export default adminService
