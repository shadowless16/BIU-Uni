import { apiUtils } from "./api"

/**
 * Student Service
 * Handles all student-related API calls
 */
class StudentService {
  /**
   * Get student dashboard data
   * @returns {Promise<Object>} Dashboard data including clearance status and recent activity
   */
  async getDashboard() {
    try {
      const data = await apiUtils.get("/student/dashboard")

      // Cache dashboard data for offline access
      this.cacheDashboardData(data)

      return data
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)

      // Try to return cached data if available
      const cachedData = this.getCachedDashboardData()
      if (cachedData) {
        console.warn("Using cached dashboard data due to network error")
        return { ...cachedData, isOffline: true }
      }

      throw error
    }
  }

  /**
   * Submit clearance application
   * @param {Object} applicationData - Application data
   * @param {string[]} applicationData.departments - Selected department IDs
   * @param {string} applicationData.clearanceType - Type of clearance
   * @param {string[]} applicationData.documents - Document IDs
   * @returns {Promise<Object>} Application submission result
   */
  async submitClearanceApplication(applicationData) {
    try {
      const data = await apiUtils.post("/student/clearance/apply", applicationData)

      // Invalidate dashboard cache to force refresh
      this.invalidateDashboardCache()

      return data
    } catch (error) {
      console.error("Failed to submit clearance application:", error)
      throw error
    }
  }

  /**
   * Get detailed clearance status
   * @returns {Promise<Object>} Detailed clearance status with timeline
   */
  async getClearanceStatus() {
    try {
      const data = await apiUtils.get("/student/clearance/status")
      return data
    } catch (error) {
      console.error("Failed to fetch clearance status:", error)
      throw error
    }
  }

  /**
   * Update student profile
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>} Updated profile data
   */
  async updateProfile(profileData) {
    try {
      // Normalize phone number if provided
      const normalizedData = { ...profileData }
      if (profileData.phone) {
        normalizedData.phone = this.normalizePhoneNumber(profileData.phone)
      }

      const data = await apiUtils.put("/student/profile", normalizedData)

      // Update cached user data
      this.updateCachedUserData(data)

      return data
    } catch (error) {
      console.error("Failed to update profile:", error)
      throw error
    }
  }

  /**
   * Get student notifications with pagination
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {boolean} options.unreadOnly - Get only unread notifications
   * @returns {Promise<Object>} Notifications data
   */
  async getNotifications(options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options

      const data = await apiUtils.get("/student/notifications", {
        page,
        limit,
        unreadOnly,
      })

      return data
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      throw error
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Update result
   */
  async markNotificationAsRead(notificationId) {
    try {
      const data = await apiUtils.post(`/student/notifications/${notificationId}/read`)
      return data
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      throw error
    }
  }

  /**
   * Get unread notification count
   * @returns {Promise<number>} Unread count
   */
  async getUnreadNotificationCount() {
    try {
      const data = await apiUtils.get("/student/notifications/unread-count")
      return data.count || 0
    } catch (error) {
      console.error("Failed to fetch unread notification count:", error)
      return 0
    }
  }

  /**
   * Upload document
   * @param {File} file - File to upload
   * @param {Object} metadata - Document metadata
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result
   */
  async uploadDocument(file, metadata = {}, onProgress) {
    try {
      // Validate file before upload
      this.validateFile(file)

      const formData = new FormData()
      formData.append("file", file)

      // Add metadata
      Object.keys(metadata).forEach((key) => {
        formData.append(key, metadata[key])
      })

      const data = await apiUtils.upload("/student/documents/upload", formData, onProgress)
      return data
    } catch (error) {
      console.error("Failed to upload document:", error)
      throw error
    }
  }

  /**
   * Get student documents
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Documents data
   */
  async getDocuments(options = {}) {
    try {
      const data = await apiUtils.get("/student/documents", options)
      return data
    } catch (error) {
      console.error("Failed to fetch documents:", error)
      throw error
    }
  }

  /**
   * Delete document
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteDocument(documentId) {
    try {
      const data = await apiUtils.delete(`/student/documents/${documentId}`)
      return data
    } catch (error) {
      console.error("Failed to delete document:", error)
      throw error
    }
  }

  /**
   * Get available departments for clearance
   * @returns {Promise<Object[]>} Available departments
   */
  async getAvailableDepartments() {
    try {
      const data = await apiUtils.get("/student/departments/available")

      // Cache departments data
      localStorage.setItem(
        "cached_departments",
        JSON.stringify({
          data,
          timestamp: Date.now(),
        }),
      )

      return data
    } catch (error) {
      console.error("Failed to fetch available departments:", error)

      // Try to return cached data
      const cached = this.getCachedDepartments()
      if (cached) {
        return cached
      }

      throw error
    }
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @private
   */
  validateFile(file) {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (file.size > maxSize) {
      throw new Error("File size must be less than 10MB")
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.")
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

  /**
   * Cache dashboard data
   * @param {Object} data - Dashboard data
   * @private
   */
  cacheDashboardData(data) {
    try {
      localStorage.setItem(
        "cached_dashboard",
        JSON.stringify({
          data,
          timestamp: Date.now(),
        }),
      )
    } catch (error) {
      console.warn("Failed to cache dashboard data:", error)
    }
  }

  /**
   * Get cached dashboard data
   * @returns {Object|null} Cached dashboard data
   * @private
   */
  getCachedDashboardData() {
    try {
      const cached = localStorage.getItem("cached_dashboard")
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)

        // Return cached data if less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return data
        }
      }
    } catch (error) {
      console.warn("Failed to get cached dashboard data:", error)
    }

    return null
  }

  /**
   * Invalidate dashboard cache
   * @private
   */
  invalidateDashboardCache() {
    localStorage.removeItem("cached_dashboard")
  }

  /**
   * Update cached user data
   * @param {Object} userData - Updated user data
   * @private
   */
  updateCachedUserData(userData) {
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}")
      const updatedUser = { ...currentUser, ...userData }
      localStorage.setItem("user", JSON.stringify(updatedUser))
    } catch (error) {
      console.warn("Failed to update cached user data:", error)
    }
  }

  /**
   * Get cached departments
   * @returns {Object[]|null} Cached departments
   * @private
   */
  getCachedDepartments() {
    try {
      const cached = localStorage.getItem("cached_departments")
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)

        // Return cached data if less than 1 hour old
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          return data
        }
      }
    } catch (error) {
      console.warn("Failed to get cached departments:", error)
    }

    return null
  }
}

// Create and export singleton instance
const studentService = new StudentService()
export default studentService
