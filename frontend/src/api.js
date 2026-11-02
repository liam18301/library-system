import axios from "axios";
import { clearSession } from "./auth";

const api = axios.create({ baseURL: "http://localhost:5000/api" });

// Send the login token with every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the session has expired, go back to the login page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !url.includes("/login")) {
      clearSession();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Turn any error into a message the librarian can read
export const errMsg = (e) =>
  e.response?.data?.error || "Cannot reach the server. Is the backend running?";

export default api;
