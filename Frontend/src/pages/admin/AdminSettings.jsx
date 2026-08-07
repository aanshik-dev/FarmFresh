import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../services/api";
import { Loader } from "../../components/ui";

const INFO_CARD = ({ icon, label, value, sub, isDark, color = "emerald" }) => (
  <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-${color}-500/15`}>
      <Icon icon={icon} className={`w-5 h-5 text-${color}-500`} />
    </div>
    <p className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>{value}</p>
    <p className={`text-sm font-medium mt-0.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{label}</p>
    {sub && <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{sub}</p>}
  </div>
);

const AdminSettings = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aRes, pRes] = await Promise.all([
          adminAPI.getAnalytics(),
          adminAPI.getPayments(),
        ]);
        setAnalytics(aRes.data.analytics);
        setPayments(pRes.data.overview);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const issueTotal = analytics
    ? (analytics.issuesByStatus || []).reduce((s, i) => s + i.count, 0)
    : 0;
  const issueResolved = analytics
    ? (analytics.issuesByStatus || []).find((i) => i._id === "RESOLVED")?.count || 0
    : 0;
  const resolutionRate = issueTotal > 0 ? Math.round((issueResolved / issueTotal) * 100) : 0;

  const contactTotal = analytics
    ? (analytics.contactsByStatus || []).reduce((s, c) => s + c.count, 0)
    : 0;
  const contactForwarded = analytics
    ? (analytics.contactsByStatus || []).find((c) => c._id === "FORWARDED")?.count || 0
    : 0;

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Admin Settings</h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Platform health, analytics, and configuration</p>
        </div>

        {/* Platform Analytics section */}
        <div className="mb-8">
          <h2 className={`text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            <Icon icon="ph:chart-line-up-fill" className="w-4 h-4 text-emerald-500" />
            Platform Health
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="md" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <INFO_CARD
                icon="ph:envelope-fill"
                label="Contact Submissions"
                value={contactTotal}
                sub={`${contactForwarded} forwarded`}
                isDark={isDark}
                color="violet"
              />
              <INFO_CARD
                icon="ph:check-circle-fill"
                label="Issue Resolution Rate"
                value={`${resolutionRate}%`}
                sub={`${issueResolved}/${issueTotal} issues resolved`}
                isDark={isDark}
                color="emerald"
              />
              <INFO_CARD
                icon="ph:currency-inr-fill"
                label="Total Payments Volume"
                value={`₹${((payments?.totalVolume || 0) / 1000).toFixed(1)}K`}
                sub={`${payments?.totalTransactions || 0} transactions`}
                isDark={isDark}
                color="blue"
              />
              <INFO_CARD
                icon="ph:warning-circle-fill"
                label="Open Issues"
                value={(analytics?.issuesByStatus || []).find((i) => i._id === "OPEN")?.count || 0}
                sub="Needs attention"
                isDark={isDark}
                color="red"
              />
            </div>
          )}
        </div>

        {/* Issues breakdown */}
        {!loading && analytics && (
          <div className="mb-8">
            <h2 className={`text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              <Icon icon="ph:bug-fill" className="w-4 h-4 text-amber-500" />
              Issue Breakdown
            </h2>
            <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="grid sm:grid-cols-2 gap-6">
                {/* By priority */}
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>By Priority</p>
                  <div className="space-y-2.5">
                    {(analytics.issuesByPriority || []).map((item) => {
                      const colorMap = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-blue-400" };
                      const total = (analytics.issuesByPriority || []).reduce((s, i) => s + i.count, 0);
                      const pct = total ? Math.round((item.count / total) * 100) : 0;
                      return (
                        <div key={item._id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs capitalize ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item._id}</span>
                            <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{item.count}</span>
                          </div>
                          <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full rounded-full ${colorMap[item._id?.toLowerCase()] || "bg-slate-500"}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {(analytics.issuesByPriority || []).length === 0 && (
                      <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No data</p>
                    )}
                  </div>
                </div>
                {/* By type */}
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>By Type</p>
                  <div className="space-y-2.5">
                    {(analytics.issuesByType || []).map((item) => {
                      const total = (analytics.issuesByType || []).reduce((s, i) => s + i.count, 0);
                      const pct = total ? Math.round((item.count / total) * 100) : 0;
                      return (
                        <div key={item._id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs capitalize ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item._id?.replace("_", " ")}</span>
                            <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{item.count}</span>
                          </div>
                          <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full rounded-full bg-violet-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                    {(analytics.issuesByType || []).length === 0 && (
                      <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No data</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top paying collectives */}
        {!loading && payments?.topCollectives?.length > 0 && (
          <div className="mb-8">
            <h2 className={`text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              <Icon icon="ph:trophy-fill" className="w-4 h-4 text-amber-500" />
              Top Collectives by Payment Volume
            </h2>
            <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
              {payments.topCollectives.map((c, i) => (
                <div
                  key={c._id}
                  className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? `border-t ${isDark ? "border-slate-800" : "border-slate-100"}` : ""}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i === 0 ? "bg-amber-500/15 text-amber-400" :
                    i === 1 ? "bg-slate-400/15 text-slate-400" :
                    "bg-orange-500/10 text-orange-400"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>{c.collectiveName}</p>
                    <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{c.count} transactions</p>
                  </div>
                  <p className={`font-bold text-sm shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>₹{c.total.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className={`text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            <Icon icon="ph:lightning-fill" className="w-4 h-4 text-blue-500" />
            Quick Actions
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "View Open Issues", icon: "ph:warning-circle-fill", path: "/dashboard/admin/issues", color: "from-red-500 to-rose-600" },
              { label: "Contact Inbox", icon: "ph:envelope-fill", path: "/dashboard/admin/contacts", color: "from-violet-500 to-purple-600" },
              { label: "User Management", icon: "ph:users-three-fill", path: "/dashboard/admin/users", color: "from-blue-500 to-indigo-600" },
              { label: "Farmer Groups", icon: "ph:plant-fill", path: "/dashboard/admin/farmer-groups", color: "from-emerald-500 to-teal-600" },
              { label: "Collectives", icon: "ph:buildings-fill", path: "/dashboard/admin/collectives", color: "from-cyan-500 to-blue-600" },
              { label: "Dashboard", icon: "ph:squares-four-fill", path: "/dashboard/admin/overview", color: "from-amber-500 to-orange-500" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer hover:shadow-lg ${
                  isDark ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800/80" : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${action.color} shadow shrink-0`}>
                  <Icon icon={action.icon} className="w-5 h-5 text-white" />
                </div>
                <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{action.label}</span>
                <Icon icon="ph:arrow-right-bold" className={`w-4 h-4 ml-auto ${isDark ? "text-slate-600" : "text-slate-300"}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Platform info footer */}
        <div className={`rounded-2xl border p-5 flex items-center gap-4 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? "bg-emerald-800/50" : "bg-emerald-100"}`}>
            <Icon icon="ph:plant-fill" className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>FarmFresh Platform</p>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Admin Panel v2.0 · Built by <a href="https://aanshik-dev.vercel.app" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">Aanshik-dev</a>
            </p>
          </div>
          <div className={`ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Platform Online
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
