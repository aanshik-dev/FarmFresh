import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { collectiveScheduleAPI, collectiveDriverAPI, collectiveZoneAPI } from "../../services/api";

const fmt = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const PickupScheduler = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [schedules, setSchedules] = useState([]);
  const [readyDeals, setReadyDeals] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming"); // upcoming | past | all
  
  // Navigation State
  const [view, setView] = useState("list"); // "list" | "form"
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    driverId: "", zoneId: "", pickupDate: "", time: "09:00", notes: "", items: [],
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [schRes, dealRes, driverRes, zoneRes] = await Promise.all([
        collectiveScheduleAPI.get({ filter: "all" }),
        collectiveScheduleAPI.getReadyDeals ? collectiveScheduleAPI.getReadyDeals() : Promise.resolve({ data: { deals: [] } }),
        collectiveDriverAPI.get(),
        collectiveZoneAPI.get(),
      ]);
      setSchedules(schRes.data.schedules || []);
      setReadyDeals(dealRes.data?.deals || []);
      setDrivers(driverRes.data.drivers?.filter((d) => d.status !== "INACTIVE") || []);
      setZones(zoneRes.data.zones || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openForm = () => {
    setForm({ driverId: "", zoneId: "", pickupDate: "", time: "09:00", notes: "", items: [] });
    setView("form");
  };

  const toggleDeal = (deal) => {
    setForm((p) => {
      const exists = p.items.find((i) => i.cropDealId === deal._id);
      if (exists) {
        return { ...p, items: p.items.filter((i) => i.cropDealId !== deal._id) };
      }
      return { ...p, items: [...p.items, { cropDealId: deal._id, collectedQuantity: deal.expectedQuantity || 0 }] };
    });
  };

  const updateQty = (dealId, qty) => {
    setForm((p) => ({
      ...p,
      items: p.items.map((i) => i.cropDealId === dealId ? { ...i, collectedQuantity: Number(qty) } : i),
    }));
  };

  const handleCreate = async () => {
    if (!form.driverId || !form.zoneId || !form.pickupDate || form.items.length === 0) {
      toast.error("Driver, zone, date, and at least one crop deal are required"); return;
    }
    setCreating(true);
    try {
      await collectiveScheduleAPI.create(form);
      toast.success("Pickup scheduled! Farmer groups have been notified.", { title: "Scheduled" });
      setView("list");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create schedule");
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (scheduleId, status, newDate) => {
    try {
      await collectiveScheduleAPI.updateStatus(scheduleId, { status, newDate });
      toast.success(`Schedule ${status.toLowerCase()}`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const filtered = schedules.filter((s) => {
    if (tab === "upcoming") return ["SCHEDULED", "IN_PROGRESS"].includes(s.status);
    if (tab === "past") return ["COMPLETED", "CANCELLED", "POSTPONED"].includes(s.status);
    return true;
  });

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
                  Pickup Schedules
                </h1>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {schedules.filter((s) => s.status === "SCHEDULED").length} upcoming · {schedules.length} total
                </p>
              </div>
              <button
                onClick={openForm}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold cursor-pointer shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Icon icon="ph:calendar-plus-fill" className="w-4 h-4" />Schedule Pickup
              </button>
            </div>

            {/* Tabs */}
            <div className={`flex gap-2 p-1.5 rounded-xl mb-8 w-fit backdrop-blur-md ${isDark ? "bg-slate-900/60 border border-slate-800" : "bg-white border border-slate-200 shadow-sm"}`}>
              {[
                { id: "upcoming", label: "Upcoming" },
                { id: "past", label: "Past" },
                { id: "all", label: "All" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    tab === t.id
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20"
                      : isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-10 h-10 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="ph:calendar-fill"
                title="No schedules found"
                description={tab === "upcoming" ? "No upcoming pickups. Schedule one now." : "No pickups match this filter."}
                action={tab === "upcoming" && (
                  <button onClick={openForm} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold cursor-pointer mt-4">
                    Schedule Pickup
                  </button>
                )}
              />
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((s, i) => (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-2xl border p-5 backdrop-blur-xl ${isDark ? "bg-slate-900/40 border-slate-800/60 shadow-xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-lg shadow-slate-200/50"}`}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                            <Icon icon="ph:map-pin-fill" className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-lg">
                            {s.zone?.name || "Zone —"}
                          </h3>
                        </div>
                        <StatusBadge status={s.status?.toLowerCase()} />
                      </div>
                      <div className={`shrink-0 text-right px-4 py-3 rounded-xl border ${isDark ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                        <p className="font-bold text-lg text-emerald-500">
                          {fmt(s.pickupDate)}
                        </p>
                        <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.time || "09:00"}</p>
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-slate-700 text-slate-300" : "bg-white text-slate-600 shadow-sm"}`}>
                        <Icon icon="ph:truck-fill" className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{s.driver?.name}</p>
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.driver?.vehicleNumber}</p>
                      </div>
                    </div>

                    {s.totalAmount > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Estimated Total:</span>
                        <span className="text-sm font-bold text-emerald-500">₹{s.totalAmount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    
                    {s.notes && (
                      <p className={`text-xs mt-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        <Icon icon="ph:note-fill" className="w-3.5 h-3.5 inline mr-1.5" />{s.notes}
                      </p>
                    )}

                    <div className="flex gap-2 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex-wrap">
                      {s.status === "SCHEDULED" && (
                        <>
                          <button onClick={() => updateStatus(s._id, "IN_PROGRESS")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                            isDark ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20" : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                          }`}>
                            Mark In Progress
                          </button>
                          <button onClick={() => updateStatus(s._id, "CANCELLED")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                            isDark ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                          }`}>
                            Cancel
                          </button>
                        </>
                      )}
                      {s.status === "IN_PROGRESS" && (
                        <button onClick={() => updateStatus(s._id, "COMPLETED")} className={`w-full py-3 rounded-xl text-sm font-semibold border transition-all ${
                          isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                        }`}>
                          <Icon icon="ph:check-circle-fill" className="w-4 h-4 inline mr-2" />
                          Mark Completed
                        </button>
                      )}
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
              Back to Schedules
            </button>

            <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl ${
              isDark ? "bg-slate-900/50 border-slate-800/60 shadow-2xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50"
            }`}>
              <h2 className="text-2xl font-bold mb-2">
                Schedule Pickup
              </h2>
              <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Assign a driver and zone for collecting crops that are in READY stage.
              </p>

              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Driver */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Driver *</label>
                    <div className="relative">
                      <select
                        value={form.driverId}
                        onChange={(e) => setForm((p) => ({ ...p, driverId: e.target.value }))}
                        className={`w-full appearance-none rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? "bg-slate-900 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      >
                        <option value="">Select driver…</option>
                        {drivers.map((d) => (
                          <option key={d._id} value={d._id}>{d.name} ({d.capacity} kg)</option>
                        ))}
                      </select>
                      <Icon icon="ph:caret-down-bold" className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                    </div>
                  </div>

                  {/* Zone */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Zone *</label>
                    <div className="relative">
                      <select
                        value={form.zoneId}
                        onChange={(e) => setForm((p) => ({ ...p, zoneId: e.target.value }))}
                        className={`w-full appearance-none rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? "bg-slate-900 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      >
                        <option value="">Select zone…</option>
                        {zones.map((z) => (
                          <option key={z._id} value={z._id}>{z.name}</option>
                        ))}
                      </select>
                      <Icon icon="ph:caret-down-bold" className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Date */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Date *</label>
                    <input
                      type="date"
                      value={form.pickupDate}
                      onChange={(e) => setForm((p) => ({ ...p, pickupDate: e.target.value }))}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                        isDark 
                          ? "bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      }`}
                    />
                  </div>
                  {/* Time */}
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Time</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${
                        isDark 
                          ? "bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Ready deals */}
                {readyDeals.length > 0 ? (
                  <div>
                    <label className={`text-xs font-semibold block mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Select Crops to Pickup (READY stage) *
                    </label>
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                      {readyDeals.map((deal) => {
                        const selected = form.items.find((i) => i.cropDealId === deal._id);
                        return (
                          <div
                            key={deal._id}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                              selected
                                ? isDark ? "border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/5" : "border-emerald-400 bg-emerald-50 shadow-md"
                                : isDark ? "border-slate-700 hover:border-slate-600 bg-slate-900/40" : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div onClick={() => toggleDeal(deal)} className="flex-1 cursor-pointer">
                                <p className={`font-bold text-base ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                                  {deal.crop?.name || "Crop"}
                                </p>
                                <p className={`text-sm font-medium flex items-center gap-1.5 mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                  <Icon icon="ph:user-bold" className="w-3.5 h-3.5" />
                                  {deal.membership?.farmer?.groupName || deal.membership?.farmer?.name}
                                </p>
                                <p className={`text-xs mt-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                  Agreed Price: ₹{deal.agreedPrice}/kg
                                </p>
                              </div>
                              <button
                                onClick={() => toggleDeal(deal)}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
                                  selected
                                    ? "bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/30"
                                    : isDark ? "border-slate-600 hover:border-slate-500" : "border-slate-300 hover:border-slate-400"
                                }`}
                              >
                                {selected && <Icon icon="ph:check-bold" className="w-3.5 h-3.5 text-white" />}
                              </button>
                            </div>
                            
                            <AnimatePresence>
                              {selected && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                  animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                                    <label className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>Collection Qty (kg):</label>
                                    <input
                                      type="number"
                                      value={selected.collectedQuantity}
                                      onChange={(e) => updateQty(deal._id, e.target.value)}
                                      className={`w-28 rounded-xl border px-3 py-1.5 text-sm outline-none transition-all ${
                                        isDark 
                                          ? "bg-slate-900 border-slate-600 text-white focus:border-emerald-500" 
                                          : "bg-white border-slate-300 text-slate-900 focus:border-emerald-500"
                                      }`}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className={`p-5 rounded-2xl text-center border border-dashed ${isDark ? "bg-slate-900/30 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                    <Icon icon="ph:leaf-fill" className={`w-8 h-8 mx-auto mb-2 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                    <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>No deals are in READY stage yet.</p>
                    <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Farmers must mark their crops as ready before you can schedule a pickup.</p>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Driver Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Special instructions for the driver or farmers..."
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
                    onClick={handleCreate}
                    disabled={creating || form.items.length === 0}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer flex items-center justify-center gap-2 hover:from-emerald-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {creating ? <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-5 h-5" /> : <Icon icon="ph:calendar-plus-bold" className="w-4 h-4" />}
                    Confirm Pickup
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

export default PickupScheduler;
