import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import ConfirmModal from "../../components/common/ConfirmModal";
import DatePicker from "../../components/common/DatePicker";
import {
  collectiveScheduleAPI,
  collectiveDriverAPI,
  collectiveZoneAPI,
} from "../../services/api";

const fmt = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtCurrency = (n) =>
  n ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0";

// ── Field component ───────────────────────────────────────────────────────────
const Field = ({ label, children, required }) => (
  <div>
    <label className="text-xs font-semibold block mb-1.5 text-slate-400">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const selectCls =
  "w-full appearance-none rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";
const inputCls =
  "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";

// ── Schedule Detail View ──────────────────────────────────────────────────────────────
const ScheduleDetailView = ({ data, onBack, isDark, onAction, onEdit }) => {
  if (!data || !data.schedule) return null;
  const { schedule, farmers } = data;

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="max-w-4xl mx-auto w-full"
    >
      <button
        onClick={onBack}
        className={`mb-6 flex items-center gap-2 text-sm font-semibold cursor-pointer transition-colors ${
          isDark ? "text-slate-400 hover:text-emerald-400" : "text-slate-500 hover:text-emerald-600"
        }`}
      >
        <Icon icon="ph:arrow-left-bold" className="w-4 h-4" /> Back to Schedules
      </button>

      <div className={`rounded-2xl border p-6 shadow-xl ${
        isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
      }`}>
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-800 gap-4">
          <div>
            <p className="text-xs text-slate-500 font-mono font-semibold uppercase tracking-wider mb-1">Schedule</p>
            <h2 className="text-2xl font-bold text-white">{schedule.code || "—"}</h2>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={schedule.status?.toLowerCase()} />
              {schedule.status === "SCHEDULED" && onEdit && (
                <button
                  onClick={() => onEdit(data)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                >
                  <Icon icon="ph:pencil-simple-bold" className="w-3.5 h-3.5" /> Edit Schedule
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Pickup Date</p>
            <span className="text-lg font-semibold text-emerald-400">{fmt(schedule.pickupDate)}</span>
          </div>
        </div>

        {/* 8 Smart Metrics Cards matching CropInventory details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Zone</p>
            <p className="text-sm font-bold text-white truncate">{schedule.zone?.name || "—"}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Pickup Time</p>
            <p className="text-sm font-bold text-white">{schedule.time || "09:00"}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Vehicle</p>
            <p className="text-sm font-bold text-white truncate">{schedule.driver?.vehicleNumber || "—"}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Capacity Limit</p>
            <p className="text-sm font-bold text-white">{schedule.driver?.capacity ? `${schedule.driver.capacity} kg` : "—"}</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Farmers Involved</p>
            <p className="text-sm font-bold text-blue-400">{schedule.farmerCount ?? 0} Groups</p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Crops Count</p>
            <p className="text-sm font-bold text-amber-400">{schedule.itemCount ?? 0} Varieties</p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Total Weight</p>
            <p className="text-sm font-bold text-emerald-400">{schedule.totalQuantity ?? 0} kg</p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Est. Total Cost</p>
            <p className="text-sm font-bold text-emerald-400">{fmtCurrency(schedule.totalAmount)}</p>
          </div>
        </div>

        {/* Assigned Driver Card */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {schedule.driver?.profile ? (
              <img
                src={schedule.driver.profile}
                alt={schedule.driver.name || "Driver"}
                className="w-14 h-14 rounded-full object-cover bg-slate-850 border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 shrink-0">
                <Icon icon="ph:user-fill" className="w-6 h-6 text-slate-500" />
              </div>
            )}
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Assigned Driver</p>
              <h4 className="font-bold text-base text-white">{schedule.driver?.name || "—"}</h4>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Icon icon="ph:phone-fill" className="w-3.5 h-3.5" /> {schedule.driver?.phone || "—"}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Vehicle Details</p>
            <p className="text-sm font-bold text-white">{schedule.driver?.vehicleNumber || "—"}</p>
            <p className="text-xs text-slate-400 mt-1">Capacity: {schedule.driver?.capacity || 0} kg</p>
          </div>
        </div>

        {/* Crops scheduled list (designed like supply lines) */}
        {farmers && farmers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Icon icon="ph:plant-fill" className="w-5 h-5 text-emerald-400" />
              Crops Scheduled for Pickup
            </h3>
            <div className="space-y-4">
              {farmers.map((farmerGrp, idx) => (
                <div key={idx} className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 transition-all hover:border-slate-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800/40">
                    <div>
                      <h4 className="font-bold text-base text-white">{farmerGrp.farmerGroup?.name || "Farmer Group"}</h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <Icon icon="ph:user-bold" /> {farmerGrp.farmerGroup?.leadFarmer || "Lead"} &middot; 
                        <Icon icon="ph:phone-fill" /> {farmerGrp.farmerGroup?.phone || "—"}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Farmer Group Total</p>
                      <span className="text-base font-bold text-emerald-400">{fmtCurrency(farmerGrp.totalAmount)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {farmerGrp.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex justify-between items-center py-2 border-b border-slate-800/20 last:border-0 text-sm">
                        <div>
                          <p className="font-semibold text-white">{item.cropName || "Crop"}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.collectedQuantity || 0} kg &times; ₹{item.agreedPrice || 0}/kg
                          </p>
                        </div>
                        <span className="font-semibold text-emerald-450">{fmtCurrency(item.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {schedule.notes && (
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 mb-6">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 flex items-center gap-1">
              <Icon icon="ph:note-pencil-bold" className="w-3.5 h-3.5" /> Remarks / Notes
            </p>
            <p className="text-sm text-slate-350 italic">"{schedule.notes}"</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-800">
          {schedule.status === "SCHEDULED" && (
            <>
              <button
                onClick={() => onAction("start", schedule._id)}
                className="flex-1 min-w-[200px] py-3.5 rounded-xl text-sm font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20"
              >
                <Icon icon="ph:truck-fill" className="w-5 h-5" />
                Mark In Progress
              </button>
              <button
                onClick={() => onAction("postpone", schedule._id)}
                className="flex-1 min-w-[150px] py-3.5 rounded-xl text-sm font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Icon icon="ph:clock-clockwise-bold" className="w-5 h-5" />
                Postpone
              </button>
              <button
                onClick={() => onAction("cancel", schedule._id)}
                className="flex-1 min-w-[150px] py-3.5 rounded-xl text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Icon icon="ph:x-circle-bold" className="w-5 h-5" />
                Cancel
              </button>
            </>
          )}
          {schedule.status === "IN_PROGRESS" && (
            <button
              onClick={() => onAction("complete", schedule._id)}
              className="w-full py-4 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Icon icon="ph:check-circle-fill" className="w-5 h-5" />
              Mark Completed
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Postpone Panel ────────────────────────────────────────────────────────────
const PostponePanel = ({ scheduleId, onClose, onConfirm }) => {
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [minISO] = useState(() => new Date().toISOString().slice(0, 10));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Postpone Pickup</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-slate-400">New Pickup Date *</label>
            <DatePicker
              value={newDate}
              onChange={setNewDate}
              minDate={minISO}
              placeholder="Select new date"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-slate-400">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Why is the pickup being postponed?"
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer transition-all">
            Cancel
          </button>
          <button
            onClick={() => newDate && onConfirm(scheduleId, newDate, reason)}
            disabled={!newDate}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-400 cursor-pointer transition-all disabled:opacity-50"
          >
            Postpone
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const PickupScheduler = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [minISO] = useState(() => new Date().toISOString().slice(0, 10));
  const [maxISO] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });

  const [schedules, setSchedules] = useState([]);
  const [readyDeals, setReadyDeals] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [displayMode, setDisplayMode] = useState("card"); // "card" | "table"
  const [sortKey, setSortKey] = useState("createdAt"); // "createdAt", "updatedAt", "status"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" | "desc"

  // View: list | form
  const [view, setView] = useState("list");
  const [creating, setCreating] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    driverId: "",
    zoneId: "",
    pickupDate: "",
    time: "09:00",
    notes: "",
    items: [],
  });

  // Detail panel
  const [detailSchedule, setDetailSchedule] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit mode
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  // Modals
  const [confirmModal, setConfirmModal] = useState(null); // { type, scheduleId, label, description }
  const [postponeModal, setPostponeModal] = useState(null); // scheduleId

  // Fetch zones, drivers, schedules
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [schRes, driverRes, zoneRes] = await Promise.all([
        collectiveScheduleAPI.get({ filter: "all" }),
        collectiveDriverAPI.get(),
        collectiveZoneAPI.get(),
      ]);
      setSchedules(schRes.data.schedules || []);
      setDrivers(driverRes.data.drivers?.filter((d) => d.status !== "INACTIVE") || []);
      setZones(zoneRes.data.zones || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Fetch ready deals when zone changes
  useEffect(() => {
    if (!form.zoneId) {
      setReadyDeals([]);
      return;
    }
    const load = async () => {
      setDealsLoading(true);
      try {
        const res = await collectiveScheduleAPI.getReadyDeals({ 
          zoneId: form.zoneId,
          scheduleId: editingScheduleId || undefined
        });
        setReadyDeals(res.data?.deals || []);
      } catch (err) {
        toast.error("Failed to load ready crops");
      } finally {
        setDealsLoading(false);
      }
    };
    load();
  }, [form.zoneId, editingScheduleId]);

  // Capacity tracking
  const selectedDriver = drivers.find((d) => d._id === form.driverId);
  const capacity = selectedDriver?.capacity || 0;
  const totalSelectedQty = form.items.reduce(
    (s, i) => s + (Number(i.collectedQuantity) || 0),
    0
  );
  const capacityExceeded = capacity > 0 && totalSelectedQty > capacity;

  const openForm = () => {
    setForm({ driverId: "", zoneId: "", pickupDate: "", time: "09:00", notes: "", items: [] });
    setReadyDeals([]);
    setEditingScheduleId(null);
    setView("form");
  };

  const handleEdit = (detailedData) => {
    const { schedule, items } = detailedData;
    setForm({
      driverId: schedule.driver?._id || schedule.driver,
      zoneId: schedule.zone?._id || schedule.zone,
      pickupDate: schedule.pickupDate ? new Date(schedule.pickupDate).toISOString().split('T')[0] : "",
      time: schedule.time || "09:00",
      notes: schedule.notes || "",
      items: (items || []).map((i) => ({
        cropDealId: i.cropDeal?._id || i.cropDeal,
        collectedQuantity: i.collectedQuantity || 0,
      })),
    });
    setEditingScheduleId(schedule._id);
    setView("form");
  };

  const toggleDeal = (deal) => {
    setForm((p) => {
      const exists = p.items.find((i) => i.cropDealId === deal._id);
      if (exists) return { ...p, items: p.items.filter((i) => i.cropDealId !== deal._id) };
      return {
        ...p,
        items: [
          ...p.items,
          { cropDealId: deal._id, collectedQuantity: deal.expectedQuantity || 0 },
        ],
      };
    });
  };

  const updateQty = (dealId, qty) => {
    setForm((p) => ({
      ...p,
      items: p.items.map((i) =>
        i.cropDealId === dealId ? { ...i, collectedQuantity: qty } : i
      ),
    }));
  };

  const handleCreate = async () => {
    if (!form.driverId || !form.zoneId || !form.pickupDate || form.items.length === 0) {
      toast.error("Driver, zone, date, and at least one crop are required");
      return;
    }
    if (capacityExceeded) {
      toast.error(`Total quantity (${totalSelectedQty} kg) exceeds vehicle capacity (${capacity} kg)`);
      return;
    }
    // Convert qty strings to numbers
    const payload = {
      ...form,
      items: form.items.map((i) => ({
        ...i,
        collectedQuantity: Number(i.collectedQuantity) || 0,
      })),
    };
    setCreating(true);
    try {
      if (editingScheduleId) {
        await collectiveScheduleAPI.update(editingScheduleId, payload);
        toast.success("Schedule updated successfully!");
      } else {
        await collectiveScheduleAPI.create(payload);
        toast.success("Pickup scheduled successfully!");
      }
      fetchAll();
      setView("list");
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setCreating(false);
    }
  };

  const handleAction = (type, scheduleId) => {
    if (type === "postpone") {
      setPostponeModal(scheduleId);
      return;
    }
    const labels = {
      start: { label: "Start Pickup", description: "Mark this pickup as In Progress? The driver will be notified.", confirm: "Start", color: "blue" },
      complete: { label: "Complete Pickup", description: "Mark this pickup as Completed? Farmer balances will be updated.", confirm: "Complete", color: "emerald" },
      cancel: { label: "Cancel Pickup", description: "This will cancel the pickup and release all selected crops back to the pool.", confirm: "Cancel Pickup", color: "red" },
    };
    setConfirmModal({ type, scheduleId, ...labels[type] });
  };

  const executeAction = async () => {
    if (!confirmModal) return;
    const { type, scheduleId } = confirmModal;
    const statusMap = { start: "IN_PROGRESS", complete: "COMPLETED", cancel: "CANCELLED" };
    setConfirmModal(null);
    try {
      await collectiveScheduleAPI.updateStatus(scheduleId, { status: statusMap[type] });
      toast.success(`Schedule ${type === "start" ? "started" : type === "complete" ? "completed" : "cancelled"}`);
      await fetchAll();
      if (view === "detail" && detailSchedule?.schedule?._id === scheduleId) {
        handleViewDetails({ _id: scheduleId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };
  const executePostpone = async (scheduleId, newDate, reason) => {
    setPostponeModal(null);
    try {
      await collectiveScheduleAPI.updateStatus(scheduleId, { status: "POSTPONED", newDate, reason });
      toast.success("Pickup postponed");
      await fetchAll();
      if (view === "detail" && detailSchedule?.schedule?._id === scheduleId) {
        handleViewDetails({ _id: scheduleId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to postpone");
    }
  };

  const handleViewDetails = async (summarySchedule) => {
    setDetailLoading(true);
    setView("detail"); // switch view immediately so user sees loading
    try {
      const { data } = await collectiveScheduleAPI.getDetail(summarySchedule._id);
      setDetailSchedule(data);
    } catch (err) {
      toast.error("Failed to load schedule details");
      setView("list"); // go back on error
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = schedules
    .filter((s) => {
      if (tab === "upcoming") return ["SCHEDULED", "IN_PROGRESS", "POSTPONED"].includes(s.status);
      if (tab === "past") return ["COMPLETED", "CANCELLED"].includes(s.status);
      return true;
    })
    .sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      
      if (sortKey === "createdAt" || sortKey === "updatedAt") {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      }
      
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <div className={`min-h-screen p-5 sm:p-7 overflow-x-hidden transition-colors duration-200 ${isDark ? "bg-slate-950 text-white" : "bg-gradient-to-br from-slate-50 via-emerald-50/20 to-amber-50/20 text-slate-900"}`}>
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                  Pickup Schedules
                </h1>
                <p className="text-sm mt-1 text-slate-400">
                  {schedules.filter((s) => ["SCHEDULED", "IN_PROGRESS"].includes(s.status)).length} active ·{" "}
                  {schedules.length} total
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* View Switcher */}
                <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
                  <button
                    onClick={() => setDisplayMode("card")}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      displayMode === "card"
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon icon="ph:squares-four-fill" className="w-4 h-4" />
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                  <button
                    onClick={() => setDisplayMode("table")}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      displayMode === "table"
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon icon="ph:list-bullets-bold" className="w-4 h-4" />
                    <span className="hidden sm:inline">List</span>
                  </button>
                </div>

                <button
                  id="btn-schedule-pickup"
                  onClick={openForm}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold cursor-pointer shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Icon icon="ph:calendar-plus-fill" className="w-4 h-4" />
                  Schedule Pickup
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              {/* Tabs */}
              <div className="flex gap-1 p-1.5 rounded-xl backdrop-blur-md bg-slate-900/60 border border-slate-800 w-fit">
                {[
                  { id: "all", label: "All Schedules" },
                  { id: "upcoming", label: "Upcoming" },
                  { id: "past", label: "Past Schedules" },
                ].map((t) => (
                  <button
                    key={t.id}
                    id={`tab-${t.id}`}
                    onClick={() => setTab(t.id)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      tab === t.id
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    {t.label}
                    {t.id === "upcoming" && schedules.filter((s) => ["SCHEDULED", "IN_PROGRESS"].includes(s.status)).length > 0 && (
                      <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                        {schedules.filter((s) => ["SCHEDULED", "IN_PROGRESS"].includes(s.status)).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 rounded-xl border text-sm outline-none bg-slate-900/60 border-slate-800 text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="updatedAt">Updated Date</option>
                    <option value="status">Status</option>
                  </select>
                  <Icon icon="ph:caret-down-bold" className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                </div>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Toggle Sort Order"
                >
                  <Icon icon={sortOrder === "asc" ? "ph:sort-ascending-bold" : "ph:sort-descending-bold"} className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-10 h-10 text-emerald-400" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="ph:calendar-fill"
                title="No schedules found"
                description={
                  tab === "upcoming"
                    ? "No upcoming pickups. Schedule one now."
                    : "No pickups match this filter."
                }
                action={
                  tab !== "past" && (
                    <button
                      onClick={openForm}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold cursor-pointer mt-4"
                    >
                      Schedule Pickup
                    </button>
                  )
                }
              />
            ) : displayMode === "table" ? (
              /* ── Table View ────────────────────────────────────────────── */
              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-5">Code</th>
                        <th className="py-4 px-5">Zone</th>
                        <th className="py-4 px-5">Date & Time</th>
                        <th className="py-4 px-5">Driver</th>
                        <th className="py-4 px-5 text-center">Crops / Qty</th>
                        <th className="py-4 px-5 text-right">Estimated Total</th>
                        <th className="py-4 px-5">Status</th>
                        <th className="py-4 px-5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {filtered.map((s) => (
                        <tr
                          key={s._id}
                          className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                          onClick={() => handleViewDetails(s)}
                        >
                          <td className="py-4 px-5 font-bold font-mono text-emerald-400">{s.code || "—"}</td>
                          <td className="py-4 px-5 font-medium text-white">{s.zone?.name || "—"}</td>
                          <td className="py-4 px-5 text-slate-300">
                            {fmt(s.pickupDate)} <span className="text-xs text-slate-500 ml-1">({s.time || "09:00"})</span>
                          </td>
                          <td className="py-4 px-5 text-slate-300">
                            <p className="font-semibold text-white">{s.driver?.name || "—"}</p>
                            <p className="text-xs text-slate-500">{s.driver?.phone || ""}</p>
                          </td>
                          <td className="py-4 px-5 text-center text-slate-300">
                            <span className="font-semibold">{s.itemCount ?? 0}</span> crops · <span className="text-emerald-400 font-bold">{s.totalQuantity ?? 0} kg</span>
                          </td>
                          <td className="py-4 px-5 text-right font-bold text-emerald-400">
                            {fmtCurrency(s.totalAmount)}
                          </td>
                          <td className="py-4 px-5">
                            <StatusBadge status={s.status?.toLowerCase()} />
                          </td>
                          <td className="py-4 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleViewDetails(s)}
                                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                                title="View Details"
                              >
                                <Icon icon="ph:eye-bold" className="w-4 h-4" />
                              </button>
                              {["SCHEDULED", "POSTPONED"].includes(s.status) && (
                                <button
                                  onClick={() => setPostponeModal(s._id)}
                                  className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
                                  title="Postpone"
                                >
                                  <Icon icon="ph:clock-clockwise-bold" className="w-4 h-4" />
                                </button>
                              )}
                              {s.status === "SCHEDULED" && (
                                <button
                                  onClick={() => handleAction("start", s._id)}
                                  className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                                  title="Start Pickup"
                                >
                                  <Icon icon="ph:play-bold" className="w-4 h-4" />
                                </button>
                              )}
                              {s.status === "IN_PROGRESS" && (
                                <button
                                  onClick={() => handleAction("complete", s._id)}
                                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                  title="Complete Pickup"
                                >
                                  <Icon icon="ph:check-bold" className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* ── Card View ─────────────────────────────────────────────── */
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((s, i) => (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group relative rounded-2xl border bg-slate-900/40 border-slate-800/60 shadow-lg p-5 transition-all cursor-pointer flex flex-col justify-between"
                    onClick={() => handleViewDetails(s)}
                  >
                    <div className="flex-1">
                      {/* Header: code + status */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-wide">
                            {s.code || "SCHEDULE"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Icon icon="ph:map-pin-fill" className="w-3 h-3 text-emerald-400" />
                            {s.zone?.name || "—"}
                          </p>
                        </div>
                        <StatusBadge status={s.status?.toLowerCase()} size="sm" />
                      </div>

                      {/* Driver */}
                      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/25 mb-3">
                        {s.driver?.profile ? (
                          <img
                            src={s.driver.profile}
                            alt={s.driver.name || "Driver"}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 shrink-0">
                            <Icon icon="ph:user-fill" className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{s.driver?.name || "Driver not assigned"}</p>
                          <p className="text-xs text-slate-500 truncate">{s.driver?.vehicleNumber || s.driver?.phone || ""}</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-400">{fmt(s.pickupDate)}</span>
                      </div>

                      {/* Stats row */}
                      <div className="flex gap-1.5 mb-3">
                        <div className="flex-1 text-center bg-slate-800/20 rounded-md py-1.5">
                          <p className="text-sm font-bold text-white">{s.itemCount ?? 0}</p>
                          <p className="text-xs text-slate-500">Crops</p>
                        </div>
                        <div className="flex-1 text-center bg-slate-800/20 rounded-md py-1.5">
                          <p className="text-sm font-bold text-white">{s.totalQuantity ?? 0} kg</p>
                          <p className="text-xs text-slate-500">Qty</p>
                        </div>
                        <div className="flex-1 text-center bg-emerald-500/5 rounded-md py-1.5">
                          <p className="text-sm font-bold text-emerald-400">
                            {s.totalAmount ? `₹${(s.totalAmount / 1000).toFixed(1)}k` : "₹0"}
                          </p>
                          <p className="text-xs text-slate-500">Total</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer: status actions + view-details arrow */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex gap-2">
                        {["SCHEDULED", "POSTPONED"].includes(s.status) && (
                          <button
                            id={`btn-postpone-${s._id}`}
                            onClick={(e) => { e.stopPropagation(); setPostponeModal(s._id); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer text-center"
                          >
                            Postpone
                          </button>
                        )}
                        {s.status === "SCHEDULED" && (
                          <button
                            id={`btn-start-${s._id}`}
                            onClick={(e) => { e.stopPropagation(); handleAction("start", s._id); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer text-center"
                          >
                            Start
                          </button>
                        )}
                        {s.status === "IN_PROGRESS" && (
                          <button
                            id={`btn-complete-${s._id}`}
                            onClick={(e) => { e.stopPropagation(); handleAction("complete", s._id); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer text-center"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                      <span
                        onClick={(e) => { e.stopPropagation(); handleViewDetails(s); }}
                        className="text-sm font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer"
                      >
                        View Details <Icon icon="ph:arrow-right-bold" className="w-4 h-4" />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : view === "detail" ? (
          detailLoading ? (
            <motion.div
              key="detail-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-64 gap-4"
            >
              <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-10 h-10 text-emerald-400" />
              <p className="text-sm text-slate-400 font-medium">Loading schedule details…</p>
            </motion.div>
          ) : detailSchedule ? (
            <ScheduleDetailView
              key="detail"
              data={detailSchedule}
              isDark={isDark}
              onAction={handleAction}
              onEdit={handleEdit}
              onBack={() => { setDetailSchedule(null); setView("list"); }}
            />
          ) : (
            <motion.div key="detail-error" className="flex flex-col items-center justify-center h-64 gap-3">
              <Icon icon="ph:warning-circle-bold" className="w-10 h-10 text-red-400" />
              <p className="text-sm text-slate-400">Failed to load schedule details.</p>
              <button onClick={() => setView("list")} className="text-sm text-emerald-400 hover:underline cursor-pointer">← Back to Schedules</button>
            </motion.div>
          )
        ) : (
          /* ── Create Schedule Form ─────────────────────────────────────── */
          <motion.div
            key="form"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="max-w-2xl mx-auto"
          >
            <button
              onClick={() => setView("list")}
              className="mb-6 flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors text-slate-400 hover:text-emerald-400"
            >
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
              Back to Schedules
            </button>

            <div className="rounded-2xl border bg-slate-900/50 border-slate-800/60 shadow-2xl shadow-black/20 p-6 sm:p-8">
              <h2 className="text-2xl font-bold mb-1">{editingScheduleId ? "Edit Pickup Schedule" : "Schedule Pickup"}</h2>
              <p className="text-sm mb-6 text-slate-400">
                {editingScheduleId ? "Update the details of this schedule." : "Select a zone first — only READY crops from that zone will appear."}
              </p>

              <div className="space-y-5">
                {/* Zone + Driver */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Zone" required>
                    <div className="relative">
                      <select
                        id="form-zone"
                        value={form.zoneId}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, zoneId: e.target.value, items: [] }));
                        }}
                        className={selectCls}
                      >
                        <option value="">Select zone…</option>
                        {zones.map((z) => (
                          <option key={z._id} value={z._id}>
                            {z.name}
                          </option>
                        ))}
                      </select>
                      <Icon icon="ph:caret-down-bold" className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-500" />
                    </div>
                  </Field>

                  <Field label="Driver" required>
                    <div className="relative">
                      <select
                        id="form-driver"
                        value={form.driverId}
                        onChange={(e) => setForm((p) => ({ ...p, driverId: e.target.value }))}
                        className={selectCls}
                      >
                        <option value="">Select driver…</option>
                        {drivers.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name} — {d.capacity} kg capacity
                          </option>
                        ))}
                      </select>
                      <Icon icon="ph:caret-down-bold" className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-500" />
                    </div>
                    {selectedDriver && (
                      <p className="text-xs text-slate-500 mt-1">
                        Vehicle: {selectedDriver.vehicleNumber} · Capacity: {selectedDriver.capacity} kg
                      </p>
                    )}
                  </Field>
                </div>

                {/* Date + Time */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Pickup Date" required>
                    <DatePicker
                      id="form-pickup-date"
                      value={form.pickupDate}
                      onChange={(v) => setForm((p) => ({ ...p, pickupDate: v }))}
                      minDate={minISO}
                      maxDate={maxISO}
                      placeholder="Select pickup date"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Pickup Time">
                    <input
                      type="text"
                      id="form-pickup-time"
                      value={form.time}
                      onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                      placeholder="09:00"
                      className={inputCls}
                    />
                  </Field>
                </div>

                {/* Capacity Tracker */}
                {capacity > 0 && (
                  <div className={`p-3.5 rounded-xl border transition-all ${capacityExceeded ? "bg-red-500/10 border-red-500/30" : "bg-slate-800/40 border-slate-700"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-400">Vehicle Capacity Meter</span>
                      <span className={`text-xs font-bold ${capacityExceeded ? "text-red-400" : "text-emerald-400"}`}>
                        {totalSelectedQty} / {capacity} kg
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${capacityExceeded ? "bg-red-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min((totalSelectedQty / capacity) * 100, 100)}%` }}
                      />
                    </div>
                    {capacityExceeded && (
                      <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1 font-semibold">
                        <Icon icon="ph:warning-circle-fill" className="w-4 h-4 shrink-0" />
                        Selected crops total {totalSelectedQty} kg which exceeds driver vehicle capacity ({capacity} kg)!
                      </p>
                    )}
                  </div>
                )}

                {/* Ready Deals */}
                <div>
                  <label className="text-xs font-semibold block mb-2 text-slate-400">
                    Select Crops to Pickup *
                    {form.zoneId && !dealsLoading && (
                      <span className="ml-2 font-normal text-slate-500">
                        ({readyDeals.length} available in this zone)
                      </span>
                    )}
                  </label>

                  {!form.zoneId ? (
                    <div className="p-5 rounded-xl border border-dashed border-slate-700 text-center bg-slate-900/30">
                      <Icon icon="ph:map-pin-bold" className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      <p className="text-sm text-slate-400">Select a zone to see available crops</p>
                    </div>
                  ) : dealsLoading ? (
                    <div className="flex items-center justify-center h-24">
                      <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-6 h-6 text-emerald-400" />
                    </div>
                  ) : readyDeals.length === 0 ? (
                    <div className="p-5 rounded-xl border border-dashed border-slate-700 text-center bg-slate-900/30">
                      <Icon icon="ph:leaf-fill" className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      <p className="text-sm font-medium text-slate-400">No READY crops in this zone yet</p>
                      <p className="text-xs mt-1 text-slate-500">Farmers must mark crops as READY first.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {readyDeals.map((deal) => {
                        const selected = form.items.find((i) => i.cropDealId === deal._id);
                        return (
                          <div
                            key={deal._id}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                              selected
                                ? "border-emerald-500/50 bg-emerald-500/10"
                                : "border-slate-700 hover:border-slate-600 bg-slate-900/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div onClick={() => toggleDeal(deal)} className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-white truncate">
                                  {deal.crop?.name || "Crop"}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {deal.membership?.farmer?.groupName || deal.membership?.farmer?.name} · ₹{deal.agreedPrice}/kg
                                </p>
                              </div>
                              <button
                                onClick={() => toggleDeal(deal)}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                  selected
                                    ? "bg-emerald-500 border-emerald-500"
                                    : "border-slate-600 hover:border-slate-500"
                                }`}
                              >
                                {selected && (
                                  <Icon icon="ph:check-bold" className="w-3.5 h-3.5 text-white" />
                                )}
                              </button>
                            </div>

                            <AnimatePresence>
                              {selected && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                  animate={{ height: "auto", opacity: 1, marginTop: 10 }}
                                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="flex items-center gap-3 pt-3 border-t border-slate-700/50">
                                    <label className="text-xs font-medium text-slate-300 whitespace-nowrap">
                                      Qty Collected (kg):
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={selected.collectedQuantity}
                                      onChange={(e) => updateQty(deal._id, e.target.value)}
                                      className="w-28 rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-sm text-white outline-none focus:border-emerald-500 transition-all"
                                    />
                                    <span className="text-xs text-slate-500">
                                      ≈ ₹{((Number(selected.collectedQuantity) || 0) * deal.agreedPrice).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <Field label="Driver Notes">
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Special instructions…"
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </Field>

                {/* Summary */}
                {form.items.length > 0 && (
                  <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {form.items.length} crop{form.items.length !== 1 ? "s" : ""} selected
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{totalSelectedQty} kg total</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-400">
                      {fmtCurrency(
                        form.items.reduce((s, item) => {
                          const deal = readyDeals.find((d) => d._id === item.cropDealId);
                          return s + (Number(item.collectedQuantity) || 0) * (deal?.agreedPrice || 0);
                        }, 0)
                      )}
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setView("list")}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-colors border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-confirm-pickup"
                    onClick={handleCreate}
                    disabled={creating || form.items.length === 0 || capacityExceeded}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer flex items-center justify-center gap-2 hover:from-emerald-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {creating ? (
                      <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-5 h-5" />
                    ) : (
                      <Icon icon="ph:calendar-plus-bold" className="w-4 h-4" />
                    )}
                    Confirm Pickup
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Postpone Modal */}
      <AnimatePresence>
        {postponeModal && (
          <PostponePanel
            scheduleId={postponeModal}
            onClose={() => setPostponeModal(null)}
            onConfirm={executePostpone}
          />
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen={!!confirmModal}
          title={confirmModal.label}
          message={confirmModal.description}
          confirmLabel={confirmModal.confirm}
          onConfirm={executeAction}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};

export default PickupScheduler;
