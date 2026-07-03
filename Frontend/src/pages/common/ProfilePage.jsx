// common/ProfilePage.jsx and SettingsPage.jsx are role-specific
// These are catch-all stubs in case used directly
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProfilePage = () => {
  const { role } = useAuth();
  if (role === "FARMER_GROUP") return <Navigate to="/dashboard/farmer/profile" replace />;
  if (role === "COLLECTIVE") return <Navigate to="/dashboard/collective/profile" replace />;
  return <Navigate to="/" replace />;
};

export default ProfilePage;
