"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNotification } from "@/contexts/NotificationContext"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import { FileText, Upload, Check, Eye, Plus, Trash2 } from "lucide-react"
import { apiService } from "@/services/apiService"

// Type definitions
interface Department {
  _id: string;
  name: string;
  isRequired: boolean;
  requirements: string[];
  description?: string;
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadId?: string
}

/**
 * Clearance Application Page
 * Allows students to apply for clearance by selecting departments and uploading documents
 */
export default function ClearanceApplication() {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [clearanceType, setClearanceType] = useState<string>("graduation");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<any>({});
  const [errors, setErrors] = useState<any>({});

  // Departments as per standard clearance
  const mockDepartments: Department[] = [
    { id: "hod", name: "Head of Department", isRequired: true, requirements: ["All courses registered and passed, no references/outstanding courses"] },
    { id: "faculty", name: "Faculty", isRequired: true, requirements: ["Satisfied Faculty requirements for clearance"] },
    { id: "library", name: "University Library", isRequired: true, requirements: ["All library books returned"] },
    { id: "campuslife", name: "Campus Life Division", isRequired: true, requirements: ["Met all requirements for Campus Life Division"] },
    { id: "studentaffairs", name: "Student Affairs", isRequired: true, requirements: ["No disciplinary case, academic outfit returned for NYSC"] },
    { id: "summerschool", name: "Summer School", isRequired: false, requirements: ["Cleared from Summer School, no outstanding"] },
    { id: "bursary", name: "Bursary", isRequired: true, requirements: ["All required fees paid, no outstanding fees"] },
    { id: "alumni", name: "Office of Alumni Relations", isRequired: false, requirements: ["Met all requirements for Alumni Relations"] },
    { id: "certificate", name: "Certificate Screening Committee", isRequired: true, requirements: ["Credentials screened and not found wanting"] },
  ];

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/departments");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
          setSelectedDepartments(data.filter((d: Department) => d.isRequired).map((d: Department) => d._id));
        } else {
          // Use mockDepartments as fallback
          setDepartments(mockDepartments as any);
          setSelectedDepartments(mockDepartments.filter((d: any) => d.isRequired).map((d: any) => d.id));
          showNotification({
            type: "warning",
            title: "Using Mock Departments",
            message: "Could not fetch department list from server. Using default departments.",
          });
        }
      } catch (err) {
        setDepartments(mockDepartments as any);
        setSelectedDepartments(mockDepartments.filter((d: any) => d.isRequired).map((d: any) => d.id));
        showNotification({
          type: "error",
          title: "Failed to load departments",
          message: "Could not fetch department list from server. Using default departments.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
    // eslint-disable-next-line
  }, []);

  // Department selection
  const handleDepartmentToggle = (departmentId: string) => {
    const department = departments.find((d) => d._id === departmentId);
    if (department?.isRequired && selectedDepartments.includes(departmentId)) {
      showNotification({
        type: "warning",
        title: "Required Department",
        message: `${department.name} is required and cannot be deselected`,
      });
      return;
    }
    setSelectedDepartments((prev) =>
      prev.includes(departmentId) ? prev.filter((id) => id !== departmentId) : [...prev, departmentId]
    );
    if (errors.departments) {
      setErrors((prev: any) => ({ ...prev, departments: "" }));
    }
  };

  // File upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        await uploadSingleFile(file);
      }
      showNotification({
        type: "success",
        title: "Upload Complete",
        message: `${files.length} file(s) uploaded successfully`,
      });
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Upload Failed",
        message: error.message || "Failed to upload files",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const uploadSingleFile = async (file: File) => {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setUploadProgress((prev: any) => ({
      ...prev,
      [uploadId]: { name: file.name, progress: 0, status: "uploading" },
    }));
    setTimeout(() => {
      setUploadedFiles((prev) => [
        ...prev,
        {
          id: uploadId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          uploadId,
        },
      ]);
      setUploadProgress((prev: any) => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 100,
          status: "completed",
        },
      }));
      setTimeout(() => {
        setUploadProgress((prev: any) => {
          const newProgress = { ...prev };
          delete newProgress[uploadId];
          return newProgress;
        });
      }, 3000);
    }, 1000);
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
    showNotification({
      type: "info",
      title: "File Removed",
      message: "File removed from application",
    });
  };

  // Validation
  const validateForm = () => {
    const newErrors: any = {};
    if (selectedDepartments.length === 0) {
      newErrors.departments = "Please select at least one department";
    }
    if (!clearanceType) {
      newErrors.clearanceType = "Please select clearance type";
    }
    return newErrors;
  };

  // Submit
  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showNotification({
        type: "error",
        title: "Validation Error",
        message: "Please fix the errors before submitting",
      });
      return;
    }
    setSubmitting(true);
    try {
      // Prepare application data
      const applicationData = {
        departments: selectedDepartments,
        clearanceType,
        documents: uploadedFiles.map(f => f.id), // You may need to adjust this if backend expects file URLs or IDs from upload
      };
      // Get token
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");
      // Submit to backend
      await apiService.submitClearanceApplication(applicationData, token);
      showNotification({
        type: "success",
        title: "Application Submitted",
        message: "Your clearance application has been submitted successfully",
      });
      // Optionally redirect or refresh status/dashboard
      window.location.href = "/student/dashboard";
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Submission Failed",
        message: error.message || "Failed to submit application",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* <Header /> removed */}
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading application form..." />
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Header /> removed */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Apply for Clearance</h1>
          <p className="mt-1 text-sm text-gray-600">
            Select the departments you need clearance from and upload required documents
          </p>
        </div>
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Clearance Type Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Clearance Type *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "graduation", label: "Graduation", description: "Final clearance for graduation" },
                  { value: "transfer", label: "Transfer", description: "Transfer to another institution" },
                  { value: "withdrawal", label: "Withdrawal", description: "Withdrawal from university" },
                  { value: "semester", label: "Semester", description: "End of semester clearance" },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      clearanceType === type.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="clearanceType"
                      value={type.value}
                      checked={clearanceType === type.value}
                      onChange={(e) => setClearanceType(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">{type.label}</span>
                      <span className="block text-xs text-gray-500 mt-1">{type.description}</span>
                    </div>
                    {clearanceType === type.value && <Check className="h-5 w-5 text-blue-600 absolute top-4 right-4" />}
                  </label>
                ))}
              </div>
              {errors.clearanceType && <p className="mt-2 text-sm text-red-600">{errors.clearanceType}</p>}
            </div>
            {/* Department Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Select Departments *</h2>
              <div className="space-y-4">
                {departments.map((department) => (
                  <div key={department._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5 mt-1">
                        <input
                          id={`dept-${department._id}`}
                          type="checkbox"
                          checked={selectedDepartments.includes(department._id)}
                          onChange={() => handleDepartmentToggle(department._id)}
                          disabled={department.isRequired}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <label
                          htmlFor={`dept-${department._id}`}
                          className="text-sm font-medium text-gray-900 flex items-center cursor-pointer"
                        >
                          {department.name}
                          {department.isRequired && (
                            <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              Required
                            </span>
                          )}
                        </label>
                        {department.description && (
                          <p className="text-sm text-gray-600 mt-1">{department.description}</p>
                        )}
                        {department.requirements && department.requirements.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 mb-2 font-medium">Requirements:</p>
                            <ul className="text-xs text-gray-500 space-y-1">
                              {department.requirements.map((req: any, index: number) => (
                                <li key={index} className="flex items-center">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2 flex-shrink-0" />
                                  {typeof req === 'object' && req !== null ? req.name : req}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.departments && <p className="mt-2 text-sm text-red-600">{errors.departments}</p>}
            </div>
            {/* Document Upload */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Documents</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">Upload supporting documents</span>
                    <span className="mt-1 block text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG up to 10MB each</span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="sr-only"
                    disabled={uploading}
                  />
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    disabled={uploading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : "Choose Files"}
                  </button>
                </div>
              </div>
              {Object.keys(uploadProgress).length > 0 && (
                <div className="mt-4 space-y-2">
                  {Object.entries(uploadProgress).map(([uploadId, progress]: any) => (
                    <div key={uploadId} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{progress.name}</span>
                        <span className="text-sm text-gray-500">{progress.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progress.status === "failed"
                              ? "bg-red-500"
                              : progress.status === "completed"
                                ? "bg-green-500"
                                : "bg-blue-500"
                          }`}
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                      {progress.status === "failed" && <p className="text-xs text-red-600 mt-1">{progress.error}</p>}
                    </div>
                  ))}
                </div>
              )}
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Uploaded Files ({uploadedFiles.length})</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <FileText className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(file.url, "_blank")}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Preview file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveFile(file.id)}
                            className="p-1 text-red-400 hover:text-red-600"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Declaration Section */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Declaration</h2>
              <p className="text-sm text-gray-700 mb-2">I hereby confirm that the information provided above is true and correct to the best of my knowledge. I understand that any false information may lead to the cancellation of my clearance.</p>
            </div>
          </div>
        </div>
        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading || selectedDepartments.length === 0}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Submitting...</span>
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Submit Application
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
