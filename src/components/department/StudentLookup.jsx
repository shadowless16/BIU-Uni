"use client"

import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import departmentService from "../services/departmentService"
import LoadingSpinner from "../shared/LoadingSpinner"
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

/**
 * Student Lookup Component
 * Search interface for department officers to find students by phone/matric number
 * Features: Real-time search, recent searches cache, advanced filtering, mobile-responsive
 */
const StudentLookup = () => {
  // Context hooks
  const { user } = useAuth()
  const { showNotification } = useNotification()

  // Component state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [recentSearches, setRecentSearches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchType, setSearchType] = useState("all") // all, phone, matric, studentId
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")

  // Debounce timer
  const [debounceTimer, setDebounceTimer] = useState(null)

  /**
   * Initialize component
   */
  useEffect(() => {
    loadRecentSearches()
  }, [])

  /**
   * Load recent searches from localStorage
   */
  const loadRecentSearches = () => {
    try {
      const saved = localStorage.getItem("department_recent_searches")
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Failed to load recent searches:", error)
    }
  }

  /**
   * Save search to recent searches
   * @param {string} query - Search query
   * @param {Object} result - Search result
   */
  const saveRecentSearch = (query, result) => {
    try {
      const newSearch = {
        id: Date.now(),
        query,
        timestamp: new Date().toISOString(),
        resultCount: result.length,
        searchType,
      }

      const updated = [newSearch, ...recentSearches.filter((s) => s.query !== query)].slice(0, 10)
      setRecentSearches(updated)
      localStorage.setItem("department_recent_searches", JSON.stringify(updated))
    } catch (error) {
      console.error("Failed to save recent search:", error)
    }
  }

  /**
   * Debounced search function
   */
  const debouncedSearch = useCallback(
    (query) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      const timer = setTimeout(() => {
        if (query.trim().length >= 2) {
          performSearch(query.trim())
        } else {
          setSearchResults([])
        }
      }, 500)

      setDebounceTimer(timer)
    },
    [debounceTimer],
  )

  /**
   * Handle search input change
   * @param {Event} e - Input change event
   */
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    setError(null)

    if (query.trim().length === 0) {
      setSearchResults([])
      return
    }

    debouncedSearch(query)
  }

  /**
   * Perform student search
   * @param {string} query - Search query
   */
  const performSearch = async (query) => {
    try {
      setLoading(true)
      setError(null)

      const options = {
        searchType: searchType !== "all" ? searchType : undefined,
        statusFilter: statusFilter !== "all" ? statusFilter : undefined,
      }

      const results = await departmentService.searchStudents(query, options)
      setSearchResults(results)

      if (results.length > 0) {
        saveRecentSearch(query, results)
      }

      if (results.length === 0) {
        showNotification({
          type: "info",
          title: "No Results",
          message: "No students found matching your search criteria.",
        })
      }
    } catch (error) {
      console.error("Search failed:", error)
      setError(error.message)
      showNotification({
        type: "error",
        title: "Search Error",
        message: "Failed to search students. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle recent search click
   * @param {Object} recentSearch - Recent search object
   */
  const handleRecentSearchClick = (recentSearch) => {
    setSearchQuery(recentSearch.query)
    setSearchType(recentSearch.searchType || "all")
    performSearch(recentSearch.query)
  }

  /**
   * Clear recent searches
   */
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("department_recent_searches")
    showNotification({
      type: "success",
      title: "Cleared",
      message: "Recent searches cleared successfully.",
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

  /**
   * Get status icon
   * @param {string} status - Status value
   * @returns {JSX.Element} Status icon
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Lookup</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Search for students by phone number, matric number, or student ID
                </p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Search by phone number, matric number, or student ID..."
              />
              {loading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Type</label>
                    <select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Fields</option>
                      <option value="phone">Phone Number</option>
                      <option value="matric">Matric Number</option>
                      <option value="studentId">Student ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Search Tips */}
            <div className="mt-4 text-sm text-gray-500">
              <p>
                <strong>Search Tips:</strong> You can search using phone numbers (e.g., 08012345678), matric numbers
                (e.g., CSC/2020/001), or student IDs. Use at least 2 characters.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Recent Searches Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Searches</h3>
                  {recentSearches.length > 0 && (
                    <button onClick={clearRecentSearches} className="text-sm text-red-600 hover:text-red-500">
                      Clear
                    </button>
                  )}
                </div>

                {recentSearches.length === 0 ? (
                  <div className="text-center py-4">
                    <History className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No recent searches</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentSearches.map((search) => (
                      <button
                        key={search.id}
                        onClick={() => handleRecentSearchClick(search)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 truncate">{search.query}</span>
                          <span className="text-xs text-gray-500">{search.resultCount} results</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500 capitalize">{search.searchType || "all"}</span>
                          <span className="text-xs text-gray-500">{formatTime(search.timestamp)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Search Results
                  {searchResults.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500">({searchResults.length} found)</span>
                  )}
                </h3>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                        <p className="mt-1 text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!searchQuery && (
                  <div className="text-center py-12">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Start searching</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Enter a phone number, matric number, or student ID to find students.
                    </p>
                  </div>
                )}

                {searchQuery && searchResults.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms or filters.</p>
                  </div>
                )}

                {loading && (
                  <div className="text-center py-12">
                    <LoadingSpinner size="large" />
                    <p className="mt-2 text-sm text-gray-500">Searching students...</p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    {searchResults.map((student) => (
                      <div
                        key={student.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </h4>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center text-sm text-gray-500">
                                  <Hash className="h-4 w-4 mr-1" />
                                  {student.matricNumber}
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Phone className="h-4 w-4 mr-1" />
                                  {departmentService.formatPhoneNumber(student.phone)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center">
                              {getStatusIcon(student.clearanceStatus)}
                              <span
                                className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(student.clearanceStatus)}`}
                              >
                                {student.clearanceStatus}
                              </span>
                            </div>
                            <Link
                              to={`/department/students/${student.id}`}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              View Details
                            </Link>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                          <div>
                            <span className="font-medium">Level:</span> {student.level}
                          </div>
                          <div>
                            <span className="font-medium">Department:</span> {student.department}
                          </div>
                          <div>
                            <span className="font-medium">Applied:</span> {formatTime(student.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentLookup
