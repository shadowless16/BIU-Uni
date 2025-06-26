import { apiUtils } from "./api"

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
class AuthService {
  /**
   * Login user with credentials
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @param {string} credentials.role - User role (student, department, admin)
   * @param {boolean} credentials.rememberMe - Remember user login
   * @returns {Promise<Object>} User data and tokens
   */
  async login(credentials) {
    try {
      const data = await apiUtils.post("/auth/login", credentials)

      // Store tokens based on rememberMe preference
      const storage = credentials.rememberMe ? localStorage : sessionStorage
      storage.setItem("token", data.token)

      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken)
      }

      // Store user data
      localStorage.setItem("user", JSON.stringify(data.user))

      return data
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  /**
   * Register new student
   * @param {Object} userData - Registration data
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    try {
      // Normalize phone number before sending
      const normalizedData = {
        ...userData,
        phone: this.normalizePhoneNumber(userData.phone),
      }

      const data = await apiUtils.post("/auth/register", normalizedData)
      return data
    } catch (error) {
      console.error("Registration failed:", error)
      throw error
    }
  }

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      const refreshToken = localStorage.getItem("refreshToken")

      if (refreshToken) {
        await apiUtils.post("/auth/logout", { refreshToken })
      }
    } catch (error) {
      console.error("Logout API call failed:", error)
      // Continue with local logout even if API call fails
    } finally {
      // Clear all stored data
      localStorage.removeItem("token")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("user")
      sessionStorage.removeItem("token")

      // Clear any cached data
      this.clearCache()
    }
  }

  /**
   * Verify current token and get user data
   * @returns {Promise<Object>} User data
   */
  async verifyToken() {
    try {
      const data = await apiUtils.get("/auth/verify")

      // Update stored user data
      localStorage.setItem("user", JSON.stringify(data.user))

      return data.user
    } catch (error) {
      console.error("Token verification failed:", error)
      throw error
    }
  }

  /**
   * Refresh access token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem("refreshToken")

      if (!refreshToken) {
        throw new Error("No refresh token available")
      }

      const data = await apiUtils.post("/auth/refresh-token", { refreshToken })

      // Update stored tokens
      localStorage.setItem("token", data.token)
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken)
      }

      return data
    } catch (error) {
      console.error("Token refresh failed:", error)
      // Clear tokens on refresh failure
      this.logout()
      throw error
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset request result
   */
  async forgotPassword(email) {
    try {
      const data = await apiUtils.post("/auth/forgot-password", { email })
      return data
    } catch (error) {
      console.error("Password reset request failed:", error)
      throw error
    }
  }

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @param {string} passwordData.confirmPassword - Confirm new password
   * @returns {Promise<Object>} Password change result
   */
  async changePassword(passwordData) {
    try {
      const data = await apiUtils.post("/auth/change-password", passwordData)

      // Force logout after password change for security
      await this.logout()

      return data
    } catch (error) {
      console.error("Password change failed:", error)
      throw error
    }
  }

  /**
   * Get current user from storage
   * @returns {Object|null} Current user data
   */
  getCurrentUser() {
    try {
      const userData = localStorage.getItem("user")
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error("Error parsing user data:", error)
      return null
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token")
    const user = this.getCurrentUser()
    return !!(token && user)
  }

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean} Role check result
   */
  hasRole(role) {
    const user = this.getCurrentUser()
    return user?.role === role
  }

  /**
   * Check if user has any of the specified roles
   * @param {string[]} roles - Roles to check
   * @returns {boolean} Role check result
   */
  hasAnyRole(roles) {
    const user = this.getCurrentUser()
    return roles.includes(user?.role)
  }

  /**
   * Normalize Nigerian phone number
   * @param {string} phone - Phone number to normalize
   * @returns {string} Normalized phone number
   */
  normalizePhoneNumber(phone) {
    if (!phone) return ""

    // Remove all non-digits
    const digits = phone.replace(/\D/g, "")

    // Handle different formats
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
   * Format phone number for display
   * @param {string} phone - Phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phone) {
    if (!phone) return ""

    const normalized = this.normalizePhoneNumber(phone)

    if (normalized.startsWith("234") && normalized.length === 13) {
      // Format as +234 XXX XXX XXXX
      return `+${normalized.substring(0, 3)} ${normalized.substring(3, 6)} ${normalized.substring(6, 9)} ${normalized.substring(9)}`
    }

    return phone
  }

  /**
   * Clear cached data
   * @private
   */
  clearCache() {
    // Clear any cached API responses
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.includes("api-cache")) {
            caches.delete(name)
          }
        })
      })
    }
  }
}

// Create and export singleton instance
const authService = new AuthService()
export default authService

// Export individual methods for convenience
export const {
  login,
  register,
  logout,
  verifyToken,
  refreshToken,
  forgotPassword,
  changePassword,
  getCurrentUser,
  isAuthenticated,
  hasRole,
  hasAnyRole,
  normalizePhoneNumber,
  formatPhoneNumber,
} = authService
