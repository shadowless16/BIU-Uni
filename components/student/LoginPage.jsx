"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../src/contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import LoadingSpinner from "../../src/components/shared/LoadingSpinner"
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react"

/**
 * Student Login Page Component
 * Handles student authentication with email/student ID and password
 * Features: Remember me, forgot password, responsive design, form validation
 */
const LoginPage = () => {
  // Navigation and location hooks
  const navigate = useNavigate()
  const location = useLocation()

  // Authentication and notification contexts
  const { login, loading, isAuthenticated } = useAuth()
  const { showNotification } = useNotification()

  // Form state management
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "student", // Default to student
    rememberMe: false,
  })

  // UI state management
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get redirect path from location state or default to role-based dashboard
  const from = location.state?.from?.pathname || "/student/dashboard"

  /**
   * Redirect authenticated users
   * This effect runs when the component mounts and when authentication state changes
   */
  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log("User already authenticated, redirecting...")
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, loading, navigate, from])

  /**
   * Handle input changes with validation
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    // Clear field-specific errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  /**
   * Validate form data
   * @returns {Object} Validation errors object
   */
  const validateForm = () => {
    const newErrors = {}

    // Email/Student ID validation
    if (!formData.email.trim()) {
      newErrors.email = "Email or Student ID is required"
    } else if (formData.email.includes("@")) {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address"
      }
    } else {
      // Student ID format validation (basic check)
      if (formData.email.length < 3) {
        newErrors.email = "Student ID must be at least 3 characters"
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    return newErrors
  }

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      // Attempt login
      await login(formData)

      // Show success notification
      showNotification({
        type: "success",
        title: "Login Successful",
        message: "Welcome back! Redirecting to your dashboard...",
      })

      // Navigation will be handled by the useEffect above
    } catch (error) {
      console.error("Login error:", error)

      // Show error notification
      showNotification({
        type: "error",
        title: "Login Failed",
        message: error.message || "Invalid credentials. Please try again.",
      })

      // Set form errors if validation errors returned from server
      if (error.errors) {
        const serverErrors = {}
        error.errors.forEach((err) => {
          serverErrors[err.field] = err.message
        })
        setErrors(serverErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Header */}
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
          <User className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">University Clearance System</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Login as
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="student">Student</option>
                <option value="department">Department Officer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* Email/Student ID Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {formData.role === "student" ? "Email or Student ID" : "Email Address"}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.email
                      ? "border-red-300 text-red-900 placeholder-red-300"
                      : "border-gray-300 placeholder-gray-400"
                  }`}
                  placeholder={formData.role === "student" ? "Enter email or student ID" : "Enter your email"}
                />
                {errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.password
                      ? "border-red-300 text-red-900 placeholder-red-300"
                      : "border-gray-300 placeholder-gray-400"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : "Sign in"}
              </button>
            </div>

            {/* Sign Up Link (only for students) */}
            {formData.role === "student" && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign up here
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
