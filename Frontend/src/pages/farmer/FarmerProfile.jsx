import React, { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useToast, Button, Input } from "../../components/ui";
import { farmerCropsData, collectivesList } from "../../utils/InterfaceData";
import StatusBadge from "../../components/common/StatusBadge";

const CROPS_LIST = [
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
];

const FarmerProfile = () => {
  const { isDark } = useTheme();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [description, setDescription] = useState(user?.description || "");
  const [leadFarmerName, setLeadFarmerName] = useState(
    user?.leadFarmerName || "",
  );
  const [numberOfFarmers, setNumberOfFarmers] = useState(
    user?.numberOfFarmers || "",
  );
  const [groupName, setGroupName] = useState(user?.groupName || "");
  const [selectedCrops, setSelectedCrops] = useState(user?.crops || []);

  // Address fields (separate)
  const [village, setVillage] = useState(user?.village || "");
  const [district, setDistrict] = useState(user?.district || "");
  const [state, setState] = useState(user?.state || "");
  const [pincode, setPincode] = useState(user?.pincode || "");
  const [lat, setLat] = useState(user?.coordinates?.lat || "");
  const [lng, setLng] = useState(user?.coordinates?.lng || "");

  // Review
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedCollective, setSelectedCollective] = useState("");

  const toggleCrop = (crop) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    const address = [village, district, state, pincode]
      .filter(Boolean)
      .join(", ");
    updateUser({
      name,
      phone,
      description,
      leadFarmerName,
      groupName,
      numberOfFarmers: parseInt(numberOfFarmers) || numberOfFarmers,
      crops: selectedCrops,
      address,
      village,
      district,
      state,
      pincode,
      coordinates:
        lat && lng
          ? { lat: parseFloat(lat), lng: parseFloat(lng) }
          : user?.coordinates,
      isProfileComplete: true,
    });
    toast.success("Profile updated successfully!", { title: "Saved" });
    setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setDescription(user?.description || "");
    setLeadFarmerName(user?.leadFarmerName || "");
    setGroupName(user?.groupName || "");
    setNumberOfFarmers(user?.numberOfFarmers || "");
    setSelectedCrops(user?.crops || []);
    setVillage(user?.village || "");
    setDistrict(user?.district || "");
    setState(user?.state || "");
    setPincode(user?.pincode || "");
    setLat(user?.coordinates?.lat || "");
    setLng(user?.coordinates?.lng || "");
    setEditing(false);
  };

  const handleSubmitReview = () => {
    if (!rating || !reviewText || !selectedCollective) {
      toast.error("Fill all review fields");
      return;
    }
    toast.success("Review submitted!", { title: "Thank you!" });
    setRating(0);
    setReviewText("");
    setSelectedCollective("");
  };

  const fullAddress = [
    user?.village,
    user?.district,
    user?.state,
    user?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const iClass = `w-full rounded-xl border text-sm px-4 py-2.5 outline-none transition-all focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
    isDark
      ? "bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
  }`;

  return (
    <div
      className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile card */}
        <div
          className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
        >
          {/* Banner */}
          <div className="h-28 bg-linear-to-br from-emerald-600 via-teal-600 to-emerald-800 relative">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px) 0 0 / 30px 30px",
              }}
            />
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4 flex-wrap gap-3">
              <div
                className={`w-20 h-20 rounded-2xl border-4 overflow-hidden flex items-center justify-center ${isDark ? "border-slate-900 bg-emerald-800" : "border-white bg-emerald-100"}`}
              >
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Icon
                    icon="ph:plant-fill"
                    className={`w-10 h-10 ${isDark ? "text-emerald-300" : "text-emerald-600"}`}
                  />
                )}
              </div>
              <div className="flex gap-2">
                {editing && (
                  <button
                    onClick={handleCancel}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all border ${isDark ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => (editing ? handleSave() : setEditing(true))}
                  disabled={saving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                    editing
                      ? "bg-linear-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20"
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

            {/* Non-editable badge */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <h1
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {user?.groupName || "Farmer Group"}
              </h1>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-100 text-emerald-700"}`}
              >
                <Icon icon="ph:plant-fill" className="w-3 h-3 inline mr-0.5" />
                Farmer Group
              </span>
            </div>
            <p
              className={`text-xs mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              <Icon icon="ph:lock-fill" className="w-3 h-3 inline mr-1" />
              Email:{" "}
              <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                {user?.email}
              </span>{" "}
              (cannot be changed)
            </p>

            {editing ? (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Group Name
                    </label>
                    <input
                      className={iClass}
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Group name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Lead Farmer Name
                    </label>
                    <input
                      className={iClass}
                      value={leadFarmerName}
                      onChange={(e) => setLeadFarmerName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Phone
                    </label>
                    <input
                      className={iClass}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      No. of Farmers
                    </label>
                    <input
                      className={iClass}
                      type="number"
                      value={numberOfFarmers}
                      onChange={(e) => setNumberOfFarmers(e.target.value)}
                      placeholder="12"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label
                    className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="About your farmer group…"
                    className={`${iClass} resize-none`}
                  />
                </div>

                {/* Address */}
                <div
                  className={`rounded-xl border p-4 space-y-3 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50"}`}
                >
                  <p
                    className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Address & Location
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      {
                        label: "Village / Town",
                        val: village,
                        set: setVillage,
                        ph: "e.g. Triyuginarayan",
                      },
                      {
                        label: "District",
                        val: district,
                        set: setDistrict,
                        ph: "e.g. Rudraprayag",
                      },
                      {
                        label: "State",
                        val: state,
                        set: setState,
                        ph: "e.g. Uttarakhand",
                      },
                      {
                        label: "Pincode",
                        val: pincode,
                        set: setPincode,
                        ph: "246444",
                      },
                      {
                        label: "Latitude",
                        val: String(lat),
                        set: setLat,
                        ph: "30.7333",
                      },
                      {
                        label: "Longitude",
                        val: String(lng),
                        set: setLng,
                        ph: "79.0667",
                      },
                    ].map((f) => (
                      <div key={f.label} className="space-y-1.5">
                        <label
                          className={`block text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {f.label}
                        </label>
                        <input
                          className={iClass}
                          value={f.val}
                          onChange={(e) => f.set(e.target.value)}
                          placeholder={f.ph}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Crops */}
                <div className="space-y-2">
                  <p
                    className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Crops Grown
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CROPS_LIST.map((crop) => (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => toggleCrop(crop)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          selectedCrops.includes(crop)
                            ? isDark
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                              : "bg-emerald-100 border-emerald-300 text-emerald-700"
                            : isDark
                              ? "border-slate-700 text-slate-400 hover:border-slate-600"
                              : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {crop}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p
                  className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  {user?.description || (
                    <span
                      className={`italic ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      No description added yet. Click "Edit Profile" to add one.
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  {[
                    user?.phone && { icon: "ph:phone-fill", val: user.phone },
                    fullAddress && {
                      icon: "ph:map-pin-fill",
                      val: fullAddress,
                    },
                    user?.email && {
                      icon: "ph:envelope-fill",
                      val: user.email,
                    },
                  ]
                    .filter(Boolean)
                    .map((item) => (
                      <span
                        key={item.val}
                        className={`flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        <Icon icon={item.icon} className="w-4 h-4 shrink-0" />
                        {item.val}
                      </span>
                    ))}
                </div>
                {user?.coordinates?.lat && (
                  <p
                    className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    <Icon
                      icon="ph:map-trifold-fill"
                      className="w-3.5 h-3.5 inline mr-1"
                    />
                    GPS: {user.coordinates.lat}, {user.coordinates.lng}
                  </p>
                )}
                {(selectedCrops.length > 0 || user?.crops?.length > 0) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(user?.crops || selectedCrops).map((c) => (
                      <span
                        key={c}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium ${isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* My Active Crops from system */}
        <div
          className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <h2
            className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Active Crop Records
          </h2>
          <div className="flex flex-wrap gap-2">
            {farmerCropsData.map((crop) => (
              <div
                key={crop.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
              >
                <Icon
                  icon="ph:plant-fill"
                  className="w-4 h-4 text-emerald-500"
                />
                <span
                  className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}
                >
                  {crop.name}
                </span>
                <StatusBadge status={crop.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Rate & Review */}
        <div
          className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <h2
            className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Rate a Collective
          </h2>
          <div className="space-y-4">
            <div>
              <label
                className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Select Collective
              </label>
              <select
                value={selectedCollective}
                onChange={(e) => setSelectedCollective(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
              >
                <option value="">Choose a collective…</option>
                {collectivesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="cursor-pointer"
                  >
                    <Icon
                      icon={n <= rating ? "ph:star-fill" : "ph:star"}
                      className={`w-7 h-7 transition-colors ${n <= rating ? "text-amber-400" : isDark ? "text-slate-600 hover:text-amber-300" : "text-slate-300 hover:text-amber-400"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label
                className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Your Review
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience…"
                rows={3}
                className={`w-full rounded-xl border text-sm p-3 outline-none resize-none ${isDark ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`}
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleSubmitReview}
              icon="ph:star-fill"
              className="w-full"
            >
              Submit Review
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerProfile;
