import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/common/StatusBadge";
import { useToast } from "../../components/ui";
import { farmerDashboardAPI, farmerCropAPI, farmerPickupAPI, farmerNotifAPI } from "../../services/api";

const StatCard = ({ label, value, icon, color = "emerald", onClick }) => {
  const { isDark } = useTheme();
  const colorMap = {
    emerald: { bg: "from-emerald-500 to-teal-600",  text: "text-emerald-400", glow: "shadow-emerald-500/20" },
    blue:    { bg: "from-blue-500 to-indigo-600",   text: "text-blue-400",    glow: "shadow-blue-500/20" },
    amber:   { bg: "from-amber-500 to-orange-600",  text: "text-amber-400",   glow: "shadow-amber-500/20" },
    violet:  { bg: "from-violet-500 to-purple-600", text: "text-violet-400",  glow: "shadow-violet-500/20" },
  };
  const c = colorMap[color] || colorMap.emerald;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`rounded-2xl border p-5 cursor-pointer transition-all ${isDark ? "bg-slate-900/60 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:shadow-md"}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${c.bg} shadow-lg ${c.glow}`}>
          <Icon icon={icon} className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className={`text-2xl font-extrabold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{value}</p>
      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
    </motion.div>
  );
};

const FarmerDashboard = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeCrops: 0,
    activeDeals: 0,
    outstandingBalance: 0,
    upcomingPickups: 0,
  });
  const [crops, setCrops] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, cropRes, pickRes, notifRes] = await Promise.all([
        farmerDashboardAPI.get(),
        farmerCropAPI.get(),
        farmerPickupAPI.getPickups(),
        farmerNotifAPI.get()
      ]);
      setStats(dashRes.data.stats || {});
      setCrops(cropRes.data.crops || []);
      setPickups((pickRes.data.pickups || []).filter(p => p.schedule?.status !== "COMPLETED"));
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount((notifRes.data.notifications || []).filter(n => !n.isRead).length);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-5 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-12 h-12 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
          Welcome back, {user?.name?.split(" ")[0]}!
        </h1>
        <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {user?.groupName || "Your farmer group"} · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Active Crops" value={stats.activeCrops || 0} icon="ph:plant-fill" color="emerald" onClick={() => navigate("/dashboard/farmer/crops")} />
        <StatCard label="Balance (₹)" value={`₹${stats.outstandingBalance || 0}`} icon="ph:wallet-fill" color="amber" onClick={() => navigate("/dashboard/farmer/schedules")} />
        <StatCard label="Upcoming Pickups" value={stats.upcomingPickups || 0} icon="ph:truck-fill" color="blue" onClick={() => navigate("/dashboard/farmer/schedules")} />
        <StatCard label="Unread Notifs" value={unreadCount} icon="ph:bell-fill" color="violet" onClick={() => navigate("/dashboard/farmer/notifications")} />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Crop status */}
        <div className={`lg:col-span-2 rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Active Crops</h2>
            <button onClick={() => navigate("/dashboard/farmer/crops")} className="text-xs text-emerald-500 hover:text-emerald-400 cursor-pointer">View all →</button>
          </div>
          <div className="space-y-3">
            {crops.length === 0 ? (
              <p className={`text-sm text-center py-5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>No crops added yet.</p>
            ) : crops.slice(0, 5).map(crop => (
              <div key={crop._id} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isDark ? "bg-slate-800/50 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-100"}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-emerald-500/15" : "bg-emerald-50"}`}>
                  <Icon icon="ph:plant-fill" className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}>{crop.crop?.name || "Unknown"}</p>
                    <StatusBadge status={crop.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, (crop.availableQuantity / (crop.plantedArea * 10)) * 100))}%` }} />
                    </div>
                    <span className={`text-[10px] shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{crop.availableQuantity} kg / {crop.plantedArea} acres</span>
                  </div>
                </div>
                {crop.deals?.length > 0 && (
                  <div className={`shrink-0 text-xs px-2 py-1 rounded-lg ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                    <Icon icon="ph:buildings-fill" className="w-3 h-3 inline mr-0.5" />
                    {crop.deals.length} deals
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Upcoming pickups */}
          <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Upcoming Pickups</h2>
              <button onClick={() => navigate("/dashboard/farmer/schedules")} className="text-xs text-emerald-500 hover:text-emerald-400 cursor-pointer">View all →</button>
            </div>
            {pickups.length === 0 ? (
              <div className={`text-center py-6 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                <Icon icon="ph:calendar-fill" className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No upcoming pickups
              </div>
            ) : (
              <div className="space-y-2">
                {pickups.slice(0, 3).map(p => (
                  <div key={p._id} className={`p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                    <div className="flex items-center gap-2">
                      <Icon icon="ph:truck-fill" className="w-4 h-4 text-blue-400 shrink-0" />
                      <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}>{p.cropDeal?.crop?.crop?.name || "Crop"}</p>
                      <StatusBadge status={p.schedule?.status} size="sm" />
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {new Date(p.schedule?.pickupDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} · {p.schedule?.time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent notifications */}
          <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Notifications</h2>
              <button onClick={() => navigate("/dashboard/farmer/notifications")} className="text-xs text-emerald-500 hover:text-emerald-400 cursor-pointer">View all →</button>
            </div>
            {notifications.length === 0 ? (
              <div className={`text-center py-6 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                <Icon icon="ph:bell-slash-fill" className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No new notifications
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 3).map(n => {
                  let icon = "ph:bell-fill";
                  if (n.type === "PAYMENT") icon = "ph:currency-inr-fill";
                  if (n.type === "PICKUP") icon = "ph:truck-fill";
                  if (n.type === "ANNOUNCEMENT") icon = "ph:megaphone-fill";
                  
                  return (
                    <div key={n._id} className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-all ${!n.isRead ? isDark ? "bg-emerald-500/8" : "bg-emerald-50" : isDark ? "bg-slate-800/30" : "bg-slate-50/50"}`}>
                      <Icon icon={icon} className={`w-4 h-4 mt-0.5 shrink-0 ${!n.isRead ? "text-emerald-400" : isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <div>
                        <p className={`text-xs font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{n.title}</p>
                        <p className={`text-xs mt-0.5 line-clamp-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{n.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
