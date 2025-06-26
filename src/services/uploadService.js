import { apiUtils } from "./api"

/**
 * Upload Service
 * Handles file uploads with progress tracking and error handling
 */
class UploadService {
  constructor() {
    this.activeUploads = new Map()
    this.uploadQueue = []
    this.maxConcurrentUploads = 3
  }

  /**
   * Upload single file with progress tracking
   * @param {File} file - File to upload
   * @param {Object} options - Upload options
   * @param {string} options.endpoint - Upload endpoint
   * @param {Object} options.metadata - Additional metadata
   * @param {Function} options.onProgress - Progress callback
   * @param {Function} options.onSuccess - Success callback
   * @param {Function} options.onError - Error callback
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file, options = {}) {
    const { endpoint = "/student/documents/upload", metadata = {}, onProgress, onSuccess, onError } = options

    // Generate unique upload ID
    const uploadId = this.generateUploadId()

    try {
      // Validate file before upload
      this.validateFile(file)

      // Compress image if needed
      const processedFile = await this.preprocessFile(file)

      // Create form data
      const formData = new FormData()
      formData.append("file", processedFile)

      // Add metadata
      Object.keys(metadata).forEach((key) => {
        formData.append(key, metadata[key])
      })

      // Track upload
      this.activeUploads.set(uploadId, {
        file: processedFile,
        startTime: Date.now(),
        status: "uploading",
      })

      // Upload with progress tracking
      const result = await apiUtils.upload(endpoint, formData, (progress) => {
        // Update upload status
        const upload = this.activeUploads.get(uploadId)
        if (upload) {
          upload.progress = progress
          upload.status = progress === 100 ? "processing" : "uploading"
        }

        // Call progress callback
        onProgress?.(progress, uploadId)
      })

      // Update upload status
      const upload = this.activeUploads.get(uploadId)
      if (upload) {
        upload.status = "completed"
        upload.result = result
        upload.endTime = Date.now()
      }

      // Call success callback
      onSuccess?.(result, uploadId)

      // Clean up after delay
      setTimeout(() => {
        this.activeUploads.delete(uploadId)
      }, 5000)

      return {
        uploadId,
        result,
        originalFile: file,
        processedFile,
      }
    } catch (error) {
      // Update upload status
      const upload = this.activeUploads.get(uploadId)
      if (upload) {
        upload.status = "failed"
        upload.error = error
        upload.endTime = Date.now()
      }

      // Call error callback
      onError?.(error, uploadId)

      console.error("File upload failed:", error)
      throw error
    }
  }

  /**
   * Upload multiple files with queue management
   * @param {File[]} files - Files to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Object[]>} Upload results
   */
  async uploadMultipleFiles(files, options = {}) {
    const { onProgress, onFileComplete, onAllComplete, onError } = options

    const uploadPromises = []
    const results = []
    let completedCount = 0

    for (const file of files) {
      const uploadPromise = this.uploadFile(file, {
        ...options,
        onProgress: (progress, uploadId) => {
          onProgress?.({
            fileIndex: uploadPromises.length - 1,
            fileName: file.name,
            progress,
            uploadId,
            completedCount,
            totalCount: files.length,
          })
        },
        onSuccess: (result, uploadId) => {
          completedCount++
          results.push({
            file,
            result,
            uploadId,
            status: "success",
          })

          onFileComplete?.({
            file,
            result,
            uploadId,
            completedCount,
            totalCount: files.length,
          })

          if (completedCount === files.length) {
            onAllComplete?.(results)
          }
        },
        onError: (error, uploadId) => {
          completedCount++
          results.push({
            file,
            error,
            uploadId,
            status: "error",
          })

          onError?.({
            file,
            error,
            uploadId,
            completedCount,
            totalCount: files.length,
          })

          if (completedCount === files.length) {
            onAllComplete?.(results)
          }
        },
      })

      uploadPromises.push(uploadPromise)

      // Limit concurrent uploads
      if (uploadPromises.length >= this.maxConcurrentUploads) {
        await Promise.allSettled(uploadPromises.slice(-this.maxConcurrentUploads))
      }
    }

    // Wait for all uploads to complete
    await Promise.allSettled(uploadPromises)

    return results
  }

  /**
   * Cancel upload
   * @param {string} uploadId - Upload ID to cancel
   * @returns {boolean} Cancel success
   */
  cancelUpload(uploadId) {
    const upload = this.activeUploads.get(uploadId)

    if (upload && upload.status === "uploading") {
      upload.status = "cancelled"
      upload.endTime = Date.now()

      // Note: Actual HTTP request cancellation would require
      // storing the axios cancel token and calling it here

      return true
    }

    return false
  }

  /**
   * Get upload status
   * @param {string} uploadId - Upload ID
   * @returns {Object|null} Upload status
   */
  getUploadStatus(uploadId) {
    return this.activeUploads.get(uploadId) || null
  }

  /**
   * Get all active uploads
   * @returns {Object[]} Active uploads
   */
  getActiveUploads() {
    return Array.from(this.activeUploads.entries()).map(([id, upload]) => ({
      id,
      ...upload,
    }))
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @private
   */
  validateFile(file) {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!file) {
      throw new Error("No file provided")
    }

    if (file.size > maxSize) {
      throw new Error(`File size must be less than ${this.formatFileSize(maxSize)}`)
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.")
    }

    // Check for potentially malicious files
    if (this.isSuspiciousFile(file)) {
      throw new Error("File appears to be suspicious and cannot be uploaded")
    }
  }

  /**
   * Preprocess file (compression, etc.)
   * @param {File} file - File to preprocess
   * @returns {Promise<File>} Processed file
   * @private
   */
  async preprocessFile(file) {
    // Only compress images
    if (!file.type.startsWith("image/")) {
      return file
    }

    try {
      // Compress image if it's larger than 2MB
      if (file.size > 2 * 1024 * 1024) {
        return await this.compressImage(file)
      }
    } catch (error) {
      console.warn("Image compression failed, using original file:", error)
    }

    return file
  }

  /**
   * Compress image file
   * @param {File} file - Image file to compress
   * @returns {Promise<File>} Compressed file
   * @private
   */
  async compressImage(file) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions (max 1920x1080)
        const maxWidth = 1920
        const maxHeight = 1080
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file with compressed data
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error("Image compression failed"))
            }
          },
          file.type,
          0.8, // 80% quality
        )
      }

      img.onerror = () => {
        reject(new Error("Failed to load image for compression"))
      }

      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Check if file is suspicious
   * @param {File} file - File to check
   * @returns {boolean} Is suspicious
   * @private
   */
  isSuspiciousFile(file) {
    const suspiciousExtensions = [".exe", ".bat", ".cmd", ".scr", ".pif", ".com"]
    const fileName = file.name.toLowerCase()

    return suspiciousExtensions.some((ext) => fileName.endsWith(ext))
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   * @private
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  /**
   * Generate unique upload ID
   * @returns {string} Upload ID
   * @private
   */
  generateUploadId() {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clear completed uploads
   */
  clearCompletedUploads() {
    for (const [id, upload] of this.activeUploads.entries()) {
      if (["completed", "failed", "cancelled"].includes(upload.status)) {
        this.activeUploads.delete(id)
      }
    }
  }

  /**
   * Get upload statistics
   * @returns {Object} Upload statistics
   */
  getUploadStats() {
    const uploads = Array.from(this.activeUploads.values())

    return {
      total: uploads.length,
      uploading: uploads.filter((u) => u.status === "uploading").length,
      processing: uploads.filter((u) => u.status === "processing").length,
      completed: uploads.filter((u) => u.status === "completed").length,
      failed: uploads.filter((u) => u.status === "failed").length,
      cancelled: uploads.filter((u) => u.status === "cancelled").length,
    }
  }
}

// Create and export singleton instance
const uploadService = new UploadService()
export default uploadService
