"use client";

import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useState, useEffect } from "react";

const DEPARTMENTS = [
  { value: "cs", label: "Computer Science" },
  { value: "ee", label: "Electrical Engineering" },
  { value: "me", label: "Mechanical Engineering" },
  // Add more departments as needed
];
const LEVELS = [
  { value: "100", label: "100" },
  { value: "200", label: "200" },
  { value: "300", label: "300" },
  { value: "400", label: "400" },
  { value: "500", label: "500" },
];

export default function StudentProfile() {
  const { user, loading: authLoading, updateProfile } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    phone: "",
    department: "",
    level: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [profilePic, setProfilePic] = useState<string>("/placeholder-user.jpg");
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

  // Fetch profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await fetch("https://biu-uni.onrender.com/api/student/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        // Log the data to debug field names
        console.log('Fetched profile data:', data);
        setProfile(data);
        setFormData({
          firstName: data.firstName || data.firstname || data.fname || "",
          lastName: data.lastName || data.lastname || data.lname || "",
          email: data.email || "",
          studentId: data.studentId || data.student_id || data.matricNo || "",
          phone: data.phone || data.phoneNumber || "",
          department: data.departmentId || data.department || "",
          level: data.level || data.classLevel || "",
        });
        if (data.profilePicUrl || data.profile_pic_url) setProfilePic(data.profilePicUrl || data.profile_pic_url);
      } catch (err) {
        // fallback to user context if fetch fails
        setProfile(user);
        setFormData({
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.email || "",
          studentId: user?.studentId || "",
          phone: user?.phone || "",
          department: user?.departmentId || "",
          level: user?.level || "",
        });
        if (user?.profilePicUrl) setProfilePic(user.profilePicUrl);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePic(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      // If profilePicFile exists, upload it (mocked here)
      let profilePicUrl = profile?.profilePicUrl;
      if (profilePicFile) {
        // TODO: Implement actual upload logic
        profilePicUrl = profilePic; // For now, just use preview URL
      }
      await updateProfile({ ...formData, profilePicUrl });
      setSuccess("Profile updated successfully.");
      setEditMode(false);
    } catch (err: any) {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading profile..." />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <div className="bg-white p-8 rounded shadow text-center">
            <h2 className="text-xl font-bold mb-2">Not logged in</h2>
            <p className="text-gray-600">Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h2>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <div className="relative mb-6">
            <img
              src={profilePic}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border-4 border-blue-100"
            />
            {editMode && (
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePicChange}
                />
                <span className="text-xs">Edit</span>
              </label>
            )}
          </div>
          {success && <div className="text-green-600 mb-4">{success}</div>}
          {error && <div className="text-red-600 mb-4">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div>
              <span className="block text-gray-500 text-sm mb-1">First Name</span>
              {editMode ? (
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="block w-full border rounded px-3 py-2"
                />
              ) : (
                <span className="block text-lg font-medium text-gray-900">{profile.firstName || "-"}</span>
              )}
            </div>
            <div>
              <span className="block text-gray-500 text-sm mb-1">Last Name</span>
              {editMode ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="block w-full border rounded px-3 py-2"
                />
              ) : (
                <span className="block text-lg font-medium text-gray-900">{profile.lastName || "-"}</span>
              )}
            </div>
            <div>
              <span className="block text-gray-500 text-sm mb-1">Email</span>
              <span className="block text-lg font-medium text-gray-900">{profile.email}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm mb-1">Student ID</span>
              {editMode ? (
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  className="block w-full border rounded px-3 py-2"
                />
              ) : (
                <span className="block text-lg font-medium text-gray-900">{profile.studentId || "-"}</span>
              )}
            </div>
            <div>
              <span className="block text-gray-500 text-sm mb-1">Phone</span>
              {editMode ? (
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full border rounded px-3 py-2"
                />
              ) : (
                <span className="block text-lg font-medium text-gray-900">{profile.phone || "-"}</span>
              )}
            </div>
            <div>
              <span className="block text-gray-500 text-sm mb-1">Department</span>
              {editMode ? (
                <select
                  name="department"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="block w-full border rounded px-3 py-2"
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(dep => (
                    <option key={dep.value} value={dep.value}>{dep.label}</option>
                  ))}
                </select>
              ) : (
                <span className="block text-lg font-medium text-gray-900">{profile.departmentId || "-"}</span>
              )}
            </div>
            <div>
              <span className="block text-gray-500 text-sm mb-1">Level</span>
              {editMode ? (
                <select
                  name="level"
                  value={formData.level}
                  onChange={e => setFormData({ ...formData, level: e.target.value })}
                  className="block w-full border rounded px-3 py-2"
                >
                  <option value="">Select Level</option>
                  {LEVELS.map(lvl => (
                    <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                  ))}
                </select>
              ) : (
                <span className="block text-lg font-medium text-gray-900">{profile.level || "-"}</span>
              )}
            </div>
            <div>
              <span className="block text-gray-500 text-sm mb-1">Role</span>
              <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold capitalize">{profile.role}</span>
            </div>
            {/* Additional Student fields */}
            <div>
              <span className="block text-gray-500 text-sm mb-1">Matric Number</span>
              <span className="block text-lg font-medium text-gray-900">{profile.matricNumber || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm mb-1">Faculty</span>
              <span className="block text-lg font-medium text-gray-900">{profile.faculty || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm mb-1">Admission Year</span>
              <span className="block text-lg font-medium text-gray-900">{profile.admissionYear || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm mb-1">Academic Session</span>
              <span className="block text-lg font-medium text-gray-900">{profile.academicSession || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm mb-1">CGPA</span>
              <span className="block text-lg font-medium text-gray-900">{profile.cgpa !== undefined ? profile.cgpa : "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm mb-1">Current Semester</span>
              <span className="block text-lg font-medium text-gray-900">{profile.currentSemester || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm mb-1">Graduation Status</span>
              <span className="block text-lg font-medium text-gray-900">{profile.graduationStatus || "-"}</span>
            </div>
            {/* Address */}
            <div className="md:col-span-2">
              <span className="block text-gray-500 text-sm mb-1">Address</span>
              <span className="block text-lg font-medium text-gray-900">
                {profile.address ? `${profile.address.street || ""}, ${profile.address.city || ""}, ${profile.address.state || ""}, ${profile.address.country || ""}` : "-"}
              </span>
            </div>
            {/* Emergency Contact */}
            <div className="md:col-span-2">
              <span className="block text-gray-500 text-sm mb-1">Emergency Contact</span>
              <span className="block text-lg font-medium text-gray-900">
                {profile.emergencyContact ? `${profile.emergencyContact.name || ""} (${profile.emergencyContact.relationship || ""}) - ${profile.emergencyContact.phone || ""}` : "-"}
              </span>
            </div>
            {/* User fields */}
            <div>
              <span className="block text-gray-500 text-sm mb-1">Profile Complete</span>
              <span className="block text-lg font-medium text-gray-900">{profile.profileComplete ? "Yes" : "No"}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm mb-1">Last Login</span>
              <span className="block text-lg font-medium text-gray-900">{profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : "-"}</span>
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            {editMode ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded shadow hover:bg-gray-300"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded shadow hover:bg-blue-600"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
