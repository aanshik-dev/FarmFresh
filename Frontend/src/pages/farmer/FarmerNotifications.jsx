import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import EmptyState from "../../components/common/EmptyState";
import { farmerNotifAPI } from "../../services/api";

const getNotifIcon = (type) => {
  switch (type) {
    case "ANNOUNCEMENT": return "ph:megaphone-fill";
    case "REQUEST": return "ph:handshake-fill";
    case "STATUS_UPDATE": return "ph:plant-fill";
    case "PICKUP": return "ph:truck-fill";
    case "PAYMENT": return "ph:currency-inr-fill";
    default: return "ph:bell-fill";
  }
};

const getNotifColor = (type) => {
  switch (type) {
    case "ANNOUNCEMENT": return "text-violet-400 bg-violet-500/10";
    case "REQUEST": return "text-emerald-400 bg-emerald-500/10";
    case "STATUS_UPDATE": return "text-amber-400 bg-amber-500/10";
    case "PICKUP": return "text-blue-400 bg-blue-500/10";
    case "PAYMENT": return "text-emerald-400 bg-emerald-500/10";
    default: return "text-slate-400 bg-slate-500/10";
  }
};

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
};

const FarmerNotifications = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const markAllRead = async () => {
    try {
      await farmerNotifAPI.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const markRead = async (id, currentStatus) => {
    if (currentStatus) return; // Already read
    try {
      await farmerNotifAPI.markRead(id);
      setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      // Silently fail or toast
    }
  };

  const unread = notifs.filter((n) => !n.isRead).length;

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
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
            onClick={markAllRead}
            className="text-sm px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors font-medium flex items-center gap-2 cursor-pointer"
          >
            <Icon icon="ph:check-all-bold" className="w-4 h-4" />
            Mark all as read
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
          description="Updates from your connected collectives will appear here."
          size="lg"
        />
      ) : (
        <div className="max-w-3xl space-y-4">
          {notifs.map((n, i) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onClick={() => markRead(n._id, n.isRead)}
              className={`relative flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                !n.isRead
                  ? isDark
                    ? "bg-slate-900/80 border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                    : "bg-white border-emerald-300 shadow-lg shadow-emerald-500/5"
                  : isDark
                  ? "bg-slate-900/40 border-slate-800/60"
                  : "bg-white/60 border-slate-200"
              }`}
            >
              {!n.isRead && (
                <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              )}

              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${getNotifColor(n.type)}`}>
                <Icon icon={getNotifIcon(n.type)} className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <p className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{n.title}</p>
                <p className={`text-sm mt-1 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{n.body}</p>
                <p className={`text-xs mt-3 flex items-center gap-1.5 font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  <Icon icon="ph:clock-fill" className="w-3.5 h-3.5" />
                  {timeAgo(n.createdAt)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerNotifications;
