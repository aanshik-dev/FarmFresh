import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui";
import SlideToggle from "../components/common/SlideToggle";
import { forgotPasswordOtp } from "../services/auth.service";

const ROLE_OPTIONS = [
  { value: "FARMER_GROUP", label: "Farmer Group", icon: "ph:plant-fill" },
  { value: "COLLECTIVE", label: "Collective", icon: "ph:buildings-fill" },
];

const HERO_FEATURES = [
  { icon: "ph:plant-fill", label: "Crop lifecycle tracking" },
  { icon: "ph:calendar-check-fill", label: "Smart pickup scheduling" },
  { icon: "ph:map-trifold-fill", label: "Zone-based management" },
];

const Login = () => {
  const { isDark } = useTheme();
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState("FARMER_GROUP");
  const [email, setEmail] = useState("aanshiksingh@gmail.com");
  const [password, setPassword] = useState("password");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [Remember, setRemember] = useState(false);

  // Forgot-password panel state
  const [showForgotPanel, setShowForgotPanel] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedInUser = await login(email, password, role);
      toast.success("Welcome back to FarmFresh!", { title: "Logged in" });
      const userRole = loggedInUser?.role;
      if (userRole === "FARMER_GROUP") navigate("/dashboard/farmer/overview");
      else if (userRole === "COLLECTIVE")
        navigate("/dashboard/collective/overview");
      else if (userRole === "ADMIN") navigate("/dashboard/admin/overview");
      else navigate("/");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err.message || "Login failed.",
        { title: "Error" },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    setForgotLoading(true);
    try {
      await forgotPasswordOtp(forgotEmail.trim());
      toast.success(
        "OTP sent to your email. Check your inbox and spam folder.",
        { title: "OTP Sent", duration: 8000 },
      );
      setShowForgotPanel(false);
      setForgotEmail("");
      // TODO: Once backend /auth/reset-password endpoint is ready,
      // open an OTP + new-password form here to complete the reset flow.
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err.message || "Failed to send OTP.",
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* ── LEFT HERO PANEL (hidden on mobile) ── */}
      <div
        className={`hidden lg:flex flex-col justify-between relative w-1/2 overflow-hidden pb-25 pt-30 px-24 gap-6 ${
          isDark
            ? "bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900"
            : "bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700"
        }`}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-400/10 blur-2xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          onClick={() => navigate("/")}
          className="text-white text-lg flex items-center gap-2 cursor-pointer mb-3"
        >
          <Icon
            width={20}
            height={20}
            icon="material-symbols:arrow-back-ios-new-rounded"
          />
          Back
        </motion.div>
        {/* Center content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="z-10 space-y-8"
        >
          <div>
            <h2 className="text-5xl font-extrabold text-white leading-14 mb-4">
              The
              <span className="text-amber-300"> Digital Hub</span> for
              <br />
              Modern Farmers
            </h2>
            <p className="text-emerald-100/80 text-base leading-relaxed max-w-sm">
              Connecting organic farmer groups with collectives for seamless
              harvest coordination, transparent pricing, and reduced
              post-harvest loss.
            </p>
          </div>

          <div className="space-y-3">
            {HERO_FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon icon={f.icon} className="w-4 h-4 text-white" />
                </div>
                <span className="text-emerald-100/90 text-sm font-medium">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom stat bar */}
        <div className="flex items-center gap-6 z-10">
          {[
            { value: "12+", label: "Farmer Groups" },
            { value: "40%", label: "Less Decay" },
            { value: "5", label: "Collectives" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-emerald-200/70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div
        className={`flex-1 flex flex-col items-center justify-center px-5 sm:px-10 py-8 lg:py-24 ${
          isDark ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        {/* Mobile-only brand */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div
            className={`p-1.5 rounded-lg ${isDark ? "bg-emerald-800/70 text-emerald-300" : "bg-emerald-100 text-emerald-600"}`}
          >
            <Icon icon="ph:plant-fill" className="w-5 h-5" />
          </div>
          <span
            className={`font-bold quantico uppercase tracking-widest text-sm ${isDark ? "text-white" : "text-slate-900"}`}
          >
            FarmFresh
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Heading */}
          <div className="mb-8 text-center lg:text-left">
            <h1
              className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Welcome back
            </h1>
            <p
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Sign in to your FarmFresh account
            </p>
          </div>

          {/* Role toggle */}
          <div className="mb-6">
            <p
              className={`text-xs font-medium mb-2 uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Account Type
            </p>
            <SlideToggle
              options={ROLE_OPTIONS}
              value={role}
              onChange={setRole}
              size="md"
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Email Address
              </label>
              <div className="relative">
                <Icon
                  icon="ph:envelope-fill"
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                />
                <input
                  type="email"
                  placeholder={
                    role === "FARMER_GROUP"
                      ? "farmer@farmfresh.com"
                      : "collective@farmfresh.com"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full rounded-xl border text-sm pl-10 pr-4 py-3 outline-none transition-all focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
                    isDark
                      ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600"
                      : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Password
              </label>
              <div className="relative">
                <Icon
                  icon="ph:lock-key-fill"
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full rounded-xl border text-sm pl-10 pr-10 py-3 outline-none transition-all focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
                    isDark
                      ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600"
                      : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <Icon
                    icon={showPass ? "ph:eye-slash-fill" : "ph:eye-fill"}
                    className="w-4 h-4"
                  />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />{" "}
                  Signing in…
                </>
              ) : (
                <>
                  <Icon icon="ph:sign-in-fill" className="w-4 h-4" /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Social Login Separator */}
          <div className="flex items-center my-6">
            <div
              className={`flex-grow border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}
            ></div>
            <span
              className={`px-3 text-xs uppercase ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Or continue with
            </span>
            <div
              className={`flex-grow border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}
            ></div>
          </div>

          {/* Google Login Button */}
          <a
            href={`${import.meta.env.VITE_BACKEND_URL}/api/auth/google`}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isDark
                ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            }`}
          >
            <Icon icon="logos:google-icon" className="w-4 h-4" />
            Sign in with Google
          </a>

          <div
            className={`flex justify-between py-3 mt-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                className="accent-emerald-400 border-emerald-400 cursor-pointer"
                type="checkbox"
                checked={Remember}
                onChange={() => setRemember(!Remember)}
              />
              Remember me
            </label>

            <button
              type="button"
              onClick={() => setShowForgotPanel((p) => !p)}
              className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {/* Forgot-password inline panel */}
          <AnimatePresence>
            {showForgotPanel && (
              <motion.form
                key="forgot"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleForgotPassword}
                className={`overflow-hidden rounded-xl border px-4 py-4 space-y-3 ${
                  isDark
                    ? "bg-slate-900 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    isDark ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  Reset your password
                </p>
                <p
                  className={`text-xs ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Enter your registered email and we&apos;ll send you an OTP.
                </p>
                <div className="relative">
                  <Icon
                    icon="ph:envelope-fill"
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className={`w-full rounded-xl border text-sm pl-10 pr-4 py-2.5 outline-none transition-all focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
                      isDark
                        ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600"
                        : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <>
                      <Icon
                        icon="svg-spinners:ring-resize"
                        className="w-4 h-4"
                      />
                      Sending OTP…
                    </>
                  ) : (
                    <>
                      <Icon icon="ph:paper-plane-fill" className="w-4 h-4" />
                      Send OTP
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p
            className={`text-center text-sm mt-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-emerald-500 hover:text-emerald-400 font-semibold"
            >
              Register
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
