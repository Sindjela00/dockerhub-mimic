/// <reference types="vite/client" />

import axios from "axios";

const api = axios.create({
  baseURL: "/",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    } else if (
      error.response?.status === 403 &&
      error.response?.data?.code === "MUST_CHANGE_PASSWORD"
    ) {
      localStorage.setItem("mustChangePassword", "true");
      window.location.href = "/change-password?forced=true";
    }
    return Promise.reject(error);
  },
);

export default api;
