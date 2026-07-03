import React, { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

// Mock user database — replace with real API calls when backend is ready
const MOCK_USERS = {
  "farmer@farmfresh.com": {
    id: "fg_001",
    name: "Debendra Semwal",
    email: "farmer@farmfresh.com",
    role: "FARMER_GROUP",
    groupName: "Triyuginarayan Organic Pulse Pioneers",
    profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    isProfileComplete: false,
    phone: "+91 94120 78234",
    address: "",
    description: "",
    crops: [],
    coordinates: null,
    numberOfFarmers: 12,
    leadFarmerName: "Debendra Semwal",
  },
  "collective@farmfresh.com": {
    id: "col_001",
    name: "Ravi Kumar Sharma",
    email: "collective@farmfresh.com",
    role: "COLLECTIVE",
    collectiveName: "Mandakini Organic Collective",
    profilePhoto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
    isProfileComplete: false,
    phone: "+91 1372 264211",
    address: "",
    description: "",
    workers: 0,
    crops: [],
    coordinates: null,
  },
  "admin@farmfresh.com": {
    id: "adm_001",
    name: "System Administrator",
    email: "admin@farmfresh.com",
    role: "ADMIN",
    profilePhoto: null,
    isProfileComplete: true,
    phone: null,
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("farmfresh-user");
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
    localStorage.setItem("farmfresh-user", JSON.stringify(mockUser));
    setUser(mockUser);
    return mockUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("farmfresh-user");
    setUser(null);
  }, []);

  const updateUser = useCallback(
    (data) => {
      const updated = { ...user, ...data };
      localStorage.setItem("farmfresh-user", JSON.stringify(updated));
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
