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
    // TODO: call login service, store user in localStorage and state
  }, []);

  const logout = useCallback(() => {
    // TODO: call logout service, clear localStorage and user state
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const updateUser = useCallback(
    (data) => {
      // TODO: call update-user service and sync to localStorage/state
      const updated = { ...user, ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      return updated;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role || null,
        login,
        logout,
        updateUser,
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
