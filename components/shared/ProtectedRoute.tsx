"use client"

import type React from "react"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import LoadingSpinner from "./LoadingSpinner"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  requireProfileComplete?: boolean
}

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  requireProfileComplete = false,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Redirect to login if not authenticated
      if (!user) {
        router.push("/login")
        return
      }

      // Check if user role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        router.push("/unauthorized")
        return
      }

      // Check if profile completion is required
      if (requireProfileComplete && !user.profileComplete) {
        router.push("/profile/complete")
        return
      }
    }
  }, [user, loading, router, allowedRoles, requireProfileComplete])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Don't render children if user is not authenticated or authorized
  if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
    return null
  }

  return <>{children}</>
}
