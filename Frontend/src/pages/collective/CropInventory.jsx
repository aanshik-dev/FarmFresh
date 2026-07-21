import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import CropSelect from "../../components/common/CropSelect";
import { collectiveCropAPI, commonAPI } from "../../services/api";

const CropInventory = () => {
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
  const [form, setForm] = useState({ code: "", price: "", quantity: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [inventoryRes, masterRes] = await Promise.all([
        collectiveCropAPI.get(),
        commonAPI.getCrops()
      ]);
      setCrops(inventoryRes.data.crops || []);
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
    setForm({ code: "", price: "", quantity: "" });
    setView("form");
  };

  const openEdit = (crop) => {
    setEditingId(crop._id);
    setForm({ 
      code: crop.crop?.code || "", 
      price: crop.price || "", 
      quantity: crop.quantity || "" 
    });
    setView("form");
  };

  const handleSave = async () => {
    if (!form.code || !form.price) {
      toast.error("Crop and price are required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await collectiveCropAPI.edit({ id: editingId, price: Number(form.price), quantity: Number(form.quantity) || undefined });
        toast.success("Crop updated!");
      } else {
        await collectiveCropAPI.add({ code: form.code, price: Number(form.price) });
        toast.success("Crop added!");
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
    if (!window.confirm(`Remove ${name} from your inventory?`)) return;
    try {
      await collectiveCropAPI.delete({ cropId: id });
      toast.success("Crop removed");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove crop");
    }
  };

  const activeCrops = crops.filter(c => c.status === "ACTIVE");
  const totalStock = activeCrops.reduce((s, c) => s + (c.quantity || 0), 0);
  const totalValue = activeCrops.reduce((s, c) => s + ((c.quantity || 0) * (c.price || 0)), 0);

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
                  Crop Inventory
                </h1>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Manage your procurement crops, prices, and available stock
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

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {[
                { label: "Active Crops", value: activeCrops.length, icon: "ph:leaf-fill", gradient: "from-emerald-500/20 to-emerald-500/5", color: "text-emerald-500" },
                { label: "Total Stock", value: `${totalStock} kg`, icon: "ph:package-fill", gradient: "from-blue-500/20 to-blue-500/5", color: "text-blue-500" },
                { label: "Est. Value", value: `₹${totalValue.toLocaleString("en-IN")}`, icon: "ph:currency-inr-fill", gradient: "from-amber-500/20 to-amber-500/5", color: "text-amber-500" },
              ].map((s, i) => (
                <motion.div 
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl ${isDark ? "bg-slate-900/50 border-slate-800/60 shadow-2xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50"}`}
                >
                  <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${s.gradient} blur-2xl pointer-events-none`} />
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isDark ? "bg-slate-800/80" : "bg-slate-100/80"} ${s.color}`}>
                    <Icon icon={s.icon} className="w-6 h-6" />
                  </div>
                  <p className="text-3xl font-bold tracking-tight">{s.value}</p>
                  <p className={`text-sm font-medium mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Crop table */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-10 h-10 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
              </div>
            ) : activeCrops.length === 0 ? (
              <EmptyState icon="ph:plant-fill" title="No crops in inventory" description="Add crops you want to procure from farmer groups." />
            ) : (
              <div className={`rounded-2xl border overflow-hidden backdrop-blur-xl ${isDark ? "bg-slate-900/40 border-slate-800/60 shadow-2xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50"}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className={isDark ? "bg-slate-800/40" : "bg-slate-50/80"}>
                      <tr>
                        {["Crop", "Category", "Price/kg", "Current Stock", "Status", "Actions"].map(h => (
                          <th key={h} className={`text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-100"}`}>
                      {activeCrops.map((crop, i) => (
                        <motion.tr
                          key={crop._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`group transition-colors ${isDark ? "hover:bg-slate-800/30" : "hover:bg-emerald-50/50"}`}
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-slate-800 text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}>
                                <Icon icon="ph:plant-fill" className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-semibold">{crop.crop?.name}</p>
                                <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{crop.crop?.code}</p>
                              </div>
                            </div>
                          </td>
                          <td className={`px-6 py-5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                            {crop.crop?.category}
                          </td>
                          <td className={`px-6 py-5 font-medium ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                            ₹{crop.price}
                          </td>
                          <td className={`px-6 py-5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                            {crop.quantity || 0} kg
                          </td>
                          <td className="px-6 py-5">
                            <StatusBadge status={(crop.quantity || 0) < 100 ? "low_stock" : "in_stock"} size="sm" />
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openEdit(crop)} 
                                className={`p-2 rounded-xl cursor-pointer transition-colors ${isDark ? "hover:bg-slate-700 text-slate-300" : "hover:bg-white hover:shadow-sm text-slate-600"}`}
                              >
                                <Icon icon="ph:pencil-fill" className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(crop._id, crop.crop?.name)} 
                                className={`p-2 rounded-xl cursor-pointer transition-colors ${isDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-50 hover:shadow-sm text-red-500"}`}
                              >
                                <Icon icon="ph:trash-fill" className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
              Back to Inventory
            </button>

            <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl ${
              isDark ? "bg-slate-900/50 border-slate-800/60 shadow-2xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50"
            }`}>
              <h2 className="text-2xl font-bold mb-2">
                {editingId ? "Edit Crop Details" : "Register New Crop"}
              </h2>
              <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {editingId ? "Update your price and stock details for this crop." : "Add a new crop to your procurement list."}
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
                  {/* Price */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Offering Price (₹/kg) *</label>
                    <div className="relative">
                      <Icon icon="ph:currency-inr-bold" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                        placeholder="120"
                        className={`w-full pl-10 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? "bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Quantity (Edit only) */}
                  {editingId && (
                    <div>
                      <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Current Stock (kg)</label>
                      <div className="relative">
                        <Icon icon="ph:package-fill" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                        <input
                          type="number"
                          value={form.quantity}
                          onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                          placeholder="0"
                          className={`w-full pl-10 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                            isDark 
                              ? "bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                              : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          }`}
                        />
                      </div>
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

export default CropInventory;
