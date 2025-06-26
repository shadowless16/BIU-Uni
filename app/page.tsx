"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import LoadingSpinner from "@/components/shared/LoadingSpinner"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else {
        // Redirect based on user role
        switch (user.role) {
          case "student":
            router.push("/student/dashboard")
            break
          case "department":
            router.push("/department")
            break
          case "admin":
            router.push("/admin/dashboard")
            break
          default:
            router.push("/login")
        }
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return null
}
