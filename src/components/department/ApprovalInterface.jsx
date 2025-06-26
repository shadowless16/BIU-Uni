"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import departmentService from "../../services/departmentService"
import LoadingSpinner from "../shared/LoadingSpinner"
import {
  User,
  Phone,
  Hash,
  Calendar,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Download,
  AlertTriangle,
} from "lucide-react"

/**
 * Approval Interface Component
 * Detailed view for reviewing and approving/rejecting student clearance applications
 * Features: Student details, document review, approval/rejection with remarks, mobile-responsive
 */
const ApprovalInterface = () => {
  // Router hooks
  const { studentId } = useParams()
  const navigate = useNavigate()

  // Context hooks
  const { user } = useAuth()
  const { showNotification } = useNotification()

  // Component state
  const [student, setStudent] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [remarks, setRemarks] = useState("")
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  /**
   * Initialize component
   */
  useEffect(() => {
    if (studentId) {
      loadStudentData()
    }
  }, [studentId])

  /**
   * Load student data and documents
   */
  const loadStudentData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load student details and documents in parallel
      const [studentData, documentsData] = await Promise.all([
        departmentService.getStudentDetails(studentId),
        departmentService.getStudentDocuments(studentId),
      ])

      setStudent(studentData)
      setDocuments(documentsData)
    } catch (error) {
      console.error("Failed to load student data:", error)
      setError(error.message)
      showNotification({
        type: "error",
        title: "Load Error",
        message: "Failed to load student data. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle student approval
   */
  const handleApprove = async () => {
    try {
      setProcessing(true)

      await departmentService.approveStudent({
        studentId: student.id,
        clearanceId: student.clearanceId,
        remarks: remarks.trim(),
      })

      showNotification({
        type: "success",
        title: "Student Approved",
        message: `${student.firstName} ${student.lastName} has been approved successfully.`,
      })

      // Navigate back to approvals list
      navigate("/department/approvals")
    } catch (error) {
      console.error("Failed to approve student:", error)
      showNotification({
        type: "error",
        title: "Approval Error",
        message: error.message || "Failed to approve student. Please try again.",
      })
    } finally {
      setProcessing(false)
    }
  }

  /**
   * Handle student rejection
   */
  const handleReject = async () => {
    try {
      if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
        showNotification({
          type: "error",
          title: "Validation Error",
          message: "Rejection reason must be at least 10 characters long.",
        })
        return
      }

      setProcessing(true)

      await departmentService.rejectStudent({
        studentId: student.id,
        clearanceId: student.clearanceId,
        remarks: rejectionReason.trim(),
      })

      showNotification({
        type: "success",
        title: "Student Rejected",
        message: `${student.firstName} ${student.lastName} has been rejected.`,
      })

      // Navigate back to approvals list
      navigate("/department/approvals")
    } catch (error) {
      console.error("Failed to reject student:", error)
      showNotification({
        type: "error",
        title: "Rejection Error",
        message: error.message || "Failed to reject student. Please try again.",
      })
    } finally {
      setProcessing(false)
      setShowRejectModal(false)
    }
  }

  /**
   * Handle document download
   * @param {string} documentId - Document ID
   * @param {string} filename - Document filename
   */
  const handleDocumentDownload = async (documentId, filename) => {
    try {
      const blob = await departmentService.downloadDocument(documentId)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showNotification({
        type: "success",
        title: "Download Started",
        message: `${filename} download started.`,
      })
    } catch (error) {
      console.error("Failed to download document:", error)
      showNotification({
        type: "error",
        title: "Download Error",
        message: "Failed to download document. Please try again.",
      })
    }
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  /**
   * Get status badge styling
   * @param {string} status - Status value
   * @returns {string} CSS classes
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Student</h3>
          <p className="mt-1 text-sm text-gray-500">{error || "Student not found"}</p>
          <button
            onClick={() => navigate("/department/approvals")}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Approvals
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate("/department/approvals")}
                  className="mr-4 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Approvals
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Student Review</h1>
                  <p className="mt-1 text-sm text-gray-500">Review and approve/reject clearance application</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(student.clearanceStatus)}`}
                >
                  {student.clearanceStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Student Information</h3>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {student.firstName} {student.lastName}
                    </h4>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Hash className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Matric Number</p>
                        <p className="text-sm text-gray-500">{student.matricNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone Number</p>
                        <p className="text-sm text-gray-500">{departmentService.formatPhoneNumber(student.phone)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Level</p>
                        <p className="text-sm text-gray-500">{student.level}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Department</p>
                        <p className="text-sm text-gray-500">{student.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Application Date</p>
                        <p className="text-sm text-gray-500">{formatDate(student.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Updated</p>
                        <p className="text-sm text-gray-500">{formatDate(student.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Uploaded Documents</h3>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No documents uploaded</h3>
                    <p className="mt-1 text-sm text-gray-500">The student hasn't uploaded any documents yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((document) => (
                      <div
                        key={document.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{document.name}</p>
                            <p className="text-sm text-gray-500">
                              {document.size} • Uploaded {formatDate(document.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDocumentDownload(document.id, document.name)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Download className="mr-1 h-4 w-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Clearance History */}
            {student.clearanceHistory && student.clearanceHistory.length > 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Clearance History</h3>
                  <div className="space-y-4">
                    {student.clearanceHistory.map((entry, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {entry.status === "approved" ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : entry.status === "rejected" ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {entry.department} - {entry.status}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(entry.date)}</p>
                          {entry.remarks && <p className="text-sm text-gray-600 mt-1">{entry.remarks}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg sticky top-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Review Actions</h3>

                {student.clearanceStatus === "pending" ? (
                  <div className="space-y-4">
                    {/* Remarks */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (Optional)</label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={4}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add any remarks or comments..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={handleApprove}
                        disabled={processing}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve Student
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={processing}
                        className="w-full flex items-center justify-center px-4 py-3 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Student
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center mb-4">
                      {student.clearanceStatus === "approved" ? (
                        <CheckCircle className="h-12 w-12 text-green-600" />
                      ) : (
                        <XCircle className="h-12 w-12 text-red-600" />
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 capitalize">{student.clearanceStatus}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This student has already been {student.clearanceStatus}.
                    </p>
                  </div>
                )}

                {/* Department Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Department</h4>
                  <p className="text-sm text-gray-500">{user?.department}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Officer: {user?.firstName} {user?.lastName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reject Student</h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Please provide a reason for rejecting this student's clearance application.
                </p>
              </div>
              <div className="mt-4">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter rejection reason..."
                />
              </div>
              <div className="mt-6">
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApprovalInterface
