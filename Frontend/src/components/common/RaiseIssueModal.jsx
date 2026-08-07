import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { issuesAPI } from "../../services/api";
import { useToast } from "../ui";
import CustomSelect from "./CustomSelect";

const ISSUE_TYPES = [
  { value: "payment", label: "Payment & Financial Issue" },
  { value: "operational", label: "Operational & Pickup Issue" },
  { value: "data", label: "Crop & Data Discrepancy" },
  { value: "account", label: "Account & Profile Issue" },
  { value: "other", label: "Other Support Query" },
];

const getAutoPriority = (cat) => {
  if (cat === "payment")
    return { label: "High Priority (Urgent Payment/Financial)", color: "text-red-500 bg-red-500/10 border-red-500/30", icon: "ph:warning-circle-bold" };
  if (cat === "operational" || cat === "account")
    return { label: "Medium Priority (Operational/Account)", color: "text-amber-500 bg-amber-500/10 border-amber-500/30", icon: "ph:info-bold" };
  return { label: "Low Priority (General Query)", color: "text-blue-500 bg-blue-500/10 border-blue-500/30", icon: "ph:check-circle-bold" };
};

const RaiseIssueModal = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [tab, setTab] = useState("create"); // "create" | "history"

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("payment");
  const [submitting, setSubmitting] = useState(false);

  // History State
  const [myIssues, setMyIssues] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchMyIssues = async () => {
    setLoadingHistory(true);
    try {
      const res = await issuesAPI.getMyIssues();
      setMyIssues(res.data?.issues || []);
    } catch (err) {
      console.error("Failed to fetch user issues:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyIssues();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in both title and description.");
      return;
    }
    setSubmitting(true);
    try {
      await issuesAPI.create({
        title: title.trim(),
        description: description.trim(),
        type,
      });
      toast.success("Support issue submitted successfully! Admin will review shortly.");
      setTitle("");
      setDescription("");
      await fetchMyIssues();
      setTab("history");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit support issue.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isDark ? "bg-slate-900 border-slate-800 shadow-black/80" : "bg-white border-slate-200 shadow-slate-300/50"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shrink-0">
                <Icon icon="ph:warning-circle-fill" className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Help & Support Issues</h2>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Raise support tickets directly to platform admin</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon icon="ph:x-bold" className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation */}
          <div className={`flex gap-2 px-6 pt-4 border-b border-slate-200 dark:border-slate-800 ${isDark ? "bg-slate-950/40" : "bg-slate-50/50"}`}>
            <button
              onClick={() => setTab("create")}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                tab === "create"
                  ? "border-amber-500 text-amber-500"
                  : isDark ? "border-transparent text-slate-400 hover:text-slate-200" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon icon="ph:plus-circle-bold" className="w-4 h-4" />
              Raise New Issue
            </button>
            <button
              onClick={() => setTab("history")}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                tab === "history"
                  ? "border-amber-500 text-amber-500"
                  : isDark ? "border-transparent text-slate-400 hover:text-slate-200" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon icon="ph:clock-counter-clockwise-bold" className="w-4 h-4" />
              My Raised Tickets ({myIssues.length})
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {tab === "create" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category & Auto Priority */}
                <div className="grid sm:grid-cols-2 gap-4 items-center">
                  <CustomSelect
                    label="Issue Category"
                    options={ISSUE_TYPES}
                    value={type}
                    onChange={(val) => setType(val)}
                  />
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Calculated Priority
                    </label>
                    {(() => {
                      const prio = getAutoPriority(type);
                      return (
                        <div className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border text-xs font-bold ${prio.color}`}>
                          <Icon icon={prio.icon} className="w-4 h-4 shrink-0" />
                          <span>{prio.label}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Issue Summary / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Payment discrepancy for pickup #SCH-1002"
                    className={`w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all ${
                      isDark
                        ? "bg-slate-800/80 border-slate-700 text-white focus:border-amber-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500"
                    }`}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Detailed Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide exact details, dates, transaction IDs or pickup schedules affected..."
                    className={`w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all resize-none ${
                      isDark
                        ? "bg-slate-800/80 border-slate-700 text-white focus:border-amber-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500"
                    }`}
                  />
                </div>

                {/* Form Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                      isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-md cursor-pointer transition-all disabled:opacity-60 flex items-center gap-2"
                  >
                    {submitting ? <Icon icon="ph:spinner-gap" className="animate-spin w-4 h-4" /> : <Icon icon="ph:paper-plane-right-fill" className="w-4 h-4" />}
                    Submit Issue
                  </button>
                </div>
              </form>
            ) : (
              /* Raised Tickets History */
              <div>
                {loadingHistory ? (
                  <div className="flex justify-center py-12">
                    <Icon icon="ph:spinner-gap" className="animate-spin w-8 h-8 text-amber-500" />
                  </div>
                ) : myIssues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icon icon="ph:check-circle-duotone" className={`w-14 h-14 mb-3 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
                    <p className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>No support tickets submitted yet</p>
                    <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Use the "Raise New Issue" tab to submit a ticket to admin</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myIssues.map((issue) => (
                      <div
                        key={String(issue._id)}
                        className={`p-4 rounded-2xl border ${isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              issue.priority === "high"
                                ? "bg-red-500/15 text-red-500"
                                : issue.priority === "medium"
                                ? "bg-amber-500/15 text-amber-500"
                                : "bg-blue-500/15 text-blue-500"
                            }`}>
                              {issue.priority} priority
                            </span>
                            <h4 className={`font-bold text-sm mt-1.5 ${isDark ? "text-white" : "text-slate-900"}`}>{issue.title}</h4>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                            issue.status === "RESOLVED"
                              ? isDark ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : issue.status === "IN_PROGRESS"
                              ? isDark ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" : "bg-blue-50 text-blue-700 border border-blue-200"
                              : isDark ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {issue.status}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed mb-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{issue.description}</p>
                        <div className={`flex items-center justify-between text-[11px] pt-2 border-t ${isDark ? "border-slate-700/60 text-slate-500" : "border-slate-200 text-slate-400"}`}>
                          <span>Category: <strong className="capitalize">{issue.type}</strong></span>
                          <span>Reported: {new Date(issue.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RaiseIssueModal;
