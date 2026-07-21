import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import EmptyState from "../../components/common/EmptyState";
import CropSelect from "../../components/common/CropSelect";
import { farmerCropAPI, commonAPI } from "../../services/api";

const CropManagement = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  
  const [crops, setCrops] = useState([]);
  const [masterCrops, setMasterCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [view, setView] = useState("list"); // "list" | "form"
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // form state
  const [form, setForm] = useState({ code: "", yld: "", plantedDate: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cropsRes, masterRes] = await Promise.all([
        farmerCropAPI.get(),
        commonAPI.getCrops()
      ]);
      setCrops(cropsRes.data.crops || []);
      setMasterCrops(masterRes.data.crops || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load crops");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ code: "", yld: "", plantedDate: "" });
    setView("form");
  };

  const openEdit = (crop) => {
    setEditingId(crop._id);
    const pd = crop.plantedDate ? new Date(crop.plantedDate).toISOString().split('T')[0] : "";
    setForm({ 
      code: crop.crop?.code || "", 
      yld: crop.yield || "", 
      plantedDate: pd 
    });
    setView("form");
  };

  const handleSave = async () => {
    if (!form.code || !form.yld) {
      toast.error("Crop and estimated yield are required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await farmerCropAPI.edit({ 
          id: editingId, 
          yld: Number(form.yld), 
          plantedDate: form.plantedDate || undefined 
        });
        toast.success("Crop updated successfully!");
      } else {
        await farmerCropAPI.add({ 
          code: form.code, 
          yld: Number(form.yld) 
        });
        toast.success("Crop added successfully!");
      }
      setView("list");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save crop");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Stop growing ${name}? This will remove it from your active list.`)) return;
    try {
      await farmerCropAPI.delete({ cropId: id });
      toast.success("Crop removed");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove crop");
    }
  };

  const activeCrops = crops.filter(c => c.status === "ACTIVE");
  const totalYield = activeCrops.reduce((sum, c) => sum + (c.yield || 0), 0);

  // Animation variants
  const listVariants = {
    initial: { x: -50, opacity: 0 },
    enter: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { x: -50, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }
  };

  const formVariants = {
    initial: { x: 50, opacity: 0 },
    enter: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { x: 50, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }
  };

  return (
    <div className={`min-h-screen p-5 sm:p-7 overflow-x-hidden ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" variants={listVariants} initial="initial" animate="enter" exit="exit">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                  My Crops
                </h1>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Manage your currently growing crops and estimated yields
                </p>
              </div>
              <button 
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold cursor-pointer shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Icon icon="ph:plus-bold" className="w-4 h-4" />
                Add Crop
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {[
                { label: "Active Crops", value: activeCrops.length, icon: "ph:plant-fill", gradient: "from-emerald-500/20 to-emerald-500/5", color: "text-emerald-500" },
                { label: "Total Estimated Yield", value: `${totalYield} kg`, icon: "ph:scales-fill", gradient: "from-blue-500/20 to-blue-500/5", color: "text-blue-500" }
              ].map((s, i) => (
                <motion.div 
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl ${isDark ? "bg-slate-900/50 border-slate-800/60 shadow-2xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50"}`}
                >
                  <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${s.gradient} blur-2xl pointer-events-none`} />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? "bg-slate-800/80" : "bg-slate-100/80"} ${s.color}`}>
                      <Icon icon={s.icon} className="w-7 h-7" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.label}</p>
                      <p className="text-3xl font-bold tracking-tight mt-1">{s.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Grid of Crops */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-10 h-10 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
              </div>
            ) : activeCrops.length === 0 ? (
              <EmptyState 
                icon="ph:plant-fill" 
                title="No crops planted yet" 
                description="Add a crop to let collectives know what you're growing." 
                action={
                  <button onClick={openAdd} className="px-4 py-2 mt-4 rounded-xl bg-emerald-500 text-white text-sm font-semibold cursor-pointer">
                    Add First Crop
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeCrops.map((crop, i) => (
                  <motion.div
                    key={crop._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 ${
                      isDark 
                        ? "bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/60 hover:border-emerald-500/30 shadow-2xl shadow-black/20" 
                        : "bg-white/80 border-slate-200 hover:border-emerald-400/50 hover:shadow-xl shadow-slate-200/50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20 text-white`}>
                          <Icon icon="ph:plant-fill" className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{crop.crop?.name}</h3>
                          <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-emerald-400/70" : "text-emerald-600/80"}`}>
                            {crop.crop?.code} · {crop.crop?.season}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-3 mb-5 p-3 rounded-xl ${isDark ? "bg-slate-950/50" : "bg-slate-50"}`}>
                      <div>
                        <p className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Est. Yield</p>
                        <p className="font-semibold">{crop.yield} kg</p>
                      </div>
                      <div>
                        <p className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Planted</p>
                        <p className="font-semibold">
                          {crop.plantedDate ? new Date(crop.plantedDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }) : "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEdit(crop)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all ${
                          isDark 
                            ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600" 
                            : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <Icon icon="ph:pencil-fill" className="w-4 h-4" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(crop._id, crop.crop?.name)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all ${
                          isDark 
                            ? "border-red-900/30 text-red-400 hover:bg-red-900/50 hover:border-red-800/50" 
                            : "border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200"
                        }`}
                      >
                        <Icon icon="ph:trash-fill" className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="form" variants={formVariants} initial="initial" animate="enter" exit="exit" className="max-w-4xl mx-auto">
            <button 
              onClick={() => setView("list")}
              className={`mb-6 flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors ${
                isDark ? "text-slate-400 hover:text-emerald-400" : "text-slate-500 hover:text-emerald-600"
              }`}
            >
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
              Back to Crops
            </button>

            <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl ${
              isDark ? "bg-slate-900/50 border-slate-800/60 shadow-2xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50"
            }`}>
              <h2 className="text-2xl font-bold mb-2">
                {editingId ? "Edit Crop Details" : "Register New Crop"}
              </h2>
              <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {editingId ? "Update your estimated yield and planting date." : "Tell collectives what you plan to grow."}
              </p>

              <div className="space-y-5">
                {/* Select Crop */}
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Crop (Master List) *</label>
                  <CropSelect
                    crops={masterCrops}
                    value={form.code}
                    onChange={(code) => setForm((p) => ({ ...p, code }))}
                    disabled={!!editingId}
                    placeholder="Select a crop from directory..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Yield */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Estimated Yield (kg) *</label>
                    <div className="relative">
                      <Icon icon="ph:scales-fill" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input
                        type="number"
                        value={form.yld}
                        onChange={(e) => setForm((p) => ({ ...p, yld: e.target.value }))}
                        placeholder="e.g. 500"
                        className={`w-full pl-10 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? "bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Planted Date (Edit only) */}
                  {editingId && (
                    <div>
                      <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Planted Date</label>
                      <input
                        type="date"
                        value={form.plantedDate}
                        onChange={(e) => setForm((p) => ({ ...p, plantedDate: e.target.value }))}
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? "bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-5 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setView("list")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-colors ${
                      isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer flex items-center justify-center gap-2 hover:from-emerald-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {saving ? <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-5 h-5" /> : <Icon icon="ph:check-bold" className="w-4 h-4" />}
                    {editingId ? "Save Changes" : "Save Crop"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CropManagement;
