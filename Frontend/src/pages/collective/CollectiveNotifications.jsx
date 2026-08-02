import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import EmptyState from "../../components/common/EmptyState";
import { collectiveNotifAPI } from "../../services/api";

const getNotifIcon = (type) => {
  switch (type) {
    case "REQUEST":       return "ph:handshake-fill";
    case "STATUS_UPDATE": return "ph:plant-fill";
    case "PICKUP":        return "ph:truck-fill";
    case "PAYMENT":       return "ph:currency-inr-fill";
    default:              return "ph:bell-fill";
  }
};

const getNotifColor = (type) => {
  switch (type) {
    case "REQUEST":       return "text-emerald-400 bg-emerald-500/10";
    case "STATUS_UPDATE": return "text-amber-400 bg-amber-500/10";
    case "PICKUP":        return "text-blue-400 bg-blue-500/10";
    case "PAYMENT":       return "text-emerald-400 bg-emerald-500/10";
    default:              return "text-slate-400 bg-slate-500/10";
  }
};

const timeAgo = (date) => {
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / 2592000)} months ago`;
};

const CollectiveNotifications = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await collectiveNotifAPI.get();
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
      await collectiveNotifAPI.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All marked as read");
      syncBadges();
    } catch { toast.error("Failed"); }
  };

  const markRead = async (id, currentStatus) => {
    if (currentStatus) return;
    try {
      await collectiveNotifAPI.markRead(id);
      setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      syncBadges();
    } catch { /* silent */ }
  };

  const deleteNotif = async (e, id) => {
    e.stopPropagation();
    const notif = notifs.find((n) => n._id === id);
    if (notif && !notif.isRead) await markRead(id, false);
    setDeletingId(id);
    try {
      await collectiveNotifAPI.delete(id);
      setNotifs((prev) => prev.filter((n) => n._id !== id));
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
            {unread > 0 ? `${unread} unread` : "All caught up!"}
          </p>
        </div>
        {unread > 0 && (
          <button
            id="btn-mark-all-read"
            onClick={markAllRead}
            className="text-sm px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors font-medium flex items-center gap-2 cursor-pointer"
          >
            <Icon icon="ph:check-all-bold" className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-10 h-10 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
        </div>
      ) : notifs.length === 0 ? (
        <EmptyState
          icon="ph:bell-slash-fill"
          title="No notifications"
          description="Alerts from your connected farmer groups will appear here."
          size="lg"
        />
      ) : (
        <div className="max-w-3xl space-y-3">
          <AnimatePresence>
            {notifs.map((n, i) => {
              const isStatusUpdate = n.type === "STATUS_UPDATE";
              const cropName = n.data?.cropName;

              return (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  onClick={() => markRead(n._id, n.isRead)}
                  className={`relative flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300 group ${
                    !n.isRead
                      ? isDark
                        ? "bg-slate-900/80 border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                        : "bg-white border-emerald-300 shadow-lg shadow-emerald-500/5"
                      : isDark
                      ? "bg-slate-900/40 border-slate-800/60"
                      : "bg-white/60 border-slate-200"
                  }`}
                >
                  {/* Unread dot */}
                  {!n.isRead && (
                    <div className="absolute top-5 right-10 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  )}

                  {/* Delete on hover */}
                  <button
                    id={`btn-delete-notif-${n._id}`}
                    onClick={(e) => deleteNotif(e, n._id)}
                    disabled={deletingId === n._id}
                    className={`absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100 ${
                      isDark
                        ? "bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400"
                        : "bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500"
                    }`}
                  >
                    {deletingId === n._id ? (
                      <Icon icon="svg-spinners:ring-resize" className="w-3.5 h-3.5" />
                    ) : (
                      <Icon icon="ph:x-bold" className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getNotifColor(n.type)}`}>
                    <Icon icon={getNotifIcon(n.type)} className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <p className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{n.title}</p>
                    <p className={`text-sm mt-1 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{n.body}</p>

                    {/* Status update CTA */}
                    {isStatusUpdate && cropName && (
                      <div className={`mt-3 p-3 rounded-xl border flex items-center justify-between gap-3 ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                        <div className="flex items-center gap-2">
                          <Icon icon="ph:plant-fill" className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold text-amber-400">{cropName}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead(n._id, n.isRead);
                            navigate("/dashboard/collective/crops");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Icon icon="ph:eye-bold" className="w-3.5 h-3.5" />
                          View Crop
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

export default CollectiveNotifications;
