import React, { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { farmerCropsData, pickupSchedules, farmerNotifications, CROPS_MASTER } from "../../utils/InterfaceData";
import StatusBadge from "../../components/common/StatusBadge";

const StatCard = ({ label, value, icon, trend, trendUp, color = "emerald", onClick }) => {
  const { isDark } = useTheme();
  const colorMap = {
    emerald: { bg: "from-emerald-500 to-teal-600",  text: "text-emerald-400", glow: "shadow-emerald-500/20" },
    blue:    { bg: "from-blue-500 to-indigo-600",   text: "text-blue-400",    glow: "shadow-blue-500/20" },
    amber:   { bg: "from-amber-500 to-orange-600",  text: "text-amber-400",   glow: "shadow-amber-500/20" },
    violet:  { bg: "from-violet-500 to-purple-600", text: "text-violet-400",  glow: "shadow-violet-500/20" },
  };
  const c = colorMap[color];
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
        {trend && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${trendUp ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
            {trendUp ? "▲" : "▼"} {trend}
          </span>
        )}
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

  const mySchedules = pickupSchedules.filter(s => s.farmerGroupId === "fg_001");
  const upcoming = mySchedules.filter(s => s.status === "scheduled");
  const unread = farmerNotifications.filter(n => !n.read).length;
  const readyCrops = farmerCropsData.filter(c => c.status === "ready");

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
        <StatCard label="Active Crops" value={farmerCropsData.filter(c => c.status !== "out_of_season").length} icon="ph:plant-fill" trend="growing" trendUp={true} color="emerald" onClick={() => navigate("/dashboard/farmer/crops")} />
        <StatCard label="Ready to Harvest" value={readyCrops.length} icon="ph:package-fill" color="amber" onClick={() => navigate("/dashboard/farmer/crops")} />
        <StatCard label="Upcoming Pickups" value={upcoming.length} icon="ph:calendar-check-fill" trend="this week" trendUp={true} color="blue" onClick={() => navigate("/dashboard/farmer/schedules")} />
        <StatCard label="Notifications" value={unread} icon="ph:bell-fill" color="violet" onClick={() => navigate("/dashboard/farmer/notifications")} />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Crop status */}
        <div className={`lg:col-span-2 rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Crop Status</h2>
            <button onClick={() => navigate("/dashboard/farmer/crops")} className="text-xs text-emerald-500 hover:text-emerald-400 cursor-pointer">View all →</button>
          </div>
          <div className="space-y-3">
            {farmerCropsData.map(crop => (
              <div key={crop.id} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isDark ? "bg-slate-800/50 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-100"}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-emerald-500/15" : "bg-emerald-50"}`}>
                  <Icon icon="ph:plant-fill" className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}>{crop.name}</p>
                    <StatusBadge status={crop.status} size="sm" />
                  </div>
                  {crop.status !== "out_of_season" && (
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 h-1.5 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${crop.growthPercent}%` }} />
                      </div>
                      <span className={`text-xs shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{crop.growthPercent}%</span>
                    </div>
                  )}
                  <p className={`text-xs mt-0.5 truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>{crop.lastUpdateText}</p>
                </div>
                {crop.collective && (
                  <div className={`shrink-0 text-xs px-2 py-1 rounded-lg ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                    <Icon icon="ph:buildings-fill" className="w-3 h-3 inline mr-0.5" />
                    Linked
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
            {upcoming.length === 0 ? (
              <div className={`text-center py-6 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                <Icon icon="ph:calendar-fill" className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No upcoming pickups
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map(s => (
                  <div key={s.id} className={`p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                    <div className="flex items-center gap-2">
                      <Icon icon="ph:calendar-check-fill" className="w-4 h-4 text-blue-400 shrink-0" />
                      <p className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{s.crop}</p>
                      <StatusBadge status={s.status} size="sm" />
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {new Date(s.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} · {s.time} · {s.driver}
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
              {unread > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-medium">{unread} new</span>}
            </div>
            <div className="space-y-2">
              {farmerNotifications.slice(0, 3).map(n => (
                <div key={n.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-all ${!n.read ? isDark ? "bg-emerald-500/8" : "bg-emerald-50" : isDark ? "bg-slate-800/30" : "bg-slate-50/50"}`}>
                  <Icon icon={n.icon} className={`w-4 h-4 mt-0.5 shrink-0 ${!n.read ? "text-emerald-400" : isDark ? "text-slate-500" : "text-slate-400"}`} />
                  <div>
                    <p className={`text-xs font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{n.title}</p>
                    <p className={`text-xs mt-0.5 line-clamp-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{n.message}</p>
                    <p className={`text-[10px] mt-1 ${isDark ? "text-slate-600" : "text-slate-300"}`}>{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
