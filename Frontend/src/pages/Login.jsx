import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui";
import SlideToggle from "../components/common/SlideToggle";
import { forgotPasswordOtp, resetPassword } from "../services/auth.service";

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
  const [searchParams, setSearchParams] = useSearchParams();

  const [role, setRole] = useState("FARMER_GROUP");
  const [email, setEmail] = useState("aanshiksingh@gmail.com");
  const [password, setPassword] = useState("password");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [Remember, setRemember] = useState(false);

  // Forgot-password panel state
  const [showForgotPanel, setShowForgotPanel] = useState(false);
  const [fEmail, setFEmail] = useState("");
  const [fOtp, setFOtp] = useState("");
  const [fPassword, setFPassword] = useState("");
  const [fConfirm, setFConfirm] = useState("");
  const [fLoading, setFLoading] = useState(false);
  const [fShowPass, setFShowPass] = useState(false);
  const [fShowConfirm, setFShowConfirm] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const toastShown = useRef(false);

  useEffect(() => {
    let t;
    if (resendTimer > 0)
      t = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const fmtTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (searchParams.get("error") === "oauth_failed" && !toastShown.current) {
      toastShown.current = true;
      const msg =
        searchParams.get("message") ||
        "Google sign-in failed. Please try again.";
      toast.error(decodeURIComponent(msg), { title: "OAuth Error" });
      setSearchParams({}); // React Router way to clean URL
    }
  }, [searchParams, setSearchParams, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email address.");
      return;
    }
    if (!password) {
      toast.error("Password is required.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

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

  const handleSendForgotOtp = async () => {
    if (!fEmail.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fEmail)) {
      toast.error("Invalid email address.");
      return;
    }
    setFLoading(true);
    try {
      await forgotPasswordOtp(fEmail.trim());
      toast.success(
        "OTP sent to your email. Check your inbox and spam folder.",
        { title: "OTP Sent", duration: 8000 },
      );
      setResendTimer(90);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err.message || "Failed to send OTP.",
      );
    } finally {
      setFLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!fEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fEmail)) {
      toast.error("Valid email is required to reset password.");
      return;
    }
    if (fOtp.length < 6) {
      toast.error("Please enter the full 6-digit OTP.");
      return;
    }
    if (fPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (fPassword !== fConfirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setFLoading(true);
    try {
      await resetPassword(fEmail.trim(), fOtp, fPassword);

      toast.success("Password reset successfully! You can now log in.", {
        title: "Success",
        duration: 6000,
      });
      setShowForgotPanel(false);
      setFEmail("");
      setFOtp("");
      setFPassword("");
      setFConfirm("");
      setResendTimer(0);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reset failed. Try again.");
    } finally {
      setFLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* ── LEFT HERO PANEL (hidden on mobile) ── */}
      <div
        className={`hidden lg:flex flex-col justify-between relative w-1/2 overflow-hidden pb-25 pt-26 px-24 gap-6 ${
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
        <div className="flex items-center pt-3 gap-6 z-10">
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
        className={`flex-1 flex flex-col items-center justify-center px-5 sm:px-10 py-8 lg:pt-22 lg:pb-16 ${
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
          <div className="w-full max-w-md relative overflow-hidden px-1 py-1">
            <AnimatePresence mode="wait">
              {!showForgotPanel ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Heading */}
                  <div className="mb-6 text-center lg:text-left">
                    <h1
                      className={`text-3xl font-bold mb-1.5 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {role === "ADMIN" ? (
                        <>
                          <Icon
                            icon="ph:shield-check-fill"
                            className="text-violet-500"
                          />
                          Admin Login
                        </>
                      ) : (
                        "Welcome back"
                      )}
                    </h1>
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {role === "ADMIN"
                        ? "Sign in to access the administrator portal"
                        : "Sign in to your FarmFresh account"}
                    </p>
                  </div>

                  {/* Role toggle and Admin button */}
                  <div className="mb-4 flex items-end gap-3">
                    <div className="flex-1">
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
                    <button
                      type="button"
                      onClick={() =>
                        setRole(role === "ADMIN" ? "FARMER_GROUP" : "ADMIN")
                      }
                      className={`h-11 px-4 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all border ${
                        role === "ADMIN"
                          ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20"
                          : isDark
                            ? "bg-slate-800/70 border-slate-700/60 text-slate-400 hover:text-violet-400 hover:border-violet-500/50"
                            : "bg-slate-100 border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-300"
                      }`}
                    >
                      <Icon icon="ph:shield-check-fill" className="w-4 h-4" />
                      Admin
                    </button>
                  </div>

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="space-y-3"
                  >
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
                            role === "ADMIN"
                              ? "admin@farmfresh.com"
                              : role === "FARMER_GROUP"
                                ? "farmer@farmfresh.com"
                                : "collective@farmfresh.com"
                          }
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className={`w-full rounded-xl border text-sm pl-10 pr-4 py-3 outline-none transition-all focus:ring-2 ${
                            role === "ADMIN"
                              ? "focus:ring-violet-500/40 focus:border-violet-500"
                              : "focus:ring-emerald-500/40 focus:border-emerald-500"
                          } ${
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
                          className={`w-full rounded-xl border text-sm pl-10 pr-10 py-3 outline-none transition-all focus:ring-2 ${
                            role === "ADMIN"
                              ? "focus:ring-violet-500/40 focus:border-violet-500"
                              : "focus:ring-emerald-500/40 focus:border-emerald-500"
                          } ${
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
                            icon={
                              showPass ? "ph:eye-slash-fill" : "ph:eye-fill"
                            }
                            className="w-4 h-4"
                          />
                        </button>
                      </div>
                    </div>

                    <div
                      className={`flex justify-between pb-1.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          className={`accent-emerald-400 border-emerald-400 cursor-pointer ${role === "ADMIN" ? "hidden" : ""}`}
                          type="checkbox"
                          checked={Remember}
                          onChange={() => setRemember(!Remember)}
                        />
                        <span className={role === "ADMIN" ? "hidden" : ""}>
                          Remember me
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowForgotPanel(true)}
                        className={`transition-colors text-sm cursor-pointer ${
                          role === "ADMIN"
                            ? "text-violet-400 hover:text-violet-300"
                            : "text-emerald-400 hover:text-emerald-300"
                        }`}
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full py-3 rounded-xl font-semibold text-sm text-white shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                        role === "ADMIN"
                          ? "bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 shadow-violet-500/20"
                          : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/20"
                      }`}
                    >
                      {loading ? (
                        <>
                          <Icon
                            icon="svg-spinners:ring-resize"
                            className="w-4 h-4"
                          />{" "}
                          Signing in…
                        </>
                      ) : (
                        <>
                          <Icon icon="ph:sign-in-fill" className="w-4 h-4" />{" "}
                          Sign In
                        </>
                      )}
                    </button>
                  </form>

                  {/* Social Login Separator */}
                  {role !== "ADMIN" && (
                    <>
                      <div className="flex items-center my-4">
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
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/google?role=${role}`;
                        }}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isDark
                            ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <Icon icon="logos:google-icon" className="w-4 h-4" />
                        Sign in with Google |{" "}
                        {role === "FARMER_GROUP"
                          ? "Farmer Group"
                          : "Collective"}
                      </button>
                    </>
                  )}

                  <p
                    className={`text-center text-sm mt-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className={`${
                        role === "ADMIN"
                          ? "text-violet-500 hover:text-violet-400"
                          : "text-emerald-500 hover:text-emerald-400"
                      } font-semibold`}
                    >
                      Register
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Heading */}
                  <div className="mb-6 text-center lg:text-left">
                    <button
                      onClick={() => setShowForgotPanel(false)}
                      className={`mb-4 flex items-center gap-2 text-sm font-medium transition-colors ${
                        isDark
                          ? "text-slate-400 hover:text-slate-200"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Icon icon="ph:arrow-left-bold" />
                      Back to login
                    </button>
                    <h1
                      className={`text-3xl font-bold mb-1.5 ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      Reset Password
                    </h1>
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Enter your email to get an OTP and set a new password.
                    </p>
                  </div>

                  <form
                    onSubmit={handleResetPassword}
                    noValidate
                    className="space-y-4"
                  >
                    {/* Email & OTP Row */}
                    <div className="space-y-1.5">
                      <label
                        className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        Email Address & OTP
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Icon
                            icon="ph:envelope-fill"
                            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          />
                          <input
                            type="email"
                            placeholder="your@email.com"
                            value={fEmail}
                            onChange={(e) => setFEmail(e.target.value)}
                            required
                            className={`w-full rounded-xl border text-sm pl-10 pr-4 py-3 outline-none transition-all focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
                              isDark
                                ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600"
                                : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                            }`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSendForgotOtp}
                          disabled={fLoading || resendTimer > 0}
                          className={`px-4 rounded-xl font-semibold text-sm transition-all border ${
                            isDark
                              ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                              : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                          }`}
                        >
                          {resendTimer > 0 ? fmtTime(resendTimer) : "Get OTP"}
                        </button>
                      </div>
                    </div>

                    {/* OTP Input */}
                    <div className="relative">
                      <Icon
                        icon="ph:password-fill"
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      />
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={fOtp}
                        onChange={(e) => setFOtp(e.target.value)}
                        required
                        className={`w-full rounded-xl border text-sm pl-10 pr-4 py-3 tracking-widest outline-none transition-all focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
                          isDark
                            ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600"
                            : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                        }`}
                      />
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label
                        className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <Icon
                          icon="ph:lock-key-fill"
                          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        />
                        <input
                          type={fShowPass ? "text" : "password"}
                          placeholder="Enter new password"
                          value={fPassword}
                          onChange={(e) => setFPassword(e.target.value)}
                          required
                          className={`w-full rounded-xl border text-sm pl-10 pr-10 py-3 outline-none transition-all focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
                            isDark
                              ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600"
                              : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setFShowPass((p) => !p)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
                        >
                          <Icon
                            icon={
                              fShowPass ? "ph:eye-slash-fill" : "ph:eye-fill"
                            }
                            className="w-4 h-4"
                          />
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <div className="relative">
                        <Icon
                          icon="ph:lock-key-fill"
                          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        />
                        <input
                          type={fShowConfirm ? "text" : "password"}
                          placeholder="Confirm password"
                          value={fConfirm}
                          onChange={(e) => setFConfirm(e.target.value)}
                          required
                          className={`w-full rounded-xl border text-sm pl-10 pr-10 py-3 outline-none transition-all focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
                            isDark
                              ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600"
                              : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setFShowConfirm((p) => !p)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
                        >
                          <Icon
                            icon={
                              fShowConfirm ? "ph:eye-slash-fill" : "ph:eye-fill"
                            }
                            className="w-4 h-4"
                          />
                        </button>
                      </div>
                    </div>

                    {/* Submit Reset */}
                    <button
                      type="submit"
                      disabled={fLoading}
                      className="w-full py-3 mt-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {fLoading ? (
                        <>
                          <Icon
                            icon="svg-spinners:ring-resize"
                            className="w-4 h-4"
                          />{" "}
                          Resetting…
                        </>
                      ) : (
                        <>
                          <Icon
                            icon="ph:check-circle-fill"
                            className="w-4 h-4"
                          />{" "}
                          Reset Password
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
