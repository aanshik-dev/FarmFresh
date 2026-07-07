import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useToast, Button } from "../../components/ui";
import { collectivesList, zonesData } from "../../utils/InterfaceData";

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

const CollectiveProfile = () => {
  const { isDark } = useTheme();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const profile = collectivesList[0];

  // Editable fields
  const [collectiveName, setCollectiveName] = useState(
    user?.collectiveName || profile?.name || "",
  );
  const [phone, setPhone] = useState(user?.phone || profile?.phone || "");
  const [workers, setWorkers] = useState(
    user?.workers || profile?.workers || "",
  );
  const [description, setDescription] = useState(
    user?.description ||
      "Premier organic produce collective in the Kedarnath corridor, operating since 2018.",
  );
  const [selectedCrops, setSelectedCrops] = useState(
    user?.crops || profile?.crops?.map((c) => c.name) || [],
  );

  // Address fields
  const [village, setVillage] = useState(user?.village || "");
  const [district, setDistrict] = useState(
    user?.district || "Rudraprayag District",
  );
  const [state, setState] = useState(user?.state || "Uttarakhand");
  const [pincode, setPincode] = useState(user?.pincode || "");
  const [lat, setLat] = useState(user?.coordinates?.lat || "");
  const [lng, setLng] = useState(user?.coordinates?.lng || "");

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
      collectiveName,
      phone,
      workers: parseInt(workers) || workers,
      description,
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
    toast.success("Profile updated!", { title: "Saved" });
    setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setCollectiveName(user?.collectiveName || profile?.name || "");
    setPhone(user?.phone || profile?.phone || "");
    setWorkers(user?.workers || profile?.workers || "");
    setDescription(user?.description || "");
    setSelectedCrops(user?.crops || profile?.crops?.map((c) => c.name) || []);
    setVillage(user?.village || "");
    setDistrict(user?.district || "Rudraprayag District");
    setState(user?.state || "Uttarakhand");
    setPincode(user?.pincode || "");
    setLat(user?.coordinates?.lat || "");
    setLng(user?.coordinates?.lng || "");
    setEditing(false);
  };

  const fullAddress =
    [user?.village, user?.district, user?.state, user?.pincode]
      .filter(Boolean)
      .join(", ") || profile?.address;

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
          <div className="h-28 bg-linear-to-br from-blue-600 via-indigo-600 to-blue-800 relative">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px) 0 0 / 30px 30px",
              }}
            />
            {profile?.isVerified && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
                <Icon icon="ph:seal-check-fill" className="w-4 h-4" />
                Verified Collective
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4 flex-wrap gap-3">
              <div
                className={`w-20 h-20 rounded-2xl border-4 overflow-hidden flex items-center justify-center ${isDark ? "border-slate-900 bg-blue-900" : "border-white bg-blue-100"}`}
              >
                <Icon
                  icon="ph:buildings-fill"
                  className={`w-10 h-10 ${isDark ? "text-blue-300" : "text-blue-600"}`}
                />
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
                      ? "bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg"
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

            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {user?.collectiveName || profile?.name}
              </h1>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" : "bg-blue-100 text-blue-700"}`}
              >
                <Icon
                  icon="ph:buildings-fill"
                  className="w-3 h-3 inline mr-0.5"
                />
                Collective
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
                      Collective Name
                    </label>
                    <input
                      className={iClass}
                      value={collectiveName}
                      onChange={(e) => setCollectiveName(e.target.value)}
                      placeholder="Collective name"
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
                      Total Workers
                    </label>
                    <input
                      className={iClass}
                      type="number"
                      value={workers}
                      onChange={(e) => setWorkers(e.target.value)}
                      placeholder="25"
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
                    placeholder="About your collective…"
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
                        ph: "e.g. Ukhimath",
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
                    Crops Handled
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
                              ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                              : "bg-blue-100 border-blue-300 text-blue-700"
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
                  {user?.description || description || (
                    <span
                      className={`italic ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      No description added yet.
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {[
                    { icon: "ph:map-pin-fill", val: fullAddress },
                    {
                      icon: "ph:phone-fill",
                      val: user?.phone || profile?.phone,
                    },
                    {
                      icon: "ph:envelope-fill",
                      val: user?.email || profile?.email,
                    },
                  ]
                    .filter((i) => i.val)
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
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Farmer Groups",
              value: profile?.farmerGroups,
              icon: "ph:users-three-fill",
              color: "text-emerald-400 bg-emerald-500/10",
            },
            {
              label: "Total Harvest",
              value: profile?.totalHarvest,
              icon: "ph:scales-fill",
              color: "text-blue-400 bg-blue-500/10",
            },
            {
              label: "Rating",
              value: `${profile?.rating} ★`,
              icon: "ph:star-fill",
              color: "text-amber-400 bg-amber-500/10",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-2xl border p-4 text-center ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}
              >
                <Icon icon={s.icon} className="w-5 h-5" />
              </div>
              <p
                className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {s.value}
              </p>
              <p
                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Crops displayed when not editing */}
        {!editing && (
          <div
            className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <h2
              className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Crops Handled
            </h2>
            <div className="flex flex-wrap gap-2">
              {(user?.crops || profile?.crops?.map((c) => c.name) || []).map(
                (crop) => (
                  <span
                    key={crop}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700"}`}
                  >
                    {crop}
                  </span>
                ),
              )}
            </div>
          </div>
        )}

        {/* Zones */}
        <div
          className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <h2
            className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Zones Covered
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile?.zones?.map((z) => {
              const zone = zonesData?.find((zd) => zd.name === z);
              return (
                <div
                  key={z}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: zone?.color || "#10b981" }}
                  />
                  <span
                    className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}
                  >
                    {z}
                  </span>
                  {zone && (
                    <span
                      className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      {zone.altitude}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectiveProfile;
