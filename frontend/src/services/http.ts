import axios from "axios";
import { clearSession, getAccessToken, getRefreshToken, updateAccessToken } from "./auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"
});

let refreshingPromise: Promise<string | null> | null = null;

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      const refresh = getRefreshToken();
      if (!refresh) {
        clearSession();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      if (!refreshingPromise) {
        refreshingPromise = refreshClient
          .post("/auth/refresh/", { refresh })
          .then((response) => {
            const nextAccessToken = response.data.access as string;
            updateAccessToken(nextAccessToken);
            return nextAccessToken;
          })
          .catch(() => {
            clearSession();
            return null;
          })
          .finally(() => {
            refreshingPromise = null;
          });
      }

      const nextAccessToken = await refreshingPromise;
      if (nextAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return api(originalRequest);
      }

      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
