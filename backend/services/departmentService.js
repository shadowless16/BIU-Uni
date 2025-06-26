// Use ES module imports at the very top
import apiUtils from "../utils/apiUtils.js";

/**
 * Department Service
 * Handles all department-related API calls
 */
class DepartmentService {
  constructor() {
    // Cache for recent searches to improve UX
    this.searchCache = new Map()
    this.recentStudentsCache = new Map()
  }

  // ...existing methods from departmentService.js...
}

export default new DepartmentService();
