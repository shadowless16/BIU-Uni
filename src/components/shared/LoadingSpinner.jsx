"use client"

import { useState, useEffect } from "react"
import { Loader2, WifiOff } from "lucide-react"

/**
 * Enhanced Loading Spinner Component
 * Provides various loading states with customizable appearance and behavior
 * Features: Multiple sizes, overlay modes, timeout handling, offline detection
 */
const LoadingSpinner = ({
  size = "default",
  variant = "default",
  overlay = false,
  fullScreen = false,
  message = "Loading...",
  timeout = null,
  onTimeout = null,
  showOfflineMessage = true,
  className = "",
  ...props
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  // Handle online/offline detection
  /*
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
  */

  // Handle timeout
  useEffect(() => {
    if (timeout) {
      const timer = setTimeout(() => {
        setHasTimedOut(true)
        if (onTimeout) {
          onTimeout()
        }
      }, timeout)

      return () => clearTimeout(timer)
    }
  }, [timeout, onTimeout])

  // MOCK: Always online for offline/standalone testing
  useEffect(() => {
    setIsOnline(true)
  }, [])

  /**
   * Get spinner size classes
   */
  const getSizeClasses = () => {
    const sizes = {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    }
    return sizes[size] || sizes.default
  }

  /**
   * Get variant classes
   */
  const getVariantClasses = () => {
    const variants = {
      default: "text-blue-600",
      primary: "text-blue-600",
      secondary: "text-gray-600",
      success: "text-green-600",
      warning: "text-yellow-600",
      danger: "text-red-600",
      white: "text-white",
    }
    return variants[variant] || variants.default
  }

  /**
   * Render loading content
   */
  const renderLoadingContent = () => {
    if (hasTimedOut) {
      return (
        <div className="flex flex-col items-center space-y-3">
          <div className="text-red-500">
            <Loader2 className={`${getSizeClasses()} animate-spin`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-red-600">Request timed out</p>
            <p className="text-xs text-gray-500 mt-1">Please check your connection and try again</p>
          </div>
        </div>
      )
    }

    // if (!isOnline && showOfflineMessage) {
    //   return (
    //     <div className="flex flex-col items-center space-y-3">
    //       <div className="text-red-500">
    //         <WifiOff className={getSizeClasses()} />
    //       </div>
    //       <div className="text-center">
    //         <p className="text-sm font-medium text-red-600">You're offline</p>
    //         <p className="text-xs text-gray-500 mt-1">Please check your internet connection</p>
    //       </div>
    //     </div>
    //   )
    // }

    return (
      <div className="flex flex-col items-center space-y-3">
        <div className={getVariantClasses()}>
          <Loader2 className={`${getSizeClasses()} animate-spin`} />
        </div>
        {message && (
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">{message}</p>
            {/* {!isOnline && (
              <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
                <WifiOff className="h-3 w-3 mr-1" />
                <span>Offline mode</span>
              </div>
            )} */}
          </div>
        )}
      </div>
    )
  }

  // Inline spinner (no overlay)
  if (!overlay && !fullScreen) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`} {...props}>
        {renderLoadingContent()}
      </div>
    )
  }

  // Full screen overlay
  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm ${className}`}
        {...props}
      >
        {renderLoadingContent()}
      </div>
    )
  }

  // Regular overlay
  return (
    <div
      className={`absolute inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg ${className}`}
      {...props}
    >
      {renderLoadingContent()}
    </div>
  )
}

/**
 * Skeleton Loading Component
 * For content placeholders while data is loading
 */
export const SkeletonLoader = ({ lines = 3, className = "", showAvatar = false, showButton = false }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {showAvatar && (
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className={`h-4 bg-gray-200 rounded ${index === lines - 1 ? "w-3/4" : "w-full"}`}></div>
        ))}
      </div>

      {showButton && (
        <div className="mt-4">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      )}
    </div>
  )
}

/**
 * Button Loading State Component
 */
export const ButtonSpinner = ({ size = "sm", className = "" }) => {
  return (
    <Loader2
      className={`animate-spin ${size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"} ${className}`}
    />
  )
}

/**
 * Page Loading Component
 * For full page loading states
 */
export const PageLoader = ({ message = "Loading page..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4">
          <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <LoadingSpinner size="lg" message={message} />
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner
