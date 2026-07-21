import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { monthlyHarvest, cropDistribution, zoneBreakdown, decayTrend } from "../../utils/InterfaceData";
import { useToast } from "../../components/ui";
import { collectiveDashboardAPI } from "../../services/api";

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

const StatCard = ({ label, value, icon, sub, color = "emerald" }) => {
  const { isDark } = useTheme();
  const c = {
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/20",
    amber: "from-amber-500 to-orange-500 shadow-amber-500/20",
    violet: "from-violet-500 to-purple-600 shadow-violet-500/20",
  }[color] || "from-emerald-500 to-teal-600 shadow-emerald-500/20";
  return (
    <motion.div whileHover={{ y: -2 }} className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${c} shadow-lg mb-4`}>
        <Icon icon={icon} className="w-5 h-5 text-white" />
      </div>
      <p className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>{value}</p>
      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      {sub && <p className={`text-xs mt-1 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>{sub}</p>}
    </motion.div>
  );
};

const CollectiveDashboard = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCrops: 0,
    activeZones: 0,
    activeDrivers: 0,
    upcomingPickups: 0,
    activeMembers: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await collectiveDashboardAPI.get();
      setStats(res.data.stats || {});
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartTheme = isDark
    ? { text: "#94a3b8", grid: "#1e293b", tooltip: { contentStyle: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, color: "#f1f5f9" } } }
    : { text: "#64748b", grid: "#f1f5f9", tooltip: { contentStyle: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#1e293b" } } };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-5 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-12 h-12 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Dashboard</h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{user?.collectiveName || "Collective Overview"} · {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate("/dashboard/collective/announcements")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border cursor-pointer transition-all ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            <Icon icon="ph:megaphone-fill" className="w-4 h-4" />
            Announce
          </button>
          <button onClick={() => navigate("/dashboard/collective/schedules")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer shadow-lg shadow-emerald-500/20">
            <Icon icon="ph:calendar-plus-fill" className="w-4 h-4" />
            Schedule Pickup
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Farmer Groups" value={stats.activeMembers || 0} icon="ph:users-three-fill" color="emerald" />
        <StatCard label="Crops Managed" value={stats.totalCrops || 0} icon="ph:plant-fill" color="blue" />
        <StatCard label="Active Zones" value={stats.activeZones || 0} icon="ph:map-trifold-fill" color="amber" />
        <StatCard label="Active Pickups" value={stats.upcomingPickups || 0} icon="ph:truck-fill" color="violet" />
      </div>

      {/* Analytics Grid */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Collection Trend */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>Collection Trend (Mock)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyHarvest}>
                <XAxis dataKey="month" stroke={chartTheme.text} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={chartTheme.text} fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v}k`} />
                <Tooltip {...chartTheme.tooltip} cursor={{ stroke: chartTheme.grid, strokeWidth: 2 }} />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: isDark ? "#0f172a" : "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crop Distribution */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>Crop Distribution (Mock)</h2>
          <div className="h-64 flex">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cropDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {cropDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip {...chartTheme.tooltip} />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '12px', color: chartTheme.text }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Zone Performance */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>Zone Performance (Mock)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneBreakdown} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" stroke={chartTheme.text} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke={chartTheme.text} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...chartTheme.tooltip} cursor={{ fill: chartTheme.grid }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                  {zoneBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality/Decay Analytics */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>Quality Preservation (Mock)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={decayTrend}>
                <XAxis dataKey="time" stroke={chartTheme.text} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={chartTheme.text} fontSize={12} tickLine={false} axisLine={false} domain={[80, 100]} />
                <Tooltip {...chartTheme.tooltip} cursor={{ stroke: chartTheme.grid, strokeWidth: 2 }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" name="Standard Method" dataKey="standard" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" name="FarmFresh Logistics" dataKey="farmfresh" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectiveDashboard;
