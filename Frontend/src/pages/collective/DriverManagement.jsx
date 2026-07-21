import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { collectiveDriverAPI, collectiveZoneAPI } from "../../services/api";

const DriverManagement = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [drivers, setDrivers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [view, setView] = useState("list"); // "list" | "form"
  const [editDriver, setEditDriver] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    name: "", phone: "", license: "", vehicleNumber: "", capacity: "", zones: [],
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [driversRes, zonesRes] = await Promise.all([
        collectiveDriverAPI.get(),
        collectiveZoneAPI.get(),
      ]);
      setDrivers(driversRes.data.drivers || []);
      setZones(zonesRes.data.zones || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditDriver(null);
    setForm({ name: "", phone: "", license: "", vehicleNumber: "", capacity: "", zones: [] });
    setView("form");
  };

  const openEdit = (d) => {
    setEditDriver(d);
    setForm({
      name: d.name, phone: d.phone, license: d.license,
      vehicleNumber: d.vehicleNumber, capacity: d.capacity,
      zones: d.zones?.map((z) => z._id || z) || [],
    });
    setView("form");
  };

  const toggleZone = (zoneId) =>
    setForm((p) => ({
      ...p,
      zones: p.zones.includes(zoneId) ? p.zones.filter((z) => z !== zoneId) : [...p.zones, zoneId],
    }));

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.license || !form.vehicleNumber || !form.capacity) {
      toast.error("All fields except zones are required"); return;
    }
    setSaving(true);
    try {
      if (editDriver) {
        await collectiveDriverAPI.edit(editDriver._id, form);
        toast.success("Driver updated!");
      } else {
        await collectiveDriverAPI.add(form);
        toast.success("Driver added!");
      }
      setView("list");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save driver");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (driver) => {
    if (!window.confirm(`Remove driver "${driver.name}"? This is a soft delete.`)) return;
    try {
      await collectiveDriverAPI.delete(driver._id);
      toast.success("Driver removed");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove driver");
    }
  };

  const activeCount = drivers.filter((d) => d.status !== "INACTIVE").length;

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
                  Drivers
                </h1>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {activeCount} active · {drivers.length} total
                </p>
              </div>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold cursor-pointer shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Icon icon="ph:plus-bold" className="w-4 h-4" />Add Driver
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-10 h-10 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
              </div>
            ) : drivers.length === 0 ? (
              <EmptyState
                icon="ph:truck-fill"
                title="No drivers added"
                description="Add drivers to assign them to pickup schedules."
                action={<button onClick={openAdd} className="px-4 py-2 mt-4 rounded-xl font-semibold bg-emerald-500 text-white text-sm cursor-pointer">Add First Driver</button>}
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {drivers.map((d, i) => (
                  <motion.div
                    key={d._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 ${
                      isDark 
                        ? "bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/60 hover:border-emerald-500/30 shadow-xl shadow-black/20" 
                        : "bg-white/80 border-slate-200 hover:border-emerald-400/50 hover:shadow-xl shadow-slate-200/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm ${
                          isDark ? "bg-slate-800 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {(d.name || "?").charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{d.name}</p>
                          <p className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>{d.phone}</p>
                        </div>
                      </div>
                      <StatusBadge status={d.status?.toLowerCase()} size="sm" />
                    </div>

                    <div className="space-y-2 mb-5">
                      <div className={`flex items-center gap-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        <Icon icon="ph:identification-badge-fill" className="w-4 h-4 shrink-0 text-amber-500" />
                        {d.license}
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        <Icon icon="ph:car-fill" className="w-4 h-4 shrink-0 text-blue-500" />
                        {d.vehicleNumber} · <span className="font-semibold">{d.capacity} kg</span>
                      </div>
                      {d.zones && d.zones.length > 0 && (
                        <div className={`flex items-center gap-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"} flex-wrap mt-2`}>
                          <Icon icon="ph:map-pin-fill" className="w-4 h-4 shrink-0 text-emerald-500" />
                          {d.zones.map((z) => (
                            <span key={z._id || z} className={`px-2 py-0.5 rounded-full font-medium ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                              {z.name || z}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className={`flex gap-2 mb-5 text-center text-sm p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                      <div className="flex-1">
                        <p className="text-xl font-bold">{d.totalDeliveries || 0}</p>
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Deliveries</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(d)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-colors ${
                          isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600" : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <Icon icon="ph:pencil-fill" className="w-4 h-4 inline mr-1" />Edit
                      </button>
                      <button
                        onClick={() => handleDelete(d)}
                        className={`px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                          isDark ? "border-red-900/30 text-red-400 hover:bg-red-900/50 hover:border-red-800/50" : "border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200"
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
              Back to Drivers
            </button>

            <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl ${
              isDark ? "bg-slate-900/50 border-slate-800/60 shadow-2xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50"
            }`}>
              <h2 className="text-2xl font-bold mb-2">
                {editDriver ? "Edit Driver Details" : "Register New Driver"}
              </h2>
              <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {editDriver ? "Update contact information, vehicle details, or zone assignments." : "Add a new driver to assign them to pickup schedules."}
              </p>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Full Name *</label>
                    <div className="relative">
                      <Icon icon="ph:user-fill" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Suresh Kumar Thapa"
                        className={`w-full pl-10 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? "bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Phone Number *</label>
                    <div className="relative">
                      <Icon icon="ph:phone-fill" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="10-digit mobile number"
                        className={`w-full pl-10 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? "bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* License */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>License Number *</label>
                    <div className="relative">
                      <Icon icon="ph:identification-badge-fill" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input
                        value={form.license}
                        onChange={(e) => setForm((p) => ({ ...p, license: e.target.value }))}
                        placeholder="e.g. UK07T1234"
                        className={`w-full pl-10 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? "bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Vehicle Number */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Vehicle Number *</label>
                    <div className="relative">
                      <Icon icon="ph:car-fill" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input
                        value={form.vehicleNumber}
                        onChange={(e) => setForm((p) => ({ ...p, vehicleNumber: e.target.value }))}
                        placeholder="e.g. UK07AB1234"
                        className={`w-full pl-10 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? "bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Vehicle Capacity (kg) *</label>
                    <div className="relative">
                      <Icon icon="ph:scales-fill" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input
                        type="number"
                        value={form.capacity}
                        onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                        placeholder="e.g. 500"
                        className={`w-full pl-10 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? "bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Assigned Zones */}
                  {zones.length > 0 && (
                    <div className="sm:col-span-2">
                      <label className={`text-xs font-semibold block mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Assigned Zones</label>
                      <div className="flex flex-wrap gap-2">
                        {zones.map((z) => (
                          <button
                            key={z._id}
                            type="button"
                            onClick={() => toggleZone(z._id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition-all ${
                              form.zones.includes(z._id)
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                                : isDark ? "border-slate-700 text-slate-400 hover:border-slate-500 bg-slate-800/50" : "border-slate-200 text-slate-600 hover:border-emerald-300 bg-slate-50"
                            }`}
                          >
                            {form.zones.includes(z._id) && <Icon icon="ph:check-bold" className="w-3.5 h-3.5" />}
                            {z.name}
                          </button>
                        ))}
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
                    {editDriver ? "Save Changes" : "Save Driver"}
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

export default DriverManagement;
