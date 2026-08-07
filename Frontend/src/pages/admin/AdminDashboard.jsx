import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { adminAPI } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";
import { Loader } from "../../components/ui";

const AdminDashboard = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, analyticsRes, paymentsRes] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getAnalytics(),
          adminAPI.getPayments(),
        ]);
        setStats(statsRes.data.stats);
        setAnalytics(analyticsRes.data.analytics);
        setPayments(paymentsRes.data.overview);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const chartTheme = isDark
    ? { text: "#94a3b8", tooltip: { contentStyle: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, color: "#f1f5f9" } } }
    : { text: "#64748b", tooltip: { contentStyle: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#1e293b" } } };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <Loader size="lg" />
        <p className={`mt-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading Platform Stats...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-600"}`}>
        <Icon icon="ph:warning-circle-fill" className="w-12 h-12 text-red-500 mb-2" />
        <p>{error || "Failed to load stats"}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600">Retry</button>
      </div>
    );
  }

  const { openIssues = 0, recentIssues = [], monthlyHarvest = [], recentGroups = [] } = stats;

  const platformStats = [
    { label: "Total Farmer Groups", value: stats.totalFarmerGroups, icon: "ph:plant-fill", color: "from-emerald-500 to-teal-600", note: "registered nodes", path: "/dashboard/admin/farmer-groups" },
    { label: "Active Collectives", value: stats.totalCollectives, icon: "ph:buildings-fill", color: "from-blue-500 to-indigo-600", note: "buyer entities", path: "/dashboard/admin/collectives" },
    { label: "Open Issues", value: openIssues, icon: "ph:warning-circle-fill", color: "from-red-500 to-rose-600", note: "needs attention", path: "/dashboard/admin/issues" },
    { label: "Total Users", value: stats.totalUsers, icon: "ph:users-three-fill", color: "from-violet-500 to-purple-600", note: "inc. admins", path: "/dashboard/admin/users" },
  ];

  // Payment stats
  const totalVolume = payments?.totalVolume || 0;
  const totalTx = payments?.totalTransactions || 0;

  // Issue priority data for bar chart
  const issuePriorityData = (analytics?.issuesByPriority || []).map((i) => ({
    name: (i._id || "").charAt(0).toUpperCase() + (i._id || "").slice(1),
    count: i.count,
  }));

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Admin Dashboard</h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>FarmFresh Platform Overview</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {openIssues > 0 && (
            <button onClick={() => navigate("/dashboard/admin/issues")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${isDark ? "bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25" : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"}`}>
              <Icon icon="ph:warning-circle-fill" className="w-4 h-4" />
              {openIssues} open issue{openIssues > 1 ? "s" : ""}
            </button>
          )}
          <button onClick={() => navigate("/dashboard/admin/contacts")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${isDark ? "bg-violet-500/15 text-violet-400 border border-violet-500/25 hover:bg-violet-500/25" : "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100"}`}>
            <Icon icon="ph:envelope-fill" className="w-4 h-4" />
            Inbox
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {platformStats.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => navigate(s.path)}
            className={`rounded-2xl border p-5 text-left cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${isDark ? "bg-slate-900/60 border-slate-800 hover:bg-slate-900" : "bg-white border-slate-200 hover:bg-slate-50"}`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.color} shadow-lg mb-4`}>
              <Icon icon={s.icon} className="w-5 h-5 text-white" />
            </div>
            <p className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>{s.value}</p>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.label}</p>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>{s.note}</p>
          </motion.button>
        ))}
      </div>

      {/* Payment summary strip */}
      <div className={`rounded-2xl border p-5 mb-5 flex flex-wrap gap-6 items-center ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shrink-0`}>
          <Icon icon="ph:currency-inr-fill" className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Total Platform Payment Volume</p>
          <p className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>₹{totalVolume.toLocaleString()}</p>
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{totalTx} total transactions</p>
        </div>
        {payments?.topCollectives?.slice(0, 3).map((c) => (
          <div key={c._id} className={`hidden sm:block px-4 py-3 rounded-xl text-center shrink-0 ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
            <p className={`text-sm font-bold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>₹{c.total.toLocaleString()}</p>
            <p className={`text-xs truncate max-w-24 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{c.collectiveName}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Harvest chart */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Platform Harvest (kg)</h2>
          <p className={`text-xs mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Last 6 months</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyHarvest.slice(-6)} barSize={28}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartTheme.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: chartTheme.text }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTheme.tooltip} />
              <Bar dataKey="kg" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User registrations chart */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>User Registrations</h2>
          <p className={`text-xs mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Last 12 months</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={analytics?.monthlyRegistrations || []} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartTheme.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: chartTheme.text }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTheme.tooltip} />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: "#8b5cf6", r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Issues breakdown + Recent issues */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Issue priority breakdown */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Issues by Priority</h2>
            <button onClick={() => navigate("/dashboard/admin/issues")} className="text-xs text-emerald-500 hover:text-emerald-400 cursor-pointer">Manage →</button>
          </div>
          {issuePriorityData.length === 0 ? (
            <div className={`flex items-center justify-center py-8 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No issues</div>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={issuePriorityData} barSize={36}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartTheme.text }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chartTheme.text }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...chartTheme.tooltip} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Issues */}
        <div className={`rounded-2xl border p-5 flex flex-col ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Recent Issues</h2>
            <button onClick={() => navigate("/dashboard/admin/issues")} className="text-xs text-emerald-500 hover:text-emerald-400 cursor-pointer">View all →</button>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {recentIssues.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-4">
                <Icon icon="ph:check-circle-fill" className="w-10 h-10 text-emerald-500 mb-2" />
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>No recent open issues!</p>
              </div>
            ) : recentIssues.map(issue => (
              <div key={issue._id} className={`flex items-start gap-3 p-3 rounded-xl mb-2 cursor-pointer transition-colors ${isDark ? "bg-slate-800/50 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-100"}`} onClick={() => navigate("/dashboard/admin/issues")}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${(issue.priority === "HIGH" || issue.priority === "high") ? "bg-red-500/15 text-red-400" : (issue.priority === "MEDIUM" || issue.priority === "medium") ? "bg-amber-500/15 text-amber-500" : "bg-blue-500/15 text-blue-500"}`}>
                  <Icon icon={(issue.priority === "HIGH" || issue.priority === "high") ? "ph:warning-fill" : "ph:info-fill"} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{issue.title}</p>
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{issue.reportedByName || "Unknown"} · {new Date(issue.createdAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={issue.priority} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Farmer Groups + Recent Payments */}
      <div className="grid lg:grid-cols-2 gap-5">
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
                  {["Group", "Lead Farmer", "Farmers", "Rating"].map(h => <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider">{h}</th>)}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-100"}`}>
                {recentGroups.length === 0 ? (
                  <tr><td colSpan="4" className="py-4 text-center text-slate-500">No recent farmer groups.</td></tr>
                ) : recentGroups.map(g => (
                  <tr key={g.id} className={`transition-colors ${isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}`}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                          {g.profile ? <img src={g.profile} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500"><Icon icon="ph:plant-fill" /></div>}
                        </div>
                        <span className={`font-medium text-sm truncate max-w-[8rem] ${isDark ? "text-white" : "text-slate-900"}`}>{g.name}</span>
                      </div>
                    </td>
                    <td className={`py-3 pr-4 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>{g.leadFarmer}</td>
                    <td className={`py-3 pr-4 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>{g.farmerCount}</td>
                    <td className={`py-3 text-xs ${isDark ? "text-amber-400" : "text-amber-500"}`}>{g.rating ? `★ ${g.rating}` : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent payments */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Recent Payments</h2>
          {!payments?.recentTransactions?.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Icon icon="ph:currency-inr-duotone" className={`w-10 h-10 mb-2 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
              <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto max-h-56 custom-scrollbar pr-1">
              {payments.recentTransactions.map((tx) => (
                <div key={tx.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800/40" : "bg-slate-50"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                    <Icon icon="ph:currency-inr-fill" className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{tx.farmerGroup} ← {tx.collective}</p>
                    <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{tx.method} · {new Date(tx.paymentDate).toLocaleDateString()}</p>
                  </div>
                  <p className={`text-sm font-bold shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>₹{tx.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
