"use client"

import type React from "react"

import { useState } from "react"
import { useNotification } from "@/contexts/NotificationContext"
import { useRouter } from "next/navigation"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import Link from "next/link"

export default function RegisterPage() {
  // Toggle for registration type
  const [registerType, setRegisterType] = useState<"student" | "department">("student")

  // Student registration state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    phone: "",
    password: "",
    confirmPassword: "",
    department: "",
    level: "",
  })
  const [profilePicture, setProfilePicture] = useState<File | null>(null)

  // Department registration state
  const [deptForm, setDeptForm] = useState({
    departmentName: "",
    departmentCode: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { showNotification } = useNotification()
  const router = useRouter()

  // Nigerian phone number formatting
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")

    // Format as Nigerian number
    if (digits.length <= 11) {
      return digits.replace(/(\d{4})(\d{3})(\d{4})/, "$1-$2-$3")
    }
    return digits.slice(0, 11).replace(/(\d{4})(\d{3})(\d{4})/, "$1-$2-$3")
  }

  // Student form validation
  const validateForm = () => {
    const errors = []

    if (!formData.firstName.trim()) errors.push("First name is required")
    if (!formData.lastName.trim()) errors.push("Last name is required")
    if (!formData.email.trim()) errors.push("Email is required")
    if (!formData.studentId.trim()) errors.push("Student ID is required")
    if (!formData.phone.trim()) errors.push("Phone number is required")
    if (!formData.password) errors.push("Password is required")
    if (!formData.confirmPassword) errors.push("Please confirm your password")
    if (!formData.department) errors.push("Department is required")
    if (!formData.level) errors.push("Level is required")

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push("Please enter a valid email address")
    }

    // Phone validation (Nigerian format)
    const phoneDigits = formData.phone.replace(/\D/g, "")
    if (formData.phone && (phoneDigits.length !== 11 || !phoneDigits.startsWith("0"))) {
      errors.push("Please enter a valid Nigerian phone number (11 digits starting with 0)")
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      errors.push("Password must be at least 6 characters long")
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match")
    }

    return errors
  }

  // Department form validation
  const validateDeptForm = () => {
    const errors = []
    if (!deptForm.departmentName.trim()) errors.push("Department name is required")
    if (!deptForm.departmentCode.trim()) errors.push("Department code is required")
    if (!deptForm.email.trim()) errors.push("Email is required")
    if (!deptForm.password) errors.push("Password is required")
    if (!deptForm.confirmPassword) errors.push("Please confirm your password")
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (deptForm.email && !emailRegex.test(deptForm.email)) {
      errors.push("Please enter a valid email address")
    }
    if (deptForm.password && deptForm.password.length < 6) {
      errors.push("Password must be at least 6 characters long")
    }
    if (deptForm.password !== deptForm.confirmPassword) {
      errors.push("Passwords do not match")
    }
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors = validateForm()
    if (errors.length > 0) {
      showNotification({
        type: "error",
        title: "Validation Error",
        message: errors[0],
      })
      return
    }
    if (!profilePicture) {
      showNotification({
        type: "error",
        title: "Validation Error",
        message: "Profile picture is required",
      })
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      Object.entries(formData).forEach(([key, value]) => form.append(key, value))
      form.append("profilePicture", profilePicture)
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        body: form,
      })
      const data = await res.json()
      if (!res.ok) {
        showNotification({
          type: "error",
          title: "Registration Failed",
          message: data.message || "Registration failed. Please try again.",
        })
        setLoading(false)
        return
      }
      showNotification({
        type: "success",
        title: "Registration Successful",
        message: "Account created successfully. Please log in.",
      })
      router.push("/login")
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Registration Failed",
        message: error.message || "An error occurred during registration",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateDeptForm()
    if (errors.length > 0) {
      showNotification({
        type: "error",
        title: "Validation Error",
        message: errors[0],
      })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("http://localhost:5000/api/auth/register-department", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deptForm),
      })
      const data = await res.json()
      if (!res.ok) {
        showNotification({
          type: "error",
          title: "Registration Failed",
          message: data.message || "Registration failed. Please try again.",
        })
        setLoading(false)
        return
      }
      showNotification({
        type: "success",
        title: "Registration Successful",
        message: "Department account created successfully. Please log in.",
      })
      router.push("/login")
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Registration Failed",
        message: error.message || "An error occurred during registration",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === "phone") {
      setFormData((prev) => ({
        ...prev,
        [name]: formatPhoneNumber(value),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleDeptInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDeptForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0])
    }
  }

  const departments = [
    "Computer Science",
    "Engineering",
    "Medicine",
    "Law",
    "Business Administration",
    "Arts",
    "Science",
    "Education",
    "Agriculture",
    "Social Sciences",
  ]

  const levels = ["100", "200", "300", "400", "500", "600"]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Toggle Tabs */}
        <div className="flex justify-center mb-6">
          <button
            type="button"
            className={`px-4 py-2 rounded-l-md border border-blue-600 font-medium focus:outline-none ${
              registerType === "student" ? "bg-blue-600 text-white" : "bg-white text-blue-600"
            }`}
            onClick={() => setRegisterType("student")}
          >
            Register as Student
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-r-md border border-blue-600 font-medium focus:outline-none ${
              registerType === "department" ? "bg-blue-600 text-white" : "bg-white text-blue-600"
            }`}
            onClick={() => setRegisterType("department")}
          >
            Register as Department
          </button>
        </div>
        {/* Student Registration Form */}
        {registerType === "student" && (
          <>
            <div>
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your student account</h2>
              <p className="mt-2 text-center text-sm text-gray-600">Join the University Clearance System</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your.email@university.edu"
                  />
                </div>

                {/* Student ID */}
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                    Student ID
                  </label>
                  <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 2020/1/12345"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0801-234-5678"
                  />
                </div>

                {/* Department and Level */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <select
                      id="department"
                      name="department"
                      required
                      value={formData.department}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                      Level
                    </label>
                    <select
                      id="level"
                      name="level"
                      required
                      value={formData.level}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Level</option>
                      {levels.map((level) => (
                        <option key={level} value={level}>
                          {level} Level
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter password (min. 6 characters)"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPassword ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l-1.415-1.414M14.12 14.12l1.415 1.415M14.12 14.12L15.536 15.536M14.12 14.12l1.414 1.414"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm your password"
                  />
                </div>

                {/* Profile Picture */}
                <div>
                  <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">
                    Profile Picture
                  </label>
                  <input
                    id="profilePicture"
                    name="profilePicture"
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <LoadingSpinner size="sm" /> : "Create Account"}
                </button>
              </div>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </>
        )}
        {/* Department Registration Form */}
        {registerType === "department" && (
          <form className="space-y-6" onSubmit={handleDeptSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="departmentName" className="block text-sm font-medium text-gray-700">
                  Department Name
                </label>
                <input
                  id="departmentName"
                  name="departmentName"
                  type="text"
                  required
                  value={deptForm.departmentName}
                  onChange={handleDeptInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Department name"
                />
              </div>
              <div>
                <label htmlFor="departmentCode" className="block text-sm font-medium text-gray-700">
                  Department Code
                </label>
                <input
                  id="departmentCode"
                  name="departmentCode"
                  type="text"
                  required
                  value={deptForm.departmentCode}
                  onChange={handleDeptInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., CSC"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Department Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={deptForm.email}
                  onChange={handleDeptInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="department@university.edu"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={deptForm.password}
                  onChange={handleDeptInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password (min. 6 characters)"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={deptForm.confirmPassword}
                  onChange={handleDeptInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your password"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <LoadingSpinner size="sm" /> : "Create Department Account"}
              </button>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
