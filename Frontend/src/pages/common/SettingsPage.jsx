import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const SettingsPage = () => {
  const { role } = useAuth();
  if (role === "FARMER_GROUP") return <Navigate to="/dashboard/farmer/settings" replace />;
  if (role === "COLLECTIVE") return <Navigate to="/dashboard/collective/settings" replace />;
  if (role === "ADMIN") return <Navigate to="/dashboard/admin/settings" replace />;
  return <Navigate to="/" replace />;
};

export default SettingsPage;
