"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);
const API = process.env.NEXT_PUBLIC_API_URL;

function getSavedAuth() {
  if (typeof window === "undefined") return { token: null, user: null };
  try {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    return { token, user: user ? JSON.parse(user) : null };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const { user: initialUser, token: initialToken } = getSavedAuth();

  // Initialize user from localStorage immediately - no effect needed
  const [user, setUser] = useState(initialUser);

  // loading is only true when we have a token and are verifying it with /me
  // If no token exists we already know loading is done
  const [loading, setLoading] = useState(!!initialToken);

  const router = useRouter();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const { token, user: savedUser } = getSavedAuth();

    // No token → nothing to verify, loading was already set to false via useState
    if (!token || !savedUser) return;

    // Verify token freshness and get latest visibleFields from DB
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted.current) return;
        if (data.success) {
          localStorage.setItem("user", JSON.stringify(data.data));
          setUser(data.data);   // ✅ inside async callback, not sync in effect body
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);        // ✅ inside async callback
        }
      })
      .catch(() => {
        if (!isMounted.current) return;
        setUser(savedUser);     // ✅ inside async callback - keep cached on network error
      })
      .finally(() => {
        if (!isMounted.current) return;
        setLoading(false);      // ✅ inside async callback
      });
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.data));
    setUser(data.data);
    return data.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };

  const refreshUser = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.data));
        setUser(data.data);
      }
    } catch {}
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, getToken, refreshUser,
      isAdmin: () => user?.role === "admin",
      isViewer: () => user?.role === "viewer",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};