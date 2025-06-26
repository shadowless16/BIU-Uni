"use client";

import { useState, useEffect } from "react";
import { Building, Phone, User, Mail, MapPin } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import departmentService from "@/services/departmentService";
import { useAuth } from "@/contexts/AuthContext";

export default function DepartmentProfile() {
  const { user } = useAuth();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch department profile from API
    const fetchDepartment = async () => {
      setLoading(true);
      setError("");
      try {
        console.log("User:", user);
        let deptId = user?.departmentId || user?.id;
        console.log("DepartmentId:", deptId);
        if (!deptId) throw new Error("No departmentId or user id found for user");
        const res = await fetch(`/api/department/departments/${deptId}`);
        if (!res.ok) throw new Error("Failed to fetch department profile");
        const data = await res.json();
        setDepartment(data);
        setForm({ ...data });
      } catch (err) {
        setDepartment(null);
        setForm(null);
        setError(err.message || "An error occurred loading department profile.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchDepartment();
    else {
      setLoading(false);
      setError("User not loaded. Please log in again.");
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setDepartment({ ...form });
      setEditMode(false);
      setSaving(false);
    }, 800);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded">Reload</button>
    </div>
  );
  if (!department) return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="bg-yellow-100 text-yellow-700 p-4 rounded mb-4">No department data found.</div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-6 mb-6">
        <img
          src={department.logoUrl}
          alt="Department Logo"
          className="w-20 h-20 rounded-full border shadow"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Building className="w-7 h-7 text-blue-600" />
            {department.name}
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" /> Head: {department.head}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        {editMode ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Head of Department</label>
                <input name="head" value={form.head} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input name="email" value={form.email} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input name="location" value={form.location} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Established</label>
                <input name="established" value={form.established} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Faculty Count</label>
                <input name="facultyCount" value={form.facultyCount} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" type="number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Student Count</label>
                <input name="studentCount" value={form.studentCount} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" type="number" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input name="website" value={form.website} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" rows={3} />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
              <button onClick={() => setEditMode(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-500" />
              <span className="text-gray-700">{department.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-blue-500" />
              <span className="text-gray-700">{department.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-500" />
              <span className="text-gray-700">{department.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-700">Established:</span>
              <span className="text-gray-700">{department.established}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-700">Faculty Count:</span>
              <span className="text-gray-700">{department.facultyCount}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-700">Student Count:</span>
              <span className="text-gray-700">{department.studentCount}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-700">Website:</span>
              <a href={department.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{department.website}</a>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">About</h2>
              <p className="text-gray-600">{department.description}</p>
            </div>
            <button onClick={() => setEditMode(true)} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Edit Profile</button>
          </>
        )}
      </div>
    </div>
  );
}
