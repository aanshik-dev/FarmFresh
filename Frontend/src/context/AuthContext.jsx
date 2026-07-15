import React, { createContext, useContext, useState, useCallback } from "react";
import { login as loginService } from "../services/auth.service";
import { getCurrentUser } from "../services/user.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [profileLoading, setProfileLoading] = useState(false);

  const login = useCallback(async (email, password, role) => {
    const data = await loginService(email, password, role);
    const { accessToken, refreshToken, user: userData } = data;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));

    sessionStorage.removeItem("profile_banner_dismissed");

    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("profile_banner_dismissed");
    setUser(null);
  }, []);

  const updateUser = useCallback(
    (data) => {
      const updated = { ...user, ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      return updated;
    },
    [user],
  );

  const fetchAndSyncUser = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setProfileLoading(true);
    try {
      const freshUser = await getCurrentUser();
      const merged = { ...freshUser };
      localStorage.setItem("user", JSON.stringify(merged));
      setUser(merged);
    } catch (err) {
      console.warn("fetchAndSyncUser failed:", err?.response?.status);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role || null,
        profileLoading,
        login,
        logout,
        updateUser,
        fetchAndSyncUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
