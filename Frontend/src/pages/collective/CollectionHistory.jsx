import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { collectiveScheduleAPI } from "../../services/api";
import api from "../../services/api";

const fmt = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtCur = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// ── Upload helper ─────────────────────────────────────────────────────────────
const uploadProof = async (file, scheduleCode, farmerFid) => {
  const formData = new FormData();
  formData.append("proof", file);
  formData.append("scheduleCode", scheduleCode || "SC");
  formData.append("farmerFid", farmerFid || "F");
  const { data } = await api.post("/collective/me/payments/proof", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
};

// ── ProofUploader ─────────────────────────────────────────────────────────────
const ProofUploader = ({ onUrlReady, scheduleCode, farmerFid }) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadProof(file, scheduleCode, farmerFid);
      onUrlReady(url);
    } catch {
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${
        preview ? "border-emerald-500/40" : "border-slate-700 hover:border-slate-500"
      }`}
      onClick={() => fileRef.current?.click()}
      onDrop={(e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files[0]);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      {preview ? (
        <div className="relative h-32 rounded-xl overflow-hidden">
          <img src={preview} alt="proof" className="w-full h-full object-cover opacity-70" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            {uploading ? (
              <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-8 h-8 text-white" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Icon icon="ph:check-circle-fill" className="w-8 h-8 text-emerald-400" />
                <span className="text-xs text-white font-semibold">Uploaded</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 p-5 text-slate-500">
          <Icon icon="ph:upload-simple-bold" className="w-7 h-7 text-emerald-400" />
          <p className="text-xs font-medium text-center text-slate-300">
            {uploading ? "Uploading proof…" : "Click or drag payment proof image/receipt"}
          </p>
        </div>
      )}
    </div>
  );
};

// ── Payment Detail View ────────────────────────────────────────────────────────
const FarmerPaymentView = ({ schedule, farmerGroupId, onClose, onDone }) => {
  const { toast } = useToast();
  const [proofUrl, setProofUrl] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [paying, setPaying] = useState(false);

  if (!schedule || !farmerGroupId) return null;

  const items = (schedule.items || []).filter(
    (it) => it.farmerGroup?._id === farmerGroupId
  );
  const pendingItems = items.filter((it) => it.paymentStatus !== "PAID");
  
  // Initialize all pending items as selected
  const [selectedItemIds, setSelectedItemIds] = useState(
    pendingItems.map((i) => i._id)
  );

  useEffect(() => {
    setSelectedItemIds(pendingItems.map((i) => i._id));
  }, [farmerGroupId, pendingItems.length]); // reset when farmer group changes

  const selectedTotal = pendingItems
    .filter((it) => selectedItemIds.includes(it._id))
    .reduce((s, it) => s + it.totalAmount, 0);

  const pendingTotal = pendingItems.reduce((s, it) => s + it.totalAmount, 0);
  const allPaid = pendingItems.length === 0;

  const farmerGroup = items[0]?.farmerGroup;

  const handlePay = async () => {
    if (!proofUrl) { toast.error("Upload payment proof first"); return; }
    if (selectedItemIds.length === 0) { toast.error("Select at least one crop to pay for"); return; }
    
    setPaying(true);
    try {
      await collectiveScheduleAPI.payFarmer(schedule._id, farmerGroupId, {
        paymentProof: proofUrl,
        utrNumber,
        remarks,
        itemIds: selectedItemIds,
      });
      toast.success(`Payment of ${fmtCur(selectedTotal)} recorded!`, { title: "Payment Recorded ✓" });
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  // handleItemPay removed in favor of checkbox UI

  return (
    <motion.div
      key="pay-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="max-w-3xl mx-auto w-full"
    >
      <button
        onClick={onClose}
        className="mb-6 flex items-center gap-2 text-sm font-semibold cursor-pointer transition-colors text-slate-400 hover:text-emerald-400"
      >
        <Icon icon="ph:arrow-left-bold" className="w-4 h-4" /> Back to History
      </button>

      <div className="rounded-2xl border bg-slate-950 border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/40">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Payment Settlement</p>
            <h2 className="text-2xl font-bold text-white">{farmerGroup?.name || "Farmer Group"}</h2>
          </div>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Summary */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Schedule</span>
              <span className="text-sm font-mono font-bold text-emerald-400">{schedule.code}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Pickup Date</span>
              <span className="text-sm text-slate-300">{fmt(schedule.pickupDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Phone</span>
              <span className="text-sm text-slate-300">{farmerGroup?.phone || "—"}</span>
            </div>
          </div>

          {/* Items breakdown */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Collected Crops</p>
            <div className="space-y-2">
              {items.map((item) => {
                const isPaid = item.paymentStatus === "PAID";
                const isSelected = selectedItemIds.includes(item._id);

                return (
                  <div
                    key={item._id}
                    onClick={() => {
                      if (isPaid) return;
                      setSelectedItemIds((prev) =>
                        isSelected ? prev.filter((id) => id !== item._id) : [...prev, item._id]
                      );
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isPaid
                        ? "bg-emerald-500/5 border-emerald-500/20 opacity-70"
                        : "bg-slate-900/40 border-slate-800 cursor-pointer hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {!isPaid && (
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-slate-600 bg-slate-800"
                          }`}
                        >
                          {isSelected && <Icon icon="ph:check-bold" className="w-3.5 h-3.5 text-white" />}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.cropName || "Crop"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.collectedQuantity} kg × ₹{item.agreedPrice}/kg
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">{fmtCur(item.totalAmount)}</p>
                      {isPaid ? (
                        <span className="text-xs text-emerald-500 flex items-center gap-1 justify-end font-semibold">
                          <Icon icon="ph:check-circle-fill" className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400 font-semibold">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total pending */}
          {!allPaid && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex justify-between items-center">
              <span className="text-sm font-semibold text-amber-400">Total Pending Settlement</span>
              <span className="text-xl font-bold text-amber-400">{fmtCur(pendingTotal)}</span>
            </div>
          )}

          {allPaid ? (
            <div className="text-center py-8 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 p-6">
              <Icon icon="ph:check-circle-fill" className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">Fully Paid</p>
              <p className="text-xs text-slate-400 mt-1">All farmer group payments for this schedule have been settled.</p>
            </div>
          ) : (
            <>
              {/* Proof upload */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Upload Payment Proof *</p>
                <ProofUploader
                  onUrlReady={setProofUrl}
                  scheduleCode={schedule.code}
                  farmerFid={farmerGroup?._id}
                />
                {proofUrl && (
                  <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1 font-medium">
                    <Icon icon="ph:check-circle-fill" className="w-3.5 h-3.5" />
                    Payment proof ready for submission
                  </p>
                )}
              </div>

              {/* UTR */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">UTR / Reference Number</p>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="Bank UTR or transaction ID"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Remarks */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Remarks</p>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  placeholder="Optional notes…"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              {/* Bulk pay */}
              <button
                onClick={handlePay}
                disabled={paying || !proofUrl || selectedItemIds.length === 0}
                className="w-full py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white cursor-pointer flex items-center justify-center gap-2 hover:from-emerald-400 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-60 mt-4"
              >
                {paying ? (
                  <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-5 h-5" />
                ) : (
                  <Icon icon="ph:check-circle-fill" className="w-5 h-5" />
                )}
                Settle Selected ({selectedItemIds.length}) — {fmtCur(selectedTotal)}
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const CollectionHistory = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [detailMap, setDetailMap] = useState({});
  const [detailLoading, setDetailLoading] = useState({});
  const [payPanel, setPayPanel] = useState(null); // { schedule, farmerGroupId }
  const [sortKey, setSortKey] = useState("createdAt"); // "createdAt", "updatedAt", "status"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" | "desc"

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await collectiveScheduleAPI.get({ filter: "past" });
      setSchedules(data.schedules || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const loadDetail = async (scheduleId) => {
    if (detailMap[scheduleId]) return;
    setDetailLoading((p) => ({ ...p, [scheduleId]: true }));
    try {
      const { data } = await collectiveScheduleAPI.getDetail(scheduleId);
      setDetailMap((p) => ({ ...p, [scheduleId]: data }));
    } catch {
      toast.error("Failed to load schedule details");
    } finally {
      setDetailLoading((p) => ({ ...p, [scheduleId]: false }));
    }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    loadDetail(id);
  };

  const groupByFarmer = (items = []) => {
    const map = {};
    for (const item of items) {
      const fId = item.farmerGroup?._id;
      if (!fId) continue;
      if (!map[fId]) {
        map[fId] = { farmerGroup: item.farmerGroup, items: [], totalAmount: 0, allPaid: true };
      }
      map[fId].items.push(item);
      map[fId].totalAmount += item.totalAmount || 0;
      if (item.paymentStatus !== "PAID") map[fId].allPaid = false;
    }
    return Object.values(map);
  };

  // Strictly past & cancelled pickups in History
  const historySchedules = schedules
    .filter((s) => ["COMPLETED", "CANCELLED"].includes(s.status))
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
  const completedSchedules = historySchedules.filter((s) => s.status === "COMPLETED");

  const totalPaid = completedSchedules.reduce((sum, sc) => sum + (sc.paidAmount || 0), 0);
  const totalPending = completedSchedules.reduce(
    (sum, sc) => sum + Math.max(0, (sc.totalAmount || 0) - (sc.paidAmount || 0)),
    0
  );

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <AnimatePresence mode="wait">
        {payPanel ? (
          <FarmerPaymentView
            schedule={payPanel.schedule}
            farmerGroupId={payPanel.farmerGroupId}
            onClose={() => setPayPanel(null)}
            onDone={() => {
              const sid = payPanel.schedule._id;
              setDetailMap((p) => {
                const next = { ...p };
                delete next[sid];
                return next;
              });
              loadDetail(sid);
              fetchSchedules();
            }}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                  Collection History
                </h1>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {completedSchedules.length} completed pickups · {historySchedules.length} past total
                </p>
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

      {/* Stats Cards - Smaller & Split Payment Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
        {/* Completed Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className={`overflow-hidden rounded-xl border p-4 ${
            isDark ? "bg-slate-900/60 border-slate-800/60 shadow-lg" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Icon icon="ph:check-circle-fill" className="w-4 h-4" />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Completed Pickups
            </span>
          </div>
          <p className="text-xl font-black text-emerald-400">{completedSchedules.length}</p>
        </motion.div>

        {/* Total Value Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`overflow-hidden rounded-xl border p-4 ${
            isDark ? "bg-slate-900/60 border-slate-800/60 shadow-lg" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Icon icon="ph:currency-inr-fill" className="w-4 h-4" />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Total Pickup Value
            </span>
          </div>
          <p className="text-xl font-black text-blue-400">
            {fmtCur(completedSchedules.reduce((s, c) => s + (c.totalAmount || 0), 0))}
          </p>
        </motion.div>

        {/* Split Payment Card: Paid vs To Be Paid */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`overflow-hidden rounded-xl border p-4 ${
            isDark ? "bg-slate-900/60 border-slate-800/60 shadow-lg" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Icon icon="ph:scales-fill" className="w-4 h-4" />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Payment Status
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-slate-500">Paid</p>
              <p className="text-base font-bold text-emerald-400">{fmtCur(totalPaid)}</p>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-right">
              <p className="text-xs text-slate-500">To be Paid</p>
              <p className="text-base font-bold text-amber-400">{fmtCur(totalPending)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-10 h-10 text-emerald-400" />
        </div>
      ) : historySchedules.length === 0 ? (
        <EmptyState
          icon="ph:clock-counter-clockwise-fill"
          title="No history yet"
          description="Completed and cancelled pickups will appear in this section."
        />
      ) : (
        <div className="space-y-3">
          {historySchedules.map((s, idx) => {
            const isExpanded = expandedId === s._id;
            const detail = detailMap[s._id];
            const farmerGroups = groupByFarmer(detail?.items);
            const pendingPayments = farmerGroups.filter((fg) => !fg.allPaid).length;

            return (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isDark
                    ? "bg-slate-900/40 border-slate-800/60 shadow-md hover:border-slate-700"
                    : "bg-white border-slate-200 shadow-sm hover:border-slate-300"
                }`}
              >
                {/* Sleek Row */}
                <button
                  id={`schedule-row-${s._id}`}
                  onClick={() => toggleExpand(s._id)}
                  className={`w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 text-left transition-colors cursor-pointer ${
                    isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? "bg-slate-800 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                      <Icon icon="ph:truck-fill" className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-bold text-base font-mono text-white">{s.code || "—"}</p>
                        <StatusBadge status={s.status?.toLowerCase()} size="sm" />
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                          Zone: {s.zone?.name || "—"}
                        </span>
                        {s.status !== "CANCELLED" && pendingPayments > 0 && (
                          <span className="text-[10px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">
                            {pendingPayments} pending
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {fmt(s.pickupDate)} · Driver: {s.driver?.name || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-base text-emerald-400">{fmtCur(s.totalAmount)}</p>
                      <p className="text-xs text-slate-500">{s.itemCount ?? 0} crops · {s.totalQuantity ?? 0} kg</p>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      } ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
                    >
                      <Icon icon="ph:caret-down-bold" className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={`border-t px-3 py-2.5 ${isDark ? "border-slate-800 bg-slate-900/30" : "border-slate-200 bg-slate-50/50"}`}>
                        {detailLoading[s._id] ? (
                          <div className="flex items-center justify-center py-2 gap-1.5">
                            <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] text-slate-400">Loading details…</span>
                          </div>
                        ) : farmerGroups.length === 0 ? (
                          <p className="text-[11px] text-center py-2 text-slate-500">No farmer groups in this pickup.</p>
                        ) : (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-slate-500">
                              Farmer Groups Involved ({farmerGroups.length})
                            </p>
                            {farmerGroups.map((fg) => {
                              const isCancelled = s.status === "CANCELLED";
                              const Container = isCancelled ? "div" : "button";
                              
                              return (
                                <Container
                                  key={fg.farmerGroup?._id}
                                  id={`farmer-pay-${fg.farmerGroup?._id}`}
                                  onClick={isCancelled ? undefined : () =>
                                    setPayPanel({
                                      schedule: { ...s, items: detail?.items || [] },
                                      farmerGroupId: fg.farmerGroup?._id,
                                    })
                                  }
                                  className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                                    isCancelled ? "" : "cursor-pointer hover:border-emerald-500/40"
                                  } ${
                                    isDark
                                      ? `border-slate-800 bg-slate-900/50 ${isCancelled ? "" : "hover:bg-slate-800/80"}`
                                      : `border-slate-200 bg-white`
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] ${
                                        isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {fg.farmerGroup?.name?.charAt(0) || "F"}
                                    </div>
                                    <div>
                                      <p className={`text-[11px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                                        {fg.farmerGroup?.name}
                                      </p>
                                      <p className={`text-[10px] flex items-center gap-1 mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                        {fg.items.length} crop{fg.items.length !== 1 ? "s" : ""}
                                        {!isCancelled && (
                                          fg.allPaid ? (
                                            <span className="text-emerald-400 flex items-center gap-0.5 font-semibold">
                                              <Icon icon="ph:check-circle-fill" className="w-2.5 h-2.5" /> Paid
                                            </span>
                                          ) : (
                                            <span className="text-amber-400 flex items-center gap-0.5 font-semibold">
                                              <Icon icon="ph:clock-fill" className="w-2.5 h-2.5" /> Pending
                                            </span>
                                          )
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className="text-right">
                                      <p className={`text-[11px] font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                                        {fmtCur(fg.totalAmount)}
                                      </p>
                                      {!isCancelled && !fg.allPaid && (
                                        <span className="text-[9px] bg-amber-500/15 text-amber-400 px-1 py-0.5 rounded font-semibold inline-block mt-0.5">
                                          Pay
                                        </span>
                                      )}
                                    </div>
                                    {!isCancelled && (
                                      <Icon icon="ph:caret-right-bold" className={`w-3 h-3 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                                    )}
                                  </div>
                                </Container>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollectionHistory;
