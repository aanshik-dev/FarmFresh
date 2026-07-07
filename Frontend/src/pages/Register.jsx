import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui";
import SlideToggle from "../components/common/SlideToggle";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon paths broken by Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ROLE_OPTIONS = [
  { value: "FARMER_GROUP", label: "Farmer Group", icon: "ph:plant-fill" },
  { value: "COLLECTIVE", label: "Collective", icon: "ph:buildings-fill" },
];

const ALL_CROPS = [
  "Rajma",
  "Potato",
  "Ginger",
  "Garlic",
  "Wheat",
  "Barley",
  "Peas",
  "Mustard",
  "Soyabean",
  "Buckwheat",
  "Amaranth",
  "Lentils",
  "Maize",
  "Turmeric",
  "Onion",
  "Tomato",
  "Cabbage",
  "Spinach",
  "Radish",
  "Turnip",
  "Cauliflower",
  "Broccoli",
  "Carrot",
  "Beetroot",
  "Coriander",
  "Fenugreek",
  "Chilli",
  "Capsicum",
  "Pumpkin",
  "Bottle Gourd",
  "Ridge Gourd",
];

// Map click handler component
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

// Field wrapper
const Field = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-slate-300">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = (isDark) =>
  `w-full rounded-xl border text-sm px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all ${
    isDark
      ? "bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-600"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
  }`;

// ── Crop Tag Input Component ──────────────────────────────────────────────────
const CropTagInput = ({ selected, onChange, isDark }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Show all unselected crops when focused with no query; filter when typing
  const suggestions = ALL_CROPS.filter(
    (c) =>
      !selected.includes(c) &&
      (query.trim().length === 0 ||
        c.toLowerCase().includes(query.toLowerCase())),
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addCrop = (crop) => {
    if (!selected.includes(crop)) onChange([...selected, crop]);
    setQuery("");
    setOpen(false);
  };

  const removeCrop = (crop) => onChange(selected.filter((c) => c !== crop));

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) addCrop(suggestions[0]);
      else if (query.trim()) addCrop(query.trim());
    }
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative space-y-2">
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((crop) => (
            <span
              key={crop}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                isDark
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-emerald-50 border-emerald-300 text-emerald-700"
              }`}
            >
              <Icon icon="ph:plant-fill" className="w-3 h-3" />
              {crop}
              <button
                type="button"
                onClick={() => removeCrop(crop)}
                className="ml-0.5 hover:text-red-400 cursor-pointer transition-colors"
              >
                <Icon icon="ph:x-bold" className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Icon
          icon="ph:magnifying-glass-fill"
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type to search crops…"
          className={`${inputCls(isDark)} pl-9`}
        />
      </div>

      {/* Dropdown suggestions */}
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 top-full mt-1 w-full rounded-xl border max-h-50 shadow-xl overflow-auto scrollbar-thin ${
              isDark
                ? "bg-slate-900 border-slate-700 shadow-black/40"
                : "bg-white border-slate-200 shadow-slate-200/60"
            }`}
          >
            {suggestions.map((crop, i) => (
              <button
                key={crop}
                type="button"
                onMouseDown={() => addCrop(crop)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                  isDark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-700 hover:bg-slate-50"
                } ${i !== 0 ? (isDark ? "border-t border-slate-800" : "border-t border-slate-100") : ""}`}
              >
                <Icon
                  icon="ph:plant-fill"
                  className="w-4 h-4 text-emerald-500 shrink-0"
                />
                {crop}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {selected.length === 0 && (
        <p
          className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}
        >
          No crops added yet. Search and click to add.
        </p>
      )}
    </div>
  );
};

// ── Map Modal ─────────────────────────────────────────────────────────────────
const MapModal = ({
  isDark,
  open,
  onClose,
  onConfirm,
  initialPos,
  initialCenter,
}) => {
  const [tempPos, setTempPos] = useState(initialPos);
  const [center] = useState(initialCenter || [30.7333, 79.0667]);

  useEffect(() => {
    setTempPos(initialPos);
  }, [initialPos, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className={`relative z-10 w-full max-w-2xl rounded-2xl border overflow-hidden shadow-2xl ${
          isDark
            ? "bg-slate-900 border-slate-700 shadow-black/60"
            : "bg-white border-slate-200"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-slate-700/80" : "border-slate-200"}`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 rounded-lg ${isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}
            >
              <Icon icon="ph:map-trifold-fill" className="w-4 h-4" />
            </div>
            <div>
              <p
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Choose Location on Map
              </p>
              <p
                className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                Click anywhere to pin your location
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${isDark ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-100"}`}
          >
            <Icon icon="ph:x-bold" className="w-4 h-4" />
          </button>
        </div>

        {/* Map */}
        <div className="h-80 relative">
          <MapContainer
            center={tempPos ? [tempPos.lat, tempPos.lng] : center}
            zoom={tempPos ? 13 : 8}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={(latlng) => setTempPos(latlng)} />
            {tempPos && <Marker position={[tempPos.lat, tempPos.lng]} />}
          </MapContainer>

          {!tempPos && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[999]">
              <div
                className={`rounded-xl px-5 py-3 text-center border backdrop-blur-sm ${isDark ? "bg-slate-900/85 border-slate-700" : "bg-white/85 border-slate-200"}`}
              >
                <Icon
                  icon="ph:map-pin-fill"
                  className="w-7 h-7 text-emerald-400 mx-auto mb-1"
                />
                <p
                  className={`text-xs font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}
                >
                  Click the map to pin location
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-t gap-3 ${isDark ? "border-slate-700/80 bg-slate-900/60" : "border-slate-200 bg-slate-50"}`}
        >
          <span
            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            {tempPos ? (
              <>
                Pinned:{" "}
                <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                  {tempPos.lat.toFixed(5)}, {tempPos.lng.toFixed(5)}
                </span>
              </>
            ) : (
              "No location selected"
            )}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm font-medium border cursor-pointer transition-colors ${isDark ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"}`}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!tempPos}
              onClick={() => {
                onConfirm(tempPos);
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ── Main Register Component ───────────────────────────────────────────────────
const Register = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, sendOTP, verifyOTP } = useAuth();

  const [role, setRole] = useState("FARMER_GROUP");
  const [step, setStep] = useState("form"); // form | otp
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [mockOtp, setMockOtp] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  // Reset form when switching roles
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirm("");
    setPhoto(null);
    setSelectedCrops([]);
    setGroupName("");
    setLeadFarmerName("");
    setNumberOfFarmers("");
    setCollectiveName("");
    setWorkers("");
    // Reset address too
    setVillage("");
    setDistrict("");
    setState("");
    setPincode("");
    setLat("");
    setLng("");
    setMarkerPos(null);
  };

  // Shared
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [photo, setPhoto] = useState(null);

  // Address
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [markerPos, setMarkerPos] = useState(null);

  // Farmer-specific
  const [groupName, setGroupName] = useState("");
  const [numberOfFarmers, setNumberOfFarmers] = useState("");
  const [leadFarmerName, setLeadFarmerName] = useState("");
  const [selectedCrops, setSelectedCrops] = useState([]);

  // Collective-specific
  const [collectiveName, setCollectiveName] = useState("");
  const [workers, setWorkers] = useState("");

  const passwordError =
    confirm && confirm !== password ? "Passwords do not match" : "";

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

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (passwordError) return;
    setLoading(true);
    try {
      const result = await sendOTP(phone);
      setMockOtp(result.mockOtp);
      setStep("otp");
      toast.info(`OTP sent. Demo OTP: ${result.mockOtp}`, {
        title: "OTP Sent",
        duration: 8000,
      });
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
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
        toast.error(`Invalid OTP. Demo OTP is: ${mockOtp}`);
        return;
      }
      const address = [village, district, state, pincode]
        .filter(Boolean)
        .join(", ");
      const coords =
        lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
      const formData =
        role === "FARMER_GROUP"
          ? {
              groupName,
              numberOfFarmers,
              leadFarmerName,
              email,
              phone,
              password,
              crops: selectedCrops,
              address,
              village,
              district,
              state,
              pincode,
              coordinates: coords,
            }
          : {
              collectiveName,
              workers,
              email,
              phone,
              password,
              address,
              village,
              district,
              state,
              pincode,
              coordinates: coords,
            };
      await register(formData, role);
      toast.success("Account created! Please log in.", {
        title: "Registered!",
      });
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) setPhoto(URL.createObjectURL(file));
  };

  const cardCls = `rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`;
  const labelCls = `block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`;
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
        // ── OTP STEP ──
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
                  icon="ph:device-mobile-fill"
                  className="w-8 h-8 text-emerald-400"
                />
              </div>
              <h2
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Verify OTP
              </h2>
              <p
                className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Enter the OTP sent to{" "}
                <span
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {phone}
                </span>
              </p>
            </div>
            <div
              className={`rounded-xl border p-4 mb-6 flex items-center gap-3 ${isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"}`}
            >
              <Icon
                icon="ph:info-fill"
                className="w-5 h-5 text-emerald-400 shrink-0"
              />
              <p
                className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Demo OTP:{" "}
                <span className="font-bold text-emerald-400 text-lg tracking-widest">
                  {mockOtp}
                </span>
              </p>
            </div>
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
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
                className="w-full py-3 rounded-xl font-semibold text-sm bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
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
        // ── MAIN FORM STEP ──
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
            {/* ── ROW 1: Identity ── */}
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
                      className={`relative w-25 h-25 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${photo ? "border-transparent" : isDark ? "border-slate-600 hover:border-emerald-500" : "border-slate-300 hover:border-emerald-400"}`}
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
                      Optional. Click to upload.
                    </p>
                  </div>
                </div>

                {/* Role-specific */}
                <AnimatePresence mode="wait">
                  {role === "FARMER_GROUP" ? (
                    <motion.div
                      key="farmer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="contents"
                    >
                      <Field label="Farmer Group Name" required>
                        <input
                          className={ic}
                          placeholder="e.g. Triyuginarayan Organic Pulse Pioneers"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          required
                        />
                      </Field>
                      <Field label="Lead Farmer Name" required>
                        <input
                          className={ic}
                          placeholder="Your full name"
                          value={leadFarmerName}
                          onChange={(e) => setLeadFarmerName(e.target.value)}
                          required
                        />
                      </Field>
                      <Field label="No. of Farmers" required>
                        <input
                          className={ic}
                          type="number"
                          min="1"
                          placeholder="12"
                          value={numberOfFarmers}
                          onChange={(e) => setNumberOfFarmers(e.target.value)}
                          required
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
                      <Field label="Collective Name" required>
                        <input
                          className={ic}
                          placeholder="e.g. Mandakini Organic Collective"
                          value={collectiveName}
                          onChange={(e) => setCollectiveName(e.target.value)}
                          required
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

                <Field label="Phone" required>
                  <input
                    className={ic}
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Email" required>
                  <input
                    className={ic}
                    type="email"
                    placeholder="you@example.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Password" required>
                  <div className="relative">
                    <input
                      className={`${ic} pr-10`}
                      type={showPass ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
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
                <Field label="Confirm Password" required>
                  <input
                    className={`${ic} ${confirm && confirm !== password ? "border-red-500 focus:border-red-500 focus:ring-red-500/40" : ""}`}
                    type="password"
                    placeholder="Re-enter password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                  {passwordError && (
                    <p className="text-xs text-red-400 mt-1">{passwordError}</p>
                  )}
                </Field>
              </div>
            </div>

            {/* ── ROW 2: Crops (both roles) ── */}
            <div className={cardCls}>
              <p className={sectionTitleCls}>
                <Icon
                  icon="ph:plant-fill"
                  className="w-3.5 h-3.5 text-emerald-400"
                />
                {role === "FARMER_GROUP" ? "Crops Grown" : "Crops Handled"}
              </p>
              <CropTagInput
                selected={selectedCrops}
                onChange={setSelectedCrops}
                isDark={isDark}
              />
            </div>

            {/* ── ROW 3: Address ── */}
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
                  {/* Auto-fill button */}
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
                  {/* Choose on map button */}
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

              {/* Pin status indicator */}
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
                <Field label="Village / Town">
                  <input
                    className={ic}
                    placeholder="e.g. Triyuginarayan"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                  />
                </Field>
                <Field label="District">
                  <input
                    className={ic}
                    placeholder="e.g. Rudraprayag"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                </Field>
                <Field label="State">
                  <input
                    className={ic}
                    placeholder="e.g. Uttarakhand"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </Field>
                <Field label="Pincode">
                  <input
                    className={ic}
                    placeholder="246444"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                </Field>
                <Field label="Latitude">
                  <input
                    className={ic}
                    placeholder="30.7333"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                  />
                </Field>
                <Field label="Longitude">
                  <input
                    className={ic}
                    placeholder="79.0667"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {/* ── Submit ── */}
            <div className="space-y-3 pb-8">
              <button
                type="submit"
                disabled={loading || !!passwordError}
                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />{" "}
                    Sending OTP…
                  </>
                ) : (
                  <>
                    <Icon icon="ph:device-mobile-fill" className="w-4 h-4" />{" "}
                    Send OTP & Continue
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
