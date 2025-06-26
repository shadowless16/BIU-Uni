import { apiUtils } from "./api"

/**
 * Department Service
 * Handles all department-related API calls
 */
class DepartmentService {
  constructor() {
    // Cache for recent searches to improve UX
    this.searchCache = new Map()
    this.recentStudentsCache = new Map()
  }

  /**
   * Get department dashboard data
   * @returns {Promise<Object>} Dashboard data with pending approvals and statistics
   */
  async getDashboard() {
    try {
      const data = await apiUtils.get("/department/dashboard-summary")
      return data
    } catch (error) {
      console.error("Failed to fetch department dashboard:", error)
      throw error
    }
  }

  /**
   * Search for students with debouncing and caching
   * @param {string} query - Search query (phone, matric number, student ID)
   * @param {Object} options - Search options
   * @returns {Promise<Object[]>} Search results
   */
  async searchStudents(query, options = {}) {
    try {
      // Check cache first
      const cacheKey = `${query}_${JSON.stringify(options)}`
      if (this.searchCache.has(cacheKey)) {
        const cached = this.searchCache.get(cacheKey)

        // Return cached result if less than 2 minutes old
        if (Date.now() - cached.timestamp < 2 * 60 * 1000) {
          return cached.data
        }
      }

      const data = await apiUtils.post("/department/search-student", {
        query: query.trim(),
        ...options,
      })

      // Cache the result
      this.searchCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      })

      // Limit cache size
      if (this.searchCache.size > 50) {
        const firstKey = this.searchCache.keys().next().value
        this.searchCache.delete(firstKey)
      }

      return data
    } catch (error) {
      console.error("Failed to search students:", error)
      throw error
    }
  }

  /**
   * Get pending students for approval
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Pending students data
   */
  async getPendingStudents(options = {}) {
    try {
      const { page = 1, limit = 20 } = options

      const data = await apiUtils.get("/department/pending-students", {
        page,
        limit,
      })

      return data
    } catch (error) {
      console.error("Failed to fetch pending students:", error)
      throw error
    }
  }

  /**
   * Approve student clearance
   * @param {Object} approvalData - Approval data
   * @param {string} approvalData.studentId - Student ID
   * @param {string} approvalData.clearanceId - Clearance ID
   * @param {string} approvalData.remarks - Optional remarks
   * @returns {Promise<Object>} Approval result
   */
  async approveStudent(approvalData) {
    try {
      const { clearanceId, remarks, departmentId, departmentSubdocId, approvedBy, studentId } = approvalData;
      const data = await apiUtils.patch(`/department/clearance-requests/${clearanceId}/approve`, {
        departmentId: departmentId, // reference to Department collection
        departmentSubdocId: departmentSubdocId, // subdocument _id in clearance.departments
        approvedBy: approvedBy, // optional, can be user._id
        remarks: remarks || "Approved by department head."
      });
      this.updateRecentStudentsCache(studentId, "approved");
      return data;
    } catch (error) {
      console.error("Failed to approve student:", error);
      throw error;
    }
  }

  /**
   * Reject student clearance
   * @param {Object} rejectionData - Rejection data
   * @param {string} rejectionData.studentId - Student ID
   * @param {string} rejectionData.clearanceId - Clearance ID
   * @param {string} rejectionData.remarks - Rejection reason (required)
   * @returns {Promise<Object>} Rejection result
   */
  async rejectStudent(rejectionData) {
    try {
      if (!rejectionData.remarks || rejectionData.remarks.trim().length < 10) {
        throw new Error("Rejection reason must be at least 10 characters long")
      }
      const { clearanceId, remarks } = rejectionData;
      const data = await apiUtils.patch(`/department/clearance-requests/${clearanceId}/reject`, {
        comment: remarks
      });
      this.updateRecentStudentsCache(rejectionData.studentId, "rejected");
      return data;
    } catch (error) {
      console.error("Failed to reject student:", error)
      throw error
    }
  }

  /**
   * Get recent students processed by this department
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>} Recent students data
   */
  async getRecentStudents(options = {}) {
    try {
      const { limit = 10 } = options

      const data = await apiUtils.get("/department/recent-students", {
        limit,
      })

      // Cache recent students
      data.forEach((student) => {
        this.recentStudentsCache.set(student.id, {
          ...student,
          timestamp: Date.now(),
        })
      })

      return data
    } catch (error) {
      console.error("Failed to fetch recent students:", error)

      // Return cached data if available
      const cachedStudents = Array.from(this.recentStudentsCache.values())
        .filter((student) => Date.now() - student.timestamp < 10 * 60 * 1000) // 10 minutes
        .slice(0, options.limit || 10)

      if (cachedStudents.length > 0) {
        console.warn("Using cached recent students data")
        return cachedStudents
      }

      throw error
    }
  }

  /**
   * Get department statistics
   * @param {Object} options - Query options
   * @param {string} options.period - Time period (today, week, month)
   * @returns {Promise<Object>} Department statistics
   */
  async getDepartmentStats(options = {}) {
    try {
      const { period = "today" } = options

      const data = await apiUtils.get("/department/stats", {
        period,
      })

      return data
    } catch (error) {
      console.error("Failed to fetch department stats:", error)
      throw error
    }
  }

  /**
   * Get student details for review
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Student details with clearance history
   */
  async getStudentDetails(studentId) {
    try {
      const data = await apiUtils.get(`/department/students/${studentId}`)
      return data
    } catch (error) {
      console.error("Failed to fetch student details:", error)
      throw error
    }
  }

  /**
   * Get student documents for review
   * @param {string} studentId - Student ID
   * @returns {Promise<Object[]>} Student documents
   */
  async getStudentDocuments(studentId) {
    try {
      const data = await apiUtils.get(`/department/students/${studentId}/documents`)
      return data
    } catch (error) {
      console.error("Failed to fetch student documents:", error)
      throw error
    }
  }

  /**
   * Download student document
   * @param {string} documentId - Document ID
   * @returns {Promise<Blob>} Document blob
   */
  async downloadDocument(documentId) {
    try {
      const response = await apiUtils.get(`/department/documents/${documentId}/download`, {
        responseType: "blob",
      })

      return response
    } catch (error) {
      console.error("Failed to download document:", error)
      throw error
    }
  }

  /**
   * Verify student document
   * @param {string} documentId - Document ID
   * @param {Object} verificationData - Verification data
   * @param {boolean} verificationData.approved - Approval status
   * @param {string} verificationData.remarks - Verification remarks
   * @returns {Promise<Object>} Verification result
   */
  async verifyDocument(documentId, verificationData) {
    try {
      const data = await apiUtils.post(`/department/documents/${documentId}/verify`, verificationData)
      return data
    } catch (error) {
      console.error("Failed to verify document:", error)
      throw error
    }
  }

  /**
   * Get department requirements
   * @returns {Promise<Object[]>} Department requirements
   */
  async getDepartmentRequirements() {
    try {
      const data = await apiUtils.get("/department/requirements")
      return data
    } catch (error) {
      console.error("Failed to fetch department requirements:", error)
      throw error
    }
  }

  /**
   * Update department requirements
   * @param {Object[]} requirements - Updated requirements
   * @returns {Promise<Object>} Update result
   */
  async updateDepartmentRequirements(requirements) {
    try {
      const data = await apiUtils.put("/department/requirements", { requirements })
      return data
    } catch (error) {
      console.error("Failed to update department requirements:", error)
      throw error
    }
  }

  /**
   * Get clearance analytics for department
   * @param {Object} options - Query options
   * @param {string} options.startDate - Start date
   * @param {string} options.endDate - End date
   * @returns {Promise<Object>} Analytics data
   */
  async getClearanceAnalytics(options = {}) {
    try {
      const data = await apiUtils.get("/department/analytics", options)
      return data
    } catch (error) {
      console.error("Failed to fetch clearance analytics:", error)
      throw error
    }
  }

  /**
   * Export department report
   * @param {Object} options - Export options
   * @param {string} options.format - Export format (pdf, excel)
   * @param {string} options.startDate - Start date
   * @param {string} options.endDate - End date
   * @returns {Promise<Blob>} Report blob
   */
  async exportReport(options = {}) {
    try {
      const response = await apiUtils.get("/department/export-report", {
        ...options,
        responseType: "blob",
      })

      return response
    } catch (error) {
      console.error("Failed to export report:", error)
      throw error
    }
  }

  /**
   * Update recent students cache
   * @param {string} studentId - Student ID
   * @param {string} status - New status
   * @private
   */
  updateRecentStudentsCache(studentId, status) {
    if (this.recentStudentsCache.has(studentId)) {
      const student = this.recentStudentsCache.get(studentId)
      this.recentStudentsCache.set(studentId, {
        ...student,
        status,
        timestamp: Date.now(),
      })
    }
  }

  /**
   * Clear search cache
   */
  clearSearchCache() {
    this.searchCache.clear()
  }

  /**
   * Clear recent students cache
   */
  clearRecentStudentsCache() {
    this.recentStudentsCache.clear()
  }

  /**
   * Format phone number for display
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phone) {
    if (!phone) return ""

    const digits = phone.replace(/\D/g, "")

    if (digits.startsWith("234") && digits.length === 13) {
      return `+${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 9)} ${digits.substring(9)}`
    }

    return phone
  }
}

// Create and export singleton instance
const departmentService = new DepartmentService()
export default departmentService

export async function getStudentById(studentId) {
  const res = await fetch(`/api/department/students/${studentId}`);
  if (!res.ok) throw new Error("Failed to fetch student");
  const json = await res.json();
  return json.data || json;
}

export async function getRecentStudents({ limit = 20 } = {}) {
  const res = await fetch(`/api/department/recent-students?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch students");
  const json = await res.json();
  return json.data || json;
}

export async function searchStudents(query, { departmentId } = {}) {
  const res = await fetch(`/api/department/search-student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, departmentId })
  });
  if (!res.ok) throw new Error("Failed to search students");
  const json = await res.json();
  return json.data || json;
}
