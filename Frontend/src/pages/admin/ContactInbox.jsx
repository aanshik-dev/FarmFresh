import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { adminAPI } from "../../services/api";
import { Loader, Input } from "../../components/ui";

const STATUS_COLORS = {
  FORWARDED: {
    dark: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    light: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  PENDING: {
    dark: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    light: "bg-amber-50 text-amber-700 border-amber-200",
  },
  FAILED: {
    dark: "bg-red-500/10 text-red-400 border-red-500/20",
    light: "bg-red-50 text-red-700 border-red-200",
  },
};

const STATUS_ICONS = {
  FORWARDED: "ph:check-circle-fill",
  PENDING: "ph:clock-fill",
  FAILED: "ph:x-circle-fill",
};

const ContactInbox = () => {
  const { isDark } = useTheme();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await adminAPI.getContacts();
        setContacts(res.data.contacts);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load contact submissions");
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const filtered = contacts.filter((c) => {
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    const matchSearch =
      !search.trim() ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.message?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    All: contacts.length,
    FORWARDED: contacts.filter((c) => c.status === "FORWARDED").length,
    PENDING: contacts.filter((c) => c.status === "PENDING").length,
    FAILED: contacts.filter((c) => c.status === "FAILED").length,
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <Loader size="lg" />
        <p className={`mt-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading Contact Inbox...</p>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Contact Inbox</h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {contacts.length} message{contacts.length !== 1 ? "s" : ""} received from the contact form
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            icon="ph:magnifying-glass"
            placeholder="Search by name, email, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { key: "All", label: "Total", icon: "ph:envelope-fill", color: "from-violet-500 to-purple-600" },
          { key: "FORWARDED", label: "Forwarded", icon: "ph:check-circle-fill", color: "from-emerald-500 to-teal-600" },
          { key: "PENDING", label: "Pending", icon: "ph:clock-fill", color: "from-amber-500 to-orange-500" },
          { key: "FAILED", label: "Failed", icon: "ph:x-circle-fill", color: "from-red-500 to-rose-600" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
              statusFilter === s.key
                ? isDark ? "border-slate-600 bg-slate-800/80" : "border-slate-300 bg-slate-100"
                : isDark ? "border-slate-800 bg-slate-900/60 hover:bg-slate-800/50" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.color} shadow mb-2`}>
              <Icon icon={s.icon} className="w-4 h-4 text-white" />
            </div>
            <p className={`text-xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>{counts[s.key]}</p>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Contact list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Icon icon="ph:envelope-open-duotone" className={`w-16 h-16 mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
          <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>No messages found</h3>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {search || statusFilter !== "All" ? "Try adjusting your search or filter" : "No contact form submissions yet"}
          </p>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <AnimatePresence>
            {filtered.map((c, i) => {
              const isExpanded = expandedId === c._id;
              const scKey = c.status || "PENDING";
              const sc = STATUS_COLORS[scKey] || STATUS_COLORS.PENDING;
              return (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : c._id)}
                    className={`w-full text-left px-5 py-4 flex items-start gap-4 transition-colors cursor-pointer ${
                      i > 0 ? `border-t ${isDark ? "border-slate-800" : "border-slate-100"}` : ""
                    } ${isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${isDark ? "bg-violet-500/15 text-violet-400" : "bg-violet-50 text-violet-700"}`}>
                      {c.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{c.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${sc[isDark ? "dark" : "light"]}`}>
                          <Icon icon={STATUS_ICONS[scKey] || "ph:clock-fill"} className="inline w-2.5 h-2.5 mr-1" />
                          {c.status}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{c.email}</p>
                      <p className={`text-sm mt-1 truncate ${isDark ? "text-slate-300" : "text-slate-600"}`}>{c.message}</p>
                    </div>
                    {/* Date + expand */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                      <Icon
                        icon={isExpanded ? "ph:caret-up-bold" : "ph:caret-down-bold"}
                        className={`w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      />
                    </div>
                  </button>

                  {/* Expanded message */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className={`px-5 pb-5 pt-2 border-t ${isDark ? "border-slate-800 bg-slate-900/30" : "border-slate-100 bg-slate-50/60"}`}>
                          <div className="flex flex-wrap gap-4 mb-3 text-xs">
                            <span className={`flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              <Icon icon="ph:user-fill" className="w-3.5 h-3.5" />
                              <strong>{c.name}</strong>
                            </span>
                            <a href={`mailto:${c.email}`} className={`flex items-center gap-1.5 hover:underline ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                              <Icon icon="ph:envelope-fill" className="w-3.5 h-3.5" />
                              {c.email}
                            </a>
                            <span className={`flex items-center gap-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                              <Icon icon="ph:calendar-fill" className="w-3.5 h-3.5" />
                              {new Date(c.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className={`rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${isDark ? "bg-slate-800 text-slate-200" : "bg-white text-slate-700 border border-slate-200"}`}>
                            {c.message}
                          </div>
                          {/* Reply link */}
                          <a
                            href={`mailto:${c.email}?subject=Re: Your FarmFresh Inquiry`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
                          >
                            <Icon icon="ph:paper-plane-tilt-fill" className="w-4 h-4" />
                            Reply via Email
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ContactInbox;
