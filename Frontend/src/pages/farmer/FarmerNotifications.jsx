import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import EmptyState from "../../components/common/EmptyState";
import { farmerNotifAPI } from "../../services/api";

const getNotifIcon = (type) => {
  switch (type) {
    case "ANNOUNCEMENT":       return "ph:megaphone-fill";
    case "REQUEST":            return "ph:handshake-fill";
    case "REQUEST_APPROVAL":   return "ph:check-circle-fill";
    case "REQUEST_REJECTION":  return "ph:x-circle-fill";
    case "STATUS_UPDATE":      return "ph:plant-fill";
    case "PICKUP":             return "ph:truck-fill";
    case "PAYMENT":            return "ph:currency-inr-fill";
    default:                   return "ph:bell-fill";
  }
};

const getNotifColor = (type) => {
  switch (type) {
    case "ANNOUNCEMENT":        return "text-violet-400 bg-violet-500/10 border-violet-500/20";
    case "REQUEST":             return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "REQUEST_APPROVAL":    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "REQUEST_REJECTION":   return "text-red-400 bg-red-500/10 border-red-500/20";
    case "STATUS_UPDATE":       return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "PICKUP":              return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "PAYMENT":             return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    default:                    return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  }
};

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 2592000)}m ago`;
};

const FarmerNotifications = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await farmerNotifAPI.get();
      setNotifs(data.notifications || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const syncBadges = () =>
    window.dispatchEvent(new Event("farmfresh:badges-sync"));

  const markAllRead = async () => {
    try {
      await farmerNotifAPI.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All marked as read");
      syncBadges();
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const markRead = async (id, currentStatus) => {
    if (currentStatus) return;
    try {
      await farmerNotifAPI.markRead(id);
      setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      syncBadges();
    } catch { /* silent */ }
  };

  const deleteNotif = async (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await farmerNotifAPI.delete(id);
      setNotifs((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove notification");
    } finally {
      setDeletingId(null);
    }
  };

  const unread = notifs.filter((n) => !n.isRead).length;

  return (
    <div className={`min-h-screen p-5 sm:p-7 transition-colors duration-200 ${isDark ? "bg-slate-950 text-white" : "bg-gradient-to-br from-slate-50 via-emerald-50/20 to-amber-50/20 text-slate-900"}`}>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {unread > 0 ? `${unread} unread notifications` : "You're all caught up!"}
          </p>
        </div>
        {unread > 0 && (
          <button
            id="btn-mark-all-read"
            onClick={markAllRead}
            className="text-sm px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-medium flex items-center gap-2 cursor-pointer"
          >
            <Icon icon="ph:check-all-bold" className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-10 h-10 text-emerald-400" />
        </div>
      ) : notifs.length === 0 ? (
        <EmptyState
          icon="ph:bell-slash-fill"
          title="No notifications"
          description="Updates from your connected collectives will appear here."
          size="lg"
        />
      ) : (
        <div className="max-w-3xl space-y-3">
          <AnimatePresence>
            {notifs.map((n, i) => {
              const isStatusReq = n.type === "STATUS_UPDATE";
              const isPickup = n.type === "PICKUP";
              const isPayment = n.type === "PAYMENT";
              const isApproval = n.type === "REQUEST_APPROVAL" || (n.title && n.title.includes("Approved"));
              const isRejection = n.type === "REQUEST_REJECTION" || (n.title && n.title.includes("Rejected"));

              return (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  onClick={() => markRead(n._id, n.isRead)}
                  className={`relative flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300 group ${
                    !n.isRead
                      ? isDark
                        ? "bg-slate-900/80 border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                        : "bg-white border-emerald-300 shadow-lg shadow-emerald-500/5"
                      : isDark
                      ? "bg-slate-900/40 border-slate-800/60 hover:border-slate-700"
                      : "bg-white/60 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Unread Indicator */}
                  {!n.isRead && (
                    <div className="absolute top-5 right-12 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  )}

                  {/* Delete Cross Icon — Always visible for read notifications, hover-visible for unread */}
                  <button
                    id={`btn-delete-notif-${n._id}`}
                    onClick={(e) => deleteNotif(e, n._id)}
                    disabled={deletingId === n._id}
                    title="Delete notification"
                    className={`absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      n.isRead ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    } ${
                      isDark
                        ? "bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                        : "bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600"
                    }`}
                  >
                    {deletingId === n._id ? (
                      <Icon icon="svg-spinners:ring-resize" className="w-3.5 h-3.5" />
                    ) : (
                      <Icon icon="ph:x-bold" className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Notification Type Icon */}
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${getNotifColor(n.type)}`}>
                    <Icon icon={getNotifIcon(n.type)} className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{n.title}</p>
                    </div>
                    <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{n.body}</p>

                    {/* Custom Card Layout: Status Query */}
                    {isStatusReq && (
                      <div className={`mt-3 p-3 rounded-xl border flex items-center justify-between gap-3 ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon icon="ph:plant-fill" className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-xs font-bold text-amber-400 truncate">
                            Update requested by collective
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead(n._id, n.isRead);
                            navigate("/dashboard/farmer/crops");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-md"
                        >
                          <Icon icon="ph:pencil-simple-bold" className="w-3.5 h-3.5" />
                          Update Status
                        </button>
                      </div>
                    )}

                    {/* Custom Card Layout: Pickup Schedule */}
                    {isPickup && (
                      <div className={`mt-3 p-3 rounded-xl border flex items-center justify-between gap-3 ${isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200"}`}>
                        <div className="flex items-center gap-2">
                          <Icon icon="ph:truck-fill" className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-bold text-blue-400 font-mono">
                            {n.data?.scheduleCode || "Pickup Scheduled"}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead(n._id, n.isRead);
                            navigate("/dashboard/farmer/schedules");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-400 transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-md"
                        >
                          View Schedule
                        </button>
                      </div>
                    )}

                    {/* Custom Card Layout: Payment */}
                    {isPayment && (
                      <div className={`mt-3 p-3 rounded-xl border flex items-center justify-between gap-3 ${isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"}`}>
                        <div className="flex items-center gap-2">
                          <Icon icon="ph:currency-inr-fill" className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-400">
                            {n.data?.amount ? `₹${Number(n.data.amount).toLocaleString("en-IN")} Payout Settled` : "Payment Settled"}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead(n._id, n.isRead);
                            navigate("/dashboard/farmer/schedules");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-400 transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-md"
                        >
                          View Receipt
                        </button>
                      </div>
                    )}

                    {/* Custom Card Layout: Request Approval / Rejection */}
                    {(isApproval || isRejection) && (
                      <div className={`mt-3 p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isApproval
                          ? isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                          : isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"
                      }`}>
                        <div className="flex items-center gap-2">
                          <Icon icon={isApproval ? "ph:check-circle-fill" : "ph:x-circle-fill"} className={`w-4 h-4 ${isApproval ? "text-emerald-400" : "text-red-400"}`} />
                          <span className={`text-xs font-bold ${isApproval ? "text-emerald-400" : "text-red-400"}`}>
                            {isApproval ? "Membership Approved" : "Request Declined"}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead(n._id, n.isRead);
                            navigate("/dashboard/farmer/collectives");
                          }}
                          className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-md ${
                            isApproval ? "bg-emerald-500 hover:bg-emerald-400" : "bg-red-500 hover:bg-red-400"
                          }`}
                        >
                          View Collectives
                        </button>
                      </div>
                    )}

                    <p className={`text-xs mt-3 flex items-center gap-1.5 font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      <Icon icon="ph:clock-fill" className="w-3.5 h-3.5" />
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default FarmerNotifications;
