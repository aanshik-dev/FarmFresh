import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { farmerGroups, collectivesList, issuesData, monthlyHarvest, dashboardStats } from "../../utils/InterfaceData";
import StatusBadge from "../../components/common/StatusBadge";

const AdminDashboard = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const openIssues = issuesData.filter(i => i.status === "open");

  const chartTheme = isDark
    ? { text: "#94a3b8", tooltip: { contentStyle: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, color: "#f1f5f9" } } }
    : { text: "#64748b", tooltip: { contentStyle: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#1e293b" } } };

  const platformStats = [
    { label: "Total Farmer Groups", value: farmerGroups.length, icon: "ph:plant-fill", color: "from-emerald-500 to-teal-600", note: "5 zones" },
    { label: "Active Collectives", value: collectivesList.length, icon: "ph:buildings-fill", color: "from-blue-500 to-indigo-600", note: "3 districts" },
    { label: "Open Issues", value: openIssues.length, icon: "ph:warning-circle-fill", color: "from-red-500 to-rose-600", note: "needs attention" },
    { label: "Total Users", value: farmerGroups.length + collectivesList.length + 1, icon: "ph:users-three-fill", color: "from-violet-500 to-purple-600", note: "inc. admin" },
  ];

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Admin Dashboard</h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>FarmFresh Platform Overview</p>
        </div>
        {openIssues.length > 0 && (
          <button onClick={() => navigate("/dashboard/admin/issues")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${isDark ? "bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25" : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"}`}>
            <Icon icon="ph:warning-circle-fill" className="w-4 h-4" />
            {openIssues.length} open issue{openIssues.length > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {platformStats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.color} shadow-lg mb-4`}>
              <Icon icon={s.icon} className="w-5 h-5 text-white" />
            </div>
            <p className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>{s.value}</p>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.label}</p>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>{s.note}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts & tables */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Harvest chart */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Platform Harvest (kg)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyHarvest.slice(-6)} barSize={28}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartTheme.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: chartTheme.text }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTheme.tooltip} />
              <Bar dataKey="kg" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Open issues */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Open Issues</h2>
            <button onClick={() => navigate("/dashboard/admin/issues")} className="text-xs text-emerald-500 hover:text-emerald-400 cursor-pointer">View all →</button>
          </div>
          {openIssues.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Icon icon="ph:check-circle-fill" className="w-10 h-10 text-emerald-500 mb-2" />
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>No open issues!</p>
            </div>
          ) : openIssues.map(issue => (
            <div key={issue.id} className={`flex items-start gap-3 p-3 rounded-xl mb-2 cursor-pointer ${isDark ? "bg-slate-800/50 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-100"}`} onClick={() => navigate("/dashboard/admin/issues")}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${issue.priority === "high" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
                <Icon icon="ph:warning-fill" className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{issue.title}</p>
                <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{issue.reportedBy} · {issue.createdAt}</p>
              </div>
              <StatusBadge status={issue.priority} size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent registrations */}
      <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Recent Farmer Groups</h2>
          <button onClick={() => navigate("/dashboard/admin/farmer-groups")} className="text-xs text-emerald-500 hover:text-emerald-400 cursor-pointer">View all →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? "text-slate-500" : "text-slate-400"}>
                {["Group", "Lead Farmer", "Farmers", "Zone", "Crops", "Rating"].map(h => <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider">{h}</th>)}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-100"}`}>
              {farmerGroups.slice(0, 4).map(g => (
                <tr key={g.id} className={isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <img src={g.profilePhoto} alt="" className="w-7 h-7 rounded-lg object-cover" />
                      <span className={`font-medium text-sm truncate max-w-36 ${isDark ? "text-white" : "text-slate-900"}`}>{g.groupName.split(" ").slice(0, 3).join(" ")}</span>
                    </div>
                  </td>
                  <td className={`py-3 pr-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{g.leadFarmer}</td>
                  <td className={`py-3 pr-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{g.numberOfFarmers}</td>
                  <td className={`py-3 pr-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{g.zone.split("·")[0].trim()}</td>
                  <td className="py-3 pr-4"><div className="flex gap-1">{g.crops.slice(0, 2).map(c => <span key={c} className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"}`}>{c}</span>)}</div></td>
                  <td className={`py-3 ${isDark ? "text-amber-400" : "text-amber-500"}`}>★ {g.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
