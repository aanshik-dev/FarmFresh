import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { collectiveNotifications } from "../../utils/InterfaceData";
import EmptyState from "../../components/common/EmptyState";

const CollectiveNotifications = () => {
  const { isDark } = useTheme();
  const [notifs, setNotifs] = useState(collectiveNotifications);
  const unread = notifs.filter(n => !n.read).length;

  const TYPE_COLORS = {
    membership_request: "text-emerald-400 bg-emerald-500/10",
    status_response:    "text-blue-400 bg-blue-500/10",
    pickup_complete:    "text-teal-400 bg-teal-500/10",
    review:             "text-amber-400 bg-amber-500/10",
  };

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Notifications</h1>
          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{unread > 0 ? `${unread} unread` : "All caught up!"}</p>
        </div>
        {unread > 0 && <button onClick={() => setNotifs(p => p.map(n => ({ ...n, read: true })))} className="text-sm text-emerald-500 hover:text-emerald-400 cursor-pointer font-medium">Mark all as read</button>}
      </div>

      {notifs.length === 0 ? <EmptyState icon="ph:bell-slash-fill" title="No notifications" description="Notifications from your farmer groups will appear here." size="lg" /> : (
        <div className="max-w-2xl space-y-3">
          {notifs.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => setNotifs(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}
              className={`relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${!n.read ? isDark ? "bg-slate-900/80 border-emerald-800/30" : "bg-white border-emerald-200" : isDark ? "bg-slate-900/40 border-slate-800/60" : "bg-white/60 border-slate-200"}`}
            >
              {!n.read && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-400" />}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[n.type] || "text-slate-400 bg-slate-500/10"}`}>
                <Icon icon={n.icon} className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{n.title}</p>
                <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{n.message}</p>
                <p className={`text-xs mt-1.5 ${isDark ? "text-slate-600" : "text-slate-300"}`}>{n.time}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setNotifs(p => p.filter(x => x.id !== n.id)); }} className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg ${isDark ? "hover:bg-slate-800 text-slate-600 hover:text-slate-300" : "hover:bg-slate-100 text-slate-300 hover:text-slate-600"}`}>
                <Icon icon="material-symbols:close-rounded" className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectiveNotifications;
