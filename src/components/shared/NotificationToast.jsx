"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

/**
 * Enhanced Notification Toast System
 * Provides comprehensive notification management with various types and behaviors
 * Features: Auto-dismiss, progress bars, action buttons, offline queuing, animations
 */

// Toast types configuration
const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    className: "border-green-200 bg-green-50 text-green-800",
    iconClassName: "text-green-600",
    progressClassName: "bg-green-600",
  },
  error: {
    icon: AlertCircle,
    className: "border-red-200 bg-red-50 text-red-800",
    iconClassName: "text-red-600",
    progressClassName: "bg-red-600",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-yellow-200 bg-yellow-50 text-yellow-800",
    iconClassName: "text-yellow-600",
    progressClassName: "bg-yellow-600",
  },
  info: {
    icon: Info,
    className: "border-blue-200 bg-blue-50 text-blue-800",
    iconClassName: "text-blue-600",
    progressClassName: "bg-blue-600",
  },
  offline: {
    icon: WifiOff,
    className: "border-gray-200 bg-gray-50 text-gray-800",
    iconClassName: "text-gray-600",
    progressClassName: "bg-gray-600",
  },
  online: {
    icon: Wifi,
    className: "border-green-200 bg-green-50 text-green-800",
    iconClassName: "text-green-600",
    progressClassName: "bg-green-600",
  },
}

/**
 * Individual Toast Component
 */
const Toast = ({
  id,
  type = "info",
  title,
  message,
  duration = 5000,
  persistent = false,
  showProgress = true,
  actions = [],
  onClose,
  onAction,
  className = "",
}) => {
  const [progress, setProgress] = useState(100)
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const config = TOAST_TYPES[type] || TOAST_TYPES.info
  const IconComponent = config.icon

  // Handle auto-dismiss
  useEffect(() => {
    if (!persistent && duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - 100 / (duration / 100)
          if (newProgress <= 0) {
            handleClose()
            return 0
          }
          return newProgress
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [duration, persistent])

  // Handle entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  /**
   * Handle toast close with exit animation
   */
  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }, [id, onClose])

  /**
   * Handle action button click
   */
  const handleAction = useCallback(
    (action) => {
      if (onAction) {
        onAction(id, action)
      }
      if (action.closeOnClick !== false) {
        handleClose()
      }
    },
    [id, onAction, handleClose],
  )

  return (
    <Card
      className={`
        relative overflow-hidden shadow-lg transition-all duration-300 ease-in-out
        ${config.className}
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        ${isExiting ? "translate-x-full opacity-0 scale-95" : ""}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <IconComponent className={`h-5 w-5 ${config.iconClassName}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && <h4 className="text-sm font-semibold mb-1 truncate">{title}</h4>}
            {message && <p className="text-sm opacity-90 break-words">{message}</p>}

            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex space-x-2 mt-3">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || "ghost"}
                    size="sm"
                    onClick={() => handleAction(action)}
                    className="h-7 px-2 text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="flex-shrink-0 h-6 w-6 p-0 hover:bg-black/10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close notification</span>
          </Button>
        </div>

        {/* Progress bar */}
        {showProgress && !persistent && duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            <Progress value={progress} className={`h-1 rounded-none ${config.progressClassName}`} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Toast Container Component
 */
const ToastContainer = ({ toasts, onClose, onAction, position = "top-right" }) => {
  const getPositionClasses = () => {
    const positions = {
      "top-right": "top-4 right-4",
      "top-left": "top-4 left-4",
      "top-center": "top-4 left-1/2 transform -translate-x-1/2",
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
    }
    return positions[position] || positions["top-right"]
  }

  if (toasts.length === 0) return null

  return createPortal(
    <div
      className={`fixed z-50 pointer-events-none ${getPositionClasses()}`}
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="space-y-2 w-80 max-w-sm pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} onAction={onAction} />
        ))}
      </div>
    </div>,
    document.body,
  )
}

/**
 * Main Notification Toast Component
 */
const NotificationToast = () => {
  const [toasts, setToasts] = useState([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Handle online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      addToast({
        type: "online",
        title: "Back Online",
        message: "Your internet connection has been restored",
        duration: 3000,
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      addToast({
        type: "offline",
        title: "You're Offline",
        message: "Some features may not be available",
        persistent: true,
      })
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  /**
   * Add a new toast
   */
  const addToast = useCallback((toast) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2)
    const newToast = {
      id,
      timestamp: Date.now(),
      ...toast,
    }

    setToasts((prev) => {
      // Remove offline toasts when coming back online
      if (toast.type === "online") {
        return [...prev.filter((t) => t.type !== "offline"), newToast]
      }

      // Limit number of toasts
      const maxToasts = 5
      const updatedToasts = [...prev, newToast]
      return updatedToasts.slice(-maxToasts)
    })

    return id
  }, [])

  /**
   * Remove a toast
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  /**
   * Handle toast action
   */
  const handleToastAction = useCallback((id, action) => {
    if (action.handler) {
      action.handler()
    }
  }, [])

  /**
   * Clear all toasts
   */
  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Expose methods globally for use in other components
  useEffect(() => {
    window.showNotification = addToast
    window.clearNotifications = clearAllToasts

    return () => {
      delete window.showNotification
      delete window.clearNotifications
    }
  }, [addToast, clearAllToasts])

  return <ToastContainer toasts={toasts} onClose={removeToast} onAction={handleToastAction} />
}

/**
 * Hook for using notifications in components
 */
export const useNotification = () => {
  const showNotification = useCallback((notification) => {
    if (window.showNotification) {
      return window.showNotification(notification)
    }
    console.warn("Notification system not initialized")
  }, [])

  const clearNotifications = useCallback(() => {
    if (window.clearNotifications) {
      window.clearNotifications()
    }
  }, [])

  return { showNotification, clearNotifications }
}

/**
 * Notification helper functions
 */
export const showSuccess = (title, message, options = {}) => {
  if (window.showNotification) {
    window.showNotification({ type: "success", title, message, ...options })
  }
}

export const showError = (title, message, options = {}) => {
  if (window.showNotification) {
    window.showNotification({ type: "error", title, message, ...options })
  }
}

export const showWarning = (title, message, options = {}) => {
  if (window.showNotification) {
    window.showNotification({ type: "warning", title, message, ...options })
  }
}

export const showInfo = (title, message, options = {}) => {
  if (window.showNotification) {
    window.showNotification({ type: "info", title, message, ...options })
  }
}

export default NotificationToast
