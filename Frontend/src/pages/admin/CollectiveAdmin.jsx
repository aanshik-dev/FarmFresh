import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { adminAPI } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";
import { Loader, Input, useToast } from "../../components/ui";

const STATUS_TABS = ["All", "active", "inactive"];

const formatAddress = (addr) => {
  if (!addr) return "N/A";
  if (typeof addr === "string") return addr.trim() || "N/A";
  if (typeof addr === "object" && addr !== null) {
    if (addr.formattedAddress && String(addr.formattedAddress).trim()) {
      return String(addr.formattedAddress).trim();
    }
    const parts = [
      addr.street,
      addr.village,
      addr.locality,
      addr.area,
      addr.town,
      addr.district,
      addr.city,
      addr.state,
      addr.pincode,
      addr.pinCode,
      addr.zip,
    ]
      .map((p) => (p ? String(p).trim() : ""))
      .filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  }
  return String(addr).trim() || "N/A";
};

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  enter: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: "easeIn" } },
};

const CollectiveAdmin = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [displayMode, setDisplayMode] = useState("grid"); // "grid" | "table"
  const [togglingId, setTogglingId] = useState(null);

  // Navigation view: "list" | "detail"
  const [view, setView] = useState("list");
  const [selectedCollective, setSelectedCollective] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchCollectives = async () => {
      try {
        const res = await adminAPI.getCollectives();
        setCollectives(res.data?.collectives || []);
      } catch (err) {
        console.error("CollectiveAdmin fetch error:", err);
        setError(err.response?.data?.message || err.message || "Failed to load collectives");
      } finally {
        setLoading(false);
      }
    };
    fetchCollectives();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    setTogglingId(id);
    try {
      const newStatus = currentStatus !== "active";
      await adminAPI.updateUserStatus(id, { isActive: newStatus });
      setCollectives((prev) =>
        (prev || []).map((c) =>
          c.id === id ? { ...c, status: newStatus ? "active" : "inactive" } : c
        )
      );
      if (selectedCollective && selectedCollective.id === id) {
        setSelectedCollective((prev) => ({ ...prev, status: newStatus ? "active" : "inactive" }));
      }
      toast.success(`Collective ${newStatus ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const openDetail = (c) => {
    setSelectedCollective(c);
    setActiveTab("overview");
    setView("detail");
  };

  const filtered = (collectives || []).filter((c) => {
    if (!c) return false;
    const matchStatus = statusFilter === "All" || c.status === statusFilter;

    // Search across Name, Manager, Email, Phone, Address, Crops, Zones
    const q = searchTerm.trim().toLowerCase();
    const cropsString = (c.crops || [])
      .map((cr) => (typeof cr === "object" ? `${cr.name} ${cr.code} ${cr.category}` : String(cr)))
      .join(" ")
      .toLowerCase();
    const zonesString = (c.zones || []).map((z) => (typeof z === "object" ? z.name : String(z))).join(" ").toLowerCase();

    const matchSearch =
      !q ||
      (c.name && String(c.name).toLowerCase().includes(q)) ||
      (c.manager && String(c.manager).toLowerCase().includes(q)) ||
      (c.email && String(c.email).toLowerCase().includes(q)) ||
      (c.phone && String(c.phone).toLowerCase().includes(q)) ||
      (c.address && String(c.address).toLowerCase().includes(q)) ||
      cropsString.includes(q) ||
      zonesString.includes(q);

    return matchStatus && matchSearch;
  });

  const counts = {
    All: collectives?.length || 0,
    active: (collectives || []).filter((c) => c?.status === "active").length,
    inactive: (collectives || []).filter((c) => c?.status === "inactive").length,
  };

  if (loading && view === "list") {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <Loader size="lg" />
        <p className={`mt-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading Collectives...</p>
      </div>
    );
  }

  if (error && view === "list") {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${isDark ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-600"}`}>
        <Icon icon="ph:warning-circle-fill" className="w-12 h-12 text-red-500 mb-2" />
        <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Error Loading Collectives</h3>
        <p className="text-sm max-w-md mb-4">{String(error)}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 shadow-md cursor-pointer">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" variants={pageVariants} initial="initial" animate="enter" exit="exit">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Collectives Directory</h1>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {collectives?.length || 0} {collectives?.length === 1 ? "collective" : "collectives"} registered on the platform
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-full sm:w-72">
                  <Input
                    icon="ph:magnifying-glass"
                    placeholder="Search by name, manager, location, crop..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Display Mode Toggle */}
                <div className={`flex items-center p-1 rounded-xl border shrink-0 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <button
                    onClick={() => setDisplayMode("grid")}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${
                      displayMode === "grid"
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm"
                        : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
                    }`}
                    title="Grid View (Mini Cards)"
                  >
                    <Icon icon="ph:squares-four-bold" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDisplayMode("table")}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${
                      displayMode === "table"
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm"
                        : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
                    }`}
                    title="Table View (Database Explorer)"
                  >
                    <Icon icon="ph:table-bold" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Status filter tabs */}
            <div className={`flex flex-wrap gap-1 p-1 rounded-xl mb-6 w-fit ${isDark ? "bg-slate-800/70" : "bg-slate-100"}`}>
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer capitalize ${
                    statusFilter === tab
                      ? tab === "inactive"
                        ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow"
                        : tab === "active"
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow"
                        : "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow"
                      : isDark
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab === "All" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab] || 0})
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Icon icon="ph:buildings-duotone" className={`w-16 h-16 mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
                <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>No collectives found</h3>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Try adjusting your search or filter</p>
              </div>
            ) : displayMode === "grid" ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                <AnimatePresence>
                  {filtered.map((c, i) => (
                    <motion.div
                      key={String(c.id || i)}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      onClick={() => openDetail(c)}
                      className={`rounded-2xl border p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 ${
                        isDark
                          ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700"
                          : "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
                      }`}
                    >
                      {/* Top Banner Info */}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 border border-indigo-500/20">
                              {c.profile ? (
                                <img src={String(c.profile)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Icon icon="ph:buildings-fill" className="w-6 h-6 text-indigo-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <h3 className={`font-bold text-base truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                                  {String(c.name || "Unnamed Collective")}
                                </h3>
                                <Icon icon="ph:seal-check-fill" className="w-4 h-4 text-blue-500 shrink-0" />
                              </div>
                              <p className={`text-xs flex items-center gap-1 mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                <Icon icon="ph:user-gear-bold" className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="truncate">Manager: {String(c.manager || "N/A")}</span>
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={String(c.status || "active")} size="sm" />
                        </div>

                        {/* Location */}
                        {c.address && (
                          <p className={`text-xs flex items-center gap-1 truncate mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            <Icon icon="ph:map-pin-bold" className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className="truncate">{formatAddress(c.address)}</span>
                          </p>
                        )}

                        {/* Universal Mini Grid Stats */}
                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800/80 my-3 text-center">
                          <div>
                            <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? "text-slate-500" : "text-slate-400"}`}>Groups</span>
                            <span className={`font-bold text-sm text-indigo-400`}>{Number(c.activeGroups || 0)}</span>
                          </div>
                          <div>
                            <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? "text-slate-500" : "text-slate-400"}`}>Harvest</span>
                            <span className="font-bold text-sm text-emerald-500">{Number(c.totalHarvestKg || 0).toLocaleString()} kg</span>
                          </div>
                          <div>
                            <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? "text-slate-500" : "text-slate-400"}`}>Dues</span>
                            <span className={`font-bold text-sm ${c.pendingPaymentAmount > 0 ? "text-amber-500" : isDark ? "text-slate-300" : "text-slate-700"}`}>
                              ₹{Number(c.pendingPaymentAmount || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Trigger Action */}
                      <div className="flex items-center justify-between text-xs font-semibold pt-1">
                        <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                          {(c.crops || []).length} Crops Traded
                        </span>
                        <span className="text-indigo-400 flex items-center gap-1 font-bold">
                          View Details <Icon icon="ph:arrow-right-bold" className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              /* Database Explorer Table View */
              <div className={`rounded-2xl border overflow-x-auto ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b uppercase font-bold tracking-wider text-[11px] ${isDark ? "bg-slate-950/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                      <th className="p-4">Collective</th>
                      <th className="p-4">Manager & Workers</th>
                      <th className="p-4">Contact & Address</th>
                      <th className="p-4">Crops Traded</th>
                      <th className="p-4">Farmer Groups</th>
                      <th className="p-4 text-right">Harvest (kg)</th>
                      <th className="p-4 text-right">Pending Dues</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-100"}`}>
                    {filtered.map((c, i) => (
                      <tr
                        key={c.id || i}
                        onClick={() => openDetail(c)}
                        className={`cursor-pointer transition-colors ${isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}
                      >
                        {/* Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 border border-indigo-500/20">
                              {c.profile ? <img src={String(c.profile)} alt="" className="w-full h-full object-cover" /> : <Icon icon="ph:buildings-fill" className="w-5 h-5 text-indigo-500" />}
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{String(c.name || "Unnamed Collective")}</p>
                              <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>ID: {String(c.id).slice(-6)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Manager */}
                        <td className="p-4">
                          <p className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{String(c.manager || "N/A")}</p>
                          <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{Number(c.workers || 0)} Workers</p>
                        </td>

                        {/* Contact */}
                        <td className="p-4">
                          <p className={isDark ? "text-slate-300" : "text-slate-700"}>{String(c.email || c.phone || "N/A")}</p>
                          <p className={`text-[11px] truncate max-w-[160px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{formatAddress(c.address) || "—"}</p>
                        </td>

                        {/* Crops */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {(c.crops || []).slice(0, 3).map((cr, idx) => (
                              <span key={idx} className={`text-[10px] px-2 py-0.5 rounded border font-medium ${isDark ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300" : "bg-indigo-50 border-indigo-200 text-indigo-800"}`}>
                                {typeof cr === "object" ? cr.name : String(cr)}
                              </span>
                            ))}
                            {(c.crops || []).length > 3 && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                +{(c.crops || []).length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Groups */}
                        <td className="p-4">
                          <span className={`font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>{Number(c.activeGroups || 0)} Groups</span>
                        </td>

                        {/* Harvest */}
                        <td className="p-4 text-right">
                          <span className="font-bold text-emerald-500">{Number(c.totalHarvestKg || 0).toLocaleString()} kg</span>
                        </td>

                        {/* Dues */}
                        <td className="p-4 text-right">
                          <span className={`font-bold ${c.pendingPaymentAmount > 0 ? "text-amber-500" : isDark ? "text-slate-300" : "text-slate-700"}`}>
                            ₹{Number(c.pendingPaymentAmount || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <StatusBadge status={String(c.status || "active")} size="sm" />
                        </td>

                        {/* Action */}
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openDetail(c)}
                            className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isDark ? "bg-slate-800 text-indigo-400 hover:bg-slate-700" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            }`}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="detail" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="max-w-5xl mx-auto">
            {/* Back button */}
            <button
              onClick={() => setView("list")}
              className={`mb-6 flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors ${
                isDark ? "text-slate-400 hover:text-indigo-400" : "text-slate-500 hover:text-indigo-600"
              }`}
            >
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
              Back to Collectives Directory
            </button>

            {/* Main Details Container */}
            {selectedCollective && (
              <div className="space-y-6">
                {/* Banner Profile Header */}
                <div className={`rounded-2xl border p-6 backdrop-blur-xl ${
                  isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-md">
                        {selectedCollective.profile ? (
                          <img src={String(selectedCollective.profile)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon icon="ph:buildings-fill" className="w-8 h-8 text-indigo-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{String(selectedCollective.name || "Collective")}</h2>
                          <StatusBadge status={String(selectedCollective.status || "active")} size="sm" />
                        </div>
                        <p className={`text-xs mt-1 flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          <span>Manager: <strong>{String(selectedCollective.manager || "N/A")}</strong></span>
                          <span>•</span>
                          <span>{Number(selectedCollective.workers || 0)} Workers</span>
                        </p>
                      </div>
                    </div>

                    {/* Quick Header Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleStatus(selectedCollective.id, selectedCollective.status)}
                        disabled={togglingId === selectedCollective.id}
                        className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                          selectedCollective.status === "active"
                            ? isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30" : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            : isDark ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        <Icon icon={selectedCollective.status === "active" ? "ph:x-circle-bold" : "ph:check-circle-bold"} className="w-4 h-4" />
                        {selectedCollective.status === "active" ? "Deactivate Collective" : "Activate Collective"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className={`flex flex-wrap gap-2 p-1.5 rounded-2xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
                  {[
                    { id: "overview", label: "Overview & Contact", icon: "ph:user-gear-bold" },
                    { id: "crops", label: `Collected Crops (${(selectedCollective.crops || []).length})`, icon: "ph:basket-bold" },
                    { id: "groups", label: `Connected Farmer Groups (${(selectedCollective.farmerGroups || []).length})`, icon: "ph:plant-bold" },
                    { id: "schedules", label: "Schedules & Pickups", icon: "ph:calendar-check-bold" },
                    { id: "financials", label: "Pending Dues & Ledger", icon: "ph:currency-inr-bold" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === t.id
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                          : isDark
                          ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Icon icon={t.icon} className="w-4 h-4" />
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content Panels */}
                <div className={`rounded-2xl border p-6 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <h3 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Collective Overview & Information</h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Collective Manager</span>
                          <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{String(selectedCollective.manager || "N/A")}</span>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Assigned Workers</span>
                          <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{Number(selectedCollective.workers || 0)} Workers</span>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Email Address</span>
                          <span className={`font-semibold text-sm break-all ${isDark ? "text-white" : "text-slate-900"}`}>{String(selectedCollective.email || "N/A")}</span>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Phone Number</span>
                          <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{String(selectedCollective.phone || "N/A")}</span>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Operational Address</span>
                          <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{formatAddress(selectedCollective.address) || "N/A"}</span>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Joined Date</span>
                          <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{selectedCollective.createdAt ? new Date(selectedCollective.createdAt).toLocaleDateString() : "N/A"}</span>
                        </div>
                      </div>

                      {/* Operational Zones */}
                      {(selectedCollective.zones || []).length > 0 && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                          <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Operational Zones</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedCollective.zones.map((z, idx) => {
                              const zoneName = typeof z === "object" && z !== null ? String(z.name || z) : String(z);
                              return (
                                <span key={idx} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-100 border-slate-200 text-slate-800"}`}>
                                  {zoneName}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "crops" && (
                    <div>
                      <h3 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Collected Crops & Procurement Prices</h3>
                      {(selectedCollective.crops || []).length === 0 ? (
                        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>No active collected crops registered.</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selectedCollective.crops.map((cr, idx) => {
                            const name = typeof cr === "object" && cr !== null ? String(cr.name || cr.code || "Crop") : String(cr || "Crop");
                            const code = typeof cr === "object" && cr !== null ? String(cr.code || "") : "";
                            const cat = typeof cr === "object" && cr !== null ? String(cr.category || "") : "";
                            const price = typeof cr === "object" && cr !== null ? cr.price : null;
                            const img = typeof cr === "object" && cr !== null ? String(cr.image || "") : "";
                            return (
                              <div key={idx} className={`p-4 rounded-xl border flex items-center gap-3.5 ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                  {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Icon icon="ph:basket-fill" className="w-5 h-5 text-indigo-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{name}</p>
                                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{code} {cat ? `• ${cat}` : ""}</p>
                                </div>
                                {price && (
                                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
                                    ₹{price}/kg
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Connected Farmer Groups Detail Tab */}
                  {activeTab === "groups" && (
                    <div>
                      <h3 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
                        Connected Farmer Groups ({selectedCollective.farmerGroups?.length || 0})
                      </h3>
                      {(selectedCollective.farmerGroups || []).length === 0 ? (
                        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>No connected farmer groups found for this collective.</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                          {selectedCollective.farmerGroups.map((fg, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                  {fg.profile ? <img src={String(fg.profile)} alt="" className="w-full h-full object-cover" /> : <Icon icon="ph:plant-fill" className="w-6 h-6 text-emerald-500" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className={`font-bold text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>{String(fg.name || "Farmer Group")}</h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 capitalize">
                                      {String(fg.status || "active")}
                                    </span>
                                  </div>
                                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    Lead: <strong>{String(fg.leadFarmer || "N/A")}</strong> ({Number(fg.farmerCount || 0)} Farmers)
                                  </p>
                                  {fg.address && (
                                    <p className={`text-[11px] mt-0.5 truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>{formatAddress(fg.address)}</p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                                <div>
                                  <span className={`text-[10px] uppercase font-bold block ${isDark ? "text-slate-500" : "text-slate-400"}`}>Balance</span>
                                  <span className="font-bold text-emerald-500">₹{Number(fg.balance || 0).toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className={`text-[10px] uppercase font-bold block ${isDark ? "text-slate-500" : "text-slate-400"}`}>Lifetime Earnings</span>
                                  <span className={`font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>₹{Number(fg.totalEarnings || 0).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "schedules" && (
                    <div className="space-y-4">
                      <h3 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Pickup Schedules & Processing</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className={`p-5 rounded-2xl border ${isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>Total Processed Harvest</span>
                          <span className="text-2xl font-extrabold text-emerald-500">{Number(selectedCollective.totalHarvestKg || 0).toLocaleString()} kg</span>
                        </div>
                        <div className={`p-5 rounded-2xl border ${isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-blue-400" : "text-blue-700"}`}>Completed Pickups</span>
                          <span className="text-2xl font-extrabold text-blue-500">{Number(selectedCollective.totalSchedules || 0)} Pickups</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "financials" && (
                    <div className="space-y-6">
                      <h3 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Pending Dues & Financial Overview</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className={`p-5 rounded-2xl border ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-amber-400" : "text-amber-700"}`}>Outstanding Dues to Farmers</span>
                          <span className="text-2xl font-extrabold text-amber-500">₹{Number(selectedCollective.pendingPaymentAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className={`p-5 rounded-2xl border ${isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>Active Zones Operational</span>
                          <span className="text-2xl font-extrabold text-indigo-500">{Number(selectedCollective.zonesCount || (selectedCollective.zones || []).length || 0)} Zones</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollectiveAdmin;
