import { useAuth } from "@/context/AuthContext";

export function useAuthFetch() {
  const { getToken, logout } = useAuth();

  const authFetch = async (url, options = {}) => {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(url, { ...options, headers });

    // Auto-logout on 401
    if (res.status === 401) {
      logout();
      throw new Error("Session expired. Please login again.");
    }

    return res;
  };

  return authFetch;
}