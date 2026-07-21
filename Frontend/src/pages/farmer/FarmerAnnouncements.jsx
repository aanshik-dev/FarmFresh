import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import EmptyState from "../../components/common/EmptyState";
import { farmerAnnouncementAPI } from "../../services/api";

const FarmerAnnouncements = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await farmerAnnouncementAPI.get();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const markRead = async (id) => {
    try {
      await farmerAnnouncementAPI.markRead(id);
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === id ? { ...a, readBy: [...a.readBy, "me"] } : a))
      );
    } catch (err) {
      // fail silently or show error
    }
  };

  const filtered = announcements.filter((a) => {
    if (tab === "unread") return !a.readBy || a.readBy.length === 0;
    return true;
  });

  return (
    <div className={`min-h-screen p-5 sm:p-7 overflow-x-hidden ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            Announcements
          </h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Updates and news from your connected collectives
          </p>
        </div>
      </div>

      <div className={`flex gap-2 p-1.5 rounded-xl mb-8 w-fit backdrop-blur-md ${isDark ? "bg-slate-900/60 border border-slate-800" : "bg-white border border-slate-200 shadow-sm"}`}>
        {[
          { id: "all", label: "All Announcements" },
          { id: "unread", label: "Unread" },
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
          icon="ph:megaphone-fill"
          title="No announcements found"
          description={tab === "unread" ? "You have read all announcements." : "No announcements from your collectives yet."}
          size="lg"
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((a, i) => {
            const isRead = a.readBy && a.readBy.length > 0;
            return (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !isRead && markRead(a._id)}
                className={`group relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 ${
                  !isRead
                    ? isDark ? "bg-slate-900/80 border-emerald-500/30 shadow-lg shadow-emerald-500/10 cursor-pointer" : "bg-white border-emerald-300 shadow-lg shadow-emerald-500/10 cursor-pointer"
                    : isDark ? "bg-slate-900/40 border-slate-800/60" : "bg-white/80 border-slate-200"
                }`}
              >
                {!isRead && (
                  <div className="absolute top-6 right-6 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}

                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    isDark ? "bg-violet-500/20 text-violet-400" : "bg-violet-50 text-violet-600"
                  }`}>
                    <Icon icon="ph:megaphone-fill" className="w-6 h-6" />
                  </div>
                  <div className="flex-1 pr-6">
                    <h3 className="font-bold text-lg leading-tight">{a.title}</h3>
                    <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <Icon icon="ph:buildings-fill" className="w-3.5 h-3.5" />
                      {a.collective?.name || "Collective"}
                      <span className="opacity-50 mx-1">•</span>
                      <Icon icon="ph:calendar-blank-fill" className="w-3.5 h-3.5" />
                      {new Date(a.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"} mb-4`}>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {a.body}
                  </p>
                </div>
                
                {a.targetCrops && a.targetCrops.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Target Crops:</span>
                    {a.targetCrops.map(c => (
                      <span key={c._id || c} className={`px-2 py-1 rounded-lg text-xs font-medium ${isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                        {c.name || "Crop"}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FarmerAnnouncements;
