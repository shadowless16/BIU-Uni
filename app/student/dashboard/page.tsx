"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { apiService } from "@/services/apiService";
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ProtectedRoute from "@/components/shared/ProtectedRoute"
import ClearanceApplication from "@/components/student/ClearanceApplication.jsx";
import StatusTracking from "@/components/student/StatusTracking.jsx";
import { useRouter } from "next/navigation";

interface DashboardData {
  clearanceStatus: {
    totalDepartments: number
    approvedDepartments: number
    pendingDepartments: number
    rejectedDepartments: number
    completionPercentage: number
  }
  recentActivity: Array<{
    id: string
    department: string
    status: "approved" | "pending" | "rejected"
    date: string
    remarks?: string
  }>
  notifications: Array<{
    id: string
    title: string
    message: string
    date: string
    read: boolean
  }>
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Get token from localStorage or sessionStorage
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        setDashboardData(null);
        setErrorType("unauthorized");
        setLoading(false);
        router.replace("/login");
        return;
      }
      const data = await apiService.getStudentDashboard(token);
      console.log('DASHBOARD API RESPONSE:', data); // Debug log
      setDashboardData(data);
      setErrorType(null);
      setLoading(false);
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error)
      if (error?.response?.status === 401 || error?.message === "Not authenticated") {
        setErrorType("unauthorized");
        setLoading(false);
        router.replace("/login");
        return;
      } else {
        setErrorType("generic");
      }
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500"
    if (percentage >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="Loading dashboard..." />
        </div>
      </ProtectedRoute>
    )
  }

  // Section rendering logic
  let content;
  if (activeSection === "apply") {
    content = <ClearanceApplication />;
  } else if (activeSection === "status") {
    content = <StatusTracking />;
  } else if (activeSection === "profile") {
    content = <div className="p-8 text-center text-gray-500">Profile management coming soon.</div>;
  } else {
    content = (
      <>
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
              <p className="mt-1 text-sm text-gray-600">Track your clearance progress and manage your applications</p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        {dashboardData ? (
          dashboardData.clearanceStatus ? (
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Clearance Progress</h2>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Overall Progress</span>
                      <span>{dashboardData.clearanceStatus.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(dashboardData.clearanceStatus.completionPercentage)}`}
                        style={{ width: `${dashboardData.clearanceStatus.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {dashboardData.clearanceStatus.totalDepartments}
                      </div>
                      <div className="text-sm text-blue-600">Total Departments</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData.clearanceStatus.approvedDepartments}
                      </div>
                      <div className="text-sm text-green-600">Approved</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {dashboardData.clearanceStatus.pendingDepartments}
                      </div>
                      <div className="text-sm text-yellow-600">Pending</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {dashboardData.clearanceStatus.rejectedDepartments}
                      </div>
                      <div className="text-sm text-red-600">Rejected</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  No clearance progress available yet.
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                {errorType === "unauthorized"
                  ? "You are not authorized. Please log in again."
                  : "Unable to load clearance progress. Please try refreshing the page or contact support if the problem persists."}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 sm:px-0">
          {/* Recent Activity */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {Array.isArray(dashboardData?.recentActivity) && dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                          ></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.department}</p>
                          <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Notifications</h3>
              <div className="space-y-3">
                {Array.isArray(dashboardData?.notifications) && dashboardData.notifications.length > 0 ? (
                  dashboardData.notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        notification.read ? "bg-gray-50 border-gray-300" : "bg-blue-50 border-blue-500"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${notification.read ? "text-gray-700" : "text-gray-900"}`}>
                            {notification.title}
                          </p>
                          <p className={`text-xs mt-1 ${notification.read ? "text-gray-500" : "text-gray-600"}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.date && !isNaN(new Date(notification.date).getTime())
                              ? new Date(notification.date).toLocaleDateString()
                              : "Date unavailable"}
                          </p>
                        </div>
                        {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
                )}
              </div>
              {dashboardData?.notifications && dashboardData.notifications.length > 5 && (
                <div className="mt-4 text-center">
                  <a href="/student/notifications" className="text-sm text-blue-600 hover:text-blue-500">
                    View all notifications
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Quick Actions */}
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveSection("apply")}
                    className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors w-full"
                  >
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Apply for Clearance</p>
                      <p className="text-xs text-blue-600">Start new application</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveSection("status")}
                    className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors w-full"
                  >
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Track Status</p>
                      <p className="text-xs text-green-600">View detailed progress</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveSection("profile")}
                    className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors w-full"
                  >
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-900">Update Profile</p>
                      <p className="text-xs text-purple-600">Manage your information</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Main Content Section */}
          <div className="mt-6">{content}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
