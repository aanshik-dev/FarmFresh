import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui";
import MapModal from "../../components/common/MapModal";
import { getProfileCompletion } from "../../components/common/ProfileBanner";
import { updateProfile } from "../../services/user.service";

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const combineAddress = (addr) => {
  if (!addr) return "";
  return [
    addr.locality,
    addr.area,
    addr.town,
    addr.district,
    addr.state,
    addr.pinCode,
  ]
    .filter(Boolean)
    .join(", ");
};

const ROLE_META = {
  FARMER_GROUP: {
    label: "Farmer Group",
    icon: "ph:plant-fill",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    gradient: "from-emerald-900/80 via-emerald-800 to-emerald-900",
    gradientLight: "from-emerald-600 via-emerald-600 to-emerald-700",
    leaderLabel: "Lead Farmer",
    countLabel: "No. of Farmers",
    countKey: "farmerCount",
  },
  COLLECTIVE: {
    label: "Collective",
    icon: "ph:buildings-fill",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    gradient: "from-emerald-900/80 via-emerald-800 to-emerald-900",
    gradientLight: "from-emerald-600 via-emerald-600 to-emerald-700",
    leaderLabel: "Manager",
    countLabel: "Workers",
    countKey: "workers",
  },
  ADMIN: {
    label: "Administrator",
    icon: "ph:shield-check-fill",
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    border: "border-violet-500/30",
    gradient: "from-violet-900 via-slate-900 to-violet-900",
    gradientLight: "from-violet-700 via-violet-600 to-violet-700",
    leaderLabel: null,
    countLabel: null,
    countKey: null,
  },
};

const FieldLabel = ({ children, required, isDark }) => (
  <label
    className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
  >
    {children}
    {required && <span className="text-rose-400 ml-0.5">*</span>}
  </label>
);

const InfoRow = ({ icon, label, value, isDark, mono }) => (
  <div className="flex items-start gap-3">
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
    >
      <Icon icon={icon} className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <p
        className={`text-xs font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}
      >
        {label}
      </p>
      <p
        className={`text-sm font-medium break-all ${mono ? "font-mono" : ""} ${isDark ? "text-slate-200" : "text-slate-700"}`}
      >
        {value || <span className="italic text-slate-400">Not set</span>}
      </p>
    </div>
  </div>
);

// Main Component
const UserProfile = () => {
  const { isDark } = useTheme();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const role = user?.role || "FARMER_GROUP";
  const meta = ROLE_META[role] || ROLE_META.FARMER_GROUP;

  // ── Mode
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  // ── Edit state — seeded from live user object
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [leader, setLeader] = useState("");
  const [count, setCount] = useState(""); // workers or farmerCount
  const [desc, setDesc] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  // Address sub-fields
  const [locality, setLocality] = useState("");
  const [area, setArea] = useState("");
  const [town, setTown] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  // Coords (edit-only)
  const [lat, setLat] = useState("");
  const [long, setLong] = useState("");

  const seedFields = useCallback(() => {
    if (!user) return;
    setName(user.name || "");
    setPhone(user.phone || "");
    setLeader(user.leader || "");
    setCount(String(user[meta.countKey] ?? ""));
    setDesc(user.desc || "");
    setPhotoPreview(user.profile || null);
    setPhotoFile(null);
    setLocality(user.address?.locality || "");
    setArea(user.address?.area || "");
    setTown(user.address?.town || "");
    setDistrict(user.address?.district || "");
    setState(user.address?.state || "");
    setPinCode(user.address?.pinCode || "");
    setLat(user.coord?.lat != null ? String(user.coord.lat) : "");
    setLong(user.coord?.long != null ? String(user.coord.long) : "");
  }, [user, meta.countKey]);

  useEffect(() => {
    if (editing) seedFields();
  }, [editing, seedFields]);

  const handlePhotoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB.");
      return;
    }
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(String(latitude.toFixed(6)));
        setLong(String(longitude.toFixed(6)));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          console.log(data);
          const addr = data.address || {};
          const twn =
            addr.county ||
            addr.town ||
            addr.city ||
            addr.city_district ||
            addr.municipality ||
            "";
          const dist = addr.state_district || addr.district || twn || "";
          const st = addr.state || addr.territory || addr.region || dist || "";

          setLocality(
            addr.neighbourhood ||
              addr.hamlet ||
              addr.road ||
              addr.residential ||
              "",
          );
          setArea(
            addr.suburb || addr.village || addr.county || addr.quarter || "",
          );
          setTown(twn);
          setDistrict(dist);
          setState(st);
          setPinCode(addr.postcode || "");
          toast.success("Location detected and address auto-filled!");
        } catch {
          toast.error("Could not reverse-geocode. Coordinates filled in.");
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        const msg =
          err.code === 1
            ? "Location permission denied."
            : err.code === 2
              ? "Location unavailable."
              : "Location request timed out.";
        toast.error(msg);
      },
      { timeout: 10000 },
    );
  };

  // ── Map confirm
  const handleMapConfirm = async (latlng) => {
    setLat(String(latlng.lat.toFixed(6)));
    setLong(String(latlng.lng.toFixed(6)));
    // Reverse-geocode
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      console.log(data);
      const addr = data.address || {};
      const twn =
        addr.county ||
        addr.town ||
        addr.city ||
        addr.city_district ||
        addr.municipality ||
        "";
      const dist = addr.state_district || addr.district || twn || "";
      const st = addr.state || addr.territory || addr.region || dist || "";

      setLocality(
        addr.neighbourhood ||
          addr.hamlet ||
          addr.road ||
          addr.residential ||
          "",
      );
      setArea(addr.suburb || addr.village || addr.county || addr.quarter || "");
      setTown(twn);
      setDistrict(dist);
      setState(st);
      setPinCode(addr.postcode || "");
      toast.success("Location pinned and address filled!");
    } catch {
      toast.error("Pinned. Could not auto-fill address.");
    }
  };

  // ── Save
  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (!phone.trim() || !/^[0-9]{10}$/.test(phone)) {
      toast.error("Valid 10-digit phone is required.");
      return;
    }
    if (role !== "ADMIN") {
      if (!leader.trim()) {
        toast.error(`${meta.leaderLabel} name is required.`);
        return;
      }
      if (meta.countKey) {
        const num = Number(count);
        if (
          count === "" ||
          isNaN(num) ||
          num < (role === "COLLECTIVE" ? 0 : 1)
        ) {
          toast.error(`Valid ${meta.countLabel} is required.`);
          return;
        }
      }
      if (!district.trim()) {
        toast.error("District is required.");
        return;
      }
      if (!state.trim()) {
        toast.error("State is required.");
        return;
      }
      if (!pinCode.trim()) {
        toast.error("Pin Code is required.");
        return;
      }
    }

    setSaving(true);
    try {
      const updates = {
        name: name.trim(),
        phone: phone.trim(),
        desc: desc.trim(),
      };

      if (role !== "ADMIN") {
        updates.leader = leader.trim();
        updates[meta.countKey] = parseInt(count) || 0;
        updates.address = {
          locality: locality.trim(),
          area: area.trim(),
          town: town.trim(),
          district: district.trim(),
          state: state.trim(),
          pinCode: pinCode.trim(),
        };
        updates.coord = {
          lat: lat ? parseFloat(lat) : null,
          long: long ? parseFloat(long) : null,
        };
      }

      if (photoPreview && photoPreview !== user?.profile) {
        updates.profile = photoPreview;
      }

      const formData = new FormData();
      Object.keys(updates).forEach((key) => {
        if (key === "profile") return;
        if (typeof updates[key] === "object" && updates[key] !== null) {
          formData.append(key, JSON.stringify(updates[key]));
        } else {
          formData.append(key, updates[key]);
        }
      });

      if (photoFile) {
        formData.append("profile", photoFile);
      }

      const res = await updateProfile(formData);
      // If backend returns updated user with Cloudinary URL, use it, else fallback to optimistic
      updateUser(res.data?.user || updates);
      toast.success("Profile updated successfully!", { title: "Saved" });
      setEditing(false);
    } catch {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    seedFields();
    setEditing(false);
  };

  const completion = getProfileCompletion(user);
  const fullAddress = combineAddress(user?.address);

  // ── Input class
  const ic = `w-full rounded-xl border text-sm px-3.5 py-2.5 outline-none transition-all focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
    isDark
      ? "bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500"
      : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
  }`;

  const sectionCard = `rounded-2xl border p-5 ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`;

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Map Modal */}
      <MapModal
        isDark={isDark}
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={handleMapConfirm}
        initialPos={
          lat && long ? { lat: parseFloat(lat), lng: parseFloat(long) } : null
        }
        initialCenter={[30.7333, 79.0667]}
      />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* ── PROFILE CARD ─────────────────────────────────────────────── */}
        <div
          className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}
        >
          {/* Hero Banner */}
          <div
            className={`h-32 bg-linear-to-br ${isDark ? meta.gradient : meta.gradientLight} relative overflow-hidden`}
          >
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full bg-white/5 blur-2xl" />
          </div>

          <div className="px-6 pb-6">
            {/* Avatar + Actions row */}
            <div className="flex items-end justify-between -mt-12 mb-4 flex-wrap gap-3">
              {/* Avatar */}
              <div className="relative z-10">
                <div
                  className={`w-24 h-24 rounded-2xl border-4 overflow-hidden flex items-center justify-center shadow-xl ${isDark ? "border-slate-900" : "border-white"}`}
                >
                  {editing && photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : user?.profile ? (
                    <img
                      src={user.profile}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center text-3xl font-bold ${isDark ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-500"}`}
                    >
                      {user?.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                {/* Photo upload in edit mode */}
                {editing && (
                  <label
                    className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer shadow-md transition-colors ${isDark ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
                  >
                    <Icon icon="ph:camera-fill" className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-2">
                {editing && (
                  <button
                    onClick={handleCancel}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all border ${isDark ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => (editing ? handleSave() : setEditing(true))}
                  disabled={saving}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                    editing
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : isDark
                        ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {saving ? (
                    <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />
                  ) : (
                    <Icon
                      icon={editing ? "ph:floppy-disk-fill" : "ph:pencil-fill"}
                      className="w-4 h-4"
                    />
                  )}
                  {editing
                    ? saving
                      ? "Saving…"
                      : "Save Changes"
                    : "Edit Profile"}
                </button>
              </div>
            </div>

            {/* Name + Role */}
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h1
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {user?.name || "—"}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color} ${meta.bg} ${meta.border}`}
              >
                <Icon icon={meta.icon} className="w-3 h-3" />
                {meta.label}
              </span>
            </div>

            {/* Identity chips */}
            <div
              className={`flex flex-wrap gap-3 text-xs mt-3 pb-4 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}
            >
              {[
                {
                  icon: "ph:identification-badge-fill",
                  val: user?.uid,
                  label: "UID",
                },
                { icon: "ph:envelope-fill", val: user?.email, label: "Email" },
                {
                  icon: "ph:plugs-connected-fill",
                  val: user?.provider,
                  label: "Provider",
                },
              ].map(({ icon, val, label }) => (
                <span
                  key={label}
                  className={`flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  <Icon
                    icon={icon}
                    className={`w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  />
                  <span
                    className={`font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {label}:
                  </span>
                  {val || "—"}
                </span>
              ))}
            </div>

            {/* Completion Progress */}
            {completion < 100 && (
              <div className="mt-6 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-amber-400" : "text-amber-600"}`}
                  >
                    <Icon icon="ph:warning-circle-fill" className="w-4 h-4" />
                    Profile Incomplete
                  </span>
                  <span
                    className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {completion}%
                  </span>
                </div>
                <div
                  className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000 ease-out"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <p
                  className={`text-[11px] mt-1.5 font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  Complete your profile to unlock all features.
                </p>
              </div>
            )}

            {/* ── EDIT FORM ── */}
            <AnimatePresence mode="wait">
              {editing ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="mt-5 space-y-4"
                >
                  {/* Name + Phone */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <FieldLabel required isDark={isDark}>
                        {role === "FARMER_GROUP"
                          ? "Farmer Group Name"
                          : role === "COLLECTIVE"
                            ? "Collective Name"
                            : "Name"}
                      </FieldLabel>
                      <input
                        className={ic}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Himalayan Farmers Group"
                      />
                    </div>
                    <div>
                      <FieldLabel required isDark={isDark}>
                        Phone
                      </FieldLabel>
                      <input
                        className={ic}
                        value={phone}
                        maxLength={10}
                        onChange={(e) =>
                          setPhone(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="10-digit number"
                      />
                    </div>
                  </div>

                  {/* Leader + Count — not for ADMIN */}
                  {role !== "ADMIN" && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <FieldLabel required isDark={isDark}>
                          {meta.leaderLabel}
                        </FieldLabel>
                        <input
                          className={ic}
                          value={leader}
                          onChange={(e) => setLeader(e.target.value)}
                          placeholder={
                            role === "FARMER_GROUP"
                              ? "e.g. Rajan Sharma"
                              : "e.g. Priya Mehta"
                          }
                        />
                      </div>
                      {meta.countKey && (
                        <div>
                          <FieldLabel required isDark={isDark}>
                            {meta.countLabel}
                          </FieldLabel>
                          <input
                            className={ic}
                            type="number"
                            min={0}
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Desc */}
                  <div>
                    <FieldLabel isDark={isDark}>
                      Description{" "}
                      <span
                        className={`normal-case font-normal text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        (optional)
                      </span>
                    </FieldLabel>
                    <textarea
                      rows={3}
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="Tell others about your group or collective…"
                      className={`${ic} resize-none`}
                    />
                  </div>

                  {/* Address — not for ADMIN */}
                  {role !== "ADMIN" && (
                    <div
                      className={`rounded-xl border p-4 space-y-3 ${isDark ? "bg-slate-800/30 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p
                          className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}
                        >
                          <Icon
                            icon="ph:map-pin-fill"
                            className="inline w-4 h-4 mr-1.5 text-emerald-400"
                          />
                          Address & Location
                        </p>
                        {/* Location action buttons */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleDetectLocation}
                            disabled={detectingLocation}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                              isDark
                                ? "border-emerald-600/40 text-emerald-400 hover:bg-emerald-500/10"
                                : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                            } disabled:opacity-60`}
                          >
                            {detectingLocation ? (
                              <Icon
                                icon="svg-spinners:ring-resize"
                                className="w-3.5 h-3.5"
                              />
                            ) : (
                              <Icon
                                icon="ph:navigation-arrow-fill"
                                className="w-3.5 h-3.5"
                              />
                            )}
                            {detectingLocation ? "Detecting…" : "Auto-Detect"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMapOpen(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                              isDark
                                ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                                : "border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <Icon
                              icon="ph:map-trifold-fill"
                              className="w-3.5 h-3.5"
                            />
                            Choose on Map
                          </button>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <FieldLabel isDark={isDark}>Locality</FieldLabel>
                          <input
                            className={ic}
                            value={locality}
                            onChange={(e) => setLocality(e.target.value)}
                            placeholder="e.g. Near Post Office"
                          />
                        </div>
                        <div>
                          <FieldLabel isDark={isDark}>
                            Area / Village
                          </FieldLabel>
                          <input
                            className={ic}
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            placeholder="e.g. Triyuginarayan"
                          />
                        </div>
                        <div>
                          <FieldLabel isDark={isDark}>Town</FieldLabel>
                          <input
                            className={ic}
                            value={town}
                            onChange={(e) => setTown(e.target.value)}
                            placeholder="e.g. Sonprayag"
                          />
                        </div>
                        <div>
                          <FieldLabel required isDark={isDark}>
                            District / City
                          </FieldLabel>
                          <input
                            className={ic}
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            placeholder="e.g. Rudraprayag"
                          />
                        </div>
                        <div>
                          <FieldLabel required isDark={isDark}>
                            State
                          </FieldLabel>
                          <input
                            className={ic}
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            placeholder="e.g. Uttarakhand"
                          />
                        </div>
                        <div>
                          <FieldLabel required isDark={isDark}>
                            Pin Code
                          </FieldLabel>
                          <input
                            className={ic}
                            value={pinCode}
                            maxLength={6}
                            onChange={(e) =>
                              setPinCode(e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="246444"
                          />
                        </div>
                      </div>

                      {/* Coords */}
                      {(lat || long) && (
                        <div
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${isDark ? "bg-slate-800/60 text-slate-400" : "bg-slate-100 text-slate-500"}`}
                        >
                          <Icon
                            icon="ph:crosshair-fill"
                            className="w-3.5 h-3.5 text-emerald-400"
                          />
                          GPS: {lat || "—"}, {long || "—"}
                          <button
                            type="button"
                            onClick={() => {
                              setLat("");
                              setLong("");
                            }}
                            className="ml-auto text-slate-400 hover:text-red-400 cursor-pointer transition-colors"
                          >
                            <Icon icon="ph:x-bold" className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                /* ── VIEW MODE ── */
                <motion.div
                  key="view"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6 grid sm:grid-cols-2 gap-6"
                >
                  <div className="space-y-6">
                    <div>
                      <h3
                        className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        Description
                      </h3>
                      {user?.desc ? (
                        <p
                          className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}
                        >
                          {user.desc}
                        </p>
                      ) : (
                        <p
                          className={`text-sm italic ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          Not available
                        </p>
                      )}
                    </div>
                    {role !== "ADMIN" && (
                      <div>
                        <h3
                          className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          Address
                        </h3>
                        {fullAddress ? (
                          <div className="flex items-start gap-2">
                            <Icon
                              icon="ph:map-pin-fill"
                              className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0"
                            />
                            <p
                              className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
                            >
                              {fullAddress}
                            </p>
                          </div>
                        ) : (
                          <p
                            className={`text-sm italic ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          >
                            Not available
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-6 border-slate-200 dark:border-slate-800">
                    {user?.phone && (
                      <InfoRow
                        icon="ph:phone-fill"
                        label="Phone"
                        value={user.phone}
                        isDark={isDark}
                      />
                    )}
                    {role !== "ADMIN" && (
                      <>
                        <InfoRow
                          icon="ph:user-fill"
                          label={meta.leaderLabel}
                          value={user?.leader}
                          isDark={isDark}
                        />
                        {user?.[meta.countKey] != null && (
                          <InfoRow
                            icon="ph:users-fill"
                            label={meta.countLabel}
                            value={String(user[meta.countKey])}
                            isDark={isDark}
                          />
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── ACCOUNT DETAILS CARD ─────────────────────────────────────── */}
        <div className={sectionCard}>
          <h2
            className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            <Icon icon="ph:info-fill" className="w-4 h-4 text-emerald-400" />
            Account Details
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoRow
              icon="ph:identification-badge-fill"
              label="User ID"
              value={user?.uid}
              isDark={isDark}
              mono
            />
            <InfoRow
              icon="ph:envelope-fill"
              label="Email"
              value={user?.email}
              isDark={isDark}
            />
            <InfoRow
              icon="ph:clock-fill"
              label="Last Login"
              value={formatDate(user?.lastLogin)}
              isDark={isDark}
            />
            <InfoRow
              icon="ph:calendar-check-fill"
              label="Account Created"
              value={formatDate(user?.creation)}
              isDark={isDark}
            />
            <InfoRow
              icon="ph:plugs-connected-fill"
              label="Auth Provider"
              value={user?.provider}
              isDark={isDark}
            />
            <InfoRow
              icon="ph:shield-check-fill"
              label="Account Status"
              value={user?.isActive ? "Active" : "Inactive"}
              isDark={isDark}
            />
          </div>
        </div>

        {/* ── COLLECTIVE STATS (rating) ─────────────────────────────────── */}
        {role === "COLLECTIVE" && user?.rating != null && (
          <div className={sectionCard}>
            <h2
              className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              <Icon icon="ph:star-fill" className="w-4 h-4 text-amber-400" />
              Performance
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Icon
                    key={n}
                    icon={
                      n <= Math.round(user.rating) ? "ph:star-fill" : "ph:star"
                    }
                    className={`w-5 h-5 ${n <= Math.round(user.rating) ? "text-amber-400" : isDark ? "text-slate-600" : "text-slate-300"}`}
                  />
                ))}
              </div>
              <span
                className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {Number(user.rating).toFixed(1) == 0.0
                  ? "N/A"
                  : Number(user.rating).toFixed(1)}
              </span>
              <span
                className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                / 5.0
              </span>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default UserProfile;
