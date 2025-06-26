"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import departmentService from "../services/departmentService"
import LoadingSpinner from "../shared/LoadingSpinner"
import {
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Search,
  FileText,
  Calendar,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  BarChart3,
  UserCheck,
  UserX,
  Eye,
} from "lucide-react"

/**
 * Department Dashboard Component
 * Main dashboard for department officers showing pending students, statistics, and quick actions
 * Features: Real-time stats, recent activity, quick navigation, responsive design
 */
const DepartmentDashboard = () => {
  // Context hooks
  const { user } = useAuth()
  const { showNotification } = useNotification()

  // Component state
  const [dashboardData, setDashboardData] = useState(null)
  const [stats, setStats] = useState(null)
  const [recentStudents, setRecentStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Initialize dashboard data
   */
  useEffect(() => {
    loadDashboardData()

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  /**
   * Load all dashboard data
   */
  const loadDashboardData = async () => {
    try {
      setError(null)

      // Load dashboard data, stats, and recent students in parallel
      const [dashboardResponse, statsResponse, recentResponse] = await Promise.all([
        departmentService.getDashboard(),
        departmentService.getDepartmentStats({ period: "today" }),
        departmentService.getRecentStudents({ limit: 5 }),
      ])

      setDashboardData(dashboardResponse)
      setStats(statsResponse)
      setRecentStudents(recentResponse)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
      setError(error.message)
      showNotification({
        type: "error",
        title: "Dashboard Error",
        message: "Failed to load dashboard data. Please try again.",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  /**
   * Handle manual refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
  }

  /**
   * Format time for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted time
   */
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Dashboard Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Department Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Welcome back, {user?.firstName} {user?.lastName}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Pending Students */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Students</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardData?.pendingCount || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  to="/department/approvals"
                  className="font-medium text-blue-700 hover:text-blue-900 flex items-center"
                >
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Today's Approvals */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Approvals</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.todayApprovals || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-gray-500">{stats?.todayRejections || 0} rejections</span>
              </div>
            </div>
          </div>

          {/* Total Students */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.totalStudents || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-gray-500">This semester</span>
              </div>
            </div>
          </div>

          {/* Processing Rate */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Processing Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.processingRate || 0}%</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-gray-500">Avg. 2.3 days</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    to="/department/lookup"
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <Search className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">Student Lookup</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </Link>

                  <Link
                    to="/department/approvals"
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <UserCheck className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">Approval Interface</span>
                    </div>
                    <div className="flex items-center">
                      {dashboardData?.pendingCount > 0 && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full mr-2">
                          {dashboardData.pendingCount}
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </Link>

                  <Link
                    to="/department/documents"
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">Document Review</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </Link>

                  <Link
                    to="/department/profile"
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-gray-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">Officer Profile</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Department Info */}
            <div className="bg-white shadow rounded-lg mt-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Department Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Department:</span>
                    <span className="text-sm font-medium text-gray-900">{user?.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Officer ID:</span>
                    <span className="text-sm font-medium text-gray-900">{user?.employeeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Last Login:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {user?.lastLogin ? formatTime(user.lastLogin) : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
                  <Link to="/department/approvals" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    View all
                  </Link>
                </div>

                {recentStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                    <p className="mt-1 text-sm text-gray-500">Student approvals and rejections will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {student.status === "approved" ? (
                              <UserCheck className="h-6 w-6 text-green-600" />
                            ) : student.status === "rejected" ? (
                              <UserX className="h-6 w-6 text-red-600" />
                            ) : (
                              <Clock className="h-6 w-6 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {student.matricNumber} • {departmentService.formatPhoneNumber(student.phone)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(student.status)}`}
                          >
                            {student.status}
                          </span>
                          <span className="text-xs text-gray-500">{formatTime(student.updatedAt)}</span>
                          <Link to={`/department/students/${student.id}`} className="text-blue-600 hover:text-blue-500">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Daily Stats Chart Placeholder */}
            <div className="bg-white shadow rounded-lg mt-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Daily Statistics</h3>
                <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Statistics chart will be implemented here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DepartmentDashboard
