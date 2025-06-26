// Clearance Service (MongoDB interaction)
const Clearance = require("../models/Clearance");

const getAllClearanceRequests = async () => {
  return await Clearance.find();
};

const approveClearanceRequest = async (id, departmentId, departmentSubdocId, approvedBy, remarks) => {
  const clearance = await Clearance.findById(id);
  if (!clearance) return null;
  const targetDeptId = departmentSubdocId || departmentId;
  // Debug log for troubleshooting
  console.log('[approveClearanceRequest] targetDeptId:', targetDeptId);
  console.log('[approveClearanceRequest] clearance.departments:', clearance.departments.map(d => ({ _id: d._id, departmentId: d.departmentId, name: d.departmentName })));
  await clearance.updateDepartmentStatus(targetDeptId, "approved", approvedBy, remarks);
  return clearance;
};

const rejectClearanceRequest = async (id, comment) => {
  return await Clearance.findByIdAndUpdate(
    id,
    { status: "rejected", ...(comment && { comment }) },
    { new: true }
  );
};

module.exports = {
  getAllClearanceRequests,
  approveClearanceRequest,
  rejectClearanceRequest,
};
