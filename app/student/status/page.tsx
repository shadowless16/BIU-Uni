"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useRouter } from "next/navigation";

/**
 * Status Tracking Page
 * Modern, visually appealing status tracking for student clearance
 */
export default function StatusTracking() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log user object
  useEffect(() => {
    console.log("user in status page:", user);
  }, [user]);

  useEffect(() => {
    let didCancel = false;
    const fetchData = async (retryCount = 0) => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          router.replace("/login");
          return;
        }
        const dashboard = await require("@/services/apiService").apiService.getStudentDashboard(
          token
        );
        console.log("Fetched dashboard:", dashboard); // Debug log
        let statusArr: { id: string; title: string; department: string; clearanceStatus: string; description: string; date: string }[] = [];
        if (dashboard && dashboard.recentActivity && Array.isArray(dashboard.recentActivity)) {
          statusArr = dashboard.recentActivity.map((activity: any, idx: number) => ({
            id: activity.id?.toString() || idx.toString(),
            title: activity.title || (activity.department ? `${activity.department} Clearance` : 'Clearance'),
            department: activity.department || '',
            clearanceStatus: activity.status ? activity.status.charAt(0).toUpperCase() + activity.status.slice(1) : '',
            description: activity.remarks || activity.description || '',
            date: activity.date || activity.updatedAt || activity.createdAt || '',
          }));
        } else {
          console.warn("No recentActivity found in dashboard:", dashboard); // Debug log
        }
        if (!didCancel) {
          setStatusData(statusArr);
          setLoading(false);
        }
      } catch (err) {
        const error = err as any;
        console.error("Error fetching status:", error); // Debug log
        let message = error.message;
        if (message === "Not authenticated") {
          router.replace("/login");
          return;
        }
        if (error.response && error.response.status === 429) {
          if (retryCount < 3) {
            // Exponential backoff: wait and retry
            setTimeout(() => fetchData(retryCount + 1), 1000 * Math.pow(2, retryCount));
            return;
          }
          message = "You are making requests too quickly. Please wait a moment and try again.";
        }
        if (!didCancel) {
          setError(message);
          showNotification({
            title: "Error",
            message,
            type: "error",
          });
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [showNotification]);

  if (authLoading)
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        Loading user...
      </div>
    );
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        Loading status...
      </div>
    );
  if (error)
    return <div className="text-red-600 text-center mt-8">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Clearance Status
        </h2>
        <div className="space-y-6">
          {statusData?.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
              No status updates found.
            </div>
          )}
          {statusData?.map((status) => (
            <div
              key={status.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {status.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                    {status.department}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      status.clearanceStatus === "Approved"
                        ? "bg-green-100 text-green-800"
                        : status.clearanceStatus === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {status.clearanceStatus}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{status.description}</p>
              </div>
              <div className="mt-4 md:mt-0 md:text-right">
                <span className="text-sm text-gray-500">{status.date}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
