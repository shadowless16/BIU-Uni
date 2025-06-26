"use client"

import React from "react"
import { AlertTriangle, RefreshCw, Home, Bug, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

/**
 * Enhanced Error Boundary Component
 * Provides comprehensive error handling with user-friendly interfaces
 * Features: Error categorization, retry mechanisms, offline detection, detailed logging
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isOnline: navigator.onLine,
      retryCount: 0,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2),
    }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo,
    })

    // Log to external service in production
    if (process.env.NODE_ENV === "production") {
      this.logErrorToService(error, errorInfo)
    }

    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  componentDidMount() {
    // Set up online/offline detection
    window.addEventListener("online", this.handleOnline)
    window.addEventListener("offline", this.handleOffline)
  }

  componentWillUnmount() {
    window.removeEventListener("online", this.handleOnline)
    window.removeEventListener("offline", this.handleOffline)
  }

  handleOnline = () => {
    this.setState({ isOnline: true })
  }

  handleOffline = () => {
    this.setState({ isOnline: false })
  }

  /**
   * Log error to external monitoring service
   */
  logErrorToService = (error, errorInfo) => {
    // Implementation for external error logging service
    // e.g., Sentry, LogRocket, etc.
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.props.userId || "anonymous",
        errorId: this.state.errorId,
      }

      // Send to logging service
      console.log("Error logged:", errorData)
    } catch (loggingError) {
      console.error("Failed to log error:", loggingError)
    }
  }

  /**
   * Categorize error type for better user messaging
   */
  categorizeError = (error) => {
    const message = error?.message?.toLowerCase() || ""
    const stack = error?.stack?.toLowerCase() || ""

    if (message.includes("network") || message.includes("fetch")) {
      return "network"
    }
    if (message.includes("chunk") || message.includes("loading")) {
      return "chunk"
    }
    if (stack.includes("react") || stack.includes("component")) {
      return "react"
    }
    if (message.includes("permission") || message.includes("unauthorized")) {
      return "permission"
    }
    return "unknown"
  }

  /**
   * Get user-friendly error message based on error type
   */
  getErrorMessage = (errorType) => {
    const messages = {
      network: {
        title: "Connection Problem",
        description: "Unable to connect to our servers. Please check your internet connection and try again.",
        icon: Wifi,
      },
      chunk: {
        title: "Loading Error",
        description: "There was a problem loading part of the application. Please refresh the page.",
        icon: RefreshCw,
      },
      react: {
        title: "Application Error",
        description: "Something went wrong with the application. Our team has been notified.",
        icon: Bug,
      },
      permission: {
        title: "Access Denied",
        description: "You don't have permission to access this resource. Please contact support if this is unexpected.",
        icon: AlertTriangle,
      },
      unknown: {
        title: "Unexpected Error",
        description:
          "An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.",
        icon: AlertTriangle,
      },
    }

    return messages[errorType] || messages.unknown
  }

  /**
   * Handle retry attempt
   */
  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      showDetails: false,
    }))

    // Force a re-render of the component tree
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  /**
   * Handle navigation to home
   */
  handleGoHome = () => {
    window.location.href = "/"
  }

  /**
   * Handle error reporting
   */
  handleReportError = () => {
    const errorData = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      timestamp: new Date().toISOString(),
    }

    // Copy error ID to clipboard
    navigator.clipboard.writeText(this.state.errorId).then(() => {
      alert(`Error ID copied to clipboard: ${this.state.errorId}`)
    })
  }

  render() {
    if (this.state.hasError) {
      const errorType = this.categorizeError(this.state.error)
      const errorMessage = this.getErrorMessage(errorType)
      const IconComponent = errorMessage.icon

      // Custom fallback UI from props
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry)
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <IconComponent className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">{errorMessage.title}</CardTitle>
              <CardDescription className="text-gray-600">{errorMessage.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Connection Status */}
              <Alert variant={this.state.isOnline ? "default" : "destructive"}>
                <div className="flex items-center">
                  {this.state.isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                  <AlertTitle className="ml-2">{this.state.isOnline ? "Online" : "Offline"}</AlertTitle>
                </div>
                <AlertDescription>
                  {this.state.isOnline
                    ? "Your internet connection is working"
                    : "Please check your internet connection"}
                </AlertDescription>
              </Alert>

              {/* Error Details (Collapsible) */}
              <Collapsible open={this.state.showDetails} onOpenChange={(open) => this.setState({ showDetails: open })}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full">
                    {this.state.showDetails ? "Hide" : "Show"} Error Details
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
                  <div className="bg-gray-100 p-3 rounded-md text-sm">
                    <p className="font-medium text-gray-700">Error ID:</p>
                    <p className="font-mono text-xs text-gray-600 break-all">{this.state.errorId}</p>
                  </div>
                  {this.state.error && (
                    <div className="bg-red-50 p-3 rounded-md text-sm">
                      <p className="font-medium text-red-700">Error Message:</p>
                      <p className="text-red-600 text-xs mt-1">{this.state.error.message}</p>
                    </div>
                  )}
                  {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                    <div className="bg-yellow-50 p-3 rounded-md text-sm">
                      <p className="font-medium text-yellow-700">Component Stack:</p>
                      <pre className="text-yellow-600 text-xs mt-1 whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2">
              <div className="flex space-x-2 w-full">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>

              <Button variant="ghost" size="sm" onClick={this.handleReportError} className="w-full text-xs">
                Copy Error ID for Support
              </Button>

              {this.state.retryCount > 0 && (
                <p className="text-xs text-gray-500 text-center">Retry attempts: {this.state.retryCount}</p>
              )}
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook for handling async errors in functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error) => {
    console.error("Async error captured:", error)
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

export default ErrorBoundary
