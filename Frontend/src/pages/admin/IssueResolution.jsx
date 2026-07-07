import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/ui";

const BASE = "http://localhost:5000/api/admin";

const IssueResolution = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [issues, setIssues] = useState([]);
  const [tab, setTab] = useState("open");

  useEffect(() => {
    fetch(`${BASE}/issues`)
      .then((r) => r.json())
      .then((data) => {
        console.log("⚠️  IssueResolution — /api/admin/issues response:", data);
        setIssues(data);
      })
      .catch((err) => console.error("Failed to load issues:", err));
  }, []);

  const filtered =
    tab === "open"
      ? issues.filter((i) => i.status === "open")
      : tab === "in_progress"
        ? issues.filter((i) => i.status === "in_progress")
        : issues.filter((i) => i.status === "resolved");

  const handleAction = (id, status, note) => {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status, assignedTo: status !== "open" ? "Admin" : null }
          : i,
      ),
    );
    toast.success(
      status === "in_progress"
        ? "Issue assigned to you."
        : "Issue marked as resolved.",
      { title: status === "resolved" ? "Resolved!" : "In Progress" },
    );
  };

  const PRIORITY_COLORS = {
    high: "text-red-400 bg-red-500/10",
    medium: "text-amber-400 bg-amber-500/10",
    low: "text-slate-400 bg-slate-500/10",
  };

  return (
    <div
      className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <div className="mb-6">
        <h1
          className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Issue Resolution
        </h1>
        <p
          className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          {issues.filter((i) => i.status === "open").length} open ·{" "}
          {issues.filter((i) => i.status === "in_progress").length} in progress
        </p>
      </div>

      <div
        className={`flex gap-1 p-1 rounded-xl mb-5 w-fit ${isDark ? "bg-slate-800/70" : "bg-slate-100"}`}
      >
        {[
          { id: "open", label: "Open" },
          { id: "in_progress", label: "In Progress" },
          { id: "resolved", label: "Resolved" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${tab === t.id ? "bg-linear-to-r from-amber-500 to-orange-600 text-white shadow" : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t.label} ({issues.filter((i) => i.status === t.id).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="ph:check-circle-fill"
          title="All clear!"
          description="No issues in this category."
        />
      ) : (
        <div className="max-w-3xl space-y-4">
          {filtered.map((issue, i) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[issue.priority]}`}
                    >
                      {issue.priority} priority
                    </span>
                    <StatusBadge status={issue.status} size="sm" />
                  </div>
                  <h3
                    className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {issue.title}
                  </h3>
                </div>
                <span
                  className={`shrink-0 text-xs px-2 py-1 rounded-lg capitalize ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
                >
                  {issue.type}
                </span>
              </div>

              <p
                className={`text-sm mb-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                {issue.description}
              </p>

              <div className="flex items-center gap-4 text-xs mb-4">
                <span
                  className={`flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  <Icon icon="ph:user-fill" className="w-3 h-3" />
                  Reported by: {issue.reportedBy} ({issue.reportedByRole})
                </span>
                <span
                  className={`flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  <Icon icon="ph:calendar-fill" className="w-3 h-3" />
                  {issue.createdAt}
                </span>
                {issue.assignedTo && (
                  <span
                    className={`flex items-center gap-1 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                  >
                    <Icon icon="ph:user-check-fill" className="w-3 h-3" />
                    Assigned: {issue.assignedTo}
                  </span>
                )}
              </div>

              {issue.status === "open" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(issue.id, "in_progress")}
                    className="flex-1 py-2 rounded-xl text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/25 cursor-pointer hover:bg-blue-500/25"
                  >
                    Take on Issue
                  </button>
                  <button
                    onClick={() => handleAction(issue.id, "resolved")}
                    className="flex-1 py-2 rounded-xl text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 cursor-pointer hover:bg-emerald-500/25"
                  >
                    Mark Resolved
                  </button>
                </div>
              )}
              {issue.status === "in_progress" && (
                <button
                  onClick={() => handleAction(issue.id, "resolved")}
                  className="w-full py-2 rounded-xl text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 cursor-pointer hover:bg-emerald-500/25"
                >
                  Mark as Resolved
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IssueResolution;
