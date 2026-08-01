import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { farmerPickupAPI } from "../../services/api";

const fmt = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const fmtCur = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// ── Receipt Modal Component ───────────────────────────────────────────────────
const ReceiptModal = ({ receiptUrl, onClose }) => {
  if (!receiptUrl) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon icon="ph:receipt-bold" className="text-emerald-400 w-5 h-5" />
            Payment Receipt
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <Icon icon="ph:x-bold" className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 flex items-center justify-center bg-slate-950/60 rounded-xl p-2 mb-4 border border-slate-800">
          <img src={receiptUrl} alt="Receipt Proof" className="max-h-96 w-auto object-contain rounded-lg shadow-md" />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer transition-all"
          >
            Close
          </button>
          <a
            href={receiptUrl}
            target="_blank"
            rel="noreferrer"
            download
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Icon icon="ph:download-simple-bold" className="w-4 h-4" />
            Download Receipt
          </a>
        </div>
      </div>
    </div>
  );
};

const FarmerSchedules = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [pickups, setPickups] = useState([]);
  const [balanceData, setBalanceData] = useState({ totalBalance: 0, totalEarnings: 0, balances: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // Default to "all"

  const [view, setView] = useState("list");
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pickupDetail, setPickupDetail] = useState(null);
  const [activeReceiptUrl, setActiveReceiptUrl] = useState(null);

  const fetchPickups = useCallback(async () => {
    setLoading(true);
    try {
      const [pickRes, balRes] = await Promise.all([
        farmerPickupAPI.getPickups(),
        farmerPickupAPI.getBalance(),
      ]);
      const data = pickRes.data;
      const all = data.pickups || [...(data.live || []), ...(data.upcoming || []), ...(data.past || [])];
      setPickups(all);
      setBalanceData(balRes.data || { totalBalance: 0, totalEarnings: 0, balances: [] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load pickups");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchPickups(); }, [fetchPickups]);

  const openDetail = async (pickup) => {
    setSelectedPickup(pickup);
    setPickupDetail(null);
    setView("detail");
    setDetailLoading(true);
    try {
      const { data } = await farmerPickupAPI.getPickupDetail(pickup._id);
      setPickupDetail(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load pickup details");
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = pickups.filter((s) => {
    if (tab === "upcoming") return ["SCHEDULED", "IN_PROGRESS", "POSTPONED"].includes(s.status);
    if (tab === "past") return ["COMPLETED", "CANCELLED"].includes(s.status);
    return true;
  });

  const totalEarnings = balanceData.totalEarnings ||
    (balanceData.balances || []).reduce((sum, b) => sum + (b.totalEarnings || 0), 0);

  const payChip = (status) => {
    const cfg = {
      PAID: { cls: isDark ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700", icon: "ph:check-circle-fill" },
      PARTIAL: { cls: isDark ? "bg-blue-500/15 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700", icon: "ph:minus-circle-fill" },
      PENDING: { cls: isDark ? "bg-amber-500/15 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700", icon: "ph:clock-fill" },
    };
    const c = cfg[status] || cfg.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wide ${c.cls}`}>
        <Icon icon={c.icon} className="w-3 h-3" />{status}
      </span>
    );
  };

  const detail = pickupDetail?.pickup;
  const receipts = pickupDetail?.receipts || [];
  const items = detail?.items || selectedPickup?.items || [];
  const postponeHistory = detail?.postponeHistory || selectedPickup?.postponeHistory || [];

  return (
    <div className={`min-h-screen p-5 sm:p-7 overflow-x-hidden ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                My Pickups
              </h1>
              <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {pickups.filter((s) => ["SCHEDULED", "IN_PROGRESS"].includes(s.status)).length} upcoming &middot; {pickups.length} total
              </p>
            </div>

            {/* Compact Balance & Earnings Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              {[
                { label: "Pending Balance Due", value: fmtCur(balanceData.totalBalance || 0), sub: "Awaiting payment from collectives", icon: "ph:wallet-bold", color: "text-amber-400", bg: "bg-amber-500/10" },
                { label: "Total Lifetime Earnings", value: fmtCur(totalEarnings), sub: "Settled across all pickups", icon: "ph:currency-inr-bold", color: "text-emerald-400", bg: "bg-emerald-500/10" },
              ].map((c) => (
                <div key={c.label} className={`p-4 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800/60 shadow-md" : "bg-white border-slate-200 shadow-sm"}`}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={`w-7 h-7 rounded-lg ${c.bg} ${c.color} flex items-center justify-center`}>
                      <Icon icon={c.icon} className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>{c.label}</span>
                  </div>
                  <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Tabs: Default to "All Pickups" */}
            <div className={`flex gap-1 p-1.5 rounded-xl mb-6 w-fit ${isDark ? "bg-slate-900/60 border border-slate-800" : "bg-white border border-slate-200 shadow-sm"}`}>
              {[
                { id: "all", label: "All Pickups" },
                { id: "upcoming", label: "Upcoming" },
                { id: "past", label: "Past Pickups" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                icon="ph:truck-fill"
                title="No pickups found"
                description={tab === "upcoming" ? "No upcoming pickups scheduled." : "No pickups match this filter."}
              />
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((s, i) => (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => openDetail(s)}
                    className={`group relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isDark
                        ? "bg-slate-900/40 border-slate-800/60 shadow-lg hover:border-emerald-500/40 hover:bg-slate-800/60"
                        : "bg-white border-slate-200 shadow-sm hover:border-emerald-300 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      {/* Heading: Schedule Code */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wide">
                            {s.code || "SCHEDULE"}
                          </p>
                          <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors mt-0.5">
                            {s.collective?.name || "Collective Scheduled"}
                          </h3>
                        </div>
                        <StatusBadge status={s.status?.toLowerCase()} size="sm" />
                      </div>

                      {/* Pickup Info */}
                      <div className={`p-3 rounded-xl mb-3 space-y-2 text-xs ${isDark ? "bg-slate-800/40 border border-slate-800" : "bg-slate-50 border border-slate-100"}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Icon icon="ph:calendar-blank-bold" className="w-3.5 h-3.5 text-emerald-400" /> Date & Time
                          </span>
                          <span className="font-semibold text-white">{fmt(s.pickupDate)} ({s.time || "09:00"})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Icon icon="ph:phone-fill" className="w-3.5 h-3.5 text-blue-400" /> Driver Phone
                          </span>
                          <span className="font-mono font-semibold text-white">{s.driver?.phone || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Icon icon="ph:user-bold" className="w-3.5 h-3.5 text-slate-400" /> Driver Name
                          </span>
                          <span className="font-semibold text-white">{s.driver?.name || "—"}</span>
                        </div>
                      </div>

                      {/* Quantity & Payout summary */}
                      <div className="flex justify-between items-center mb-3 text-xs">
                        <span className="text-slate-400">Total Value:</span>
                        <span className="font-bold text-sm text-emerald-400">{fmtCur(s.totalAmount)}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      {payChip(s.paymentStatus || "PENDING")}
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        View Details <Icon icon="ph:arrow-right-bold" className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* ── Slim Pickup Details View ───────────────────────────────── */
          <motion.div key="detail" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 30, opacity: 0 }} className="max-w-2xl mx-auto">
            <button
              onClick={() => { setView("list"); setPickupDetail(null); }}
              className={`mb-5 flex items-center gap-2 text-xs font-semibold cursor-pointer transition-colors ${isDark ? "text-slate-400 hover:text-emerald-400" : "text-slate-500 hover:text-emerald-600"}`}
            >
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" /> Back to Pickups
            </button>

            {detailLoading ? (
              <div className="flex items-center justify-center h-64">
                <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-10 h-10 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header card */}
                <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800/60 shadow-xl" : "bg-white border-slate-200 shadow-md"}`}>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <p className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">
                        {detail?.code || selectedPickup?.code || "SCHEDULE"}
                      </p>
                      <h2 className="text-xl font-bold text-white">{detail?.collective?.name || "Collective Scheduled"}</h2>
                    </div>
                    <StatusBadge status={(detail?.status || selectedPickup?.status || "").toLowerCase()} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <p className="text-slate-400 mb-0.5">Pickup Date & Time</p>
                      <p className="font-bold text-sm text-white">{fmt(detail?.pickupDate || selectedPickup?.pickupDate)}</p>
                      <p className="text-slate-400">{detail?.time || selectedPickup?.time || "09:00"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <p className="text-slate-400 mb-0.5">Assigned Driver</p>
                      <p className="font-bold text-sm text-white">{detail?.driver?.name || selectedPickup?.driver?.name || "—"}</p>
                      <p className="font-mono text-emerald-400">{detail?.driver?.phone || selectedPickup?.driver?.phone || "—"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800">
                      <p className="text-[11px] text-slate-400">Total Qty</p>
                      <p className="font-bold text-sm text-white">{(detail?.totalQuantity || selectedPickup?.totalQuantity || 0)} kg</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800">
                      <p className="text-[11px] text-slate-400">Total Payout</p>
                      <p className="font-bold text-sm text-emerald-400">{fmtCur(detail?.totalAmount || selectedPickup?.totalAmount)}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center justify-center">
                      {payChip(detail?.paymentStatus || selectedPickup?.paymentStatus || "PENDING")}
                    </div>
                  </div>
                </div>

                {/* Crop items */}
                <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  <h3 className="text-sm font-bold mb-4 text-white flex items-center gap-2">
                    <Icon icon="ph:plant-fill" className="text-emerald-400 w-4 h-4" />
                    Crops Collected ({items.length})
                  </h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item._id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-sm text-white">{item.cropName || "Crop"}</p>
                          {payChip(item.paymentStatus || "PENDING")}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-900/50 rounded-lg">
                          <div>
                            <p className="text-slate-400">Collected</p>
                            <p className="font-bold text-white">{item.collectedQuantity || 0} kg</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Agreed Rate</p>
                            <p className="font-bold text-white">₹{item.agreedPrice || 0}/kg</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Amount</p>
                            <p className="font-bold text-emerald-400">{fmtCur(item.totalAmount)}</p>
                          </div>
                        </div>

                        {item.paymentStatus === "PAID" && item.paymentProof && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-end">
                            <button
                              onClick={() => setActiveReceiptUrl(item.paymentProof)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer"
                            >
                              <Icon icon="ph:receipt-bold" className="w-3.5 h-3.5" /> View Receipt
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Receipts list */}
                {receipts.length > 0 && (
                  <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <h3 className="text-sm font-bold mb-3 text-white flex items-center gap-2">
                      <Icon icon="ph:receipt-fill" className="text-blue-400 w-4 h-4" />
                      Payment Receipts
                    </h3>
                    <div className="space-y-3">
                      {receipts.map((r) => (
                        <div key={r._id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm text-emerald-400">{fmtCur(r.amount)}</p>
                            <p className="text-slate-400 mt-0.5">{fmt(r.paymentDate)} · {r.method || "OTHER"}</p>
                            {r.utrNumber && <p className="text-slate-500 font-mono mt-0.5">UTR: {r.utrNumber}</p>}
                          </div>
                          {r.paymentProof && (
                            <button
                              onClick={() => setActiveReceiptUrl(r.paymentProof)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer"
                            >
                              <Icon icon="ph:eye-bold" className="w-3.5 h-3.5" /> View Receipt
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Postpone history */}
                {postponeHistory.length > 0 && (
                  <div className={`rounded-2xl border p-4 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-amber-400 flex items-center gap-1.5">
                      <Icon icon="ph:clock-clockwise-fill" className="w-4 h-4" /> Postpone History
                    </h3>
                    <div className="space-y-2 text-xs">
                      {postponeHistory.map((ph, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-300">
                          Moved from <strong>{fmt(ph.from)}</strong> to <strong>{fmt(ph.to)}</strong>
                          {ph.reason ? ` — "${ph.reason}"` : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Viewer Modal */}
      <ReceiptModal
        receiptUrl={activeReceiptUrl}
        onClose={() => setActiveReceiptUrl(null)}
      />
    </div>
  );
};

export default FarmerSchedules;
