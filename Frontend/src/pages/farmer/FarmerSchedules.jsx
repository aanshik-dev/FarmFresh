import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { farmerPickupAPI } from "../../services/api";

const fmt = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const FarmerSchedules = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming"); // upcoming | past | all

  // Navigation State
  const [view, setView] = useState("list"); // "list" | "detail"
  const [selectedPickup, setSelectedPickup] = useState(null);

  const fetchPickups = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await farmerPickupAPI.getPickups();
      setPickups(data.pickups || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load pickups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPickups();
  }, [fetchPickups]);

  const openDetail = (pickup) => {
    setSelectedPickup(pickup);
    setView("detail");
  };

  const filtered = pickups.filter((s) => {
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

  const detailVariants = {
    initial: { x: 50, opacity: 0 },
    enter: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { x: 50, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }
  };

  return (
    <div className={`min-h-screen p-5 sm:p-7 overflow-x-hidden ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" variants={listVariants} initial="initial" animate="enter" exit="exit">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                  My Pickups
                </h1>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {pickups.filter((s) => s.status === "SCHEDULED").length} upcoming · {pickups.length} total
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className={`flex gap-2 p-1.5 rounded-xl mb-8 w-fit backdrop-blur-md ${isDark ? "bg-slate-900/60 border border-slate-800" : "bg-white border border-slate-200 shadow-sm"}`}>
              {[
                { id: "upcoming", label: "Upcoming" },
                { id: "past", label: "Past Pickups" },
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
                icon="ph:truck-fill" 
                title="No pickups found" 
                description={tab === "upcoming" ? "No upcoming pickups scheduled by the collective." : "No pickups match this filter."} 
              />
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((s, i) => (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => openDetail(s)}
                    className={`group relative overflow-hidden rounded-2xl border p-5 cursor-pointer backdrop-blur-xl transition-all duration-300 ${isDark ? "bg-slate-900/40 border-slate-800/60 shadow-xl shadow-black/20 hover:border-emerald-500/40 hover:bg-slate-800/80" : "bg-white/80 border-slate-200 shadow-lg shadow-slate-200/50 hover:border-emerald-300 hover:bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                            <Icon icon="ph:map-pin-fill" className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-lg">
                            {s.schedule?.zone?.name || "Zone —"}
                          </h3>
                        </div>
                        <StatusBadge status={s.schedule?.status?.toLowerCase() || s.status?.toLowerCase()} />
                      </div>
                      <div className={`shrink-0 text-right px-4 py-3 rounded-xl border ${isDark ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                        <p className="font-bold text-lg text-emerald-500">
                          {fmt(s.schedule?.pickupDate || s.pickupDate)}
                        </p>
                        <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {s.schedule?.time || s.time || "09:00"}
                        </p>
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl mb-4 ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                      <div className="flex items-center gap-2">
                        <Icon icon="ph:truck-fill" className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                        <div className="truncate">
                          <p className="text-xs text-slate-500">Driver</p>
                          <p className="text-sm font-semibold truncate">{s.schedule?.driver?.name || s.driver?.name || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="ph:scales-fill" className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                        <div>
                          <p className="text-xs text-slate-500">Collection</p>
                          <p className="text-sm font-semibold">{s.collectedQuantity || 0} kg</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Amount Expected:</span>
                      <span className="text-sm font-bold text-emerald-500">₹{(s.totalAmount || 0).toLocaleString("en-IN")}</span>
                    </div>

                    <div className={`mt-4 pt-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider border-t ${isDark ? "border-slate-800 text-emerald-400" : "border-slate-100 text-emerald-600"}`}>
                      View Details
                      <Icon icon="ph:arrow-right-bold" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="detail" variants={detailVariants} initial="initial" animate="enter" exit="exit" className="max-w-3xl mx-auto">
            <button 
              onClick={() => {
                setView("list");
                setSelectedPickup(null);
              }}
              className={`mb-6 flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors ${
                isDark ? "text-slate-400 hover:text-emerald-400" : "text-slate-500 hover:text-emerald-600"
              }`}
            >
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
              Back to Pickups
            </button>

            {selectedPickup && (
              <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl ${
                isDark ? "bg-slate-900/50 border-slate-800/60 shadow-2xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50"
              }`}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">
                    Pickup Details
                  </h2>
                  <StatusBadge status={selectedPickup.schedule?.status?.toLowerCase() || selectedPickup.status?.toLowerCase()} />
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                        <Icon icon="ph:calendar-blank-fill" className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`text-xs uppercase tracking-wider font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Schedule</p>
                        <p className="font-bold">{fmt(selectedPickup.schedule?.pickupDate || selectedPickup.pickupDate)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Time:</span>
                        <span className="text-sm font-semibold">{selectedPickup.schedule?.time || selectedPickup.time || "09:00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Zone:</span>
                        <span className="text-sm font-semibold">{selectedPickup.schedule?.zone?.name || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
                        <Icon icon="ph:truck-fill" className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`text-xs uppercase tracking-wider font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Driver</p>
                        <p className="font-bold">{selectedPickup.schedule?.driver?.name || selectedPickup.driver?.name || "—"}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Vehicle:</span>
                        <span className="text-sm font-semibold">{selectedPickup.schedule?.driver?.vehicleNumber || selectedPickup.driver?.vehicleNumber || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Phone:</span>
                        <span className="text-sm font-semibold">{selectedPickup.schedule?.driver?.phone || selectedPickup.driver?.phone || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Crop Information</h3>
                
                <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/50 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-dashed border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                        <Icon icon="ph:plant-fill" className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{selectedPickup.cropDeal?.crop?.name || "Crop"}</p>
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Code: {selectedPickup.cropDeal?.crop?.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Payment Status</p>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold tracking-wide uppercase ${
                        selectedPickup.paymentStatus === "PAID"
                          ? isDark ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : isDark ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "bg-amber-50 text-amber-600 border border-amber-200"
                      }`}>
                        {selectedPickup.paymentStatus}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Collection Qty</p>
                      <p className="text-lg font-bold">{selectedPickup.collectedQuantity || 0} kg</p>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Rate</p>
                      <p className="text-lg font-bold">₹{selectedPickup.agreedPrice || 0}/kg</p>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Total Amount</p>
                      <p className="text-lg font-bold text-emerald-500">₹{(selectedPickup.totalAmount || 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                  
                  {selectedPickup.paymentStatus === "PAID" && selectedPickup.paymentProof && (
                    <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700 flex justify-center">
                      <a href={selectedPickup.paymentProof} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors">
                        <Icon icon="ph:file-pdf-fill" className="w-5 h-5" />
                        View Payment Receipt
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FarmerSchedules;
