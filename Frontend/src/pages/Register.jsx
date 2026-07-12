import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/ui";
import SlideToggle from "../components/common/SlideToggle";
import { getAllCrops } from "../services/common.service.js";
import { register, registerOtp } from "../services/auth.service.js";
import getTime from "../utils/time.js";

import MapModal from "../components/common/MapModal";
import CropTagInput from "../components/common/CropTagInput";
import { Field, inputCls } from "../components/common/FormFields";

const ROLE_OPTIONS = [
  { value: "FARMER_GROUP", label: "Farmer Group", icon: "ph:plant-fill" },
  { value: "COLLECTIVE", label: "Collective", icon: "ph:buildings-fill" },
];

const Register = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [allCrops, setAllCrops] = useState([]);
  const [role, setRole] = useState("FARMER_GROUP");
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [email, setEmail] = useState("aanshiksinghtomar@gmail.com");
  const [phone, setPhone] = useState("8822665588");
  const [password, setPassword] = useState("password");
  const [confirm, setConfirm] = useState("password");
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [markerPos, setMarkerPos] = useState(null);

  const [groupName, setGroupName] = useState("Aanshik Farming Group");
  const [numberOfFarmers, setNumberOfFarmers] = useState("15");
  const [leadFarmerName, setLeadFarmerName] = useState("Aanshik Singh");
  const [selectedCrops, setSelectedCrops] = useState([]);

  const [collectiveName, setCollectiveName] = useState("Aanshik's Collective");
  const [workers, setWorkers] = useState("50");

  const inputRefs = {
    groupName: useRef(null),
    leadFarmerName: useRef(null),
    numberOfFarmers: useRef(null),
    collectiveName: useRef(null),
    email: useRef(null),
    phone: useRef(null),
    password: useRef(null),
    confirm: useRef(null),
    village: useRef(null),
    district: useRef(null),
    state: useRef(null),
    pincode: useRef(null),
    lat: useRef(null),
    lng: useRef(null),
  };

  // ── Fetch crops on mount
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const data = await getAllCrops();
        setAllCrops(data.crops);
      } catch (err) {
        toast.error("Failed to load crops list.");
      }
    };
    fetchCrops();
  }, []);

  // ── Reset form when switching roles
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirm("");
    setPhoto(null);
    setPhotoFile(null);
    setSelectedCrops([]);
    setGroupName("");
    setLeadFarmerName("");
    setNumberOfFarmers("");
    setCollectiveName("");
    setWorkers("");
    setVillage("");
    setDistrict("");
    setState("");
    setPincode("");
    setLat("");
    setLng("");
    setMarkerPos(null);
  };

  const validate = () => {
    const fail = (field, message) => {
      setFormErrors({ [field]: message });
      toast.error(message, { title: "Fix this first" });
      refs[field]?.current?.focus();
      refs[field]?.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return false;
    };

    // Role-specific
    if (role === "FARMER_GROUP") {
      if (!groupName.trim())
        return fail("groupName", "Farmer group name is required.");
      if (!leadFarmerName.trim())
        return fail("leadFarmerName", "Lead farmer name is required.");
      if (!numberOfFarmers || Number(numberOfFarmers) < 1)
        return fail("numberOfFarmers", "Enter a valid number of farmers.");
    } else {
      if (!collectiveName.trim())
        return fail("collectiveName", "Collective name is required.");
    }

    // Email
    if (!email.trim()) return fail("email", "Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return fail("email", "Enter a valid email address.");

    // Phone — must be exactly 10 digits
    const digitsOnly = phone.replace(/\D/g, "");
    if (!phone.trim()) return fail("phone", "Phone number is required.");
    if (digitsOnly.length !== 10)
      return fail("phone", "Phone number must be exactly 10 digits.");

    // Password
    if (!password) return fail("password", "Password is required.");
    if (password.length < 8)
      return fail("password", "Password must be at least 8 characters.");

    // Confirm password
    if (!confirm) return fail("confirm", "Please confirm your password.");
    if (confirm !== password) return fail("confirm", "Passwords do not match.");

    // Address
    if (!village.trim()) return fail("village", "Village / Town is required.");
    if (!district.trim()) return fail("district", "District is required.");
    if (!state.trim()) return fail("state", "State is required.");
    if (!pincode.trim()) return fail("pincode", "Pincode is required.");

    // Coordinates
    if (!lat)
      return fail(
        "lat",
        "Latitude is required. Use Auto-fill or Choose on Map.",
      );
    if (!lng)
      return fail(
        "lng",
        "Longitude is required. Use Auto-fill or Choose on Map.",
      );

    setFormErrors({});
    return true;
  };

  const ic = inputCls(isDark);

  const reverseGeocode = useCallback(
    async (la, lo) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${lo}&format=json`,
        );
        const data = await res.json();
        const addr = data.address || {};
        setVillage(
          addr.village || addr.hamlet || addr.suburb || addr.town || "",
        );
        setDistrict(addr.district || addr.county || "");
        setState(addr.state || "");
        setPincode(addr.postcode || "");
      } catch {
        toast.error("Could not fetch address. Please fill manually.");
      }
    },
    [toast],
  );

  const handleAutoFill = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported.");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        setLat(latitude.toFixed(6));
        setLng(longitude.toFixed(6));
        setMarkerPos({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude);
        setLocLoading(false);
        toast.success("Location detected and address filled!", {
          title: "Location",
        });
      },
      () => {
        setLocLoading(false);
        toast.error("Location access denied. Please allow or fill manually.");
      },
      { timeout: 10000 },
    );
  };

  // ── Handle map pin confirmation
  const handleMapConfirm = useCallback(
    (latlng) => {
      setMarkerPos(latlng);
      setLat(latlng.lat.toFixed(6));
      setLng(latlng.lng.toFixed(6));
      reverseGeocode(latlng.lat, latlng.lng);
      toast.success("Location pinned and address filled!", {
        title: "Location",
      });
    },
    [reverseGeocode, toast],
  );

  // ── Step 1: Validate form then send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const name = role === "FARMER_GROUP" ? groupName : collectiveName;

      const res = await registerOtp(name, email);
      console.log(res);
      const leftAttempt = 5 - (res?.attempts || 5);
      setStep("otp");
      toast.info(
        <>
          OTP has been sent successfully !!
          <br />
          please check your inbox & spam folder.
          <br />
          You have {leftAttempt} attempts remaining.
        </>,
        {
          title: "OTP Sent",
          duration: 8000,
        },
      );
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
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP & Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      const formData = new FormData();

      // ── Common fields (field names match register.service.js exactly)
      formData.append("role", role);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("password", password);
      formData.append("otp", otp);

      // ── Address fields
      formData.append("village", village);
      formData.append("area", district);
      formData.append("city", district);
      formData.append("state", state);
      formData.append("pinCode", pincode);

      formData.append("lat", lat);
      formData.append("long", lng);

      if (photoFile) formData.append("profile", photoFile);

      formData.append("crops", JSON.stringify(selectedCrops));

      if (role === "FARMER_GROUP") {
        formData.append("name", groupName);
        formData.append("leadFarmer", leadFarmerName);
        formData.append("farmerCount", numberOfFarmers);
        formData.append("workers", "");
      } else {
        formData.append("name", collectiveName);
        formData.append("workers", workers);
        formData.append("leadFarmer", "");
        formData.append("farmerCount", "");
      }

      await register(formData);

      toast.success(
        <>
          Account Created Successfully!!
          <br />
          Welcome onboard {name}
          <br />
          Please login to proceed.
        </>,
        {
          title: "Registered!",
        },
      );
      navigate("/login");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err.message || "Registration failed.",
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // {
  //     "success": true,
  //     "message": "Registration successful.",
  //     "res": {
  //         "uid": "FG200002",
  //         "name": "Param Singh and Sons",
  //         "email": "aanshikSingh@gmail.com",
  //         "phone": "882266996",
  //         "profileUrl": "https://res.cloudinary.com/aanshik-dev-cloud/image/upload/v1783866385/farmfresh/userProfiles/FG200002.jpg"
  //     }
  // }

  // ── Photo change handler — keeps both preview URL and raw File object
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(URL.createObjectURL(file));
      setPhotoFile(file);
    }
  };

  const cardCls = `rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`;
  const sectionTitleCls = `text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-500"}`;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-100"}`}
    >
      {/* Map Modal */}
      <AnimatePresence>
        {mapOpen && (
          <MapModal
            isDark={isDark}
            open={mapOpen}
            onClose={() => setMapOpen(false)}
            onConfirm={handleMapConfirm}
            initialPos={markerPos}
            initialCenter={
              lat && lng ? [parseFloat(lat), parseFloat(lng)] : undefined
            }
          />
        )}
      </AnimatePresence>

      {step === "otp" ? (
        // ── OTP STEP
        <div className="flex items-center justify-center min-h-screen px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full max-w-md rounded-3xl border p-8 ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xl"}`}
          >
            <div className="text-center mb-7">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-emerald-500/10" : "bg-emerald-100"}`}
              >
                <Icon
                  icon="ph:envelope-open-fill"
                  className="w-8 h-8 text-emerald-400"
                />
              </div>
              <h2
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Verify Your Email
              </h2>
              <p
                className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Enter the OTP sent to{" "}
                <span
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {email}
                </span>
              </p>
              <p
                className={`text-sm font-thin opacity-70 mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Please check your inbox and spam folder.
                <br />
                OTP is valid for 20 minutes.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="text"
                placeholder="_ _ _ _ _ _"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className={`w-full rounded-xl border text-center text-3xl tracking-[0.6em] py-4 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 ${isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-900"}`}
                required
              />
              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <>
                    <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />{" "}
                    Verifying…
                  </>
                ) : (
                  <>
                    <Icon icon="ph:check-bold" className="w-4 h-4" /> Verify &
                    Create Account
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setOtp("");
                }}
                className={`w-full text-sm text-center cursor-pointer ${isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}
              >
                ← Back to form
              </button>
            </form>
          </motion.div>
        </div>
      ) : (
        // ── MAIN FORM STEP
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pt-24">
          {/* Back */}
          <motion.button
            type="button"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate("/")}
            className={`flex items-center gap-2 text-sm mb-6 cursor-pointer transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
            Back to Home
          </motion.button>

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1
                className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Create Your Account
              </h1>
              <p
                className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Join FarmFresh and start managing your harvest.
              </p>
            </div>
            <div className="sm:min-w-72">
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                Account Type
              </p>
              <SlideToggle
                options={ROLE_OPTIONS}
                value={role}
                onChange={handleRoleChange}
                size="md"
              />
            </div>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-5">
            {/* ── Identity */}
            <div className={cardCls}>
              <p className={sectionTitleCls}>
                <Icon icon="ph:user-fill" className="w-3.5 h-3.5" />
                Identity
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Profile photo */}
                <div className="flex items-center gap-4 sm:col-span-2">
                  <label className="cursor-pointer group shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <div
                      className={`relative w-16 h-16 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${photo ? "border-transparent" : isDark ? "border-slate-600 hover:border-emerald-500" : "border-slate-300 hover:border-emerald-400"}`}
                    >
                      {photo ? (
                        <img
                          src={photo}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <Icon
                            icon="ph:camera-fill"
                            className={`w-5 h-5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          />
                          <span
                            className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          >
                            Photo
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                        <Icon
                          icon="ph:pencil-fill"
                          className="w-4 h-4 text-white"
                        />
                      </div>
                    </div>
                  </label>
                  <div>
                    <p
                      className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}
                    >
                      Profile Photo
                    </p>
                    <p
                      className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Optional. Max 2 MB.
                    </p>
                  </div>
                </div>

                {/* Role-specific fields */}
                <AnimatePresence mode="wait">
                  {role === "FARMER_GROUP" ? (
                    <motion.div
                      key="farmer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="contents"
                    >
                      <Field
                        label="Farmer Group Name"
                        required
                        error={formErrors.groupName}
                      >
                        <input
                          ref={inputRefs.groupName}
                          className={`${ic} ${formErrors.groupName ? "border-red-500" : ""}`}
                          placeholder="e.g. Triyuginarayan Organic Pulse Pioneers"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          onFocus={() =>
                            setFormErrors((p) => ({ ...p, groupName: "" }))
                          }
                        />
                      </Field>
                      <Field
                        label="Lead Farmer Name"
                        required
                        error={formErrors.leadFarmerName}
                      >
                        <input
                          ref={inputRefs.leadFarmerName}
                          className={`${ic} ${formErrors.leadFarmerName ? "border-red-500" : ""}`}
                          placeholder="Your full name"
                          value={leadFarmerName}
                          onChange={(e) => setLeadFarmerName(e.target.value)}
                          onFocus={() =>
                            setFormErrors((p) => ({ ...p, leadFarmerName: "" }))
                          }
                        />
                      </Field>
                      <Field
                        label="No. of Farmers"
                        required
                        error={formErrors.numberOfFarmers}
                      >
                        <input
                          ref={inputRefs.numberOfFarmers}
                          className={`${ic} ${formErrors.numberOfFarmers ? "border-red-500" : ""}`}
                          type="number"
                          min="1"
                          placeholder="12"
                          value={numberOfFarmers}
                          onChange={(e) => setNumberOfFarmers(e.target.value)}
                          onFocus={() =>
                            setFormErrors((p) => ({
                              ...p,
                              numberOfFarmers: "",
                            }))
                          }
                        />
                      </Field>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="collective"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="contents"
                    >
                      <Field
                        label="Collective Name"
                        required
                        error={formErrors.collectiveName}
                      >
                        <input
                          ref={inputRefs.collectiveName}
                          className={`${ic} ${formErrors.collectiveName ? "border-red-500" : ""}`}
                          placeholder="e.g. Mandakini Organic Collective"
                          value={collectiveName}
                          onChange={(e) => setCollectiveName(e.target.value)}
                          onFocus={() =>
                            setFormErrors((p) => ({ ...p, collectiveName: "" }))
                          }
                        />
                      </Field>
                      <Field label="Total Workers / Staff">
                        <input
                          className={ic}
                          type="number"
                          min="1"
                          placeholder="25"
                          value={workers}
                          onChange={(e) => setWorkers(e.target.value)}
                        />
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Field label="Phone" required error={formErrors.phone}>
                  <input
                    ref={inputRefs.phone}
                    className={`${ic} ${formErrors.phone ? "border-red-500" : ""}`}
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setFormErrors((p) => ({ ...p, phone: "" }))}
                  />
                </Field>
                <Field label="Email" required error={formErrors.email}>
                  <input
                    ref={inputRefs.email}
                    className={`${ic} ${formErrors.email ? "border-red-500" : ""}`}
                    type="email"
                    placeholder="you@example.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFormErrors((p) => ({ ...p, email: "" }))}
                  />
                </Field>
                <Field label="Password" required error={formErrors.password}>
                  <div className="relative">
                    <input
                      ref={inputRefs.password}
                      className={`${ic} pr-10 ${formErrors.password ? "border-red-500" : ""}`}
                      type={showPass ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() =>
                        setFormErrors((p) => ({ ...p, password: "" }))
                      }
                      minLength={8}
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
                </Field>
                <Field
                  label="Confirm Password"
                  required
                  error={formErrors.confirm}
                >
                  <input
                    ref={inputRefs.confirm}
                    className={`${ic} ${formErrors.confirm ? "border-red-500 focus:border-red-500 focus:ring-red-500/40" : ""}`}
                    type="password"
                    placeholder="Re-enter password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onFocus={() =>
                      setFormErrors((p) => ({ ...p, confirm: "" }))
                    }
                  />
                </Field>
              </div>
            </div>

            {/* ── Crops */}
            <div className={cardCls}>
              <p className={sectionTitleCls}>
                <Icon
                  icon="ph:plant-fill"
                  className="w-3.5 h-3.5 text-emerald-400"
                />
                {role === "FARMER_GROUP" ? "Crops Grown" : "Crops Handled"}
              </p>
              {/* CropTagInput shows names in the list view; on selection it stores the crop code */}
              <CropTagInput
                selected={selectedCrops}
                onChange={setSelectedCrops}
                crops={allCrops}
                isDark={isDark}
              />
            </div>

            {/* ── Location & Address */}
            <div className={cardCls}>
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <p className={sectionTitleCls}>
                  <Icon
                    icon="ph:map-pin-fill"
                    className="w-3.5 h-3.5 text-blue-400"
                  />
                  Location & Address
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFill}
                    disabled={locLoading}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-60 ${
                      isDark
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/25 hover:bg-blue-500/20"
                        : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                    }`}
                  >
                    {locLoading ? (
                      <>
                        <Icon
                          icon="svg-spinners:ring-resize"
                          className="w-3.5 h-3.5"
                        />{" "}
                        Detecting…
                      </>
                    ) : (
                      <>
                        <Icon icon="ph:gps-fix-fill" className="w-3.5 h-3.5" />{" "}
                        Auto-fill
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapOpen(true)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isDark
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    <Icon icon="ph:map-trifold-fill" className="w-3.5 h-3.5" />
                    Choose on Map
                  </button>
                </div>
              </div>

              {lat && lng && (
                <div
                  className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-4 ${isDark ? "bg-emerald-500/8 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}
                >
                  <Icon
                    icon="ph:map-pin-fill"
                    className="w-3.5 h-3.5 shrink-0"
                  />
                  Location pinned: {parseFloat(lat).toFixed(4)},{" "}
                  {parseFloat(lng).toFixed(4)}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Village / Town"
                  required
                  error={formErrors.village}
                >
                  <input
                    ref={inputRefs.village}
                    className={`${ic} ${formErrors.village ? "border-red-500" : ""}`}
                    placeholder="e.g. Triyuginarayan"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    onFocus={() =>
                      setFormErrors((p) => ({ ...p, village: "" }))
                    }
                  />
                </Field>
                <Field label="District" required error={formErrors.district}>
                  <input
                    ref={inputRefs.district}
                    className={`${ic} ${formErrors.district ? "border-red-500" : ""}`}
                    placeholder="e.g. Rudraprayag"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    onFocus={() =>
                      setFormErrors((p) => ({ ...p, district: "" }))
                    }
                  />
                </Field>
                <Field label="State" required error={formErrors.state}>
                  <input
                    ref={inputRefs.state}
                    className={`${ic} ${formErrors.state ? "border-red-500" : ""}`}
                    placeholder="e.g. Uttarakhand"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    onFocus={() => setFormErrors((p) => ({ ...p, state: "" }))}
                  />
                </Field>
                <Field label="Pincode" required error={formErrors.pincode}>
                  <input
                    ref={inputRefs.pincode}
                    className={`${ic} ${formErrors.pincode ? "border-red-500" : ""}`}
                    placeholder="246444"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    onFocus={() =>
                      setFormErrors((p) => ({ ...p, pincode: "" }))
                    }
                  />
                </Field>
                <Field label="Latitude" required error={formErrors.lat}>
                  <input
                    ref={inputRefs.lat}
                    className={`${ic} ${formErrors.lat ? "border-red-500" : ""}`}
                    placeholder="30.7333"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    onFocus={() => setFormErrors((p) => ({ ...p, lat: "" }))}
                  />
                </Field>
                <Field label="Longitude" required error={formErrors.lng}>
                  <input
                    ref={inputRefs.lng}
                    className={`${ic} ${formErrors.lng ? "border-red-500" : ""}`}
                    placeholder="79.0667"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    onFocus={() => setFormErrors((p) => ({ ...p, lng: "" }))}
                  />
                </Field>
              </div>
            </div>

            {/* ── Submit */}
            <div className="space-y-3 pb-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />{" "}
                    Sending OTP…
                  </>
                ) : (
                  <>
                    <Icon icon="ph:envelope-fill" className="w-4 h-4" /> Send
                    OTP & Continue
                  </>
                )}
              </button>
              <p
                className={`text-center text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-emerald-500 hover:text-emerald-400 font-semibold"
                >
                  Sign in →
                </Link>
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Register;
