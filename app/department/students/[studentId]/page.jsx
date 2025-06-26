"use client"

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getStudentById } from "@/services/departmentService";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Link from "next/link";
import { User, Phone, Hash, Clock, ArrowLeft } from "lucide-react";

export default function DepartmentStudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params?.studentId;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    setError("");
    getStudentById(studentId)
      .then((data) => setStudent(data))
      .catch(() => setError("Failed to fetch student details"))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  if (!student) {
    return <div className="text-center py-8">Student not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <button
        className="mb-6 flex items-center text-blue-600 hover:underline"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-5 w-5 mr-1" /> Back
      </button>
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center mb-6">
          <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mr-6">
            {student.profilePicture || (student.userId && student.userId.profilePicture) ? (
              <img
                src={student.profilePicture || (student.userId && student.userId.profilePicture)}
                alt="Profile"
                className="h-20 w-20 object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-gray-400" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {(student.firstName || (student.userId && student.userId.firstName) || "") +
                ((student.lastName || (student.userId && student.userId.lastName))
                  ? ` ${(student.lastName || (student.userId && student.userId.lastName))}`
                  : "") ||
                student.matricNumber ||
                "No Name"}
            </h2>
            <div className="flex gap-2 text-gray-500 text-sm">
              <span className="flex items-center"><Hash className="h-4 w-4 mr-1" />{student.matricNumber || student.studentId || "-"}</span>
              <span className="flex items-center"><Phone className="h-4 w-4 mr-1" />{student.phone || (student.userId && student.userId.phone) || "-"}</span>
              <span className="flex items-center"><Clock className="h-4 w-4 mr-1" />{student.updatedAt ? new Date(student.updatedAt).toLocaleDateString() : "-"}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <span className="font-semibold">Status:</span> {student.status || student.graduationStatus || "pending"}
          </div>
          <div>
            <span className="font-semibold">Department:</span> {student.departmentName || student.department || "-"}
          </div>
          <div>
            <span className="font-semibold">Email:</span> {student.email || (student.userId && student.userId.email) || "-"}
          </div>
          <div>
            <span className="font-semibold">Faculty:</span> {student.faculty || "-"}
          </div>
          <div>
            <span className="font-semibold">Level:</span> {student.level || "-"}
          </div>
          <div>
            <span className="font-semibold">Admission Year:</span> {student.admissionYear || "-"}
          </div>
          <div>
            <span className="font-semibold">Academic Session:</span> {student.academicSession || "-"}
          </div>
          <div>
            <span className="font-semibold">CGPA:</span> {student.cgpa !== undefined ? student.cgpa : "-"}
          </div>
          <div>
            <span className="font-semibold">Current Semester:</span> {student.currentSemester || "-"}
          </div>
          <div>
            <span className="font-semibold">Graduation Status:</span> {student.graduationStatus || "-"}
          </div>
          <div>
            <span className="font-semibold">Address:</span> {student.address ? `${student.address.street || ""}, ${student.address.city || ""}, ${student.address.state || ""}, ${student.address.country || ""}` : "-"}
          </div>
          <div>
            <span className="font-semibold">Emergency Contact:</span> {student.emergencyContact ? `${student.emergencyContact.name || ""} (${student.emergencyContact.relationship || ""}) - ${student.emergencyContact.phone || ""}` : "-"}
          </div>
          <div>
            <span className="font-semibold">Last Login:</span> {student.lastLogin ? new Date(student.lastLogin).toLocaleString() : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
