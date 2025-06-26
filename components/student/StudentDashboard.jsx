"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../src/contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import studentService from "../../src/services/studentService"
import Header from "../../src/components/shared/Header"
import LoadingSpinner from "../../src/components/shared/LoadingSpinner"
import {
  BarChart3,
  FileText,
  Eye,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Bell,
  ArrowRight,
} from "lucide-react"

/**
 * Student Dashboard Component
 * Main dashboard for students showing clearance progress, recent activity, and quick actions
 * Features: Progress visualization, statistics, recent activity, notifications, quick navigation
 */
const StudentDashboard = () => {
  // Authentication context
  const { user } = useAuth()
  const { showNotification } = useNotification()

  // Component state
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Fetch dashboard data on component mount
   */
  useEffect(() => {
    fetchDashboardData()
  }, [])

  /**
   * Set up automatic refresh every 5 minutes
   */
  useEffect(() => {
    const interval = setInterval(
      () => {
        refreshDashboardData()
      },
      5 * 60 * 1000,
    ) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  /**
   * Fetch dashboard data from API
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await studentService.getDashboard()
      setDashboardData(data)

      console.log("✅ Dashboard data loaded:", data)
    } catch (error) {
      console.error("❌ Failed to fetch dashboard data:", error)
      setError(error)

      // Show error notification
      showNotification({
        type: "error",
        title: "Failed to load dashboard",
        message: error.message || "Please try refreshing the page",
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Refresh dashboard data (for manual refresh)
   */
  const refreshDashboardData = async () => {
    try {
      setRefreshing(true)
      const data = await studentService.getDashboard()
      setDashboardData(data)
    } catch (error) {
      console.error("❌ Failed to refresh dashboard:", error)
    } finally {
      setRefreshing(false)
    }
  }

  /**
   * Get status color for progress indicators
   * @param {string} status - Status value
   * @returns {string} CSS color class
   */
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-100"
      case "pending":
        return "text-yellow-600 bg-yellow-100"
      case "rejected":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  /**
   * Get progress bar color based on completion percentage
   * @param {number} percentage - Completion percentage
   * @returns {string} CSS color class
   */
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "bg-green-500"
    if (percentage >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Map backend dashboard data to UI structure
  useEffect(() => {
    if (!dashboardData) return

    // Map clearance progress
    if (dashboardData.clearances && dashboardData.clearances.length > 0) {
      const latestClearance = dashboardData.clearances[0]
      const departments = latestClearance.departments || []
      const totalDepartments = departments.length
      const approvedDepartments = departments.filter(d => d.status === "approved").length
      const pendingDepartments = departments.filter(d => d.status === "pending").length
      const rejectedDepartments = departments.filter(d => d.status === "rejected").length
      const completionPercentage = totalDepartments > 0 ? Math.round((approvedDepartments / totalDepartments) * 100) : 0

      dashboardData.clearanceStatus = {
        totalDepartments,
        approvedDepartments,
        pendingDepartments,
        rejectedDepartments,
        completionPercentage,
      }

      // Map recent activity from department approvals
      dashboardData.recentActivity = departments.map(dep => ({
        department: dep.departmentName,
        status: dep.status,
        date: dep.approvedAt || dep.updatedAt || dep.createdAt,
        remarks: dep.remarks,
      })).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
    } else {
      dashboardData.clearanceStatus = {
        totalDepartments: 0,
        approvedDepartments: 0,
        pendingDepartments: 0,
        rejectedDepartments: 0,
        completionPercentage: 0,
      }
      dashboardData.recentActivity = []
    }

    // Map notifications
    if (dashboardData.notifications) {
      dashboardData.notifications = dashboardData.notifications.map(n => ({
        ...n,
        date: n.createdAt,
        read: n.read || false,
      }))
    }
  }, [dashboardData])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading your dashboard..." />
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
            <p className="text-gray-600 mb-4">{error.message || "Something went wrong. Please try again."}</p>
            <button
              onClick={fetchDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-150"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.firstName || user?.name}! 👋
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Track your clearance progress and manage your applications
                  </p>
                </div>
                <button
                  onClick={refreshDashboardData}
                  disabled={refreshing}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Refresh dashboard"
                >
                  <svg
                    className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>

              {/* Offline indicator */}
              {dashboardData?.isOffline && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">
                      You're viewing cached data. Some information may be outdated.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        {dashboardData?.clearanceStatus && (
          <div className="mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Clearance Progress
                  </h2>
                  <span className="text-2xl font-bold text-blue-600">
                    {dashboardData.clearanceStatus.completionPercentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Overall Progress</span>
                    <span>
                      {dashboardData.clearanceStatus.approvedDepartments} of{" "}
                      {dashboardData.clearanceStatus.totalDepartments} departments
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(
                        dashboardData.clearanceStatus.completionPercentage,
                      )}`}
                      style={{
                        width: `${dashboardData.clearanceStatus.completionPercentage}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardData.clearanceStatus.totalDepartments}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">Total Departments</div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 mr-1" />
                      {dashboardData.clearanceStatus.approvedDepartments}
                    </div>
                    <div className="text-sm text-green-600 font-medium">Approved</div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center">
                      <Clock className="h-6 w-6 mr-1" />
                      {dashboardData.clearanceStatus.pendingDepartments}
                    </div>
                    <div className="text-sm text-yellow-600 font-medium">Pending</div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600 flex items-center justify-center">
                      <XCircle className="h-6 w-6 mr-1" />
                      {dashboardData.clearanceStatus.rejectedDepartments}
                    </div>
                    <div className="text-sm text-red-600 font-medium">Rejected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout for Activity and Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Activity */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Recent Activity
              </h3>

              <div className="space-y-3">
                {dashboardData?.recentActivity?.length > 0 ? (
                  dashboardData.recentActivity.map((activity, index) => (
                    <div
                      key={activity.id || index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-150"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              activity.status === "approved"
                                ? "bg-green-500"
                                : activity.status === "pending"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{activity.department}</p>
                          <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                          {activity.remarks && <p className="text-xs text-gray-600 mt-1">{activity.remarks}</p>}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No recent activity</p>
                    <p className="text-xs text-gray-400">
                      Activities will appear here once you start your clearance process
                    </p>
                  </div>
                )}
              </div>

              {dashboardData?.recentActivity?.length > 0 && (
                <div className="mt-4 text-center">
                  <Link
                    to="/student/status"
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium flex items-center justify-center"
                  >
                    View detailed status
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-blue-600" />
                Recent Notifications
              </h3>

              <div className="space-y-3">
                {dashboardData?.notifications?.length > 0 ? (
                  dashboardData.notifications.slice(0, 5).map((notification, index) => (
                    <div
                      key={notification.id || index}
                      className={`p-3 rounded-lg border-l-4 ${
                        notification.read ? "bg-gray-50 border-gray-300" : "bg-blue-50 border-blue-500"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${notification.read ? "text-gray-700" : "text-gray-900"}`}>
                            {notification.title}
                          </p>
                          <p className={`text-xs mt-1 ${notification.read ? "text-gray-500" : "text-gray-600"}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(notification.date)}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No notifications</p>
                    <p className="text-xs text-gray-400">You'll receive updates about your clearance progress here</p>
                  </div>
                )}
              </div>

              {dashboardData?.notifications && dashboardData.notifications.length > 5 && (
                <div className="mt-4 text-center">
                  <Link
                    to="/student/notifications"
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium flex items-center justify-center"
                  >
                    View all notifications
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Apply for Clearance */}
              <Link
                to="/student/apply"
                className="group flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-150"
              >
                <div className="flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-blue-900 group-hover:text-blue-800">Apply for Clearance</p>
                  <p className="text-xs text-blue-600">Start new application</p>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Track Status */}
              <Link
                to="/student/status"
                className="group flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-150"
              >
                <div className="flex-shrink-0">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-green-900 group-hover:text-green-800">Track Status</p>
                  <p className="text-xs text-green-600">View detailed progress</p>
                </div>
                <ArrowRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Update Profile */}
              <Link
                to="/student/profile"
                className="group flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-150"
              >
                <div className="flex-shrink-0">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-purple-900 group-hover:text-purple-800">Update Profile</p>
                  <p className="text-xs text-purple-600">Manage your information</p>
                </div>
                <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default StudentDashboard
