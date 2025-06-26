"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import LoadingSpinner from "../../src/components/shared/LoadingSpinner"
import {
  Search,
  User,
  Phone,
  Hash,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  AlertCircle,
  History,
  Filter,
} from "lucide-react"
import departmentService from "../../src/services/departmentService"

// Utility to deduplicate students by id
function dedupeStudents(students) {
  const seen = new Set()
  return students.filter((student) => {
    if (!student.id) return true
    if (seen.has(student.id)) return false
    seen.add(student.id)
    return true
  })
}

export default function StudentLookup() {
  // Use user instead of currentUser for Next.js AuthContext
  const { user } = useAuth()
  const { addNotification } = useNotification()

  const [searchTerm, setSearchTerm] = useState("")
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Fetch recent students on mount
  const fetchRecentStudents = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await departmentService.getRecentStudents({ limit: 20 })
      const unique = dedupeStudents(data)
      setStudents(unique)
      setFilteredStudents(unique)
    } catch (err) {
      setError("Failed to fetch students")
      addNotification("Failed to fetch students", "error")
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  // Search students when searchTerm changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredStudents(students)
      return
    }
    setLoading(true)
    departmentService
      .searchStudents(searchTerm, { departmentId: user?.departmentId })
      .then((results) => {
        setFilteredStudents(dedupeStudents(results))
      })
      .catch(() => {
        setError("Failed to search students")
        addNotification("Failed to search students", "error")
      })
      .finally(() => setLoading(false))
  }, [searchTerm, user?.departmentId, students])

  useEffect(() => {
    fetchRecentStudents()
  }, [fetchRecentStudents])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  // Remove the full-page spinner. Always render the input and show a small spinner inside the input box when loading.

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Student Lookup</h1>
      <div className="mb-6 relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search by name..."
          className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm pr-10"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <LoadingSpinner small />
          </span>
        )}
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="grid gap-6">
        {filteredStudents.map((student, idx) => (
          <div key={student.id ? `${student.id}-${student.matricNumber || idx}` : idx} className="bg-white rounded-xl shadow-md flex items-center p-6 hover:shadow-lg transition-shadow">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div className="ml-6 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-lg text-gray-900">{(student.firstName || "") + (student.lastName ? ` ${student.lastName}` : "") || student.matricNumber || "No Name"}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${student.status === "approved" ? "bg-green-100 text-green-700" : student.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{student.status}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-gray-500 text-sm mb-1">
                <span className="flex items-center"><Phone className="h-4 w-4 mr-1" />{student.phone}</span>
                <span className="flex items-center"><Hash className="h-4 w-4 mr-1" />{student.matricNumber || student.studentId || "-"}</span>
                <span className="flex items-center"><Clock className="h-4 w-4 mr-1" />{student.updatedAt ? new Date(student.updatedAt).toLocaleDateString() : "-"}</span>
              </div>
            </div>
            <div>
              <Link href={`/department/students/${student.id}`} className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 transition-colors">View Details</Link>
            </div>
          </div>
        ))}
        {filteredStudents.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-12">
            <p>No students found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
