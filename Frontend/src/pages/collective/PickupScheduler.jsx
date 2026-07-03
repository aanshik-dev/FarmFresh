import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { pickupSchedules, driversData, farmerGroups, collectivesList } from "../../utils/InterfaceData";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/ui";

const PickupScheduler = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState(pickupSchedules);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState("active"); // active | all
  const [form, setForm] = useState({ farmerGroupId: "", crop: "", quantity: "", driverId: "", date: "", time: "09:00", notes: "" });
  const [creating, setCreating] = useState(false);

  const selectedGroup = farmerGroups.find(g => g.id === form.farmerGroupId);

  const handleCreate = async () => {
    if (!form.farmerGroupId || !form.crop || !form.quantity || !form.driverId || !form.date) { toast.error("Fill all required fields"); return; }
    setCreating(true);
    await new Promise(r => setTimeout(r, 800));
    const driver = driversData.find(d => d.id === form.driverId);
    const group = farmerGroups.find(g => g.id === form.farmerGroupId);
    const newSch = {
      id: `sch_${Date.now()}`,
      farmerGroup: group?.groupName || "",
      farmerGroupId: form.farmerGroupId,
      collective: "Mandakini Organic Collective",
      crop: form.crop,
      quantity: parseInt(form.quantity),
      driver: driver?.name || "",
      driverId: form.driverId,
      date: form.date,
      time: form.time,
      status: "scheduled",
      zone: group?.zone?.split("·")[0].trim() || "Zone A",
      notes: form.notes,
    };
    setSchedules(prev => [newSch, ...prev]);
    toast.success("Pickup scheduled! Farmer group has been notified.", { title: "Scheduled" });
    setShowModal(false);
    setForm({ farmerGroupId: "", crop: "", quantity: "", driverId: "", date: "", time: "09:00", notes: "" });
    setCreating(false);
  };

  const updateStatus = (id, status) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    toast.info("Schedule status updated.");
  };

  const active = schedules.filter(s => ["scheduled", "in_progress"].includes(s.status));
  const displayed = tab === "active" ? active : schedules;

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Pickup Schedules</h1>
          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{active.length} active · {schedules.length} total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium cursor-pointer shadow-lg shadow-emerald-500/20">
          <Icon icon="ph:calendar-plus-fill" className="w-4 h-4" />Schedule Pickup
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl mb-5 w-fit ${isDark ? "bg-slate-800/70" : "bg-slate-100"}`}>
        {[{ id: "active", label: `Active (${active.length})` }, { id: "all", label: `All (${schedules.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${tab === t.id ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow" : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
        ))}
      </div>

      {displayed.length === 0 ? <EmptyState icon="ph:calendar-fill" title="No schedules" description="Create a pickup schedule to get started." action={<button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm cursor-pointer">Create Schedule</button>} /> : (
        <div className="space-y-4">
          {displayed.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{s.farmerGroup.split(" ").slice(0, 3).join(" ")}</h3>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {s.crop} · {s.quantity} kg · {s.zone}
                  </p>
                </div>
                <div className={`shrink-0 text-right px-3 py-2 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
                  <p className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{new Date(s.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.time}</p>
                </div>
              </div>

              <div className={`flex items-center gap-2 mt-3 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <Icon icon="ph:truck-fill" className="w-4 h-4" />
                <span>{s.driver}</span>
              </div>
              {s.notes && <p className={`mt-2 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}><Icon icon="ph:note-fill" className="w-3 h-3 inline mr-1" />{s.notes}</p>}

              {s.status === "scheduled" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateStatus(s.id, "in_progress")} className={`flex-1 py-2 rounded-xl text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/25 cursor-pointer hover:bg-blue-500/25`}>Mark In Progress</button>
                  <button onClick={() => updateStatus(s.id, "cancelled")} className={`flex-1 py-2 rounded-xl text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25 cursor-pointer hover:bg-red-500/25`}>Cancel</button>
                </div>
              )}
              {s.status === "in_progress" && (
                <button onClick={() => updateStatus(s.id, "completed")} className="mt-3 w-full py-2 rounded-xl text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 cursor-pointer hover:bg-emerald-500/25">Mark Completed</button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }} className={`relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl z-10 overflow-y-auto max-h-[90vh] ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className={`font-bold text-xl ${isDark ? "text-white" : "text-slate-900"}`}>Schedule Pickup</h3>
                <button onClick={() => setShowModal(false)} className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}><Icon icon="material-symbols:close-rounded" className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Farmer Group *</label>
                  <select value={form.farmerGroupId} onChange={e => setForm(p => ({ ...p, farmerGroupId: e.target.value, crop: "" }))} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                    <option value="">Select a farmer group…</option>
                    {farmerGroups.map(g => <option key={g.id} value={g.id}>{g.groupName}</option>)}
                  </select>
                </div>
                {selectedGroup && (
                  <div>
                    <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Crop *</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedGroup.crops.map(c => <button key={c} type="button" onClick={() => setForm(p => ({ ...p, crop: c }))} className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer ${form.crop === c ? "bg-emerald-500 border-emerald-500 text-white" : isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}>{c}</button>)}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Quantity (kg) *</label>
                    <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} placeholder="120" className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900"}`} />
                  </div>
                  <div>
                    <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Driver *</label>
                    <select value={form.driverId} onChange={e => setForm(p => ({ ...p, driverId: e.target.value }))} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                      <option value="">Select driver…</option>
                      {driversData.filter(d => d.status === "active").map(d => <option key={d.id} value={d.id}>{d.name.split(" ")[0]} — {d.zones.join(", ")}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Date *</label>
                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                  </div>
                  <div>
                    <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Time</label>
                    <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                  </div>
                </div>
                <div>
                  <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Special instructions for the driver…" rows={2} className={`w-full rounded-xl border text-sm p-3 outline-none resize-none ${isDark ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`} />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm border cursor-pointer ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>Cancel</button>
                <button onClick={handleCreate} disabled={creating} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer flex items-center justify-center gap-2 ${creating ? "opacity-70" : ""}`}>
                  {creating && <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />}
                  Schedule Pickup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PickupScheduler;
