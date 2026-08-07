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

const FarmerGroupAdmin = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [displayMode, setDisplayMode] = useState("grid"); // "grid" | "table"
  const [togglingId, setTogglingId] = useState(null);

  // Navigation view: "list" | "detail"
  const [view, setView] = useState("list");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await adminAPI.getFarmerGroups();
        setGroups(res.data?.groups || []);
      } catch (err) {
        console.error("FarmerGroupAdmin fetch error:", err);
        setError(err.response?.data?.message || err.message || "Failed to load farmer groups");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    setTogglingId(id);
    try {
      const newStatus = currentStatus !== "active";
      await adminAPI.updateUserStatus(id, { isActive: newStatus });
      setGroups((prev) =>
        (prev || []).map((g) =>
          g.id === id ? { ...g, status: newStatus ? "active" : "inactive" } : g
        )
      );
      if (selectedGroup && selectedGroup.id === id) {
        setSelectedGroup((prev) => ({ ...prev, status: newStatus ? "active" : "inactive" }));
      }
      toast.success(`Farmer Group ${newStatus ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const openDetail = (g) => {
    setSelectedGroup(g);
    setActiveTab("overview");
    setView("detail");
  };

  const filtered = (groups || []).filter((g) => {
    if (!g) return false;
    const matchStatus = statusFilter === "All" || g.status === statusFilter;

    // Search across Name, Lead Farmer, Email, Phone, Address, Crops, Zones, Collectives
    const q = searchTerm.trim().toLowerCase();
    const cropsString = (g.crops || []).map((c) => (typeof c === "object" ? `${c.name} ${c.code} ${c.category}` : String(c))).join(" ").toLowerCase();
    const zonesString = (g.zones || []).map((z) => (typeof z === "object" ? z.name : String(z))).join(" ").toLowerCase();
    const colString = (g.collectives || []).map((col) => (typeof col === "object" ? col.name : String(col))).join(" ").toLowerCase();

    const matchSearch =
      !q ||
      (g.name && String(g.name).toLowerCase().includes(q)) ||
      (g.leadFarmer && String(g.leadFarmer).toLowerCase().includes(q)) ||
      (g.email && String(g.email).toLowerCase().includes(q)) ||
      (g.phone && String(g.phone).toLowerCase().includes(q)) ||
      (g.address && String(g.address).toLowerCase().includes(q)) ||
      cropsString.includes(q) ||
      zonesString.includes(q) ||
      colString.includes(q);

    return matchStatus && matchSearch;
  });

  const counts = {
    All: groups?.length || 0,
    active: (groups || []).filter((g) => g?.status === "active").length,
    inactive: (groups || []).filter((g) => g?.status === "inactive").length,
  };

  if (loading && view === "list") {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <Loader size="lg" />
        <p className={`mt-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading Farmer Groups...</p>
      </div>
    );
  }

  if (error && view === "list") {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${isDark ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-600"}`}>
        <Icon icon="ph:warning-circle-fill" className="w-12 h-12 text-red-500 mb-2" />
        <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Error Loading Farmer Groups</h3>
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
                <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Farmer Groups Directory</h1>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {groups?.length || 0} registered {groups?.length === 1 ? "group" : "groups"} on the platform
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-full sm:w-72">
                  <Input
                    icon="ph:magnifying-glass"
                    placeholder="Search by name, lead, location, crop..."
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
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm"
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
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm"
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
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow"
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
                <Icon icon="ph:plant-duotone" className={`w-16 h-16 mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
                <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>No groups found</h3>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Try adjusting your search or filter criteria</p>
              </div>
            ) : displayMode === "grid" ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                <AnimatePresence>
                  {filtered.map((g, i) => (
                    <motion.div
                      key={String(g.id || i)}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      onClick={() => openDetail(g)}
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
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 border border-emerald-500/20">
                              {g.profile ? (
                                <img src={String(g.profile)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Icon icon="ph:plant-fill" className="w-6 h-6 text-emerald-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className={`font-bold text-base truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                                {String(g.name || "Unnamed Group")}
                              </h3>
                              <p className={`text-xs flex items-center gap-1 mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                <Icon icon="ph:user-bold" className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="truncate">{String(g.leadFarmer || "N/A")}</span>
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={String(g.status || "active")} size="sm" />
                        </div>

                        {/* Location */}
                        {g.address && (
                          <p className={`text-xs flex items-center gap-1 truncate mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            <Icon icon="ph:map-pin-bold" className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className="truncate">{formatAddress(g.address)}</span>
                          </p>
                        )}

                        {/* Universal Mini Grid Stats */}
                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800/80 my-3 text-center">
                          <div>
                            <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? "text-slate-500" : "text-slate-400"}`}>Farmers</span>
                            <span className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{Number(g.farmerCount || 0)}</span>
                          </div>
                          <div>
                            <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? "text-slate-500" : "text-slate-400"}`}>Earnings</span>
                            <span className="font-bold text-sm text-emerald-500">₹{Number(g.totalEarnings || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? "text-slate-500" : "text-slate-400"}`}>Collectives</span>
                            <span className="font-bold text-sm text-indigo-400">{Number(g.activeMemberships || (g.collectives || []).length || 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Trigger Action */}
                      <div className="flex items-center justify-between text-xs font-semibold pt-1">
                        <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                          {(g.crops || []).length} Crops Grown
                        </span>
                        <span className="text-emerald-500 flex items-center gap-1 font-bold">
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
                      <th className="p-4">Farmer Group</th>
                      <th className="p-4">Lead Farmer & Members</th>
                      <th className="p-4">Contact & Address</th>
                      <th className="p-4">Crops Grown</th>
                      <th className="p-4">Connected Collectives</th>
                      <th className="p-4 text-right">Lifetime Earnings</th>
                      <th className="p-4 text-right">Pending Balance</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-100"}`}>
                    {filtered.map((g, i) => (
                      <tr
                        key={g.id || i}
                        onClick={() => openDetail(g)}
                        className={`cursor-pointer transition-colors ${isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}
                      >
                        {/* Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 border border-emerald-500/20">
                              {g.profile ? <img src={String(g.profile)} alt="" className="w-full h-full object-cover" /> : <Icon icon="ph:plant-fill" className="w-5 h-5 text-emerald-500" />}
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{String(g.name || "Unnamed Group")}</p>
                              <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>ID: {String(g.id).slice(-6)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Lead Farmer */}
                        <td className="p-4">
                          <p className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{String(g.leadFarmer || "N/A")}</p>
                          <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{Number(g.farmerCount || 0)} Farmers</p>
                        </td>

                        {/* Contact */}
                        <td className="p-4">
                          <p className={isDark ? "text-slate-300" : "text-slate-700"}>{String(g.email || g.phone || "N/A")}</p>
                          <p className={`text-[11px] truncate max-w-[160px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{formatAddress(g.address) || "—"}</p>
                        </td>

                        {/* Crops */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {(g.crops || []).slice(0, 3).map((c, idx) => (
                              <span key={idx} className={`text-[10px] px-2 py-0.5 rounded border font-medium ${isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
                                {typeof c === "object" ? c.name : String(c)}
                              </span>
                            ))}
                            {(g.crops || []).length > 3 && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                +{(g.crops || []).length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Collectives */}
                        <td className="p-4">
                          <span className={`font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>{(g.collectives || []).length} Collectives</span>
                        </td>

                        {/* Lifetime Earnings */}
                        <td className="p-4 text-right">
                          <span className="font-bold text-emerald-500">₹{Number(g.totalEarnings || 0).toLocaleString()}</span>
                        </td>

                        {/* Pending Balance */}
                        <td className="p-4 text-right">
                          <span className={`font-bold ${g.pendingBalance > 0 ? "text-amber-500" : isDark ? "text-slate-300" : "text-slate-700"}`}>
                            ₹{Number(g.pendingBalance || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <StatusBadge status={String(g.status || "active")} size="sm" />
                        </td>

                        {/* Action */}
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openDetail(g)}
                            className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isDark ? "bg-slate-800 text-emerald-400 hover:bg-slate-700" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
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
                isDark ? "text-slate-400 hover:text-emerald-400" : "text-slate-500 hover:text-emerald-600"
              }`}
            >
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
              Back to Farmer Groups Directory
            </button>

            {/* Main Details Container */}
            {selectedGroup && (
              <div className="space-y-6">
                {/* Banner Profile Header */}
                <div className={`rounded-2xl border p-6 backdrop-blur-xl ${
                  isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-md">
                        {selectedGroup.profile ? (
                          <img src={String(selectedGroup.profile)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon icon="ph:plant-fill" className="w-8 h-8 text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{String(selectedGroup.name || "Farmer Group")}</h2>
                          <StatusBadge status={String(selectedGroup.status || "active")} size="sm" />
                        </div>
                        <p className={`text-xs mt-1 flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          <span>Lead Farmer: <strong>{String(selectedGroup.leadFarmer || "N/A")}</strong></span>
                          <span>•</span>
                          <span>{Number(selectedGroup.farmerCount || 0)} Farmers</span>
                        </p>
                      </div>
                    </div>

                    {/* Quick Header Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleStatus(selectedGroup.id, selectedGroup.status)}
                        disabled={togglingId === selectedGroup.id}
                        className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                          selectedGroup.status === "active"
                            ? isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30" : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            : isDark ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        <Icon icon={selectedGroup.status === "active" ? "ph:x-circle-bold" : "ph:check-circle-bold"} className="w-4 h-4" />
                        {selectedGroup.status === "active" ? "Deactivate Group" : "Activate Group"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className={`flex flex-wrap gap-2 p-1.5 rounded-2xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
                  {[
                    { id: "overview", label: "Overview & Contact", icon: "ph:user-bold" },
                    { id: "crops", label: `Crops Grown (${(selectedGroup.crops || []).length})`, icon: "ph:leaf-bold" },
                    { id: "collectives", label: `Connected Collectives (${(selectedGroup.collectives || []).length})`, icon: "ph:buildings-bold" },
                    { id: "financials", label: "Financial Ledger", icon: "ph:currency-inr-bold" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === t.id
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
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
                      <h3 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Group Overview & Information</h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Lead Farmer</span>
                          <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{String(selectedGroup.leadFarmer || "N/A")}</span>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Farmer Members</span>
                          <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{Number(selectedGroup.farmerCount || 0)} Farmers</span>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Email Address</span>
                          <span className={`font-semibold text-sm break-all ${isDark ? "text-white" : "text-slate-900"}`}>{String(selectedGroup.email || "N/A")}</span>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Phone Number</span>
                          <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{String(selectedGroup.phone || "N/A")}</span>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Location Address</span>
                          <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{formatAddress(selectedGroup.address) || "N/A"}</span>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Joined Date</span>
                          <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{selectedGroup.createdAt ? new Date(selectedGroup.createdAt).toLocaleDateString() : "N/A"}</span>
                        </div>
                      </div>

                      {/* Operational Zones */}
                      {(selectedGroup.zones || []).length > 0 && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                          <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Assigned Zones</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedGroup.zones.map((z, idx) => {
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
                      <h3 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Active Cultivated Crops</h3>
                      {(selectedGroup.crops || []).length === 0 ? (
                        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>No active crops registered for this group.</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selectedGroup.crops.map((c, idx) => {
                            const name = typeof c === "object" && c !== null ? String(c.name || c.code || "Crop") : String(c || "Crop");
                            const code = typeof c === "object" && c !== null ? String(c.code || "") : "";
                            const cat = typeof c === "object" && c !== null ? String(c.category || "") : "";
                            const img = typeof c === "object" && c !== null ? String(c.image || "") : "";
                            return (
                              <div key={idx} className={`p-4 rounded-xl border flex items-center gap-3.5 ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                  {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Icon icon="ph:leaf-fill" className="w-5 h-5 text-emerald-500" />}
                                </div>
                                <div>
                                  <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{name}</p>
                                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{code} {cat ? `• ${cat}` : ""}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Connected Collectives Detail Tab */}
                  {activeTab === "collectives" && (
                    <div>
                      <h3 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
                        Partner Buyer Collectives ({(selectedGroup.collectives || []).length})
                      </h3>
                      {(selectedGroup.collectives || []).length === 0 ? (
                        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>No active collective partnerships.</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                          {selectedGroup.collectives.map((col, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                  {col.profile ? <img src={String(col.profile)} alt="" className="w-full h-full object-cover" /> : <Icon icon="ph:buildings-fill" className="w-6 h-6 text-indigo-500" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className={`font-bold text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>{String(col.name || "Collective")}</h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 capitalize">
                                      {String(col.status || "active")}
                                    </span>
                                  </div>
                                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    Manager: <strong>{String(col.manager || "N/A")}</strong>
                                  </p>
                                  {col.address && (
                                    <p className={`text-[11px] mt-0.5 truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>{formatAddress(col.address)}</p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                                <div>
                                  <span className={`text-[10px] uppercase font-bold block ${isDark ? "text-slate-500" : "text-slate-400"}`}>Pending Balance</span>
                                  <span className="font-bold text-amber-500">₹{Number(col.balance || 0).toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className={`text-[10px] uppercase font-bold block ${isDark ? "text-slate-500" : "text-slate-400"}`}>Lifetime Earnings</span>
                                  <span className={`font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>₹{Number(col.totalEarnings || 0).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "financials" && (
                    <div className="space-y-6">
                      <h3 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Financial Summary</h3>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className={`p-5 rounded-2xl border ${isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>Total Lifetime Earnings</span>
                          <span className="text-2xl font-extrabold text-emerald-500">₹{Number(selectedGroup.totalEarnings || 0).toLocaleString()}</span>
                        </div>
                        <div className={`p-5 rounded-2xl border ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-amber-400" : "text-amber-700"}`}>Pending Balance</span>
                          <span className="text-2xl font-extrabold text-amber-500">₹{Number(selectedGroup.pendingBalance || 0).toLocaleString()}</span>
                        </div>
                        <div className={`p-5 rounded-2xl border ${isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"}`}>
                          <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>Completed Pickups</span>
                          <span className="text-2xl font-extrabold text-indigo-500">{Number(selectedGroup.totalPickups || 0)}</span>
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

export default FarmerGroupAdmin;
