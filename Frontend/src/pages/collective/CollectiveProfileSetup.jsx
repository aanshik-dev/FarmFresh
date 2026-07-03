import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button, Input, useToast } from "../../components/ui";
import ProgressWizard from "../../components/common/ProgressWizard";
import { CROPS_MASTER, zonesData } from "../../utils/InterfaceData";

const STEPS = [
  { label: "About",    icon: "ph:info-fill" },
  { label: "Crops",    icon: "ph:leaf-fill" },
  { label: "Location", icon: "ph:map-pin-fill" },
  { label: "Review",   icon: "ph:check-circle-fill" },
];

const CollectiveProfileSetup = () => {
  const { isDark } = useTheme();
  const { updateUser, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [workers, setWorkers] = useState("");
  const [established, setEstablished] = useState("2020");

  // Step 1 — Crops with prices
  const [cropEntries, setCropEntries] = useState([]);
  const [cropSearch, setCropSearch] = useState("");

  // Step 2 — Location
  const [coords, setCoords] = useState(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [locLoading, setLocLoading] = useState(false);

  const addCrop = (crop) => {
    if (!cropEntries.find(e => e.id === crop.id)) {
      setCropEntries(prev => [...prev, { ...crop, pricePerKg: "", stock: "" }]);
    }
    setCropSearch("");
  };

  const removeCrop = (id) => setCropEntries(prev => prev.filter(e => e.id !== id));
  const updateCropEntry = (id, field, value) => setCropEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));

  const filteredCrops = CROPS_MASTER.filter(c =>
    c.name.toLowerCase().includes(cropSearch.toLowerCase()) &&
    !cropEntries.find(e => e.id === c.id)
  );

  const handleGetLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setCoords(c); setManualLat(c.lat.toFixed(6)); setManualLng(c.lng.toFixed(6)); setLocLoading(false); toast.success("Location detected!"); },
      () => { toast.warning("Could not get GPS. Enter manually."); setLocLoading(false); }
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    updateUser({ description, address, workers: parseInt(workers), established, crops: cropEntries, coordinates: coords, isProfileComplete: true });
    toast.success("Profile complete! Welcome to FarmFresh.", { title: "Setup Complete" });
    navigate("/dashboard/collective/overview");
    setLoading(false);
  };

  const canNext = [
    description.trim().length > 10 && address.trim().length > 5 && workers,
    cropEntries.length > 0,
    coords !== null,
    true,
  ][step];

  return (
    <div className={`min-h-screen pt-10 pb-20 px-4 sm:px-8 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full mb-3 ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-700"}`}>
            <Icon icon="ph:buildings-fill" className="w-3.5 h-3.5" />Welcome, {user?.collectiveName?.split(" ")[0]}!
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Set up your collective</h1>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Complete your profile so farmer groups can find and join you.</p>
        </div>

        <div className={`rounded-2xl border p-5 mb-6 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <ProgressWizard steps={STEPS} currentStep={step} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}
            className={`rounded-2xl border p-6 sm:p-8 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
          >
            {/* Step 0 — About */}
            {step === 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600"}`}><Icon icon="ph:info-fill" className="w-5 h-5" /></div>
                  <div><h2 className={`font-semibold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>About Your Collective</h2><p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Describe your collective to farmer groups</p></div>
                </div>
                <div className="space-y-1.5">
                  <label className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Description <span className="text-red-400">*</span></label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your collective, the regions you cover, your mission and values…" rows={4} className={`w-full rounded-xl border text-sm p-3 outline-none resize-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 ${isDark ? "bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"}`} />
                </div>
                <Input label="Full Address" placeholder="Village, Block, District, State" value={address} onChange={e => setAddress(e.target.value)} icon="ph:map-pin-fill" required />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Number of Workers" type="number" placeholder="e.g. 45" value={workers} onChange={e => setWorkers(e.target.value)} icon="ph:person-fill" required />
                  <Input label="Established Year" type="number" placeholder="e.g. 2019" value={established} onChange={e => setEstablished(e.target.value)} icon="ph:calendar-fill" />
                </div>
              </div>
            )}

            {/* Step 1 — Crops */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}><Icon icon="ph:leaf-fill" className="w-5 h-5" /></div>
                  <div><h2 className={`font-semibold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Crops & Pricing</h2><p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Set the crops you handle and procurement prices</p></div>
                </div>

                {/* Search + add */}
                <div className="relative">
                  <Icon icon="ph:magnifying-glass-fill" className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                  <input type="text" placeholder="Search crops to add…" value={cropSearch} onChange={e => setCropSearch(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none ${isDark ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`} />
                  {cropSearch && (
                    <div className={`absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border shadow-xl overflow-hidden ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                      {filteredCrops.slice(0, 5).map(crop => (
                        <button key={crop.id} onClick={() => addCrop(crop)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-pointer ${isDark ? "hover:bg-slate-700 text-slate-200" : "hover:bg-slate-50 text-slate-800"}`}>
                          <span style={{ color: crop.color }}>●</span>{crop.name}
                          <span className={`text-xs ml-auto ${isDark ? "text-slate-500" : "text-slate-400"}`}>{crop.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Added crops */}
                {cropEntries.length === 0 ? (
                  <div className={`text-center py-6 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}><Icon icon="ph:leaf-fill" className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>Search and add crops above</p></div>
                ) : (
                  <div className="space-y-3">
                    {cropEntries.map(crop => (
                      <div key={crop.id} className={`rounded-xl border p-3 flex items-center gap-3 ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                        <span className="text-lg" style={{ color: crop.color }}>●</span>
                        <span className={`text-sm font-medium flex-1 ${isDark ? "text-slate-200" : "text-slate-800"}`}>{crop.name}</span>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center border rounded-lg overflow-hidden ${isDark ? "border-slate-600" : "border-slate-200"}`}>
                            <span className={`px-2 text-xs ${isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"}`}>₹/kg</span>
                            <input type="number" placeholder="100" value={crop.pricePerKg} onChange={e => updateCropEntry(crop.id, "pricePerKg", e.target.value)} className={`w-16 px-2 py-1.5 text-sm outline-none ${isDark ? "bg-slate-800 text-slate-100" : "bg-white text-slate-900"}`} />
                          </div>
                          <div className={`flex items-center border rounded-lg overflow-hidden ${isDark ? "border-slate-600" : "border-slate-200"}`}>
                            <span className={`px-2 text-xs ${isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"}`}>kg</span>
                            <input type="number" placeholder="0" value={crop.stock} onChange={e => updateCropEntry(crop.id, "stock", e.target.value)} className={`w-16 px-2 py-1.5 text-sm outline-none ${isDark ? "bg-slate-800 text-slate-100" : "bg-white text-slate-900"}`} />
                          </div>
                        </div>
                        <button onClick={() => removeCrop(crop.id)} className={`w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer ${isDark ? "hover:bg-slate-700 text-slate-500 hover:text-red-400" : "hover:bg-slate-100 text-slate-400 hover:text-red-500"}`}>
                          <Icon icon="ph:trash-fill" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Location */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-violet-500/15 text-violet-400" : "bg-violet-50 text-violet-600"}`}><Icon icon="ph:map-pin-fill" className="w-5 h-5" /></div>
                  <div><h2 className={`font-semibold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Collective Location</h2><p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Your base location for zone planning</p></div>
                </div>
                <button onClick={handleGetLocation} disabled={locLoading} className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border-2 border-dashed font-medium transition-all cursor-pointer ${coords ? isDark ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-emerald-400 bg-emerald-50 text-emerald-700" : isDark ? "border-slate-600 text-slate-400 hover:border-violet-500 hover:text-violet-400" : "border-slate-300 text-slate-500 hover:border-violet-400 hover:text-violet-600"}`}>
                  {locLoading ? <Icon icon="svg-spinners:ring-resize" className="w-5 h-5" /> : <Icon icon={coords ? "ph:check-circle-fill" : "ph:crosshair-fill"} className="w-5 h-5" />}
                  {coords ? `GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Use My Current Location (GPS)"}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Latitude" type="number" step="0.000001" placeholder="30.712" value={manualLat} onChange={e => setManualLat(e.target.value)} icon="ph:globe-fill" />
                  <Input label="Longitude" type="number" step="0.000001" placeholder="79.062" value={manualLng} onChange={e => setManualLng(e.target.value)} icon="ph:globe-fill" />
                </div>
                <Button variant="outline" onClick={() => { const lat = parseFloat(manualLat); const lng = parseFloat(manualLng); if (!isNaN(lat) && !isNaN(lng)) { setCoords({ lat, lng }); toast.success("Coordinates saved!"); } else toast.error("Invalid coordinates"); }} className="w-full">Save Manual Coordinates</Button>
              </div>
            )}

            {/* Step 3 — Review */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600"}`}><Icon icon="ph:check-circle-fill" className="w-5 h-5" /></div>
                  <div><h2 className={`font-semibold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Review & Submit</h2><p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Confirm your collective details</p></div>
                </div>
                {[
                  { label: "Collective Name", value: user?.collectiveName },
                  { label: "Address", value: address },
                  { label: "Workers", value: `${workers} staff members` },
                  { label: "Crops", value: cropEntries.map(c => `${c.name} (₹${c.pricePerKg}/kg)`).join(", ") || "None" },
                  { label: "Location", value: coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Not set" },
                ].map(item => (
                  <div key={item.label} className={`p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                    <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.label}</p>
                    <p className={`text-sm font-medium mt-0.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.value || "—"}</p>
                  </div>
                ))}
                <div className={`rounded-xl p-4 text-sm ${isDark ? "bg-blue-500/10 border border-blue-500/20 text-blue-300" : "bg-blue-50 border border-blue-200 text-blue-800"}`}>
                  ✓ You can edit all these details from your Profile page later.
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-5">
          {step > 0 && <button onClick={() => setStep(p => p - 1)} className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-medium transition-all cursor-pointer ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}><Icon icon="ph:arrow-left-bold" className="w-4 h-4" />Back</button>}
          <Button variant="primary" size="lg" className="flex-1" disabled={!canNext} loading={loading} onClick={() => step < 3 ? setStep(p => p + 1) : handleComplete()} iconRight={step < 3 ? "ph:arrow-right-bold" : "ph:check-bold"}>
            {step < 3 ? "Continue" : "Complete Setup"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CollectiveProfileSetup;
