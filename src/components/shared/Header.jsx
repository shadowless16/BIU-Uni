"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useNotification } from "@/contexts/NotificationContext"
import notificationService from "../../services/notificationService"
import { Menu, X, Bell, User, LogOut, Settings, ChevronDown, Wifi, WifiOff } from "lucide-react"

/**
 * Header Component
 * Navigation header with role-based menu items, notifications, and user actions
 * Features: Responsive design, notification badge, user dropdown, offline indicator
 */
const Header = () => {
  // Context hooks
  const { user, logout, getUserDisplayName } = useAuth()
  const { showNotification } = useNotification()
  const router = useRouter();

  // Component state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  /**
   * Initialize component and load unread notifications
   */
  useEffect(() => {
    if (user) {
      loadUnreadCount()

      // Subscribe to notification updates
      const unsubscribe = notificationService.subscribe("new_notification", () => {
        loadUnreadCount()
      })

      return unsubscribe
    }
  }, [user])

  /**
   * Set up online/offline detection
   */
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  /**
   * Close mobile menu when route changes
   */
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }, [])

  /**
   * Load unread notification count
   */
  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error("Failed to load unread count:", error)
    }
  }

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    try {
      await logout()
      showNotification({
        type: "success",
        title: "Logged Out",
        message: "You have been successfully logged out",
      })
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      showNotification({
        type: "error",
        title: "Logout Error",
        message: "There was an error logging you out",
      })
    }
  }

  /**
   * Get navigation items based on user role
   * @returns {Array} Navigation items array
   */
  const getNavigationItems = () => {
    if (!user) return []

    switch (user.role) {
      case "student":
        return [
          { name: "Dashboard", href: "/student/dashboard", current: location.pathname === "/student/dashboard" },
          { name: "Apply", href: "/student/apply", current: location.pathname === "/student/apply" },
          { name: "Track Status", href: "/student/status", current: location.pathname === "/student/status" },
          { name: "Profile", href: "/student/profile", current: location.pathname === "/student/profile" },
        ]
      case "department":
        return [
          { name: "Dashboard", href: "/department/", current: location.pathname === "/department" },
          { name: "Student Lookup", href: "/department/lookup", current: location.pathname === "/department/lookup" },
          { name: "Approvals", href: "/department/approvals", current: location.pathname === "/department/approvals" },
          { name: "Profile", href: "/department/profile", current: location.pathname === "/department/profile" },
        ]
      case "admin":
        return [
          { name: "Dashboard", href: "/admin/dashboard", current: location.pathname === "/admin/dashboard" },
          { name: "Students", href: "/admin/students", current: location.pathname === "/admin/students" },
          { name: "Departments", href: "/admin/departments", current: location.pathname === "/admin/departments" },
          { name: "Reports", href: "/admin/reports", current: location.pathname === "/admin/reports" },
          { name: "Settings", href: "/admin/settings", current: location.pathname === "/admin/settings" },
        ]
      default:
        return []
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href={user ? `/${user.role}/dashboard` : "/"} className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">BIU Clearance System</h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.current ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Offline/Online Indicator */}
            <div className="hidden sm:flex items-center">
              {isOnline ? (
                <div className="flex items-center text-green-600" title="Online">
                  <Wifi className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex items-center text-red-600" title="Offline">
                  <WifiOff className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Notifications */}
            <Link
              href={`/${user?.role}/notifications`}
              className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-xs font-medium text-white flex items-center justify-center transform translate-x-1 -translate-y-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-sm rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-2"
              >
                <div className="hidden md:flex items-center space-x-2">
                  <span className="font-medium">{getUserDisplayName()}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
                    {user?.role}
                  </span>
                </div>
                <User className="h-6 w-6" />
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">{user?.email}</div>
                  <Link
                    href={`/${user?.role}/profile`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {/* User info */}
              <div className="px-3 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className="text-xs text-blue-600 capitalize font-medium">{user?.role}</p>
              </div>

              {/* Navigation items */}
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    item.current ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile notifications */}
              <Link
                href={`/${user?.role}/notifications`}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 flex items-center"
              >
                <Bell className="mr-3 h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">{unreadCount}</span>
                )}
              </Link>

              {/* Mobile user actions */}
              <div className="border-t border-gray-200 pt-2">
                <Link
                  href={`/${user?.role}/profile`}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 flex items-center"
                >
                  <Settings className="mr-3 h-5 w-5" />
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 flex items-center"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign out
                </button>
              </div>

              {/* Connection status */}
              <div className="px-3 py-2 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-600" />
                      <span className="text-xs text-red-600">Offline</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside handler for dropdowns */}
      {(isUserMenuOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsUserMenuOpen(false)
            setIsMobileMenuOpen(false)
          }}
        />
      )}
    </header>
  )
}

export default Header
