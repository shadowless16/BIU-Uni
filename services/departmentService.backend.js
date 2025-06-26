// Backend-only: Get student by MongoDB _id (for /department/students/:studentId route)
// This avoids frontend/backend import issues
const Student = require("../models/Student");
const Department = require("../models/Department");

async function getStudentByIdBackend(studentId) {
  if (!studentId) return null;
  let student = null;
  try {
    student = await Student.findById(studentId).populate("userId", "firstName lastName email");
  } catch (e) {
    student = await Student.findOne({ studentId: studentId }).populate("userId", "firstName lastName email");
  }
  return student;
}

// Backend-only department service functions (CommonJS)
async function getAllDepartments() {
  return await Department.find({ isActive: true });
}

module.exports = {
  getStudentByIdBackend,
  getAllDepartments,
};
