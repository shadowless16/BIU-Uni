"use client"

import { useState, useEffect } from "react"
// import { useLocation } from "react-router-dom"
// import studentService from "../../src/services/studentService"
import { useAuth } from "@/contexts/AuthContext"
import { useNotification } from "@/contexts/NotificationContext"
import Header from "../../src/components/shared/Header"
import LoadingSpinner from "../../src/components/shared/LoadingSpinner"
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Calendar,
  MessageSquare,
  RefreshCw,
  FileText,
  User,
  Building,
  X,
} from "lucide-react"

/**
 * Status Tracking Component
 * Detailed view of clearance status for each department with timeline
 * Features: Department status cards, timeline view, document links, officer remarks
 */
const StatusTracking = () => {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [clearanceData, setClearanceData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [error, setError] = useState(null)

  // Fetch real clearance data from backend
  useEffect(() => {
    loadClearanceStatus();
    // Auto-refresh every 2 minutes
    const interval = setInterval(loadClearanceStatus, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadClearanceStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");
      const dashboard = await require("@/services/apiService").apiService.getStudentDashboard(token);
      // Use the latest clearance object from dashboard (if available)
      if (dashboard && dashboard.clearances && dashboard.clearances.length > 0) {
        setClearanceData(dashboard.clearances[0]);
      } else {
        setClearanceData(null);
      }
    } catch (err) {
      setError(err);
      setClearanceData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Set up auto-refresh every 2 minutes
   */
  useEffect(() => {
    const interval = setInterval(
      () => {
        refreshStatus()
      },
      2 * 60 * 1000,
    ) // 2 minutes

    return () => clearInterval(interval)
  }, [])

  /**
   * Refresh status (for manual refresh)
   */
  const refreshStatus = async () => {
    setRefreshing(true);
    await loadClearanceStatus();
  }

  /**
   * Get status icon and color
   * @param {string} status - Status value
   * @returns {Object} Icon component and color classes
   */
  const getStatusDisplay = (status) => {
    switch (status) {
      case "approved":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
          borderColor: "border-green-200",
        }
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          borderColor: "border-yellow-200",
        }
      case "rejected":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          borderColor: "border-red-200",
        }
      default:
        return {
          icon: AlertCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          borderColor: "border-gray-200",
        }
    }
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  /**
   * Get progress percentage
   * @returns {number} Progress percentage
   */
  const getProgressPercentage = () => {
    if (!clearanceData?.departments) return 0

    const totalDepts = clearanceData.departments.length
    const approvedDepts = clearanceData.departments.filter((d) => d.status === "approved").length

    return Math.round((approvedDepts / totalDepts) * 100)
  }

  /**
   * Get overall status
   * @returns {Object} Overall status info
   */
  const getOverallStatus = () => {
    if (!clearanceData?.departments) return { status: "pending", message: "Loading..." }

    const departments = clearanceData.departments
    const totalDepts = departments.length
    const approvedDepts = departments.filter((d) => d.status === "approved").length
    const rejectedDepts = departments.filter((d) => d.status === "rejected").length

    if (approvedDepts === totalDepts) {
      return { status: "completed", message: "Clearance completed successfully!" }
    } else if (rejectedDepts > 0) {
      return { status: "rejected", message: `${rejectedDepts} department(s) rejected your application` }
    } else {
      return { status: "in_progress", message: `${approvedDepts} of ${totalDepts} departments approved` }
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading clearance status..." />
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !clearanceData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load status</h3>
            <p className="text-gray-600 mb-4">{error.message || "Something went wrong. Please try again."}</p>
            <button
              onClick={loadClearanceStatus}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-150"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const overallStatus = getOverallStatus()
  const progressPercentage = getProgressPercentage()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clearance Status</h1>
              <p className="mt-1 text-sm text-gray-600">Track your clearance progress across all departments</p>
            </div>
            <button
              onClick={refreshStatus}
              disabled={refreshing}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Overall Progress</h2>
                <span className="text-2xl font-bold text-blue-600">{progressPercentage}%</span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Status Message */}
              <div
                className={`p-3 rounded-lg ${
                  overallStatus.status === "completed"
                    ? "bg-green-50 text-green-800"
                    : overallStatus.status === "rejected"
                      ? "bg-red-50 text-red-800"
                      : "bg-blue-50 text-blue-800"
                }`}
              >
                <p className="text-sm font-medium">{overallStatus.message}</p>
              </div>

              {/* Application Info */}
              {clearanceData?.applicationNumber && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Application #:</span>
                    <span className="ml-2 font-medium">{clearanceData.applicationNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Submitted:</span>
                    <span className="ml-2 font-medium">{formatDate(clearanceData.submittedAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 font-medium capitalize">{clearanceData.clearanceType}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Department Status Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Department Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clearanceData?.departments?.map((department) => {
              const statusDisplay = getStatusDisplay(department.status)
              const StatusIcon = statusDisplay.icon

              return (
                <div
                  key={department.id}
                  className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedDepartment?.id === department.id ? "border-blue-500 shadow-md" : statusDisplay.borderColor
                  }`}
                  onClick={() => setSelectedDepartment(department)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{department.departmentName}</h3>
                    <div className={`p-1 rounded-full ${statusDisplay.bgColor}`}>
                      <StatusIcon className={`h-4 w-4 ${statusDisplay.color}`} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        statusDisplay.color
                      } ${statusDisplay.bgColor}`}
                    >
                      {department.status.charAt(0).toUpperCase() + department.status.slice(1)}
                    </div>

                    {department.approvedAt && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(department.approvedAt)}
                      </div>
                    )}

                    {department.approvedBy && (
                      <div className="flex items-center text-xs text-gray-500">
                        <User className="h-3 w-3 mr-1" />
                        Processed by officer
                      </div>
                    )}

                    {department.remarks && (
                      <div className="flex items-center text-xs text-gray-500">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Has remarks
                      </div>
                    )}
                  </div>

                  {/* Requirements Progress */}
                  {department.requirements && department.requirements.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">Requirements:</div>
                      <div className="space-y-1">
                        {department.requirements.slice(0, 2).map((req, index) => (
                          <div key={index} className="flex items-center text-xs">
                            <div
                              className={`w-2 h-2 rounded-full mr-2 ${req.completed ? "bg-green-500" : "bg-gray-300"}`}
                            />
                            <span className={req.completed ? "text-green-600" : "text-gray-500"}>{req.name}</span>
                          </div>
                        ))}
                        {department.requirements.length > 2 && (
                          <div className="text-xs text-gray-400">+{department.requirements.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Department Details */}
        {selectedDepartment && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{selectedDepartment.departmentName} - Details</h3>
                <button onClick={() => setSelectedDepartment(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Status Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Current Status:</span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusDisplay(selectedDepartment.status).color
                        } ${getStatusDisplay(selectedDepartment.status).bgColor}`}
                      >
                        {selectedDepartment.status.charAt(0).toUpperCase() + selectedDepartment.status.slice(1)}
                      </span>
                    </div>

                    {selectedDepartment.submittedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Submitted:</span>
                        <span className="text-sm text-gray-900">{formatDate(selectedDepartment.submittedAt)}</span>
                      </div>
                    )}

                    {selectedDepartment.approvedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Processed:</span>
                        <span className="text-sm text-gray-900">{formatDate(selectedDepartment.approvedAt)}</span>
                      </div>
                    )}

                    {selectedDepartment.approvedBy && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Processed By:</span>
                        <span className="text-sm text-gray-900">Department Officer</span>
                      </div>
                    )}
                  </div>

                  {/* Officer Remarks */}
                  {selectedDepartment.remarks && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Officer Remarks:</h5>
                      <div
                        className={`p-3 rounded-lg text-sm ${
                          selectedDepartment.status === "approved"
                            ? "bg-green-50 text-green-800"
                            : selectedDepartment.status === "rejected"
                              ? "bg-red-50 text-red-800"
                              : "bg-blue-50 text-blue-800"
                        }`}
                      >
                        {selectedDepartment.remarks}
                      </div>
                    </div>
                  )}
                </div>

                {/* Requirements */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Requirements</h4>
                  {selectedDepartment.requirements && selectedDepartment.requirements.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDepartment.requirements.map((req, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div
                            className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                              req.completed ? "bg-green-500" : "bg-gray-300"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${req.completed ? "text-green-900" : "text-gray-900"}`}>
                              {req.name}
                            </p>
                            {req.notes && <p className="text-xs text-gray-500 mt-1">{req.notes}</p>}
                            {req.completedAt && (
                              <p className="text-xs text-gray-400 mt-1">Completed: {formatDate(req.completedAt)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No specific requirements listed</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        {clearanceData?.timeline && clearanceData.timeline.length > 0 && (
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Timeline</h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {clearanceData.timeline.map((event, eventIdx) => (
                      <li key={event.id || eventIdx}>
                        <div className="relative pb-8">
                          {eventIdx !== clearanceData.timeline.length - 1 && (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                <Building className="h-4 w-4 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{event.action}</p>
                                <p className="text-sm text-gray-500">{event.description}</p>
                                {event.metadata && (
                                  <div className="mt-1 text-xs text-gray-400">
                                    {JSON.stringify(event.metadata, null, 2)}
                                  </div>
                                )}
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {formatDate(event.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents */}
        {clearanceData?.documents && clearanceData.documents.length > 0 && (
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Submitted Documents ({clearanceData.documents.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clearanceData.documents.map((document) => (
                    <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{document.originalName}</p>
                          <p className="text-xs text-gray-500">
                            {document.size && `${Math.round(document.size / 1024)} KB`}
                          </p>
                          <p className="text-xs text-gray-400">Uploaded: {formatDate(document.uploadedAt)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => window.open(document.url, "_blank")}
                          className="flex-1 bg-blue-50 text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-blue-100"
                        >
                          <Eye className="h-3 w-3 inline mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement("a")
                            link.href = document.url
                            link.download = document.originalName
                            link.click()
                          }}
                          className="flex-1 bg-gray-50 text-gray-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100"
                        >
                          <Download className="h-3 w-3 inline mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default StatusTracking
