// This file is deprecated. Use '@/contexts/AuthContext' (TypeScript) everywhere in your app.

"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import authService from "../services/authService"
import notificationService from "../services/notificationService"

/**
 * Authentication Context
 * Manages global authentication state and user information
 */
const AuthContext = createContext(undefined)

/**
 * Authentication Provider Component
 * Provides authentication state and methods to child components
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  /**
   * Initialize authentication state on app load
   */
  useEffect(() => {
    initializeAuth()
  }, [])

  /**
   * Set up auth failure listener
   */
  useEffect(() => {
    const handleAuthFailure = () => {
      console.log("Auth failure detected, logging out user")
      handleLogout()
    }

    window.addEventListener("auth:logout", handleAuthFailure)

    return () => {
      window.removeEventListener("auth:logout", handleAuthFailure)
    }
  }, [])

  /**
   * Initialize authentication state
   */
  const initializeAuth = async () => {
    try {
      setLoading(true)

      // Check if user is already authenticated
      if (authService.isAuthenticated()) {
        // Verify token with server
        const userData = await authService.verifyToken()
        setUser(userData)
        setIsAuthenticated(true)

        // Initialize real-time notifications
        notificationService.initializeRealTime(userData.id)

        console.log("✅ User authenticated:", userData.email)
      } else {
        console.log("❌ No valid authentication found")
      }
    } catch (error) {
      console.error("Authentication verification failed:", error)

      // Clear invalid tokens
      await authService.logout()
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Login user with credentials
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} Login result
   */
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true)

      const data = await authService.login(credentials)

      setUser(data.user)
      setIsAuthenticated(true)

      // Initialize real-time notifications
      notificationService.initializeRealTime(data.user.id)

      console.log("✅ Login successful:", data.user.email)

      return data
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Register new user
   * @param {Object} userData - Registration data
   * @returns {Promise<Object>} Registration result
   */
  const register = useCallback(async (userData) => {
    try {
      setLoading(true)

      const data = await authService.register(userData)

      console.log("✅ Registration successful:", data.email)

      return data
    } catch (error) {
      console.error("Registration failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true)

      await authService.logout()

      // Disconnect from real-time notifications
      notificationService.disconnect()
      notificationService.clearCache()

      setUser(null)
      setIsAuthenticated(false)

      console.log("✅ Logout successful")
    } catch (error) {
      console.error("Logout error:", error)

      // Force local logout even if API call fails
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Handle logout (for external triggers)
   */
  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  /**
   * Update user profile
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>} Update result
   */
  const updateProfile = useCallback(
    async (profileData) => {
      try {
        // This would typically call a profile update service
        // For now, we'll update the local user state
        const updatedUser = { ...user, ...profileData }
        setUser(updatedUser)

        // Update stored user data
        localStorage.setItem("user", JSON.stringify(updatedUser))

        return updatedUser
      } catch (error) {
        console.error("Profile update failed:", error)
        throw error
      }
    },
    [user],
  )

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @returns {Promise<Object>} Change result
   */
  const changePassword = useCallback(
    async (passwordData) => {
      try {
        const result = await authService.changePassword(passwordData)

        // Logout user after password change for security
        await logout()

        return result
      } catch (error) {
        console.error("Password change failed:", error)
        throw error
      }
    },
    [logout],
  )

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset request result
   */
  const forgotPassword = useCallback(async (email) => {
    try {
      const result = await authService.forgotPassword(email)
      return result
    } catch (error) {
      console.error("Password reset request failed:", error)
      throw error
    }
  }, [])

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean} Role check result
   */
  const hasRole = useCallback(
    (role) => {
      return user?.role === role
    },
    [user],
  )

  /**
   * Check if user has any of the specified roles
   * @param {string[]} roles - Roles to check
   * @returns {boolean} Role check result
   */
  const hasAnyRole = useCallback(
    (roles) => {
      return roles.includes(user?.role)
    },
    [user],
  )

  /**
   * Check if user profile is complete
   * @returns {boolean} Profile completion status
   */
  const isProfileComplete = useCallback(() => {
    return user?.profileComplete === true
  }, [user])

  /**
   * Get user display name
   * @returns {string} User display name
   */
  const getUserDisplayName = useCallback(() => {
    if (!user) return ""

    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }

    return user.email || user.name || "User"
  }, [user])

  /**
   * Refresh authentication token
   * @returns {Promise<void>}
   */
  const refreshAuth = useCallback(async () => {
    try {
      await authService.refreshToken()
      console.log("✅ Token refreshed successfully")
    } catch (error) {
      console.error("Token refresh failed:", error)
      await logout()
      throw error
    }
  }, [logout])

  // Context value
  const value = {
    // State
    user,
    loading,
    isAuthenticated,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    refreshAuth,

    // Utilities
    hasRole,
    hasAnyRole,
    isProfileComplete,
    getUserDisplayName,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use authentication context
 * @returns {Object} Authentication context value
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}

/**
 * Higher-order component for authentication
 * @param {React.Component} Component - Component to wrap
 * @returns {React.Component} Wrapped component
 */
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const auth = useAuth()

    return <Component {...props} auth={auth} />
  }
}

export default AuthContext
