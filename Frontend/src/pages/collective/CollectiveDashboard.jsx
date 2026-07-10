import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { monthlyHarvest, cropDistribution, zoneBreakdown, decayTrend, pickupSchedules, membershipRequests, collectiveNotifications } from "../../utils/InterfaceData";
import StatusBadge from "../../components/common/StatusBadge";

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

const StatCard = ({ label, value, icon, sub, color = "emerald" }) => {
  const { isDark } = useTheme();
  const c = {
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/20",
    amber: "from-amber-500 to-orange-500 shadow-amber-500/20",
    violet: "from-violet-500 to-purple-600 shadow-violet-500/20",
  }[color];
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

  const upcoming = pickupSchedules.filter(s => s.status === "scheduled").length;
  const pending = membershipRequests.filter(m => m.status === "pending").length;
  const unread = collectiveNotifications.filter(n => !n.read).length;

  const chartTheme = isDark
    ? { text: "#94a3b8", grid: "#1e293b", tooltip: { contentStyle: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, color: "#f1f5f9" } } }
    : { text: "#64748b", grid: "#f1f5f9", tooltip: { contentStyle: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#1e293b" } } };

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

      {/* Alerts */}
      {(pending > 0 || unread > 0) && (
        <div className="flex flex-wrap gap-3 mb-6">
          {pending > 0 && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer text-sm ${isDark ? "bg-amber-500/10 border-amber-500/25 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700"}`} onClick={() => navigate("/dashboard/collective/farmers")}>
              <Icon icon="ph:user-plus-fill" className="w-4 h-4" />
              <span>{pending} membership request{pending > 1 ? "s" : ""} pending review</span>
              <Icon icon="ph:arrow-right-bold" className="w-3.5 h-3.5" />
            </div>
          )}
          {unread > 0 && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer text-sm ${isDark ? "bg-blue-500/10 border-blue-500/25 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700"}`} onClick={() => navigate("/dashboard/collective/notifications")}>
              <Icon icon="ph:bell-fill" className="w-4 h-4" />
              <span>{unread} new notification{unread > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Farmer Groups" value="14" icon="ph:users-three-fill" sub="+2 this month" color="emerald" />
        <StatCard label="Active Pickups" value={upcoming} icon="ph:truck-fill" sub="scheduled" color="blue" />
        <StatCard label="Crops Managed" value="9" icon="ph:leaf-fill" sub="4 categories" color="amber" />
        <StatCard label="Total Harvest (YTD)" value="18.4t" icon="ph:scales-fill" sub="+12% vs 2025" color="violet" />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Monthly harvest line chart */}
        <div className={`lg:col-span-2 rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Monthly Harvest (kg)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyHarvest}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartTheme.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: chartTheme.text }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTheme.tooltip} />
              <Line type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Crop distribution donut */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Crop Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={cropDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {cropDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...chartTheme.tooltip} formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {cropDistribution.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Zone breakdown bar chart */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Zone Breakdown (kg)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={zoneBreakdown} barSize={28}>
              <XAxis dataKey="zone" tick={{ fontSize: 11, fill: chartTheme.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: chartTheme.text }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTheme.tooltip} />
              <Bar dataKey="kg" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Decay trend */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Post-Harvest Decay (%)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={decayTrend}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartTheme.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: chartTheme.text }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTheme.tooltip} />
              <Line type="monotone" dataKey="decay" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: "#ef4444", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent pickups */}
      <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Recent Pickups</h2>
          <button onClick={() => navigate("/dashboard/collective/history")} className="text-xs text-emerald-500 hover:text-emerald-400 cursor-pointer">View history →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? "text-slate-500" : "text-slate-400"}>
                {["Farmer Group", "Crop", "Qty", "Driver", "Date", "Status"].map(h => (
                  <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-100"}`}>
              {pickupSchedules.slice(0, 4).map(s => (
                <tr key={s.id} className={isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}>
                  <td className={`py-3 pr-4 font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{s.farmerGroup.split(" ").slice(0, 2).join(" ")}</td>
                  <td className={`py-3 pr-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{s.crop}</td>
                  <td className={`py-3 pr-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{s.quantity} kg</td>
                  <td className={`py-3 pr-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{s.driver.split(" ")[0]}</td>
                  <td className={`py-3 pr-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{new Date(s.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</td>
                  <td className="py-3"><StatusBadge status={s.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollectiveDashboard;
