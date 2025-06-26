const express = require("express");
const departmentService = require("../services/departmentService");
// Use the correct backend file for all backend logic
const departmentServiceBackend = require("../services/departmentService.server.js");
const clearanceService = require("../services/clearanceService");
const router = express.Router();

// Fetch all departments
router.get("/departments", async (req, res) => {
  try {
    const departments = await departmentServiceBackend.getAllDepartments();
    res.json(departments);
  } catch (err) {
    console.error("/departments error:", err); // Log full error
    res.status(500).json({ error: err.message, stack: err.stack }); // Return stack for debugging
  }
});

// Fetch a department profile by ID
router.get("/departments/:id", async (req, res) => {
  try {
    // Use the backend-only service for backend logic
    const department = await departmentServiceBackend.getDepartmentById(req.params.id);
    if (!department) return res.status(404).json({ error: "Department not found" });
    res.json(department);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a department profile
router.put("/departments/:id", async (req, res) => {
  try {
    const updated = await departmentService.updateDepartment(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Department not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all clearance requests
router.get("/clearance-requests", async (req, res) => {
  try {
    const requests = await clearanceService.getAllClearanceRequests();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve a clearance request
router.patch("/clearance-requests/:id/approve", async (req, res) => {
  try {
    const { departmentId, departmentSubdocId, approvedBy, remarks } = req.body;
    if (!departmentId && !departmentSubdocId) {
      return res.status(400).json({ success: false, message: "departmentId or departmentSubdocId is required" });
    }
    const request = await clearanceService.approveClearanceRequest(
      req.params.id,
      departmentId,
      departmentSubdocId,
      approvedBy,
      remarks
    );
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reject a clearance request
router.patch("/clearance-requests/:id/reject", async (req, res) => {
  try {
    const request = await clearanceService.rejectClearanceRequest(req.params.id, req.body.comment);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Department statistics (for dashboard)
router.get("/stats", async (req, res) => {
  try {
    // Example: Calculate stats from Clearance and Student models
    const Clearance = require("../models/Clearance");
    const Student = require("../models/Student");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayApprovals = await Clearance.countDocuments({ status: "approved", updatedAt: { $gte: today, $lt: tomorrow } });
    const todayRejections = await Clearance.countDocuments({ status: "rejected", updatedAt: { $gte: today, $lt: tomorrow } });
    const totalStudents = await Student.countDocuments();
    const pendingCount = await Clearance.countDocuments({ status: "pending" });
    // Example: Calculate processing rate (approved/total)
    const totalProcessed = await Clearance.countDocuments({ status: { $in: ["approved", "rejected"] } });
    const processingRate = totalProcessed > 0 ? Math.round((todayApprovals / totalProcessed) * 100) : 0;

    res.json({ success: true, data: {
      todayApprovals,
      todayRejections,
      totalStudents,
      pendingCount,
      processingRate,
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Recent students (for dashboard activity)
router.get("/recent-students", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const Clearance = require("../models/Clearance");
    // Find recent clearances (approved, rejected, pending)
    const recent = await Clearance.find({})
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "firstName lastName" }
      });
    // Map to dashboard format
    const students = recent.map((clr) => {
      // Debug: log the studentId object
      console.log("DEBUG studentId:", JSON.stringify(clr.studentId, null, 2));
      return {
        id: clr.studentId?._id || clr.studentId,
        firstName: clr.studentId?.userId?.firstName || "",
        lastName: clr.studentId?.userId?.lastName || "",
        matricNumber: clr.studentId?.matricNumber || "",
        phone: clr.studentId?.phone || "",
        status: clr.status,
        updatedAt: clr.updatedAt,
      };
    });
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Pending students (for dashboard)
router.get("/pending-students", async (req, res) => {
  try {
    const Clearance = require("../models/Clearance");
    // Find clearances where at least one department is still pending
    const pending = await Clearance.find({ "departments.status": "pending" })
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "firstName lastName" }
      });
    // Ensure departmentId is always a string for frontend filtering
    pending.forEach(clr => {
      if (Array.isArray(clr.departments)) {
        clr.departments.forEach(dept => {
          if (dept.departmentId && typeof dept.departmentId !== 'string') {
            dept.departmentId = dept.departmentId.toString();
          }
        });
      }
    });
    res.json({ success: true, data: pending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Department dashboard summary (for dashboardData)
router.get("/dashboard-summary", async (req, res) => {
  try {
    const Clearance = require("../models/Clearance");
    const Student = require("../models/Student");
    const pendingCount = await Clearance.countDocuments({ status: "pending" });
    const totalStudents = await Student.countDocuments();
    res.json({ success: true, data: { pendingCount, totalStudents } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /department/search-student
router.post("/search-student", async (req, res) => {
  try {
    const { query, departmentId } = req.body;
    const Student = require("../models/Student");
    if (!query) return res.status(400).json({ success: false, message: "Missing search query" });
    const q = query.trim().toLowerCase();
    const regex = new RegExp(q, "i");

    // 1. Search all students (optionally by department)
    let studentQuery = {};
    if (departmentId) studentQuery.department = departmentId;
    let students = await Student.find(studentQuery)
      .populate({ path: "userId", select: "firstName lastName" });
    console.log("[DEBUG] All students (populated):", students);

    // 2. Filter students by user name (case-insensitive, partial)
    let nameMatchedStudents = students.filter(s => {
      const first = (s.userId?.firstName || "").toLowerCase();
      const last = (s.userId?.lastName || "").toLowerCase();
      const full = `${first} ${last}`;
      const rev = `${last} ${first}`;
      return first.includes(q) || last.includes(q) || full.includes(q) || rev.includes(q);
    });
    console.log("[DEBUG] Students matching name:", nameMatchedStudents);

    // 3. Also search by matricNumber, studentId, phone as before
    const searchConditions = [
      { matricNumber: regex },
      { studentId: regex },
      { phone: regex }
    ];
    const studentFieldQuery = {
      ...(departmentId && { department: departmentId }),
      $or: searchConditions,
    };
    let fieldMatchedStudents = await Student.find(studentFieldQuery)
      .populate({ path: "userId", select: "firstName lastName" });
    console.log("[DEBUG] Students matching matric/phone/studentId:", fieldMatchedStudents);

    // 4. Merge and dedupe
    const allStudents = [...nameMatchedStudents, ...fieldMatchedStudents];
    const seen = new Set();
    const deduped = allStudents.filter(s => {
      if (!s._id) return true;
      if (seen.has(s._id.toString())) return false;
      seen.add(s._id.toString());
      return true;
    });
    console.log("[DEBUG] Deduped students:", deduped);

    const results = deduped.map(student => ({
      id: student._id,
      firstName: student.userId?.firstName || "",
      lastName: student.userId?.lastName || "",
      matricNumber: student.matricNumber,
      phone: student.phone,
      status: student.graduationStatus || "pending",
      updatedAt: student.updatedAt,
    }));
    console.log("[DEBUG] Final results:", results);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error("[ERROR] /search-student:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Fetch a student by ID
router.get("/students/:studentId", async (req, res) => {
  try {
    // Use the backend-specific function to avoid frontend/backend conflicts
    const student = await departmentServiceBackend.getStudentByIdBackend(req.params.studentId);
    if (!student) {
      console.warn(`[WARN] Student not found for id: ${req.params.studentId}`);
      return res.status(404).json({ error: "Student not found" });
    }
    // Populate all user fields if userId is populated
    let studentObj = student.toObject();
    if (studentObj.userId && studentObj.userId._id) {
      // Optionally, fetch the full user document if needed
      const User = require("../models/User");
      const userDoc = await User.findById(studentObj.userId._id).lean();
      if (userDoc) studentObj.userId = userDoc;
    }
    res.json({ success: true, data: studentObj });
  } catch (err) {
    console.error(`[ERROR] /students/:studentId:`, err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

module.exports = router;
