import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/ui";
import SlideToggle from "../components/common/SlideToggle";
import { register, registerOtp } from "../services/auth.service.js";
import getTime from "../utils/time.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { value: "FARMER_GROUP", label: "Farmer Group", icon: "ph:plant-fill" },
  { value: "COLLECTIVE", label: "Collective", icon: "ph:buildings-fill" },
];

const HERO_STEPS = [
  { icon: "ph:user-circle-fill", label: "Set up your account identity" },
  { icon: "ph:lock-key-fill", label: "Secure your access credentials" },
  { icon: "ph:seal-check-fill", label: "Verify your email with OTP" },
];

const TOTAL_STEPS = 3;

// ─── Input field component
const Field = ({ label, icon, required, children }) => {
  const { isDark } = useTheme();
  return (
    <div className="space-y-1.5">
      <label
        className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
      >
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <Icon
            icon={icon}
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? "text-slate-500" : "text-slate-400"}`}
          />
        )}
        {children}
      </div>
    </div>
  );
};

// ─── Step progress bar
const StepBar = ({ current, total }) => {
  const { isDark } = useTheme();
  return (
    <div className="flex items-center gap-2 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i < current
                ? "bg-emerald-500"
                : isDark
                  ? "bg-slate-700"
                  : "bg-slate-200"
            }`}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Main Component
const Register = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Wizard state
  const [step, setStep] = useState(1); // 1=Profile, 2=Credentials, 3=OTP
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Step 1 — Profile
  const [role, setRole] = useState("FARMER_GROUP");
  const [name, setName] = useState("User Farmer/Collective");
  const [leader, setLeader] = useState("Aanshik");
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  // ── Step 2 — Credentials
  const [email, setEmail] = useState("aanshiksinghtomar@gmail.com");
  const [phone, setPhone] = useState("8855885588");
  const [password, setPassword] = useState("password");
  const [confirm, setConfirm] = useState("password");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Step 3 — OTP (6 boxes)
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const otpRefs = Array.from({ length: 6 }, () => React.createRef());
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  // ─── Shared input class
  const ic = `w-full rounded-xl border text-sm pl-10 pr-4 py-3 outline-none transition-all focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
    isDark
      ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600"
      : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
  }`;

  const icNoIcon = ic.replace("pl-10", "px-4");

  // ─── Handlers
  const handlePhotoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPhoto(URL.createObjectURL(f));
  };

  const handleOtpDigit = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKey = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0)
      otpRefs[index - 1].current?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const next = Array(6).fill("");
    pasted.split("").forEach((c, i) => {
      next[i] = c;
    });
    setOtpDigits(next);
    if (pasted.length > 0) otpRefs[Math.min(pasted.length, 5)].current?.focus();
  };

  const validateStep1 = () => {
    if (!name.trim()) {
      toast.error("Name is required.");
      return false;
    }
    if (!leader.trim()) {
      toast.error("Leader/Manager name is required.");
      return false;
    }
    if (photoFile && photoFile.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!email.trim()) {
      toast.error("Email is required.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email address.");
      return false;
    }
    if (!phone.trim()) {
      toast.error("Phone is required.");
      return false;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      toast.error("Must be a valid 10-digit number.");
      return false;
    }
    if (!password) {
      toast.error("Password is required.");
      return false;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return false;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleNextStep1 = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSendOtp = async () => {
    if (!validateStep2()) return;
    setOtpLoading(true);
    try {
      const res = await registerOtp(name, email, phone);
      console.log(res);
      toast.success(
        <>
          OTP has been sent successfully !!
          <br />
          please check your inbox & spam folder.
          <br />
          You have {res.leftAttempts} attempts remaining.
        </>,
        {
          title: "OTP Sent",
          duration: 8000,
        },
      );
      setResendTimer(90);
      setStep(3);
    } catch (err) {
      const unblockAt = err?.response?.data?.unblockAt;
      const formattedTime = getTime(unblockAt);

      const message = err?.response?.data?.message?.includes(
        "many attempts",
      ) ? (
        <>
          Too many attempts !!
          <br />
          Please try again after {formattedTime ? formattedTime : "6 hours"}.
        </>
      ) : (
        err?.response?.data?.message || err.message || "Failed to send OTP."
      );

      toast.error(message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async () => {
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      toast.error("Please enter the full 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("role", role);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("password", password);
      formData.append("leader", leader);
      formData.append("otp", otp);
      if (photoFile) formData.append("profile", photoFile);

      await register(formData);
      toast.success(
        <>
          Account Created Successfully!!
          <br />
          Welcome onboard {leader}
          <br />
          Please login to proceed.
        </>,
        {
          title: "Registered!",
          duration: 6000,
        },
      );
      navigate("/login");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err.message || "Registration failed.",
        { title: "Error" },
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Step labels
  const stepTitles = [
    { title: "Create Your Account", sub: "Set up your profile identity" },
    { title: "Secure Your Access", sub: "Your login credentials" },
    { title: "Verify Your Email", sub: `OTP sent to ${email || "your email"}` },
  ];

  const currentTitle = stepTitles[step - 1];

  // ─── Render
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

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="z-10 space-y-8"
        >
          <div>
            <h2 className="text-5xl font-extrabold text-white leading-14 mb-4">
              Join the
              <span className="text-amber-300"> FarmFresh</span>
              <br />
              Network
            </h2>
            <p className="text-emerald-100/80 text-base leading-relaxed max-w-sm">
              Connect with India's growing organic farming ecosystem. Register
              your Farmer Group or Collective and start coordinating smarter
              harvests today.
            </p>
          </div>

          {/* Step indicators */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/70">
              Registration Steps
            </p>
            {HERO_STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                    i + 1 < step
                      ? "bg-emerald-400/90"
                      : i + 1 === step
                        ? "bg-white/20 ring-2 ring-white/40"
                        : "bg-white/10"
                  }`}
                >
                  {i + 1 < step ? (
                    <Icon
                      icon="ph:check-bold"
                      className="w-4 h-4 text-emerald-900"
                    />
                  ) : (
                    <Icon icon={s.icon} className="w-4 h-4 text-white" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium transition-all duration-300 ${
                    i + 1 === step ? "text-white" : "text-emerald-100/60"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom stat bar */}
        <div className="flex items-center gap-6 z-10 mt-3">
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
        className={`flex-1 flex flex-col items-center justify-center px-5 sm:px-10 py-8 lg:py-16 ${
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
          <div className="mb-6 text-center lg:text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
              >
                <h1
                  className={`text-3xl font-bold mb-1.5 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {currentTitle.title}
                </h1>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {currentTitle.sub}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step progress */}
          <StepBar current={step} total={TOTAL_STEPS} />

          {/* ── STEP 1: Profile ── */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Role */}
                <div>
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

                {/* Profile photo — hover pencil avatar */}
                <label className="flex items-center gap-5 cursor-pointer group">
                  <div
                    className={`relative w-18 h-18 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center ${
                      isDark ? "bg-slate-800" : "bg-slate-100"
                    } ring-2 ring-offset-2 ${
                      isDark
                        ? "ring-slate-700 ring-offset-slate-950"
                        : "ring-slate-200 ring-offset-slate-50"
                    }`}
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon
                        icon="ph:user-fill"
                        className={`w-10 h-10 ${
                          isDark ? "text-slate-600" : "text-slate-400"
                        }`}
                      />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Icon
                        icon="ph:pencil-fill"
                        className="w-5 h-5 text-white"
                      />
                      <span className="text-white text-[10px] mt-1 font-semibold">
                        {photo ? "Change" : "Upload"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p
                      className={`text-sm font-semibold ${
                        isDark ? "text-slate-200" : "text-slate-800"
                      }`}
                    >
                      Profile Photo
                    </p>
                    <p
                      className={`text-xs ${
                        isDark ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Optional - shown publicly
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isDark ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      JPG, PNG · max 2 MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>

                {/* Group / Collective name */}
                <Field
                  label={
                    role === "FARMER_GROUP"
                      ? "Farmer Group Name"
                      : "Collective Name"
                  }
                  icon={
                    role === "FARMER_GROUP"
                      ? "ph:plant-fill"
                      : "ph:buildings-fill"
                  }
                  error={errors.name}
                  required
                >
                  <input
                    type="text"
                    placeholder={
                      role === "FARMER_GROUP"
                        ? "e.g. Himalayan Farmers Group"
                        : "e.g. GreenValley Collective"
                    }
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrors((p) => ({ ...p, name: "" }));
                    }}
                    className={`${ic} ${errors.name ? "border-rose-500" : ""}`}
                  />
                </Field>

                {/* Leader / Manager */}
                <Field
                  label={
                    role === "FARMER_GROUP"
                      ? "Lead Farmer Name"
                      : "Manager Name"
                  }
                  icon="ph:user-fill"
                  error={errors.leader}
                  required
                >
                  <input
                    type="text"
                    placeholder={
                      role === "FARMER_GROUP"
                        ? "e.g. Rajan Sharma"
                        : "e.g. Priya Mehta"
                    }
                    value={leader}
                    onChange={(e) => {
                      setLeader(e.target.value);
                      setErrors((p) => ({ ...p, leader: "" }));
                    }}
                    className={`${ic} ${errors.leader ? "border-rose-500" : ""}`}
                  />
                </Field>

                <button
                  onClick={handleNextStep1}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[.98] text-white font-semibold text-sm transition-all"
                >
                  Next Step
                </button>

                <p
                  className={`text-center text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-emerald-500 hover:text-emerald-400 font-semibold"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ── STEP 2: Credentials ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Email */}
                <Field
                  label="Email Address"
                  icon="ph:envelope-fill"
                  error={errors.email}
                  required
                >
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((p) => ({ ...p, email: "" }));
                    }}
                    className={`${ic} ${errors.email ? "border-rose-500" : ""}`}
                  />
                </Field>

                {/* Phone */}
                <Field
                  label="Phone Number"
                  icon="ph:phone-fill"
                  error={errors.phone}
                  required
                >
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ""));
                      setErrors((p) => ({ ...p, phone: "" }));
                    }}
                    className={`${ic} ${errors.phone ? "border-rose-500" : ""}`}
                  />
                </Field>

                {/* Password */}
                <Field
                  label="Password"
                  icon="ph:lock-key-fill"
                  error={errors.password}
                  required
                >
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((p) => ({ ...p, password: "" }));
                    }}
                    className={`${ic} pr-10 ${errors.password ? "border-rose-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <Icon
                      icon={showPass ? "ph:eye-slash-fill" : "ph:eye-fill"}
                      className="w-4 h-4"
                    />
                  </button>
                </Field>

                {/* Confirm Password */}
                <Field
                  label="Confirm Password"
                  icon="ph:lock-key-fill"
                  error={errors.confirm}
                  required
                >
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      setErrors((p) => ({ ...p, confirm: "" }));
                    }}
                    className={`${ic} pr-10 ${errors.confirm ? "border-rose-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <Icon
                      icon={showConfirm ? "ph:eye-slash-fill" : "ph:eye-fill"}
                      className="w-4 h-4"
                    />
                  </button>
                </Field>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setStep(1)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      isDark
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="flex-[2] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[.98] disabled:opacity-60 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {otpLoading ? (
                      <>
                        <Icon
                          icon="ph:spinner-gap"
                          className="w-4 h-4 animate-spin"
                        />
                        Sending OTP…
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: OTP ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Info card */}
                <div
                  className={`flex items-start gap-3 p-4 rounded-xl border ${
                    isDark
                      ? "bg-emerald-950/40 border-emerald-800/40"
                      : "bg-emerald-50 border-emerald-200"
                  }`}
                >
                  <Icon
                    icon="ph:envelope-open-fill"
                    className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"
                  />
                  <div>
                    <p
                      className={`text-sm font-semibold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                    >
                      OTP sent to your email
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Check your inbox and spam folder
                    </p>
                  </div>
                </div>

                {/* 6-box OTP input */}
                <div className="space-y-2">
                  <label
                    className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    6-Digit OTP
                    <span className="text-rose-400 ml-0.5">*</span>
                  </label>
                  <div className="flex gap-2.5">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={otpRefs[i]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigit(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKey(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className={`flex-1 min-w-0 aspect-square rounded-xl border text-center font-mono text-xl font-bold outline-none transition-all focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
                          isDark
                            ? "bg-slate-900 border-slate-700 text-slate-100"
                            : "bg-white border-slate-200 text-slate-900"
                        } ${errors.otp ? "border-rose-500" : ""} ${
                          digit
                            ? isDark
                              ? "border-emerald-600 bg-emerald-950/40"
                              : "border-emerald-400 bg-emerald-50"
                            : ""
                        }`}
                      />
                    ))}
                  </div>
                  {errors.otp && (
                    <p className="text-xs text-rose-400">{errors.otp}</p>
                  )}
                </div>

                {/* Resend */}
                <div className="text-center">
                  <button
                    onClick={handleSendOtp}
                    disabled={otpLoading || resendTimer > 0}
                    className={`text-sm font-semibold transition-colors ${
                      resendTimer > 0
                        ? isDark
                          ? "text-slate-500 cursor-not-allowed"
                          : "text-slate-400 cursor-not-allowed"
                        : "text-emerald-500 hover:text-emerald-400"
                    } disabled:opacity-50`}
                  >
                    {otpLoading
                      ? "Resending…"
                      : resendTimer > 0
                        ? `Resend OTP in ${formatTime(resendTimer)}`
                        : "Resend OTP"}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep(2);
                      setOtpDigits(["", "", "", "", "", ""]);
                    }}
                    className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      isDark
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="flex-[2] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[.98] disabled:opacity-60 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Icon
                          icon="ph:spinner-gap"
                          className="w-4 h-4 animate-spin"
                        />
                        Creating Account…
                      </>
                    ) : (
                      <>
                        <Icon
                          icon="ph:user-circle-plus-fill"
                          className="w-4 h-4"
                        />
                        Create Account
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
