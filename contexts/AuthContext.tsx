"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiService } from "@/services/apiService"

// Define user types for different roles
interface User {
  id: string
  email: string
  role: "student" | "department" | "admin"
  firstName: string
  lastName: string
  phone?: string
  studentId?: string
  departmentId?: string
  profileComplete: boolean
  level?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  refreshToken: () => Promise<void>
  getUserDisplayName: () => string
}

interface LoginCredentials {
  email: string
  password: string
  role: "student" | "department" | "admin"
  rememberMe?: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      // Check both localStorage and sessionStorage for token and user
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          localStorage.removeItem("user");
          sessionStorage.removeItem("user");
          setUser(null);
        }
      } else if (token) {
        try {
          // Fallback: Try to verify token and get user data from API
          const userData = await apiService.verifyToken();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, [])

  // Auto-refresh token every 15 minutes
  useEffect(() => {
    if (user) {
      const interval = setInterval(
        async () => {
          try {
            await refreshToken()
          } catch (error) {
            console.error("Token refresh failed:", error)
            logout()
          }
        },
        15 * 60 * 1000,
      ) // 15 minutes

      return () => clearInterval(interval)
    }
  }, [user])

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const res = await apiService.login(credentials);
      if (res.success && res.data && res.data.user) {
        const user = res.data.user;
        const storage = credentials.rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", res.data.token);
        storage.setItem("user", JSON.stringify(user));
        setUser(user);
      } else {
        throw new Error(res.message || "Login failed");
      }
    } catch (error: any) {
      // Optionally show error to user
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await apiService.updateProfile(data)
      setUser(updatedUser)
    } catch (error) {
      throw error
    }
  }

  const refreshToken = async () => {
    try {
      const response = await apiService.refreshToken()
      localStorage.setItem("token", response.token)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  // Add getUserDisplayName to context
  const getUserDisplayName = () => {
    if (!user) return "";
    // Prefer firstName if available, else name, else email
    // @ts-ignore
    return user.firstName || user.name || user.email || "User";
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    refreshToken,
    getUserDisplayName,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
