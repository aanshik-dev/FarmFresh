import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "../components/ui";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const userStr = searchParams.get("user");

    if (accessToken && refreshToken && userStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userStr));
        
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(userData));

        // Determine redirect path based on role
        let redirectPath = "/";
        if (userData.role === "FARMER_GROUP") redirectPath = "/dashboard/farmer/overview";
        else if (userData.role === "COLLECTIVE") redirectPath = "/dashboard/collective/overview";
        else if (userData.role === "ADMIN") redirectPath = "/dashboard/admin/overview";

        // Directly reload the app or update context if setUser was exposed
        window.location.href = redirectPath;
      } catch (err) {
        toast.error("Failed to parse OAuth user data");
        navigate("/login");
      }
    } else {
      toast.error("OAuth login failed");
      navigate("/login");
    }
  }, [searchParams, navigate, toast]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-medium">Authenticating...</p>
        <p className="text-sm text-slate-500">Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
