const express = require("express");
const studentService = require("../services/studentService");
const authMiddleware = require("../middleware/authMiddleware");
const studentController = require("../controllers/studentController");
const router = express.Router();

// Fetch all students
router.get("/students", async (req, res) => {
  try {
    const students = await studentService.getAllStudents();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch a student by ID
router.get("/students/:id", async (req, res) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a student profile
router.put("/students/:id", async (req, res) => {
  try {
    const updated = await studentService.updateStudent(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Student not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a student
router.delete("/students/:id", async (req, res) => {
  try {
    const deleted = await studentService.deleteStudent(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Student not found" });
    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student dashboard route
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    // Get userId from auth middleware (assumes req.user is set)
    const userId = req.user._id || req.user.id;

    // Find the student profile
    const Student = require("../models/Student");
    const User = require("../models/User");
    const Clearance = require("../models/Clearance");
    const Notification = require("../models/Notification");

    const student = await Student.findOne({ userId });
    if (!student)
      return res.status(404).json({ error: "Student profile not found" });

    // Find the user info
    const user = await User.findById(userId);

    // Find latest clearance application
    const clearance = await Clearance.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate clearanceStatus
    let clearanceStatus = null;
    let recentActivity = [];
    if (clearance && Array.isArray(clearance.departments)) {
      const totalDepartments = clearance.departments.length;
      const approvedDepartments = clearance.departments.filter(
        (d) => d.status === "approved"
      ).length;
      const pendingDepartments = clearance.departments.filter(
        (d) => d.status === "pending"
      ).length;
      const rejectedDepartments = clearance.departments.filter(
        (d) => d.status === "rejected"
      ).length;
      const completionPercentage =
        totalDepartments > 0 ? Math.round((approvedDepartments / totalDepartments) * 100) : 0;
      clearanceStatus = {
        totalDepartments,
        approvedDepartments,
        pendingDepartments,
        rejectedDepartments,
        completionPercentage,
      };
      recentActivity = clearance.departments.map((d, idx) => ({
        id: d.departmentId ? d.departmentId.toString() : idx.toString(),
        department: d.departmentName,
        status: d.status,
        date: d.approvedAt || d.updatedAt || clearance.updatedAt || clearance.createdAt,
        remarks: d.remarks || "",
      })).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    }

    // Find recent notifications
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    const formattedNotifications = notifications.map(n => ({
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      date: n.createdAt,
      read: n.read,
    }));

    res.json({
      clearanceStatus,
      recentActivity,
      notifications: formattedNotifications,
      user: user ? { name: user.firstName + ' ' + user.lastName } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add this route for clearance application
router.post("/clearance/apply", authMiddleware, studentController.submitClearanceApplication);

// Get current student profile (for frontend profile page)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const Student = require("../models/Student");
    const User = require("../models/User");
    // Find the student profile
    const student = await Student.findOne({ userId });
    if (!student) return res.status(404).json({ error: "Student profile not found" });
    // Find the user info
    const user = await User.findById(userId);
    res.json({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      studentId: student?.studentId || "",
      phone: student?.phone || "",
      departmentId: student?.departmentId || "",
      level: student?.level || "",
      role: user?.role || "Student",
      profilePicUrl: user?.profilePicUrl || ""
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
