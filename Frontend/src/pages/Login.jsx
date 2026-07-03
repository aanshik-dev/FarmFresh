import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Button, Input, useToast } from "../components/ui";
import SlideToggle from "../components/common/SlideToggle";

const ROLE_OPTIONS = [
  { value: "FARMER_GROUP", label: "Farmer Group", icon: "ph:plant-fill" },
  { value: "COLLECTIVE",   label: "Collective",   icon: "ph:buildings-fill" },
];

const Login = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const [role, setRole]         = useState("FARMER_GROUP");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedInUser = await login(email, password, email === "admin@farmfresh.com" ? undefined : role);
      toast.success("Welcome back to FarmFresh!", { title: "Logged in" });
      const userRole = loggedInUser?.role || role;
      if (userRole === "FARMER_GROUP") navigate("/dashboard/farmer/overview");
      else if (userRole === "COLLECTIVE") navigate("/dashboard/collective/overview");
      else if (userRole === "ADMIN") navigate("/dashboard/admin/overview");
      else navigate("/");
    } catch (err) {
      toast.error(err.message || "Login failed.", { title: "Error" });
    } finally {
      setLoading(false);
    }
  };

  const demoHints = {
    FARMER_GROUP: "farmer@farmfresh.com",
    COLLECTIVE:   "collective@farmfresh.com",
    ADMIN:        "admin@farmfresh.com",
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center px-4 sm:px-6 pt-24 pb-16 transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Background glows */}
      <div className="pointer-events-none fixed -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/8 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-400/6 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden ${
          isDark ? "bg-slate-900/80 border-slate-800 shadow-black/50 backdrop-blur-md" : "bg-white border-slate-200 shadow-slate-300/40"
        }`}
      >
        {/* Card header */}
        <div className={`px-7 pt-7 pb-5 border-b ${isDark ? "border-slate-800/60" : "border-slate-100"}`}>
          <div className="flex flex-col items-center gap-3 mb-5 text-center">
            <div className={`p-3 rounded-2xl ${isDark ? "bg-emerald-800/50 text-emerald-300" : "bg-emerald-100 text-emerald-600"}`}>
              <Icon icon="ph:plant-fill" className="w-7 h-7" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold quantico uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>Sign In</h1>
              <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Access your FarmFresh account</p>
            </div>
          </div>

          {/* Role toggle */}
          <SlideToggle options={ROLE_OPTIONS} value={role} onChange={setRole} size="md" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder={demoHints[role]}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon="ph:envelope-fill"
            required
            hint={`Demo: ${demoHints[role]} / password`}
          />

          {/* Password with show/hide */}
          <div className="space-y-1.5">
            <label className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Icon icon="ph:lock-key-fill" className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
              </div>
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full rounded-xl border text-sm pl-10 pr-10 py-2.5 outline-none transition-all focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 ${
                  isDark ? "bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
              >
                <Icon icon={showPass ? "ph:eye-slash-fill" : "ph:eye-fill"} className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className={`flex items-center gap-2 cursor-pointer select-none text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="rounded accent-emerald-500 w-4 h-4" />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm text-emerald-500 hover:text-emerald-400 font-medium">Forgot password?</Link>
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            {loading ? "Signing in…" : "Sign In"}
          </Button>

          {/* Admin login hint */}
          <button
            type="button"
            onClick={() => { setEmail("admin@farmfresh.com"); setPassword("password"); }}
            className={`w-full text-xs text-center py-2 rounded-lg border border-dashed transition-colors cursor-pointer ${isDark ? "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600" : "border-slate-300 text-slate-400 hover:text-slate-600"}`}
          >
            <Icon icon="ph:shield-fill" className="w-3 h-3 inline mr-1 text-amber-400" />
            Fill Admin credentials
          </button>
        </form>

        <div className={`px-7 py-4 border-t text-center ${isDark ? "border-slate-800/60" : "border-slate-100"}`}>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Don't have an account?{" "}
            <Link to="/register" className="text-emerald-500 hover:text-emerald-400 font-semibold">Create one →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
