"use client"

import { useState, useEffect } from "react"
import { Building2, Plus, Edit, Trash2, UserPlus, CheckCircle } from "lucide-react"
import { adminService } from "../../services/adminService"
import LoadingSpinner from "../shared/LoadingSpinner"

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([])
  const [officers, setOfficers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddDeptModal, setShowAddDeptModal] = useState(false)
  const [showEditDeptModal, setShowEditDeptModal] = useState(false)
  const [showAssignOfficerModal, setShowAssignOfficerModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [selectedDepartment, setSelectedDepartment] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [deptResponse, officerResponse] = await Promise.all([
        adminService.getDepartments(),
        adminService.getOfficers(),
      ])
      setDepartments(deptResponse.departments)
      setOfficers(officerResponse.officers)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDepartment = async (deptId) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await adminService.deleteDepartment(deptId)
        fetchData()
      } catch (error) {
        console.error("Delete error:", error)
      }
    }
  }

  const DepartmentForm = ({ department, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: department?.name || "",
      code: department?.code || "",
      description: department?.description || "",
      requirements: department?.requirements || [""],
      isActive: department?.isActive ?? true,
    })
    const [saving, setSaving] = useState(false)

    const handleAddRequirement = () => {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, ""],
      })
    }

    const handleRemoveRequirement = (index) => {
      setFormData({
        ...formData,
        requirements: formData.requirements.filter((_, i) => i !== index),
      })
    }

    const handleRequirementChange = (index, value) => {
      const newRequirements = [...formData.requirements]
      newRequirements[index] = value
      setFormData({
        ...formData,
        requirements: newRequirements,
      })
    }

    const handleSubmit = async (e) => {
      e.preventDefault()
      setSaving(true)
      try {
        const cleanedData = {
          ...formData,
          requirements: formData.requirements.filter((req) => req.trim() !== ""),
        }

        if (department) {
          await adminService.updateDepartment(department._id, cleanedData)
        } else {
          await adminService.createDepartment(cleanedData)
        }
        onSave()
        onClose()
      } catch (error) {
        console.error("Save error:", error)
      } finally {
        setSaving(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">{department ? "Edit Department" : "Add New Department"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Clearance Requirements</label>
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={requirement}
                      onChange={(e) => handleRequirementChange(index, e.target.value)}
                      placeholder="Enter requirement"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddRequirement}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Requirement
                </button>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Department is active
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const AssignOfficerModal = ({ department, onClose, onSave }) => {
    const [selectedOfficer, setSelectedOfficer] = useState("")
    const [permissions, setPermissions] = useState({
      canApprove: true,
      canReject: true,
      canViewAll: false,
      canManageRequirements: false,
    })
    const [assigning, setAssigning] = useState(false)

    const handleSubmit = async (e) => {
      e.preventDefault()
      if (!selectedOfficer) return

      setAssigning(true)
      try {
        await adminService.assignOfficer(department._id, {
          officerId: selectedOfficer,
          permissions,
        })
        onSave()
        onClose()
      } catch (error) {
        console.error("Assign error:", error)
      } finally {
        setAssigning(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Assign Officer to {department?.name}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Officer</label>
                <select
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose an officer</option>
                  {officers
                    .filter((officer) => !department?.officers?.some((deptOfficer) => deptOfficer._id === officer._id))
                    .map((officer) => (
                      <option key={officer._id} value={officer._id}>
                        {officer.firstName} {officer.lastName} - {officer.email}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2">
                  {Object.entries(permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={key}
                        checked={value}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            [key]: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={key} className="ml-2 text-sm text-gray-700">
                        {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {assigning ? "Assigning..." : "Assign Officer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
              <p className="text-gray-600 mt-1">Manage departments, officers, and requirements</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowAddDeptModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Department
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((department) => (
            <div key={department._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                      <p className="text-sm text-gray-500">{department.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingDepartment(department)
                        setShowEditDeptModal(true)
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(department._id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">{department.description}</p>

                {/* Department Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{department.stats?.totalStudents || 0}</div>
                    <div className="text-xs text-gray-500">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{department.stats?.approved || 0}</div>
                    <div className="text-xs text-gray-500">Approved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{department.stats?.pending || 0}</div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </div>
                </div>

                {/* Officers */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Officers</h4>
                    <button
                      onClick={() => {
                        setSelectedDepartment(department)
                        setShowAssignOfficerModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Assign
                    </button>
                  </div>
                  <div className="space-y-1">
                    {department.officers?.slice(0, 3).map((officer, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {officer.firstName} {officer.lastName}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            officer.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {officer.status}
                        </span>
                      </div>
                    ))}
                    {department.officers?.length > 3 && (
                      <div className="text-xs text-gray-500">+{department.officers.length - 3} more</div>
                    )}
                  </div>
                </div>

                {/* Requirements */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Requirements</h4>
                  <div className="space-y-1">
                    {department.requirements?.slice(0, 3).map((req, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                        {req}
                      </div>
                    ))}
                    {department.requirements?.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{department.requirements.length - 3} more requirements
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      department.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {department.isActive ? "Active" : "Inactive"}
                  </span>
                  <div className="text-xs text-gray-500">{department.officers?.length || 0} officer(s)</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {departments.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first department.</p>
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Department
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddDeptModal && <DepartmentForm onClose={() => setShowAddDeptModal(false)} onSave={fetchData} />}

      {showEditDeptModal && editingDepartment && (
        <DepartmentForm
          department={editingDepartment}
          onClose={() => {
            setShowEditDeptModal(false)
            setEditingDepartment(null)
          }}
          onSave={fetchData}
        />
      )}

      {showAssignOfficerModal && selectedDepartment && (
        <AssignOfficerModal
          department={selectedDepartment}
          onClose={() => {
            setShowAssignOfficerModal(false)
            setSelectedDepartment(null)
          }}
          onSave={fetchData}
        />
      )}
    </div>
  )
}

export default DepartmentManagement
