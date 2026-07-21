import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { collectiveScheduleAPI } from "../../services/api";

const fmt = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const FarmerDetailPanel = ({ schedule, farmerItem, onPaymentMarked, isDark }) => {
  const { toast } = useToast();
  const [paying, setPaying] = useState(false);
  const [proofUrl, setProofUrl] = useState("");

  if (!farmerItem) return null;

  // All items for this farmer in this schedule
  const farmerItems = schedule.items?.filter(
    (it) => it.farmerGroup?._id === farmerItem.farmerGroup?._id
  ) || [];
  const totalDue = farmerItems.reduce((s, it) => s + it.totalAmount, 0);
  const allPaid = farmerItems.every((it) => it.paymentStatus === "PAID");

  const handleMarkPaid = async (item) => {
    if (!proofUrl.trim()) { toast.error("Please provide payment proof URL"); return; }
    setPaying(true);
    try {
      await collectiveScheduleAPI.markItemPaid(schedule._id, item._id, { paymentProof: proofUrl });
      toast.success("Payment recorded!");
      onPaymentMarked();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Farmer info */}
      <div className={`flex items-center gap-4 p-5 rounded-2xl border ${isDark ? "bg-slate-900/50 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${isDark ? "bg-slate-800 text-emerald-400" : "bg-emerald-50 text-emerald-600 shadow-inner"}`}>
          {farmerItem.farmerGroup?.name?.charAt(0) || "F"}
        </div>
        <div>
          <p className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
            {farmerItem.farmerGroup?.name}
          </p>
          <div className={`flex items-center gap-2 mt-1 text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <Icon icon="ph:phone-fill" className="w-3.5 h-3.5" />
            {farmerItem.farmerGroup?.phone}
            <span className="opacity-50">|</span>
            <Icon icon="ph:user-fill" className="w-3.5 h-3.5" />
            {farmerItem.farmerGroup?.leadFarmer}
          </div>
        </div>
      </div>

      {/* Crop breakdown */}
      <div>
        <p className={`text-sm font-semibold mb-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
          Collected Crops
        </p>
        <div className="space-y-4">
          {farmerItems.map((item) => (
            <div
              key={item._id}
              className={`p-5 rounded-xl border ${
                isDark ? "bg-slate-900/40 border-slate-700/60" : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-slate-800 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                    <Icon icon="ph:plant-fill" className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-bold text-base ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      {item.cropDeal?.crop?.name || "Crop"}
                    </p>
                    <p className={`text-xs font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      Code: {item.cropDeal?.crop?.code}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide uppercase ${
                  item.paymentStatus === "PAID"
                    ? isDark ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : isDark ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "bg-amber-50 text-amber-600 border border-amber-200"
                }`}>
                  {item.paymentStatus}
                </span>
              </div>
              
              <div className={`grid grid-cols-3 gap-3 text-center p-3 rounded-xl ${isDark ? "bg-slate-950/50" : "bg-slate-50"}`}>
                <div>
                  <p className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Collected</p>
                  <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{item.collectedQuantity} kg</p>
                </div>
                <div>
                  <p className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Rate</p>
                  <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>₹{item.agreedPrice}/kg</p>
                </div>
                <div>
                  <p className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Amount</p>
                  <p className={`font-bold text-sm text-emerald-500`}>₹{item.totalAmount.toLocaleString("en-IN")}</p>
                </div>
              </div>
              
              {item.paymentStatus === "PAID" && item.paymentProof && (
                <a href={item.paymentProof} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors">
                  <Icon icon="ph:file-pdf-fill" className="w-4 h-4" />
                  View Payment Receipt
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className={`flex items-center justify-between p-5 rounded-2xl ${
        isDark ? "bg-emerald-500/10 border border-emerald-500/25" : "bg-emerald-50 border border-emerald-200 shadow-sm"
      }`}>
        <p className={`font-bold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>Total Balance</p>
        <p className={`text-2xl font-black ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>₹{totalDue.toLocaleString("en-IN")}</p>
      </div>

      {/* Mark as paid (if not all paid) */}
      {!allPaid && (
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/50 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}>
          <p className={`text-sm font-bold mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Attach Payment Proof & Mark Paid
          </p>
          <div className="relative mb-4">
            <Icon icon="ph:link-bold" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
            <input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="Paste payment receipt URL or screenshot link..."
              className={`w-full pl-10 rounded-xl border px-3 py-3 text-sm outline-none transition-all ${
                isDark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
              }`}
            />
          </div>
          {farmerItems
            .filter((it) => it.paymentStatus !== "PAID")
            .map((item) => (
              <button
                key={item._id}
                onClick={() => handleMarkPaid(item)}
                disabled={paying}
                className="w-full py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer flex items-center justify-center gap-2 mb-3 last:mb-0 hover:from-emerald-400 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-60 disabled:hover:translate-y-0 hover:-translate-y-0.5"
              >
                {paying ? <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-5 h-5" /> : <Icon icon="ph:check-circle-bold" className="w-4 h-4" />}
                Mark "{item.cropDeal?.crop?.name}" as Paid
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

const CollectionHistory = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [detailMap, setDetailMap] = useState({}); // scheduleId → { schedule, items }
  const [detailLoading, setDetailLoading] = useState({});
  const [selectedFarmerItem, setSelectedFarmerItem] = useState(null);
  const [selectedScheduleForPanel, setSelectedScheduleForPanel] = useState(null);
  
  // Navigation State
  const [view, setView] = useState("list"); // "list" | "detail"

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await collectiveScheduleAPI.get({ filter: "all" });
      setSchedules(data.schedules || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

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

  const openFarmerDetail = (schedule, item) => {
    setSelectedScheduleForPanel({ ...schedule, items: detailMap[schedule._id]?.items || [] });
    setSelectedFarmerItem(item);
    setView("detail");
  };

  // Summarize items by farmer for a schedule
  const groupByFarmer = (items = []) => {
    const map = {};
    for (const item of items) {
      const fId = item.farmerGroup?._id;
      if (!fId) continue;
      if (!map[fId]) {
        map[fId] = { farmerGroup: item.farmerGroup, items: [], totalAmount: 0, allPaid: true };
      }
      map[fId].items.push(item);
      map[fId].totalAmount += item.totalAmount;
      if (item.paymentStatus !== "PAID") map[fId].allPaid = false;
    }
    return Object.values(map);
  };

  const completed = schedules.filter((s) => s.status === "COMPLETED");
  const totalKg = detailMap
    ? Object.values(detailMap).reduce((sum, d) => sum + (d.items || []).reduce((s, i) => s + i.collectedQuantity, 0), 0)
    : 0;
  const totalAmt = completed.reduce((s, sc) => s + (sc.totalAmount || 0), 0);

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
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                Collection History
              </h1>
              <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {completed.length} completed pickups
              </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {[
                { icon: "ph:check-circle-fill", label: "Completed Pickups", value: completed.length, gradient: "from-emerald-500/20 to-emerald-500/5", color: "text-emerald-500" },
                { icon: "ph:currency-inr-fill", label: "Total Paid Out", value: `₹${totalAmt.toLocaleString("en-IN")}`, gradient: "from-blue-500/20 to-blue-500/5", color: "text-blue-500" },
                { icon: "ph:calendar-check-fill", label: "Total Schedules", value: schedules.length, gradient: "from-amber-500/20 to-amber-500/5", color: "text-amber-500" },
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

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-10 h-10 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
              </div>
            ) : schedules.length === 0 ? (
              <EmptyState icon="ph:clock-counter-clockwise-fill" title="No pickups yet" description="Completed pickups will appear here." />
            ) : (
              <div className="space-y-5">
                {schedules.map((s, idx) => {
                  const isExpanded = expandedId === s._id;
                  const detail = detailMap[s._id];
                  const farmerGroups = groupByFarmer(detail?.items);

                  return (
                    <motion.div
                      key={s._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`rounded-2xl border overflow-hidden backdrop-blur-xl ${isDark ? "bg-slate-900/40 border-slate-800/60 shadow-xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-lg shadow-slate-200/50"}`}
                    >
                      {/* Pickup card header */}
                      <button
                        onClick={() => toggleExpand(s._id)}
                        className={`w-full flex items-center justify-between p-5 text-left transition-colors cursor-pointer ${isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isDark ? "bg-slate-800" : "bg-emerald-50"}`}>
                            <Icon icon="ph:truck-fill" className={`w-6 h-6 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-1">
                              <p className="font-bold text-lg">
                                Pickup · {fmt(s.pickupDate)}
                              </p>
                              <StatusBadge status={s.status?.toLowerCase()} size="sm" />
                            </div>
                            <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              Driver: {s.driver?.name || "—"} · Zone: {s.zone?.name || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-5 shrink-0">
                          <div className="text-right">
                            <p className={`font-bold text-xl text-emerald-500`}>₹{(s.totalAmount || 0).toLocaleString("en-IN")}</p>
                            <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Total</p>
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${isExpanded ? "rotate-180" : ""} ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                            <Icon icon="ph:caret-down-bold" className="w-4 h-4" />
                          </div>
                        </div>
                      </button>

                      {/* Expanded farmer list */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className={`border-t overflow-hidden ${isDark ? "border-slate-800/60" : "border-slate-200"}`}
                          >
                            <div className={`px-5 py-5 ${isDark ? "bg-slate-900/30" : "bg-slate-50/50"}`}>
                              {detailLoading[s._id] ? (
                                <div className="flex items-center gap-3 justify-center py-6">
                                  <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-6 h-6 text-emerald-500" />
                                  <span className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading farmer details...</span>
                                </div>
                              ) : farmerGroups.length === 0 ? (
                                <p className={`text-sm text-center py-6 font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>No farmer groups in this pickup.</p>
                              ) : (
                                <div className="space-y-3">
                                  <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                    Farmer Groups Collected ({farmerGroups.length})
                                  </p>
                                  {farmerGroups.map((fg) => (
                                    <button
                                      key={fg.farmerGroup?._id}
                                      onClick={() => openFarmerDetail(s, fg.items[0])}
                                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 shadow-sm hover:-translate-y-0.5 ${
                                        isDark ? "border-slate-700/60 hover:border-emerald-500/40 hover:bg-slate-800/80 hover:shadow-emerald-500/10" : "border-slate-200 hover:border-emerald-300 hover:bg-white hover:shadow-emerald-500/10 bg-white/50"
                                      }`}
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                                          {fg.farmerGroup?.name?.charAt(0) || "F"}
                                        </div>
                                        <div>
                                          <p className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{fg.farmerGroup?.name}</p>
                                          <p className={`text-xs font-medium flex items-center gap-1.5 mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                            <Icon icon="ph:plant-fill" className="w-3.5 h-3.5" />
                                            {fg.items.length} crop{fg.items.length !== 1 ? "s" : ""}
                                            <span className="opacity-50">|</span>
                                            {fg.allPaid ? (
                                              <span className="text-emerald-500 flex items-center gap-1"><Icon icon="ph:check-circle-fill" /> Paid</span>
                                            ) : (
                                              <span className="text-amber-500 flex items-center gap-1"><Icon icon="ph:clock-fill" /> Pending Payment</span>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="text-right">
                                          <p className={`text-base font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                                            ₹{fg.totalAmount.toLocaleString("en-IN")}
                                          </p>
                                        </div>
                                        <Icon icon="ph:caret-right-bold" className={`w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                                      </div>
                                    </button>
                                  ))}
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
        ) : (
          <motion.div key="form" variants={formVariants} initial="initial" animate="enter" exit="exit" className="max-w-3xl mx-auto">
            <button 
              onClick={() => {
                setView("list");
                setSelectedFarmerItem(null);
                setDetailMap({}); // Clear to refresh
                fetchSchedules(); // Refresh to reflect any payment updates
              }}
              className={`mb-6 flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors ${
                isDark ? "text-slate-400 hover:text-emerald-400" : "text-slate-500 hover:text-emerald-600"
              }`}
            >
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
              Back to Collection History
            </button>

            <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl ${
              isDark ? "bg-slate-900/50 border-slate-800/60 shadow-2xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50"
            }`}>
              <h2 className="text-2xl font-bold mb-2">
                Farmer Payment Details
              </h2>
              <p className={`text-sm mb-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Review collected crops and record payments for {selectedFarmerItem?.farmerGroup?.name}.
              </p>

              <FarmerDetailPanel
                schedule={selectedScheduleForPanel}
                farmerItem={selectedFarmerItem}
                onPaymentMarked={() => {}} // Refresh handled on back button
                isDark={isDark}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollectionHistory;
