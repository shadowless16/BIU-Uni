// Student Service (MongoDB interaction)
const Student = require("../models/Student");

const getAllStudents = async () => {
  return await Student.find();
};

const getStudentById = async (id) => {
  return await Student.findById(id);
};

const updateStudent = async (id, data) => {
  return await Student.findByIdAndUpdate(id, data, { new: true });
};

const deleteStudent = async (id) => {
  return await Student.findByIdAndDelete(id);
};

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
