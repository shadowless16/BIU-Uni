import { apiUtils } from "./api"

/**
 * Notification Service
 * Handles notification-related API calls and real-time updates
 */
class NotificationService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
    this.notificationCache = new Map()
    this.unreadCount = 0
    this.isConnected = false
  }

  /**
   * Initialize real-time notification connection
   * @param {string} userId - User ID for socket room
   */
  initializeRealTime(userId) {
    if (typeof window !== "undefined" && window.io) {
      try {
        this.socket = window.io(process.env.REACT_APP_API_URL || "http://localhost:5000", {
          transports: ["websocket", "polling"],
          timeout: 20000,
        })

        this.socket.on("connect", () => {
          console.log("🔌 Connected to notification service")
          this.isConnected = true

          // Join user-specific room
          this.socket.emit("join_room", userId)

          // Notify listeners of connection
          this.notifyListeners("connection", { connected: true })
        })

        this.socket.on("disconnect", () => {
          console.log("🔌 Disconnected from notification service")
          this.isConnected = false

          // Notify listeners of disconnection
          this.notifyListeners("connection", { connected: false })
        })

        this.socket.on("new_notification", (notification) => {
          console.log("🔔 New notification received:", notification)

          // Update unread count
          this.unreadCount++

          // Cache notification
          this.cacheNotification(notification)

          // Notify listeners
          this.notifyListeners("new_notification", notification)

          // Show browser notification if permission granted
          this.showBrowserNotification(notification)
        })

        this.socket.on("notification_read", (data) => {
          console.log("📖 Notification marked as read:", data)

          // Update unread count
          this.unreadCount = Math.max(0, this.unreadCount - 1)

          // Update cached notification
          this.updateCachedNotification(data.notificationId, { isRead: true })

          // Notify listeners
          this.notifyListeners("notification_read", data)
        })

        this.socket.on("bulk_notification_update", (data) => {
          console.log("📚 Bulk notification update:", data)

          // Update unread count
          this.unreadCount = data.unreadCount || 0

          // Notify listeners
          this.notifyListeners("bulk_update", data)
        })
      } catch (error) {
        console.error("Failed to initialize real-time notifications:", error)
      }
    }
  }

  /**
   * Disconnect from real-time service
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  /**
   * Get notifications with pagination
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {boolean} options.unreadOnly - Get only unread notifications
   * @returns {Promise<Object>} Notifications data
   */
  async getNotifications(options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options

      const data = await apiUtils.get("/notifications", {
        page,
        limit,
        unreadOnly,
      })

      // Cache notifications
      if (data.notifications) {
        data.notifications.forEach((notification) => {
          this.cacheNotification(notification)
        })
      }

      // Update unread count
      if (data.unreadCount !== undefined) {
        this.unreadCount = data.unreadCount
      }

      return data
    } catch (error) {
      console.error("Failed to fetch notifications:", error)

      // Return cached notifications if available
      const cachedNotifications = this.getCachedNotifications(options)
      if (cachedNotifications.length > 0) {
        console.warn("Using cached notifications due to network error")
        return {
          notifications: cachedNotifications,
          unreadCount: this.unreadCount,
          isOffline: true,
        }
      }

      throw error
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Update result
   */
  async markAsRead(notificationId) {
    try {
      const data = await apiUtils.post(`/notifications/${notificationId}/read`)

      // Update local state optimistically
      this.unreadCount = Math.max(0, this.unreadCount - 1)
      this.updateCachedNotification(notificationId, { isRead: true })

      // Notify listeners
      this.notifyListeners("notification_read", { notificationId })

      return data
    } catch (error) {
      console.error("Failed to mark notification as read:", error)

      // Revert optimistic update
      this.unreadCount++
      this.updateCachedNotification(notificationId, { isRead: false })

      throw error
    }
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Update result
   */
  async markAllAsRead() {
    try {
      const data = await apiUtils.post("/notifications/mark-all-read")

      // Update local state
      this.unreadCount = 0

      // Update all cached notifications
      for (const [id, notification] of this.notificationCache.entries()) {
        if (!notification.isRead) {
          this.updateCachedNotification(id, { isRead: true })
        }
      }

      // Notify listeners
      this.notifyListeners("bulk_update", { unreadCount: 0 })

      return data
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      throw error
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteNotification(notificationId) {
    try {
      const data = await apiUtils.delete(`/notifications/${notificationId}`)

      // Remove from cache
      const notification = this.notificationCache.get(notificationId)
      if (notification && !notification.isRead) {
        this.unreadCount = Math.max(0, this.unreadCount - 1)
      }
      this.notificationCache.delete(notificationId)

      // Notify listeners
      this.notifyListeners("notification_deleted", { notificationId })

      return data
    } catch (error) {
      console.error("Failed to delete notification:", error)
      throw error
    }
  }

  /**
   * Get unread notification count
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount() {
    try {
      const data = await apiUtils.get("/notifications/unread-count")
      this.unreadCount = data.count || 0
      return this.unreadCount
    } catch (error) {
      console.error("Failed to fetch unread count:", error)
      return this.unreadCount // Return cached count
    }
  }

  /**
   * Subscribe to notification events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   * @returns {Function} Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    this.listeners.get(event).add(callback)

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event)
      if (eventListeners) {
        eventListeners.delete(callback)
        if (eventListeners.size === 0) {
          this.listeners.delete(event)
        }
      }
    }
  }

  /**
   * Request browser notification permission
   * @returns {Promise<string>} Permission status
   */
  async requestNotificationPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      console.log("Browser notification permission:", permission)
      return permission
    }
    return "denied"
  }

  /**
   * Show browser notification
   * @param {Object} notification - Notification data
   * @private
   */
  showBrowserNotification(notification) {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: notification.id,
          requireInteraction: notification.priority === "urgent",
        })

        // Auto-close after 5 seconds (except urgent notifications)
        if (notification.priority !== "urgent") {
          setTimeout(() => {
            browserNotification.close()
          }, 5000)
        }

        // Handle click
        browserNotification.onclick = () => {
          window.focus()

          // Navigate to notification URL if available
          if (notification.data?.actionUrl) {
            window.location.href = notification.data.actionUrl
          }

          browserNotification.close()
        }
      } catch (error) {
        console.error("Failed to show browser notification:", error)
      }
    }
  }

  /**
   * Cache notification
   * @param {Object} notification - Notification to cache
   * @private
   */
  cacheNotification(notification) {
    this.notificationCache.set(notification.id, {
      ...notification,
      cachedAt: Date.now(),
    })

    // Limit cache size
    if (this.notificationCache.size > 100) {
      const oldestKey = this.notificationCache.keys().next().value
      this.notificationCache.delete(oldestKey)
    }
  }

  /**
   * Update cached notification
   * @param {string} notificationId - Notification ID
   * @param {Object} updates - Updates to apply
   * @private
   */
  updateCachedNotification(notificationId, updates) {
    const notification = this.notificationCache.get(notificationId)
    if (notification) {
      this.notificationCache.set(notificationId, {
        ...notification,
        ...updates,
      })
    }
  }

  /**
   * Get cached notifications
   * @param {Object} options - Filter options
   * @returns {Object[]} Cached notifications
   * @private
   */
  getCachedNotifications(options = {}) {
    const { unreadOnly = false, limit = 20 } = options

    let notifications = Array.from(this.notificationCache.values())

    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.isRead)
    }

    // Sort by creation date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return notifications.slice(0, limit)
  }

  /**
   * Notify event listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @private
   */
  notifyListeners(event, data) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in notification listener for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Clear notification cache
   */
  clearCache() {
    this.notificationCache.clear()
    this.unreadCount = 0
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  isConnectedToRealTime() {
    return this.isConnected
  }

  /**
   * Get current unread count
   * @returns {number} Unread count
   */
  getCurrentUnreadCount() {
    return this.unreadCount
  }
}

// Create and export singleton instance
const notificationService = new NotificationService()
export default notificationService
