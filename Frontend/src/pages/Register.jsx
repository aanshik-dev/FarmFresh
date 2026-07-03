import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Button, Input, useToast } from "../components/ui";
import SlideToggle from "../components/common/SlideToggle";

const ROLE_OPTIONS = [
  { value: "FARMER_GROUP", label: "Farmer Group", icon: "ph:plant-fill" },
  { value: "COLLECTIVE",   label: "Collective",   icon: "ph:buildings-fill" },
];

const Register = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, sendOTP, verifyOTP } = useAuth();

  const [role, setRole] = useState("FARMER_GROUP");
  const [step, setStep] = useState("form"); // form | otp | done
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [mockOtp, setMockOtp] = useState(null);

  // Shared fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [photo, setPhoto] = useState(null);

  // Farmer-specific
  const [groupName, setGroupName]       = useState("");
  const [numberOfFarmers, setNumberOfFarmers] = useState("");
  const [leadFarmerName, setLeadFarmerName]   = useState("");

  // Collective-specific
  const [collectiveName, setCollectiveName] = useState("");

  const passwordError = confirm && confirm !== password ? "Passwords do not match" : "";

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (passwordError) return;
    setLoading(true);
    try {
      const result = await sendOTP(phone);
      setMockOtp(result.mockOtp);
      setStep("otp");
      toast.info(`OTP sent to ${phone}. Demo OTP: ${result.mockOtp}`, { title: "OTP Sent", duration: 8000 });
    } catch (err) {
      toast.error(err.message || "Failed to send OTP", { title: "Error" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      const valid = await verifyOTP(phone, otp);
      if (!valid) {
        toast.error(`Invalid OTP. Demo OTP is: ${mockOtp}`, { title: "Wrong OTP" });
        return;
      }
      const formData = role === "FARMER_GROUP"
        ? { groupName, numberOfFarmers, leadFarmerName, email, phone, password }
        : { collectiveName, email, phone, password };
      await register(formData, role);
      toast.success("Account created! Please log in.", { title: "Registration Successful" });
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Registration failed", { title: "Error" });
    } finally {
      setOtpLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) setPhoto(URL.createObjectURL(file));
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center px-4 sm:px-6 pt-24 pb-16 transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="pointer-events-none fixed -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/8 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-400/6 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
          isDark ? "bg-slate-900/80 border-slate-800 shadow-black/50 backdrop-blur-md" : "bg-white border-slate-200 shadow-slate-300/40"
        }`}
      >
        {/* Header */}
        <div className={`px-7 pt-7 pb-5 border-b ${isDark ? "border-slate-800/60" : "border-slate-100"}`}>
          <div className="flex flex-col items-center gap-3 mb-5 text-center">
            <div className={`p-3 rounded-2xl ${isDark ? "bg-emerald-800/50 text-emerald-300" : "bg-emerald-100 text-emerald-600"}`}>
              <Icon icon="ph:user-plus-fill" className="w-7 h-7" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold quantico uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                {step === "otp" ? "Verify OTP" : "Create Account"}
              </h1>
              <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {step === "otp" ? `Enter the OTP sent to ${phone}` : "Join FarmFresh as a partner"}
              </p>
            </div>
          </div>

          {step === "form" && (
            <SlideToggle options={ROLE_OPTIONS} value={role} onChange={(v) => { setRole(v); }} size="md" />
          )}
        </div>

        {/* OTP step */}
        <AnimatePresence mode="wait">
          {step === "otp" ? (
            <motion.form
              key="otp"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              onSubmit={handleVerifyAndRegister}
              className="px-7 py-6 space-y-5"
            >
              <div className={`rounded-xl border p-4 flex items-start gap-3 ${isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"}`}>
                <Icon icon="ph:info-fill" className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-emerald-300" : "text-emerald-800"}`}>Demo Mode</p>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>The OTP is: <span className="font-bold text-emerald-500">{mockOtp}</span></p>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Enter OTP <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  maxLength={6}
                  className={`w-full rounded-xl border text-center text-2xl tracking-[0.5em] py-3 outline-none transition-all focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 ${
                    isDark ? "bg-slate-800/60 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                  required
                />
              </div>

              <Button type="submit" variant="primary" size="lg" loading={otpLoading} className="w-full">
                Verify & Create Account
              </Button>

              <button type="button" onClick={() => { setStep("form"); setOtp(""); }} className={`w-full text-sm text-center cursor-pointer ${isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
                ← Back to form
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSendOTP}
              className="px-7 py-6 space-y-4"
            >
              {/* Profile photo */}
              <div className="flex justify-center">
                <label className="cursor-pointer group">
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <div className={`relative w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                    photo ? "border-transparent" : isDark ? "border-slate-600 hover:border-emerald-500" : "border-slate-300 hover:border-emerald-400"
                  }`}>
                    {photo ? (
                      <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Icon icon="ph:camera-fill" className={`w-6 h-6 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                        <span className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Photo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                      <Icon icon="ph:pencil-fill" className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </label>
              </div>

              {/* Role-specific fields */}
              <AnimatePresence mode="wait">
                {role === "FARMER_GROUP" ? (
                  <motion.div key="farmer-fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <Input label="Group Name" placeholder="e.g. Triyuginarayan Organic Pulse Pioneers" value={groupName} onChange={e => setGroupName(e.target.value)} icon="ph:users-three-fill" required />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="No. of Farmers" type="number" placeholder="12" value={numberOfFarmers} onChange={e => setNumberOfFarmers(e.target.value)} icon="ph:person-fill" required />
                      <Input label="Lead Farmer Name" placeholder="Your full name" value={leadFarmerName} onChange={e => setLeadFarmerName(e.target.value)} icon="ph:user-fill" required />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="collective-fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Input label="Collective Name" placeholder="e.g. Mandakini Organic Collective" value={collectiveName} onChange={e => setCollectiveName(e.target.value)} icon="ph:buildings-fill" required />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} icon="ph:phone-fill" required />
                <Input label="Email" type="email" placeholder="you@example.in" value={email} onChange={e => setEmail(e.target.value)} icon="ph:envelope-fill" required />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Icon icon="ph:lock-key-fill" className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                  </div>
                  <input type={showPass ? "text" : "password"} placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} required className={`w-full rounded-xl border text-sm pl-10 pr-10 py-2.5 outline-none transition-all focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 ${isDark ? "bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"}`} />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute inset-y-0 right-3 flex items-center cursor-pointer">
                    <Icon icon={showPass ? "ph:eye-slash-fill" : "ph:eye-fill"} className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                  </button>
                </div>
              </div>

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                icon="ph:lock-key-fill"
                error={passwordError}
                required
              />

              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full" icon="ph:device-mobile-fill">
                {loading ? "Sending OTP…" : "Send OTP & Continue"}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className={`px-7 py-4 border-t text-center ${isDark ? "border-slate-800/60" : "border-slate-100"}`}>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-500 hover:text-emerald-400 font-semibold">Sign in →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
