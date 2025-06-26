const Clearance = require("../models/Clearance");
const Student = require("../models/Student");
const Department = require("../models/Department");

// Replace uuidv4 with legacy unique string
function generateLegacyAppNumber() {
  return (
    'CL' +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substr(2, 5).toUpperCase()
  );
}

// POST /api/student/clearance/apply
exports.submitClearanceApplication = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const student = await Student.findOne({ userId });
    if (!student) return res.status(404).json({ error: "Student profile not found" });

    // Get department details for each selected department
    const departments = await Department.find({ _id: { $in: req.body.departments } });
    const departmentItems = departments.map((dept) => ({
      departmentId: dept._id,
      departmentName: dept.name,
      status: "pending",
      requirements: dept.requirements || [],
    }));

    // Create new clearance application
    const clearance = new Clearance({
      studentId: student._id,
      userId,
      applicationNumber: generateLegacyAppNumber(),
      academicSession: student.academicSession,
      semester: student.currentSemester,
      clearanceType: req.body.clearanceType,
      overallStatus: "submitted",
      departments: departmentItems,
      documents: req.body.documents || [],
      submittedAt: new Date(),
    });
    await clearance.save();
    res.status(201).json({ message: "Clearance application submitted", clearanceId: clearance._id });
  } catch (err) {
    // Enhanced error logging for debugging
    console.error("[Clearance Application Error]");
    console.error("User:", req.user);
    console.error("Request body:", req.body);
    console.error("Error:", err);
    res.status(500).json({ error: err.message, details: err });
  }
};
