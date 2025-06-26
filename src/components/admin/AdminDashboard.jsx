"use client"

import { useState, useEffect } from "react"
import {
  Users,
  Building2,
  FileText,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  AlertTriangle,
  Activity,
} from "lucide-react"
import { adminService } from "../../services/adminService"
import LoadingSpinner from "../shared/LoadingSpinner"

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState("7d")

  useEffect(() => {
    fetchDashboardData()
  }, [selectedPeriod])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const data = await adminService.getDashboardAnalytics(selectedPeriod)
      setDashboardData(data)
      setError(null)
    } catch (err) {
      setError("Failed to load dashboard data")
      console.error("Dashboard error:", err)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, trend, color = "blue" }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? "text-green-600" : "text-red-600"} flex items-center mt-1`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {Math.abs(trend)}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  )

  const QuickActionCard = ({ title, description, icon: Icon, onClick, color = "blue" }) => (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border hover:border-blue-300"
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  )

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">System overview and management</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Activity className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={dashboardData?.stats?.totalStudents || 0}
            icon={Users}
            trend={dashboardData?.trends?.students}
            color="blue"
          />
          <StatCard
            title="Active Clearances"
            value={dashboardData?.stats?.activeClearances || 0}
            icon={Clock}
            trend={dashboardData?.trends?.clearances}
            color="yellow"
          />
          <StatCard
            title="Completed Today"
            value={dashboardData?.stats?.completedToday || 0}
            icon={CheckCircle}
            trend={dashboardData?.trends?.completed}
            color="green"
          />
          <StatCard
            title="Departments"
            value={dashboardData?.stats?.totalDepartments || 0}
            icon={Building2}
            color="purple"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Completion Rate Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Completion Rates</h3>
              <BarChart3 className="w-5 h-5 text-gray-500" />
            </div>
            <div className="space-y-4">
              {dashboardData?.completionRates?.map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${dept.rate}%` }}></div>
                    </div>
                    <span className="text-sm text-gray-600">{dept.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Department Performance</h3>
              <PieChart className="w-5 h-5 text-gray-500" />
            </div>
            <div className="space-y-3">
              {dashboardData?.departmentPerformance?.map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{dept.name}</p>
                    <p className="text-sm text-gray-600">{dept.pending} pending</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">{dept.avgTime}</p>
                    <p className="text-xs text-gray-500">avg time</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard
              title="Student Management"
              description="Add, edit, and manage student records"
              icon={Users}
              onClick={() => (window.location.href = "/admin/students")}
              color="blue"
            />
            <QuickActionCard
              title="Department Management"
              description="Manage departments and assign officers"
              icon={Building2}
              onClick={() => (window.location.href = "/admin/departments")}
              color="green"
            />
            <QuickActionCard
              title="Reports & Analytics"
              description="Generate reports and export data"
              icon={FileText}
              onClick={() => (window.location.href = "/admin/reports")}
              color="purple"
            />
            <QuickActionCard
              title="System Settings"
              description="Configure system and user permissions"
              icon={Settings}
              onClick={() => (window.location.href = "/admin/settings")}
              color="orange"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent System Activity</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboardData?.recentActivity?.map((activity, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-full ${
                      activity.type === "approval"
                        ? "bg-green-100"
                        : activity.type === "rejection"
                          ? "bg-red-100"
                          : "bg-blue-100"
                    }`}
                  >
                    {activity.type === "approval" && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {activity.type === "rejection" && <XCircle className="w-4 h-4 text-red-600" />}
                    {activity.type === "registration" && <Users className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
