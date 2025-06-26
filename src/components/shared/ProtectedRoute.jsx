"use client"

import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { PageLoader } from "./LoadingSpinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle, LogIn, Home } from "lucide-react"

/**
 * Enhanced Protected Route Component
 * Provides comprehensive route protection with role-based access control
 * Features: JWT validation, role checking, session management, graceful error handling
 */
const ProtectedRoute = ({
  children,
  requiredRole = null,
  requiredRoles = [],
  allowedRoles = [],
  requireAuth = true,
  fallbackPath = "/login",
  showUnauthorized = true,
  onUnauthorized = null,
  checkPermissions = null,
  loadingComponent = null,
  className = "",
}) => {
  const { user, isLoading, isAuthenticated, checkAuthStatus, logout } = useAuth()
  const location = useLocation()
  const [authChecked, setAuthChecked] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)

  /**
   * Check authentication status on mount and route change
   */
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuthStatus()
      } catch (error) {
        console.error("Auth verification failed:", error)
      } finally {
        setAuthChecked(true)
      }
    }

    verifyAuth()
  }, [location.pathname, checkAuthStatus])

  /**
   * Check permissions when user or requirements change
   */
  useEffect(() => {
    if (authChecked && user) {
      const hasPermission = checkUserPermissions()
      setPermissionGranted(hasPermission)
    }
  }, [authChecked, user, requiredRole, requiredRoles, allowedRoles])

  /**
   * Check if user has required permissions
   */
  const checkUserPermissions = () => {
    if (!user) return false

    // Custom permission check function
    if (checkPermissions && typeof checkPermissions === "function") {
      return checkPermissions(user)
    }

    // Check specific required role
    if (requiredRole && user.role !== requiredRole) {
      return false
    }

    // Check if user role is in required roles array
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      return false
    }

    // Check if user role is in allowed roles array
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return false
    }

    // Check if user account is active
    if (user.status && user.status !== "active") {
      return false
    }

    return true
  }

  /**
   * Get appropriate redirect path based on user role
   */
  const getRedirectPath = () => {
    if (!user) return fallbackPath

    // Role-based default redirects
    const roleRedirects = {
      student: "/student/dashboard",
      department: "/department",
      admin: "/admin/dashboard",
    }

    return roleRedirects[user.role] || fallbackPath
  }

  /**
   * Handle unauthorized access
   */
  const handleUnauthorized = () => {
    if (onUnauthorized && typeof onUnauthorized === "function") {
      onUnauthorized(user, location)
    }
  }

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  /**
   * Render loading state
   */
  if (isLoading || !authChecked) {
    if (loadingComponent) {
      return loadingComponent
    }
    return <PageLoader message="Verifying access..." />
  }

  /**
   * Handle unauthenticated users
   */
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location.pathname, message: "Please log in to access this page" }}
        replace
      />
    )
  }

  /**
   * Handle users without required permissions
   */
  if (requireAuth && isAuthenticated && !permissionGranted) {
    handleUnauthorized()

    if (!showUnauthorized) {
      return <Navigate to={getRedirectPath()} replace />
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">Access Denied</CardTitle>
            <CardDescription className="text-gray-600">You don't have permission to access this page</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Insufficient Permissions</AlertTitle>
              <AlertDescription>
                {requiredRole && (
                  <>
                    Required role: <strong>{requiredRole}</strong>
                  </>
                )}
                {requiredRoles.length > 0 && (
                  <>
                    Required roles: <strong>{requiredRoles.join(", ")}</strong>
                  </>
                )}
                {allowedRoles.length > 0 && (
                  <>
                    Allowed roles: <strong>{allowedRoles.join(", ")}</strong>
                  </>
                )}
                {user && (
                  <>
                    <br />
                    Your role: <strong>{user.role}</strong>
                  </>
                )}
              </AlertDescription>
            </Alert>

            {user?.status && user.status !== "active" && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Account Status</AlertTitle>
                <AlertDescription>
                  Your account status is: <strong>{user.status}</strong>
                  <br />
                  Please contact support if you believe this is an error.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <div className="flex space-x-2 w-full">
              <Button onClick={() => window.history.back()} variant="outline" className="flex-1">
                Go Back
              </Button>
              <Button onClick={() => (window.location.href = getRedirectPath())} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </div>

            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full text-red-600 hover:text-red-700"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign in as different user
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    )
  }

  /**
   * Render protected content
   */
  return <div className={className}>{children}</div>
}

/**
 * Higher-order component for protecting components
 */
export const withProtectedRoute = (Component, protectionOptions = {}) => {
  const ProtectedComponent = (props) => (
    <ProtectedRoute {...protectionOptions}>
      <Component {...props} />
    </ProtectedRoute>
  )

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`
  return ProtectedComponent
}

/**
 * Hook for checking permissions in components
 */
export const usePermissions = () => {
  const { user } = useAuth()

  const hasRole = (role) => {
    return user?.role === role
  }

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role)
  }

  const hasPermission = (permission) => {
    return user?.permissions?.includes(permission)
  }

  const isActive = () => {
    return user?.status === "active"
  }

  return {
    user,
    hasRole,
    hasAnyRole,
    hasPermission,
    isActive,
  }
}

/**
 * Component for conditional rendering based on permissions
 */
export const PermissionGate = ({
  children,
  requiredRole = null,
  requiredRoles = [],
  allowedRoles = [],
  checkPermissions = null,
  fallback = null,
}) => {
  const { user } = useAuth()

  const hasPermission = () => {
    if (!user) return false

    if (checkPermissions && typeof checkPermissions === "function") {
      return checkPermissions(user)
    }

    if (requiredRole && user.role !== requiredRole) {
      return false
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      return false
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return false
    }

    return true
  }

  if (hasPermission()) {
    return children
  }

  return fallback
}

export default ProtectedRoute
