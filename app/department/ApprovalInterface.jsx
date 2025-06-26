"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, User, FileText, Clock } from "lucide-react"
import LoadingSpinner from "../../src/components/shared/LoadingSpinner"
import departmentService from "../../src/services/departmentService"
import { useAuth } from "../../contexts/AuthContext"

const ApprovalInterface = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loadingId, setLoadingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch clearance requests for the logged-in department
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await departmentService.getPendingStudents()
        console.log('Fetched pending students:', data)
        // Try to extract array from common response shapes
        let requestsArr = Array.isArray(data)
          ? data
          : Array.isArray(data?.students)
          ? data.students
          : Array.isArray(data?.data)
          ? data.data
          : []
        // Flatten clearance requests by departments
        let flattened = []
        for (const req of requestsArr) {
          if (Array.isArray(req.departments)) {
            for (const dept of req.departments) {
              flattened.push({
                ...req,
                ...dept,
                clearanceId: req._id || req.id,
                studentName: req.studentName || req.name || req.fullName,
                matricNo: req.matricNo || req.matricNumber,
                requestDate: req.submittedAt || req.createdAt,
                documentUrl: req.documentUrl, // adjust if needed
                id: dept._id?.toString() || `${req._id}-${dept.departmentId}`,
                status: dept.status,
                departmentName: dept.departmentName || dept.department,
                departmentId: dept.departmentId,
                departmentSubdocId: dept._id?.toString(), // <-- add this line
                studentId: req.studentId,
              })
            }
          }
        }
        // Debug: log departmentId values for troubleshooting
        console.log('user:', user);
        console.log('user.departmentId:', user?.departmentId);
        console.log('user.department:', user?.department);
        // New debug logs to inspect backend data structure
        console.log('requestsArr:', requestsArr);
        if (requestsArr.length > 0) {
          for (let i = 0; i < Math.min(3, requestsArr.length); i++) {
            console.log(`requestsArr[${i}]:`, requestsArr[i]);
            console.log(`requestsArr[${i}].departments:`, requestsArr[i]?.departments);
          }
        }
        console.log('flattened:', flattened.map(f => ({
          departmentId: f.departmentId,
          departmentName: f.departmentName,
          studentName: f.studentName,
          status: f.status
        })));

        // Helper to get string id from various formats
        const getIdString = (id) =>
          typeof id === "string"
            ? id.trim().toLowerCase()
            : id?.$oid
            ? id.$oid.trim().toLowerCase()
            : id?.toString
            ? id.toString().trim().toLowerCase()
            : "";
        // Robust filter: match by departmentId, departmentName, or user.name (case-insensitive, allow substring match for names)
        const userDeptIds = [user?.departmentId, user?.department].filter(Boolean).map(getIdString);
        const userDeptName = user?.name ? getIdString(user.name) : null;
        const filtered = flattened.filter((req) => {
          const reqDeptIds = [req.departmentId].map(getIdString);
          const reqDeptName = req.departmentName ? getIdString(req.departmentName) : null;
          // Strict ID match
          if (userDeptIds.length > 0 && reqDeptIds.some(id => userDeptIds.includes(id))) return true;
          // Substring match for department names
          if (userDeptName && reqDeptName && (userDeptName.includes(reqDeptName) || reqDeptName.includes(userDeptName))) return true;
          return false;
        });
        setRequests(filtered)
      } catch (err) {
        setError("Failed to load clearance requests.")
      } finally {
        setLoading(false)
      }
    }
    if (user?.role === "department") fetchRequests()
  }, [user])

  const handleAction = async (req, action) => {
    console.log("DEBUG handleAction:", {
      clearanceId: req.clearanceId,
      departmentId: req.departmentId,
      approvedBy: user?._id,
      req
    });
    setLoadingId(req.id)
    try {
      if (action === "approve") {
        await departmentService.approveStudent({
          studentId: req.studentId,
          clearanceId: req.clearanceId,
          departmentId: req.departmentId, // reference to Department collection
          departmentSubdocId: req.departmentSubdocId, // subdocument _id in clearance.departments
          approvedBy: user?._id, // pass user id if available
          remarks: "Approved by department head.",
        })
      } else {
        await departmentService.rejectStudent({
          studentId: req.studentId,
          clearanceId: req.clearanceId,
          departmentId: req.departmentId, // for consistency, if needed
          approvedBy: user?._id,
          remarks: "Rejected by department head.",
        })
      }
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r
        )
      )
    } catch (err) {
      setError("Failed to update request status.")
    } finally {
      setLoadingId(null)
    }
  }

  if (loading) return <LoadingSpinner fullScreen message="Loading clearance requests..." />
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Student Clearance Requests</h1>
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matric No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-900">{req.studentName}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{req.matricNo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{req.departmentName || req.department}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                  {new Date(req.requestDate).toLocaleDateString()} <Clock className="inline w-4 h-4 ml-1 text-gray-400" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a
                    href={req.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:underline"
                  >
                    <FileText className="w-4 h-4 mr-1" />View
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {req.status === "pending" && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                  {req.status === "approved" && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                      <CheckCircle className="w-4 h-4 mr-1" /> Approved
                    </span>
                  )}
                  {req.status === "rejected" && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                      <XCircle className="w-4 h-4 mr-1" /> Rejected
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {req.status === "pending" ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleAction(req, "approve")}
                        disabled={loadingId === req.id}
                        className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 text-xs font-medium disabled:opacity-60"
                      >
                        {loadingId === req.id ? <LoadingSpinner size={16} /> : <CheckCircle className="w-4 h-4 mr-1" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(req, "reject")}
                        disabled={loadingId === req.id}
                        className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 text-xs font-medium disabled:opacity-60"
                      >
                        {loadingId === req.id ? <LoadingSpinner size={16} /> : <XCircle className="w-4 h-4 mr-1" />}
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">No actions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && (
          <div className="p-8 text-center text-gray-500">No clearance requests for your department.</div>
        )}
      </div>
    </div>
  )
}

export default ApprovalInterface
