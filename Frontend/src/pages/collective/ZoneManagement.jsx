import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import EmptyState from "../../components/common/EmptyState";
import { collectiveZoneAPI } from "../../services/api";

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#84cc16",
];

const DIRECTIONS = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West", "Central"];

const ZoneManagement = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  
  // Navigation State
  const [view, setView] = useState("list"); // "list" | "form"
  const [editZone, setEditZone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", area: "", direction: "", description: "", color: "#10b981" });

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await collectiveZoneAPI.get();
      setZones(data.zones || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load zones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  const openAdd = () => {
    setEditZone(null);
    setForm({ name: "", area: "", direction: "", description: "", color: "#10b981" });
    setView("form");
  };

  const openEdit = (zone, e) => {
    if (e) e.stopPropagation();
    setEditZone(zone);
    setForm({
      name: zone.name,
      area: zone.area || "",
      direction: zone.direction || "",
      description: zone.description || "",
      color: zone.color || "#10b981",
    });
    setView("form");
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Zone name is required"); return; }
    setSaving(true);
    try {
      if (editZone) {
        await collectiveZoneAPI.edit(editZone._id, form);
        toast.success("Zone updated!");
      } else {
        await collectiveZoneAPI.add(form);
        toast.success("Zone added!");
      }
      setView("list");
      fetchZones();
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save zone");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zone, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Delete zone "${zone.name}"? Farmer groups assigned to it will be unassigned.`)) return;
    try {
      await collectiveZoneAPI.delete(zone._id);
      toast.success("Zone deleted");
      if (selected?._id === zone._id) setSelected(null);
      fetchZones();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete zone");
    }
  };

  // Animation variants
  const listVariants = {
    initial: { x: -30, opacity: 0 },
    enter: { x: 0, opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
    exit: { x: -30, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }
  };

  const formVariants = {
    initial: { x: 30, opacity: 0 },
    enter: { x: 0, opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
    exit: { x: 30, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }
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
                  Zones
                </h1>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {zones.length} geographic zones managed
                </p>
              </div>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold cursor-pointer shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Icon icon="ph:plus-bold" className="w-4 h-4" />Add Zone
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-10 h-10 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
              </div>
            ) : zones.length === 0 ? (
              <EmptyState
                icon="ph:map-trifold-fill"
                title="No zones yet"
                description="Create zones to organize your farmer groups by area."
                action={
                  <button onClick={openAdd} className="px-5 py-2.5 mt-4 rounded-xl font-semibold bg-emerald-500 text-white text-sm cursor-pointer">
                    Add First Zone
                  </button>
                }
              />
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Zone cards */}
                <div className="space-y-4">
                  {zones.map((z, i) => (
                    <motion.div
                      key={z._id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelected(selected?._id === z._id ? null : z)}
                      className={`relative rounded-2xl border p-5 cursor-pointer backdrop-blur-xl transition-all duration-300 overflow-hidden ${
                        selected?._id === z._id
                          ? isDark ? "border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/10" : "border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-500/10"
                          : isDark ? "bg-slate-900/40 border-slate-800/60 hover:border-emerald-500/30" : "bg-white/80 border-slate-200 hover:border-emerald-400/50 hover:shadow-md"
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${z.color}, transparent)` }} />
                      
                      <div className="flex items-start justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: z.color + "15" }}>
                            <Icon icon="ph:map-pin-fill" className="w-6 h-6" style={{ color: z.color }} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{z.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <p className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                {z.farmerGroupCount || 0} farmer groups
                              </p>
                              {z.area && (
                                <span className={`text-[11px] px-2 py-0.5 rounded-md ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                                  📍 {z.area}
                                </span>
                              )}
                              {z.direction && (
                                <span className={`text-[11px] px-2 py-0.5 rounded-md ${isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                                  🧭 {z.direction}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => openEdit(z, e)}
                            className={`p-2 rounded-xl cursor-pointer transition-colors ${isDark ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                          >
                            <Icon icon="ph:pencil-fill" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(z, e)}
                            className={`p-2 rounded-xl cursor-pointer transition-colors ${isDark ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
                          >
                            <Icon icon="ph:trash-fill" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {z.description && (
                        <p className={`text-sm ml-16 relative z-10 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{z.description}</p>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Zone detail panel */}
                <div className={`rounded-2xl border p-6 sm:p-8 h-fit sticky top-6 backdrop-blur-xl ${isDark ? "bg-slate-900/60 border-slate-800/60 shadow-2xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50"}`}>
                  {selected ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: selected.color, boxShadow: `0 10px 25px -5px ${selected.color}60` }}>
                          <Icon icon="ph:map-pin-fill" className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h2 className="font-bold text-2xl">{selected.name}</h2>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              {selected.farmerGroupCount || 0} farmer groups assigned
                            </span>
                            {selected.area && (
                              <span className={`text-xs px-2.5 py-0.5 rounded-md font-medium ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
                                Area: {selected.area}
                              </span>
                            )}
                            {selected.direction && (
                              <span className={`text-xs px-2.5 py-0.5 rounded-md font-medium ${isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                                Direction: {selected.direction}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {selected.description && (
                        <div className={`p-4 rounded-xl mb-6 ${isDark ? "bg-slate-950/50" : "bg-slate-50"}`}>
                          <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Description</h4>
                          <p className="text-sm">{selected.description}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-3 mt-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => openEdit(selected)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all ${
                            isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Icon icon="ph:pencil-fill" className="w-4 h-4 inline mr-2" />Edit Zone
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <Icon icon="ph:map-trifold-fill" className={`w-16 h-16 mb-4 ${isDark ? "text-slate-700" : "text-slate-200"}`} />
                      <p className={`text-base font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        Select a zone from the left
                      </p>
                      <p className={`text-sm mt-1 ${isDark ? "text-slate-600" : "text-slate-500"}`}>
                        to view its details and management options
                      </p>
                    </div>
                  )}
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
              Back to Zones
            </button>

            <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl ${
              isDark ? "bg-slate-900/50 border-slate-800/60 shadow-2xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50"
            }`}>
              <h2 className="text-2xl font-bold mb-2">
                {editZone ? "Edit Zone Details" : "Create New Zone"}
              </h2>
              <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {editZone ? "Update zone name, area, direction, description, or color identifier." : "Define a new geographic region to organize and assign your farmer groups."}
              </p>

              <div className="space-y-5">
                {/* 2-Column Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Zone Name */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Zone Name *</label>
                    <div className="relative">
                      <Icon icon="ph:map-pin-fill" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Kedarnath North Zone"
                        className={`w-full pl-10 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? "bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Area / Landmark */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Area / Coverage Landmark</label>
                    <div className="relative">
                      <Icon icon="ph:buildings-fill" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input
                        value={form.area}
                        onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
                        placeholder="e.g. Guptkashi, Phata & Sonprayag"
                        className={`w-full pl-10 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? "bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Direction */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Geographic Direction</label>
                    <div className="relative">
                      <Icon icon="ph:compass-fill" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <select
                        value={form.direction}
                        onChange={(e) => setForm((p) => ({ ...p, direction: e.target.value }))}
                        className={`w-full pl-10 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? "bg-slate-900 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      >
                        <option value="">Select Direction</option>
                        {DIRECTIONS.map((dir) => (
                          <option key={dir} value={dir}>{dir}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Color Identifier */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Zone Color Identifier</label>
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, color: c }))}
                          className={`w-8 h-8 rounded-lg cursor-pointer transition-all flex items-center justify-center ${
                            form.color === c ? "ring-2 ring-offset-2 ring-offset-transparent scale-110 shadow-md shadow-black/20" : "hover:scale-105 opacity-70 hover:opacity-100"
                          }`}
                          style={{ background: c, ringColor: c }}
                        >
                          {form.color === c && <Icon icon="ph:check-bold" className="w-4 h-4 text-white drop-shadow-md" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description (Full Width) */}
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Description & Route Details</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of this zone, main pickup routes, and coverage notes..."
                    rows={3}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none resize-none transition-all ${
                      isDark 
                        ? "bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    }`}
                  />
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
                    {editZone ? "Save Changes" : "Save Zone"}
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

export default ZoneManagement;
