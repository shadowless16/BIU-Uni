"use client"

import { useState, useEffect } from "react"
import { Settings, Shield, Mail, Lock, Save, RefreshCw, Eye, EyeOff } from "lucide-react"
import { adminService } from "../../services/adminService"
import LoadingSpinner from "../shared/LoadingSpinner"

const SystemSettings = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [showPasswords, setShowPasswords] = useState({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const data = await adminService.getSystemSettings()
      setSettings(data)
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (section, data) => {
    try {
      setSaving(true)
      await adminService.updateSystemSettings(section, data)
      await fetchSettings()
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-blue-100 text-blue-700 border border-blue-200"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  )

  const GeneralSettings = () => {
    const [formData, setFormData] = useState({
      systemName: settings?.general?.systemName || "",
      systemDescription: settings?.general?.systemDescription || "",
      maintenanceMode: settings?.general?.maintenanceMode || false,
      allowRegistration: settings?.general?.allowRegistration || true,
      maxFileSize: settings?.general?.maxFileSize || 5,
      sessionTimeout: settings?.general?.sessionTimeout || 30,
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      saveSettings("general", formData)
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System Name</label>
            <input
              type="text"
              value={formData.systemName}
              onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max File Size (MB)</label>
            <input
              type="number"
              value={formData.maxFileSize}
              onChange={(e) => setFormData({ ...formData, maxFileSize: Number.parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">System Description</label>
          <textarea
            value={formData.systemDescription}
            onChange={(e) => setFormData({ ...formData, systemDescription: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
          <input
            type="number"
            value={formData.sessionTimeout}
            onChange={(e) => setFormData({ ...formData, sessionTimeout: Number.parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="maintenanceMode"
              checked={formData.maintenanceMode}
              onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="maintenanceMode" className="ml-2 text-sm text-gray-700">
              Enable Maintenance Mode
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowRegistration"
              checked={formData.allowRegistration}
              onChange={(e) => setFormData({ ...formData, allowRegistration: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="allowRegistration" className="ml-2 text-sm text-gray-700">
              Allow New User Registration
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    )
  }

  const UserPermissions = () => {
    const [permissions, setPermissions] = useState(settings?.permissions || {})

    const handlePermissionChange = (role, permission, value) => {
      setPermissions((prev) => ({
        ...prev,
        [role]: {
          ...prev[role],
          [permission]: value,
        },
      }))
    }

    const handleSubmit = (e) => {
      e.preventDefault()
      saveSettings("permissions", permissions)
    }

    const roles = ["student", "officer", "admin"]
    const permissionsList = [
      { key: "canView", label: "View Records" },
      { key: "canEdit", label: "Edit Records" },
      { key: "canDelete", label: "Delete Records" },
      { key: "canApprove", label: "Approve Clearances" },
      { key: "canReject", label: "Reject Clearances" },
      { key: "canExport", label: "Export Data" },
      { key: "canManageUsers", label: "Manage Users" },
      { key: "canViewReports", label: "View Reports" },
    ]

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permission
                </th>
                {roles.map((role) => (
                  <th
                    key={role}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissionsList.map((permission) => (
                <tr key={permission.key}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permission.label}</td>
                  {roles.map((role) => (
                    <td key={role} className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={permissions[role]?.[permission.key] || false}
                        onChange={(e) => handlePermissionChange(role, permission.key, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Permissions"}
        </button>
      </form>
    )
  }

  const EmailSettings = () => {
    const [formData, setFormData] = useState({
      smtpHost: settings?.email?.smtpHost || "",
      smtpPort: settings?.email?.smtpPort || 587,
      smtpUser: settings?.email?.smtpUser || "",
      smtpPassword: settings?.email?.smtpPassword || "",
      fromEmail: settings?.email?.fromEmail || "",
      fromName: settings?.email?.fromName || "",
      enableNotifications: settings?.email?.enableNotifications || true,
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      saveSettings("email", formData)
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
            <input
              type="text"
              value={formData.smtpHost}
              onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
            <input
              type="number"
              value={formData.smtpPort}
              onChange={(e) => setFormData({ ...formData, smtpPort: Number.parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
            <input
              type="text"
              value={formData.smtpUser}
              onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
            <div className="relative">
              <input
                type={showPasswords.smtp ? "text" : "password"}
                value={formData.smtpPassword}
                onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("smtp")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.smtp ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
            <input
              type="email"
              value={formData.fromEmail}
              onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
            <input
              type="text"
              value={formData.fromName}
              onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableNotifications"
            checked={formData.enableNotifications}
            onChange={(e) => setFormData({ ...formData, enableNotifications: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="enableNotifications" className="ml-2 text-sm text-gray-700">
            Enable Email Notifications
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Email Settings"}
        </button>
      </form>
    )
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600 mt-1">Configure system preferences and user permissions</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={fetchSettings}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <nav className="space-y-2">
              <TabButton
                id="general"
                label="General"
                icon={Settings}
                active={activeTab === "general"}
                onClick={setActiveTab}
              />
              <TabButton
                id="permissions"
                label="User Permissions"
                icon={Shield}
                active={activeTab === "permissions"}
                onClick={setActiveTab}
              />
              <TabButton
                id="email"
                label="Email Settings"
                icon={Mail}
                active={activeTab === "email"}
                onClick={setActiveTab}
              />
              <TabButton
                id="security"
                label="Security"
                icon={Lock}
                active={activeTab === "security"}
                onClick={setActiveTab}
              />
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              {activeTab === "general" && <GeneralSettings />}
              {activeTab === "permissions" && <UserPermissions />}
              {activeTab === "email" && <EmailSettings />}
              {activeTab === "security" && (
                <div className="text-center py-12">
                  <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Security Settings</h3>
                  <p className="text-gray-600">Security configuration panel coming soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemSettings
