import axios from "axios";

// Centralized Axios instance with baseURL "/api"
const api = axios.create({
  baseURL: "/api",
});

// Request interceptor to add authentication token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
