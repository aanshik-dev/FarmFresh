import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button, Input, useToast } from "../../components/ui";
import ProgressWizard from "../../components/common/ProgressWizard";
import { CROPS_MASTER } from "../../utils/InterfaceData";

const STEPS = [
  { label: "Basic Info",  icon: "ph:info-fill" },
  { label: "Crops",       icon: "ph:plant-fill" },
  { label: "Location",    icon: "ph:map-pin-fill" },
  { label: "Review",      icon: "ph:check-circle-fill" },
];

const FarmerProfileSetup = () => {
  const { isDark } = useTheme();
  const { updateUser, markProfileComplete, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1 — Basic Info
  const [description, setDescription] = useState(user?.description || "");
  const [address, setAddress] = useState(user?.address || "");

  // Step 2 — Crops
  const [selectedCrops, setSelectedCrops] = useState(user?.crops || []);

  // Step 3 — Location
  const [coords, setCoords] = useState(user?.coordinates || null);
  const [locLoading, setLocLoading] = useState(false);
  const [manualLat, setManualLat] = useState(user?.coordinates?.lat?.toString() || "");
  const [manualLng, setManualLng] = useState(user?.coordinates?.lng?.toString() || "");

  const toggleCrop = (cropId) => {
    setSelectedCrops(prev =>
      prev.includes(cropId) ? prev.filter(c => c !== cropId) : [...prev, cropId]
    );
  };

  const handleGetLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setManualLat(c.lat.toFixed(6));
        setManualLng(c.lng.toFixed(6));
        setLocLoading(false);
        toast.success("Location detected!", { title: "GPS" });
      },
      () => {
        toast.warning("Could not get GPS location. Enter manually.", { title: "Location" });
        setLocLoading(false);
      }
    );
  };

  const handleManualCoords = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) { toast.error("Invalid coordinates"); return; }
    setCoords({ lat, lng });
    toast.success("Coordinates saved!");
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      updateUser({
        description,
        address,
        crops: selectedCrops,
        coordinates: coords,
        isProfileComplete: true,
      });
      toast.success("Profile complete! Welcome to FarmFresh.", { title: "Setup Complete" });
      navigate("/dashboard/farmer/overview");
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const canNext = [
    description.trim().length > 10 && address.trim().length > 5,
    selectedCrops.length > 0,
    coords !== null,
    true,
  ][currentStep];

  const cropsByCategory = CROPS_MASTER.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {});

  return (
    <div className={`min-h-screen pt-10 pb-20 px-4 sm:px-8 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full mb-3 ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
            <Icon icon="ph:hand-waving-fill" className="w-3.5 h-3.5" />
            Welcome, {user?.name?.split(" ")[0]}!
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Complete your profile</h1>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Set up your farmer group profile to start managing crops and joining collectives.</p>
        </div>

        {/* Progress */}
        <div className={`rounded-2xl border p-5 mb-6 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <ProgressWizard steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className={`rounded-2xl border p-6 sm:p-8 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
          >
            {/* Step 0 — Basic Info */}
            {currentStep === 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                    <Icon icon="ph:info-fill" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`font-semibold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Basic Information</h2>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Tell us about your farmer group</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Group Description <span className="text-red-400">*</span></label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Tell collectives about your group, your farming practices, the area you operate in…"
                    rows={4}
                    className={`w-full rounded-xl border text-sm p-3 outline-none resize-none transition-all focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 ${isDark ? "bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"}`}
                  />
                  <p className={`text-xs ${description.length > 10 ? "text-emerald-500" : isDark ? "text-slate-500" : "text-slate-400"}`}>{description.length} / min 10 characters</p>
                </div>

                <Input
                  label="Full Address"
                  placeholder="Village, Tehsil, District, State"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  icon="ph:map-pin-fill"
                  required
                  hint="Enter your complete address including altitude if known"
                />
              </div>
            )}

            {/* Step 1 — Crops */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                    <Icon icon="ph:plant-fill" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`font-semibold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Select Your Crops</h2>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Choose all crops your group grows</p>
                  </div>
                </div>

                <div className={`px-3 py-2 rounded-xl flex items-center gap-2 text-sm ${
                  selectedCrops.length > 0 ? isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700" : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"
                }`}>
                  <Icon icon="ph:info-fill" className="w-4 h-4" />
                  {selectedCrops.length > 0 ? `${selectedCrops.length} crop(s) selected` : "Select at least one crop"}
                </div>

                {Object.entries(cropsByCategory).map(([category, crops]) => (
                  <div key={category}>
                    <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {crops.map(crop => {
                        const isSelected = selectedCrops.includes(crop.id);
                        return (
                          <button
                            key={crop.id}
                            type="button"
                            onClick={() => toggleCrop(crop.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                                : isDark ? "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200" : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                            }`}
                          >
                            <span style={{ color: isSelected ? "white" : crop.color }}>●</span>
                            {crop.name}
                            {isSelected && <Icon icon="ph:check-bold" className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 2 — Location */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                    <Icon icon="ph:map-pin-fill" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`font-semibold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Farm Location</h2>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Help collectives find you on the map</p>
                  </div>
                </div>

                {/* GPS button */}
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locLoading}
                  className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border-2 border-dashed font-medium transition-all cursor-pointer ${
                    coords
                      ? isDark ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : isDark ? "border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400" : "border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600"
                  }`}
                >
                  {locLoading ? (
                    <Icon icon="svg-spinners:ring-resize" className="w-5 h-5" />
                  ) : (
                    <Icon icon={coords ? "ph:check-circle-fill" : "ph:crosshair-fill"} className="w-5 h-5" />
                  )}
                  {coords ? `GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Use My Current Location (GPS)"}
                </button>

                <div className={`relative flex items-center gap-3 ${isDark ? "text-slate-600" : "text-slate-300"}`}>
                  <div className="flex-1 h-px bg-current" />
                  <span className="text-xs">or enter manually</span>
                  <div className="flex-1 h-px bg-current" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input label="Latitude" type="number" step="0.000001" placeholder="e.g. 30.712" value={manualLat} onChange={e => setManualLat(e.target.value)} icon="ph:globe-fill" />
                  <Input label="Longitude" type="number" step="0.000001" placeholder="e.g. 79.062" value={manualLng} onChange={e => setManualLng(e.target.value)} icon="ph:globe-fill" />
                </div>

                <Button type="button" variant="outline" onClick={handleManualCoords} className="w-full">
                  Save Manual Coordinates
                </Button>

                {coords && (
                  <div className={`rounded-xl p-3 flex items-center gap-2 text-sm ${isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                    <Icon icon="ph:check-circle-fill" className="w-4 h-4" />
                    Location set: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Review */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
                    <Icon icon="ph:check-circle-fill" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`font-semibold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Review Your Profile</h2>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Confirm details before submitting</p>
                  </div>
                </div>

                {[
                  { label: "Group Name", value: user?.groupName, icon: "ph:users-three-fill" },
                  { label: "Lead Farmer", value: user?.leadFarmerName, icon: "ph:user-fill" },
                  { label: "Address", value: address, icon: "ph:map-pin-fill" },
                  { label: "Crops", value: CROPS_MASTER.filter(c => selectedCrops.includes(c.id)).map(c => c.name).join(", "), icon: "ph:plant-fill" },
                  { label: "Location", value: coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Not set", icon: "ph:globe-fill" },
                ].map(item => (
                  <div key={item.label} className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                    <Icon icon={item.icon} className={`w-4 h-4 mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                    <div>
                      <p className={`text-xs font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.label}</p>
                      <p className={`text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.value || "—"}</p>
                    </div>
                  </div>
                ))}

                <div className={`rounded-xl p-4 text-sm ${isDark ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-emerald-50 border border-emerald-200 text-emerald-800"}`}>
                  <p className="font-medium mb-1">✓ All set! You can edit these details anytime from your Profile page.</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-5">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={() => setCurrentStep(p => p - 1)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-medium transition-all cursor-pointer ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
              Back
            </button>
          )}
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            disabled={!canNext}
            loading={loading}
            onClick={() => currentStep < 3 ? setCurrentStep(p => p + 1) : handleComplete()}
            iconRight={currentStep < 3 ? "ph:arrow-right-bold" : "ph:check-bold"}
          >
            {currentStep < 3 ? "Continue" : "Complete Setup"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FarmerProfileSetup;
