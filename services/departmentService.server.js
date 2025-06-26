// This file was renamed to prevent accidental client-side imports of backend-only code.
// If you need backend Mongoose logic, import from this file on the server only.

const Department = require("../models/Department");
const Student = require("../models/Student");

const getAllDepartments = async () => {
  return await Department.find();
};

const getDepartmentById = async (id) => {
  return await Department.findById(id);
};

const updateDepartment = async (id, data) => {
  return await Department.findByIdAndUpdate(id, data, { new: true });
};

/**
 * Get a student by Mongo _id, studentId, or matricNumber (backend only)
 * @param {string} id - Mongo _id, studentId, or matricNumber
 * @returns {Promise<Object|null>} Student object or null
 */
async function getStudentByIdBackend(id) {
  if (!id) return null;
  // Try by Mongo _id
  let student = await Student.findById(id).populate("userId", "firstName lastName email");
  if (student) return student;
  // Try by studentId
  student = await Student.findOne({ studentId: id }).populate("userId", "firstName lastName email");
  if (student) return student;
  // Try by matricNumber
  student = await Student.findOne({ matricNumber: id }).populate("userId", "firstName lastName email");
  return student;
}

module.exports = {
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  getStudentByIdBackend,
};
