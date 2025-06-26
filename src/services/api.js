import axios from "axios"

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage or sessionStorage
    const token = localStorage.getItem("token") || sessionStorage.getItem("token")

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() }

    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      params: config.params,
    })

    return config
  },
  (error) => {
    console.error("❌ Request Error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime

    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      duration: `${duration}ms`,
      data: response.data,
    })

    return response
  },
  async (error) => {
    const originalRequest = error.config

    console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    })

    // Handle token expiration (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem("refreshToken")

        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/auth/refresh-token`,
            { refreshToken },
          )

          const { token, refreshToken: newRefreshToken } = response.data.data

          // Update stored tokens
          localStorage.setItem("token", token)
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken)
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError)

        // Clear tokens and redirect to login
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        sessionStorage.removeItem("token")

        // Dispatch custom event for auth failure
        window.dispatchEvent(new CustomEvent("auth:logout"))

        return Promise.reject(refreshError)
      }
    }

    // Handle network errors
    if (!error.response) {
      const networkError = {
        ...error,
        isNetworkError: true,
        message: "Network error. Please check your internet connection.",
      }
      return Promise.reject(networkError)
    }

    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      const rateLimitError = {
        ...error,
        isRateLimited: true,
        message: "Too many requests. Please wait a moment and try again.",
      }
      return Promise.reject(rateLimitError)
    }

    // Handle server errors (5xx)
    if (error.response?.status >= 500) {
      const serverError = {
        ...error,
        isServerError: true,
        message: "Server error. Please try again later.",
      }
      return Promise.reject(serverError)
    }

    return Promise.reject(error)
  },
)

// Helper function to handle API responses consistently
export const handleApiResponse = (response) => {
  const data = response && response.data ? response.data : response;
  if (data && data.success) {
    return data.data;
  } else {
    throw new Error((data && data.message) || "API request failed");
  }
}

// Helper function to handle API errors consistently
export const handleApiError = (error) => {
  if (error.isNetworkError) {
    return {
      type: "network",
      message: error.message,
      retry: true,
    }
  }

  if (error.isRateLimited) {
    return {
      type: "rate_limit",
      message: error.message,
      retry: true,
      retryAfter: 60000, // 1 minute
    }
  }

  if (error.isServerError) {
    return {
      type: "server",
      message: error.message,
      retry: true,
    }
  }

  return {
    type: "client",
    message,
    errors: error.response?.data?.errors || [],
  }
}

// Utility functions for common API patterns
export const apiUtils = {
  // GET request with error handling
  get: async (url, params = {}) => {
    try {
      const response = await api.get(url, { params })
      return handleApiResponse(response)
    } catch (error) {
      throw handleApiError(error)
    }
  },

  // POST request with error handling
  post: async (url, data = {}) => {
    try {
      const response = await api.post(url, data)
      return handleApiResponse(response)
    } catch (error) {
      throw handleApiError(error)
    }
  },

  // PATCH request with error handling
  patch: async (url, data = {}) => {
    try {
      const response = await api.patch(url, data)
      return handleApiResponse(response)
    } catch (error) {
      throw handleApiError(error)
    }
  },

  // PUT request with error handling
  put: async (url, data = {}) => {
    try {
      const response = await api.put(url, data)
      return handleApiResponse(response)
    } catch (error) {
      throw handleApiError(error)
    }
  },

  // DELETE request with error handling
  delete: async (url) => {
    try {
      const response = await api.delete(url)
      return handleApiResponse(response)
    } catch (error) {
      throw handleApiError(error)
    }
  },

  // Upload with progress tracking
  upload: async (url, formData, onProgress) => {
    try {
      const response = await api.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress?.(percentCompleted)
        },
      })
      return handleApiResponse(response)
    } catch (error) {
      throw handleApiError(error)
    }
  },
}
