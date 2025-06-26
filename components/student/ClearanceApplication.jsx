"use client"

import { useState, useEffect } from "react"
// import { useNavigate } from "react-router-dom"
// import studentService from "../../src/services/studentService"
// import uploadService from "../../src/services/uploadService"
import { useAuth } from "@/contexts/AuthContext"
import { useNotification } from "@/contexts/NotificationContext"
import Header from "../../src/components/shared/Header"
import LoadingSpinner from "../../src/components/shared/LoadingSpinner"
import { FileText, Upload, Check, Eye, Plus, Trash2 } from "lucide-react"

/**
 * Clearance Application Component
 * Allows students to apply for clearance by selecting departments and uploading documents
 * Features: Department selection, file upload with progress, form validation, preview
 */
const ClearanceApplication = () => {
  // Navigation and context hooks
  // const navigate = useNavigate()
  const { user } = useAuth()
  const { showNotification } = useNotification()

  // Form state
  const [selectedDepartments, setSelectedDepartments] = useState([])
  const [clearanceType, setClearanceType] = useState("graduation")
  const [uploadedFiles, setUploadedFiles] = useState([])

  // UI state
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [errors, setErrors] = useState({})

  // MOCK: Provide mock departments
  const mockDepartments = [
    { id: "lib", name: "Library", isRequired: true, requirements: [] },
    { id: "bursary", name: "Bursary", isRequired: false, requirements: [] },
    { id: "hostel", name: "Hostel", isRequired: false, requirements: [] },
  ];

  /**
   * Load departments and existing applications on component mount
   */
  useEffect(() => {
    // MOCK: Set departments directly
    setDepartments(mockDepartments);
    setSelectedDepartments(mockDepartments.filter(d => d.isRequired).map(d => d.id));
    setLoading(false);
  }, []);

  /**
   * Handle department selection/deselection
   * @param {string} departmentId - Department ID to toggle
   */
  const handleDepartmentToggle = (departmentId) => {
    const department = departments.find((d) => d.id === departmentId)

    // Don't allow deselecting required departments
    if (department?.isRequired && selectedDepartments.includes(departmentId)) {
      showNotification({
        type: "warning",
        title: "Required Department",
        message: `${department.name} is required and cannot be deselected`,
      })
      return
    }

    setSelectedDepartments((prev) =>
      prev.includes(departmentId) ? prev.filter((id) => id !== departmentId) : [...prev, departmentId],
    )

    // Clear department-related errors
    if (errors.departments) {
      setErrors((prev) => ({ ...prev, departments: "" }))
    }
  }

  /**
   * Handle file selection for upload
   * @param {Event} event - File input change event
   */
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files)

    if (files.length === 0) return

    setUploading(true)

    try {
      // Upload files one by one with progress tracking
      for (const file of files) {
        await uploadSingleFile(file)
      }

      showNotification({
        type: "success",
        title: "Upload Complete",
        message: `${files.length} file(s) uploaded successfully`,
      })
    } catch (error) {
      console.error("❌ File upload failed:", error)
      showNotification({
        type: "error",
        title: "Upload Failed",
        message: error.message || "Failed to upload files",
      })
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ""
    }
  }

  /**
   * Upload a single file with progress tracking
   * @param {File} file - File to upload
   */
  const uploadSingleFile = async (file) => {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // Set initial progress
      setUploadProgress((prev) => ({
        ...prev,
        [uploadId]: { name: file.name, progress: 0, status: "uploading" },
      }))

      // MOCK: Simulate file upload
      setTimeout(() => {
        // Add to uploaded files list
        setUploadedFiles((prev) => [
          ...prev,
          {
            id: uploadId,
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file), // MOCK: Create object URL for preview
            uploadId,
          },
        ])

        // Update progress to completed
        setUploadProgress((prev) => ({
          ...prev,
          [uploadId]: {
            ...prev[uploadId],
            progress: 100,
            status: "completed",
          },
        }))

        // Remove progress after delay
        setTimeout(() => {
          setUploadProgress((prev) => {
            const newProgress = { ...prev }
            delete newProgress[uploadId]
            return newProgress
          })
        }, 3000)
      }, 1000)
    } catch (error) {
      // Update progress to failed
      setUploadProgress((prev) => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          status: "failed",
          error: error.message,
        },
      }))

      throw error
    }
  }

  /**
   * Remove uploaded file
   * @param {string} fileId - File ID to remove
   */
  const handleRemoveFile = (fileId) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))

    showNotification({
      type: "info",
      title: "File Removed",
      message: "File removed from application",
    })
  }

  /**
   * Validate form before submission
   * @returns {Object} Validation errors
   */
  const validateForm = () => {
    const newErrors = {}

    // Check if at least one department is selected
    if (selectedDepartments.length === 0) {
      newErrors.departments = "Please select at least one department"
    }

    // Check clearance type
    if (!clearanceType) {
      newErrors.clearanceType = "Please select clearance type"
    }

    return newErrors
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Validate form
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      showNotification({
        type: "error",
        title: "Validation Error",
        message: "Please fix the errors before submitting",
      })
      return
    }

    setSubmitting(true)

    try {
      // MOCK: Simulate successful submission
      setTimeout(() => {
        showNotification({
          type: "success",
          title: "Application Submitted",
          message: "Your clearance application has been submitted successfully",
        })

        // MOCK: Navigate to status page
        // navigate("/student/status", {
        //   state: { applicationId: result.applicationId },
        // })
      }, 1000)
    } catch (error) {
      console.error("❌ Application submission failed:", error)
      showNotification({
        type: "error",
        title: "Submission Failed",
        message: error.message || "Failed to submit application",
      })
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading application form..." />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Apply for Clearance</h1>
          <p className="mt-1 text-sm text-gray-600">
            Select the departments you need clearance from and upload required documents
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Clearance Type Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Clearance Type *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "graduation", label: "Graduation", description: "Final clearance for graduation" },
                  { value: "transfer", label: "Transfer", description: "Transfer to another institution" },
                  { value: "withdrawal", label: "Withdrawal", description: "Withdrawal from university" },
                  { value: "semester", label: "Semester", description: "End of semester clearance" },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      clearanceType === type.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="clearanceType"
                      value={type.value}
                      checked={clearanceType === type.value}
                      onChange={(e) => setClearanceType(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">{type.label}</span>
                      <span className="block text-xs text-gray-500 mt-1">{type.description}</span>
                    </div>
                    {clearanceType === type.value && <Check className="h-5 w-5 text-blue-600 absolute top-4 right-4" />}
                  </label>
                ))}
              </div>
              {errors.clearanceType && <p className="mt-2 text-sm text-red-600">{errors.clearanceType}</p>}
            </div>

            {/* Department Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Select Departments *</h2>
              <div className="space-y-4">
                {departments.map((department) => (
                  <div key={department.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5 mt-1">
                        <input
                          id={`dept-${department.id}`}
                          type="checkbox"
                          checked={selectedDepartments.includes(department.id)}
                          onChange={() => handleDepartmentToggle(department.id)}
                          disabled={department.isRequired}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <label
                          htmlFor={`dept-${department.id}`}
                          className="text-sm font-medium text-gray-900 flex items-center cursor-pointer"
                        >
                          {department.name}
                          {department.isRequired && (
                            <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              Required
                            </span>
                          )}
                        </label>

                        {department.description && (
                          <p className="text-sm text-gray-600 mt-1">{department.description}</p>
                        )}

                        {department.requirements && department.requirements.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 mb-2 font-medium">Requirements:</p>
                            <ul className="text-xs text-gray-500 space-y-1">
                              {department.requirements.map((req, index) => (
                                <li key={index} className="flex items-center">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2 flex-shrink-0" />
                                  {req.name}
                                  {req.documentRequired && (
                                    <span className="ml-1 text-blue-600">(Document required)</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.departments && <p className="mt-2 text-sm text-red-600">{errors.departments}</p>}
            </div>

            {/* Document Upload */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Documents</h2>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">Upload supporting documents</span>
                    <span className="mt-1 block text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG up to 10MB each</span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="sr-only"
                    disabled={uploading}
                  />
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    disabled={uploading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : "Choose Files"}
                  </button>
                </div>
              </div>

              {/* Upload Progress */}
              {Object.keys(uploadProgress).length > 0 && (
                <div className="mt-4 space-y-2">
                  {Object.entries(uploadProgress).map(([uploadId, progress]) => (
                    <div key={uploadId} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{progress.name}</span>
                        <span className="text-sm text-gray-500">{progress.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progress.status === "failed"
                              ? "bg-red-500"
                              : progress.status === "completed"
                                ? "bg-green-500"
                                : "bg-blue-500"
                          }`}
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                      {progress.status === "failed" && <p className="text-xs text-red-600 mt-1">{progress.error}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Uploaded Files ({uploadedFiles.length})</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <FileText className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(file.url, "_blank")}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Preview file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveFile(file.id)}
                            className="p-1 text-red-400 hover:text-red-600"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || uploading || selectedDepartments.length === 0}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Submitting...</span>
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ClearanceApplication
