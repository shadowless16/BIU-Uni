// ApiService for real backend API calls
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://biu-uni.onrender.com/api";

class ApiService {
  async login(credentials: any) {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    return res.data;
  }
  async register(userData: any) {
    const res = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    return res.data;
  }
  async verifyToken(token: string) {
    const res = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
  async refreshToken(refreshToken: string) {
    const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
    return res.data;
  }
  async forgotPassword(email: string) {
    const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
    return res.data;
  }
  async getStudentDashboard(token: string) {
    const res = await axios.get(`${API_BASE_URL}/student/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
  async submitClearanceApplication(applicationData: any, token: string) {
    const res = await axios.post(`${API_BASE_URL}/student/clearance/apply`, applicationData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
  async updateProfile(data: any, token: string) {
    const res = await axios.put(`${API_BASE_URL}/student/profile`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
}

export const apiService = new ApiService();
