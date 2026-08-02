import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { adminAPI } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { useToast, Loader } from "../../components/ui";

const IssueResolution = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("OPEN");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await adminAPI.getIssues();
        setIssues(res.data.issues);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load issues");
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const filtered = issues.filter((i) => i.status === tab);

  const handleAction = async (id, status) => {
    setUpdatingId(id);
    try {
      await adminAPI.updateIssueStatus(id, { status });
      setIssues((prev) =>
        prev.map((i) => (i._id === id ? { ...i, status } : i))
      );
      toast.success(
        status === "IN_PROGRESS" ? "Issue assigned to you." : "Issue marked as resolved.",
        { title: status === "RESOLVED" ? "Resolved!" : "In Progress" }
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update issue status");
    } finally {
      setUpdatingId(null);
    }
  };

  const PRIORITY_COLORS = {
    HIGH: "text-red-400 bg-red-500/10",
    MEDIUM: "text-amber-500 bg-amber-500/10",
    LOW: "text-blue-500 bg-blue-500/10",
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <Loader size="lg" />
        <p className={`mt-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading Issues...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-600"}`}>
        <Icon icon="ph:warning-circle-fill" className="w-12 h-12 text-red-500 mb-2" />
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600">Retry</button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Issue Resolution</h1>
        <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {issues.filter((i) => i.status === "OPEN").length} open · {issues.filter((i) => i.status === "IN_PROGRESS").length} in progress
        </p>
      </div>

      <div className={`flex flex-wrap gap-1 p-1 rounded-xl mb-5 w-fit ${isDark ? "bg-slate-800/70" : "bg-slate-100"}`}>
        {[
          { id: "OPEN", label: "Open" },
          { id: "IN_PROGRESS", label: "In Progress" },
          { id: "RESOLVED", label: "Resolved" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              tab === t.id
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow"
                : isDark
                ? "text-slate-400 hover:text-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label} ({issues.filter((i) => i.status === t.id).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="ph:check-circle-fill" title="All clear!" description="No issues in this category." />
      ) : (
        <div className="max-w-3xl space-y-4">
          <AnimatePresence>
            {filtered.map((issue, i) => (
              <motion.div
                key={issue._id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold tracking-wide ${PRIORITY_COLORS[issue.priority]}`}>
                        {issue.priority} PRIORITY
                      </span>
                      <StatusBadge status={issue.status} size="sm" />
                    </div>
                    <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{issue.title}</h3>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-1 rounded-lg capitalize font-medium border ${isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-600"}`}>
                    {issue.type.replace("_", " ")}
                  </span>
                </div>

                <p className={`text-sm mb-4 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{issue.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs mb-4">
                  <span className={`flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    <Icon icon="ph:user-fill" className="w-3.5 h-3.5" />
                    Reported by: {issue.reportedByName || "Unknown"} ({issue.reportedByRole?.replace("_", " ")})
                  </span>
                  <span className={`flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    <Icon icon="ph:clock-fill" className="w-3.5 h-3.5" />
                    {new Date(issue.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className={`pt-4 border-t flex flex-wrap items-center gap-2 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                  {issue.status === "OPEN" && (
                    <>
                      <button
                        onClick={() => handleAction(issue._id, "IN_PROGRESS")}
                        disabled={updatingId === issue._id}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md disabled:opacity-70 flex items-center gap-2"
                      >
                        {updatingId === issue._id ? <Icon icon="ph:spinner-gap" className="animate-spin w-4 h-4" /> : <Icon icon="ph:hand-pointing-fill" className="w-4 h-4" />}
                        Assign to Me
                      </button>
                      <button
                        onClick={() => handleAction(issue._id, "RESOLVED")}
                        disabled={updatingId === issue._id}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-70 flex items-center gap-2 ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                      >
                        {updatingId === issue._id ? <Icon icon="ph:spinner-gap" className="animate-spin w-4 h-4" /> : <Icon icon="ph:check-circle-bold" className="w-4 h-4" />}
                        Mark Resolved
                      </button>
                    </>
                  )}
                  {issue.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => handleAction(issue._id, "RESOLVED")}
                      disabled={updatingId === issue._id}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md disabled:opacity-70 flex items-center gap-2"
                    >
                      {updatingId === issue._id ? <Icon icon="ph:spinner-gap" className="animate-spin w-4 h-4" /> : <Icon icon="ph:check-circle-bold" className="w-4 h-4" />}
                      Mark Resolved
                    </button>
                  )}
                  {issue.status === "RESOLVED" && (
                    <button
                      onClick={() => handleAction(issue._id, "OPEN")}
                      disabled={updatingId === issue._id}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-70 flex items-center gap-2 ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                    >
                      {updatingId === issue._id ? <Icon icon="ph:spinner-gap" className="animate-spin w-4 h-4" /> : <Icon icon="ph:arrow-u-up-left-bold" className="w-4 h-4" />}
                      Reopen Issue
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default IssueResolution;
