import React, { createContext, useContext, useState, useCallback } from "react";

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

  const login = useCallback(async (email, password, role) => {
    await new Promise((r) => setTimeout(r, 900));
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (!mockUser) throw new Error("No account found with this email.");
    if (password !== "password") throw new Error("Invalid password. (hint: use 'password')");
    if (role && mockUser.role !== role) {
      throw new Error(
        `This account is registered as ${mockUser.role === "FARMER_GROUP" ? "Farmer Group" : "Collective"}, not ${role === "FARMER_GROUP" ? "Farmer Group" : "Collective"}.`
      );
    }
    localStorage.setItem("user", JSON.stringify(mockUser));
    setUser(mockUser);
    return mockUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const updateUser = useCallback(
    (data) => {
      const updated = { ...user, ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      return updated;
    },
    [user]
  );

  const register = useCallback(async (formData, role) => {
    // Simulate API delay for registration
    await new Promise((r) => setTimeout(r, 800));
    // Mock: always succeeds
    return { success: true };
  }, []);

  const sendOTP = useCallback(async (phone) => {
    await new Promise((r) => setTimeout(r, 600));
    // Mock OTP is always 123456
    return { success: true, mockOtp: "123456" };
  }, []);

  const verifyOTP = useCallback(async (phone, otp) => {
    await new Promise((r) => setTimeout(r, 400));
    return otp === "123456";
  }, []);

  const markProfileComplete = useCallback(() => {
    updateUser({ isProfileComplete: true });
  }, [updateUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role || null,
        login,
        logout,
        updateUser,
        register,
        sendOTP,
        verifyOTP,
        markProfileComplete,
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
