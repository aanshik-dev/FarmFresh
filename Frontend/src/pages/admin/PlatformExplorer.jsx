import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { adminAPI } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";
import { Loader, Input } from "../../components/ui";
import CustomSelect from "../../components/common/CustomSelect";

// Helper to format any address object into a single string
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

// Helper to safely format cell values for tabular preview
const formatCellValue = (val) => {
  if (val === null || val === undefined) return <span className="text-slate-400 font-mono">—</span>;
  if (typeof val === "boolean") {
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
        {val ? "TRUE" : "FALSE"}
      </span>
    );
  }
  if (typeof val === "object") {
    if (Array.isArray(val)) {
      return val.map((v) => (typeof v === "object" ? String(v.name || v.code || JSON.stringify(v)) : String(v))).join(", ");
    }
    return formatAddress(val);
  }
  const str = String(val);
  if (str.startsWith("http://") || str.startsWith("https://")) {
    return (
      <a href={str} target="_blank" rel="noreferrer" className="text-emerald-500 underline hover:text-emerald-400 font-mono truncate max-w-[160px] block">
        {str}
      </a>
    );
  }
  return str;
};

// ── Membership Status color map ───────────────────────────────────────────────
const MEM_STATUS_COLORS = {
  ACTIVE:   { dark: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", light: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PENDING:  { dark: "bg-amber-500/10 text-amber-400 border-amber-500/20",   light: "bg-amber-50 text-amber-700 border-amber-200" },
  INACTIVE: { dark: "bg-slate-700/50 text-slate-400 border-slate-700",       light: "bg-slate-100 text-slate-500 border-slate-200" },
  REJECTED: { dark: "bg-red-500/10 text-red-400 border-red-500/20",          light: "bg-red-50 text-red-700 border-red-200" },
};

const DEAL_STATUS_COLORS = {
  APPROVED:    "text-emerald-500",
  REQUESTED:   "text-blue-500",
  REJECTED:    "text-red-500",
  CANCELLED:   "text-slate-400",
  ABANDONED:   "text-slate-400",
  F_TERMINATE: "text-orange-400",
  C_TERMINATE: "text-orange-400",
};

// ── Database Collections Explorer Tab ─────────────────────────────────────────
const COLLECTION_OPTIONS = [
  { value: "farmergroups", label: "Farmer Groups" },
  { value: "collectives", label: "Collectives" },
  { value: "crops", label: "Crops Directory" },
  { value: "memberships", label: "Memberships" },
  { value: "zones", label: "Zones" },
  { value: "schedules", label: "Pickup Schedules" },
  { value: "scheduleitems", label: "Schedule Items" },
  { value: "users", label: "Platform Users" },
  { value: "issues", label: "Support Issues" },
  { value: "reviews", label: "Ratings & Reviews" },
  { value: "contacts", label: "Contact Inquiries" },
  { value: "payments", label: "Payments Ledger" },
];

const CollectionsTab = ({ isDark }) => {
  const [selectedCollection, setSelectedCollection] = useState("farmergroups");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminAPI.getCollectionData(selectedCollection);
        setDocs(res.data?.docs || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to query collection");
      } finally {
        setLoading(false);
      }
    };
    fetchCollection();
  }, [selectedCollection]);

  // Extract column headers dynamically from document keys
  const columns = useMemo(() => {
    if (!docs || docs.length === 0) return [];
    const keysSet = new Set();
    // Prioritize key columns like _id, name, code, leadFarmer, manager, address, status, createdAt
    const priority = ["_id", "name", "code", "leadFarmer", "manager", "email", "phone", "address", "status", "createdAt"];
    
    docs.forEach((doc) => {
      Object.keys(doc).forEach((k) => {
        if (k !== "__v") keysSet.add(k);
      });
    });

    const allKeys = Array.from(keysSet);
    return allKeys.sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [docs]);

  // Filter records by search bar across all fields
  const filteredDocs = useMemo(() => {
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter((doc) => {
      return Object.entries(doc).some(([k, v]) => {
        if (v === null || v === undefined) return false;
        const strVal = typeof v === "object" ? formatAddress(v) : String(v);
        return strVal.toLowerCase().includes(q);
      });
    });
  }, [docs, search]);

  return (
    <div className="space-y-5">
      {/* Selector & Search bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-64">
          <CustomSelect
            label="Select Collection"
            options={COLLECTION_OPTIONS}
            value={selectedCollection}
            onChange={(val) => setSelectedCollection(val)}
          />
        </div>
        <div className="w-full sm:w-80 pt-6 sm:pt-0">
          <Input
            icon="ph:magnifying-glass"
            placeholder={`Search ${selectedCollection} records...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Info summary */}
      <div className="flex items-center justify-between text-xs font-semibold px-1">
        <span className={isDark ? "text-slate-400" : "text-slate-600"}>
          Showing {filteredDocs.length} of {docs.length} records in <code className="font-mono text-emerald-500 font-bold">{selectedCollection}</code>
        </span>
        <span className={isDark ? "text-slate-500" : "text-slate-400"}>
          Addresses & sub-objects are formatted into single strings
        </span>
      </div>

      {/* Dynamic Data Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader size="lg" /></div>
      ) : error ? (
        <div className="text-center py-20 text-red-400 font-semibold">{error}</div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Icon icon="ph:database-duotone" className={`w-14 h-14 mb-3 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
          <p className={`text-base font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>No records found in {selectedCollection}</p>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-x-auto ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b uppercase font-bold tracking-wider text-[11px] ${isDark ? "bg-slate-950/80 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                {columns.map((col) => (
                  <th key={col} className="p-3.5 whitespace-nowrap font-mono">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-100"}`}>
              {filteredDocs.map((doc, idx) => (
                <tr key={String(doc._id || idx)} className={`transition-colors ${isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}>
                  {columns.map((colKey) => (
                    <td key={colKey} className={`p-3.5 max-w-xs truncate whitespace-nowrap ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      {formatCellValue(doc[colKey])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Memberships Tab ────────────────────────────────────────────────────────────
const MembershipsTab = ({ isDark }) => {
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminAPI.getRelations();
        setRelations(res.data.relations || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load relations");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    return (relations || []).filter((r) => {
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.farmerGroup?.name?.toLowerCase().includes(q) ||
          r.collective?.name?.toLowerCase().includes(q) ||
          r.zone?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [relations, statusFilter, search]);

  if (loading) return <div className="flex justify-center py-16"><Loader size="lg" /></div>;
  if (error) return <div className="text-center py-16 text-red-400">{error}</div>;

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 min-w-48">
          <Input icon="ph:magnifying-glass" placeholder="Search farmer, collective, zone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className={`flex gap-1 p-1 rounded-xl ${isDark ? "bg-slate-800/70" : "bg-slate-100"}`}>
          {["All", "ACTIVE", "PENDING", "INACTIVE", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                statusFilter === s
                  ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow"
                  : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <p className={`text-xs mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{filtered.length} relationships</p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icon icon="ph:graph-duotone" className={`w-14 h-14 mb-3 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
          <p className={`text-base font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>No relationships found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => {
            const memSC = MEM_STATUS_COLORS[r.status] || MEM_STATUS_COLORS.INACTIVE;
            const isExpanded = expandedId === String(r.membershipId);
            return (
              <motion.div
                key={String(r.membershipId)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
              >
                {/* Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : String(r.membershipId))}
                  className={`w-full text-left p-4 flex flex-wrap items-center gap-4 cursor-pointer transition-colors ${isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}
                >
                  {/* Farmer Group */}
                  <div className="flex items-center gap-3 flex-1 min-w-48">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      {r.farmerGroup?.profile ? (
                        <img src={r.farmerGroup.profile} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon icon="ph:plant-fill" className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>{r.farmerGroup?.name || "Unknown"}</p>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{r.farmerGroup?.leadFarmer} · {r.farmerGroup?.farmerCount} farmers</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <Icon icon="ph:arrows-left-right-bold" className={`w-4 h-4 shrink-0 ${isDark ? "text-slate-600" : "text-slate-300"}`} />

                  {/* Collective */}
                  <div className="flex items-center gap-3 flex-1 min-w-48">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                      {r.collective?.profile ? (
                        <img src={r.collective.profile} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon icon="ph:buildings-fill" className="w-5 h-5 text-indigo-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>{r.collective?.name || "Unknown"}</p>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{r.collective?.manager}</p>
                    </div>
                  </div>

                  {/* Zone */}
                  {r.zone && (
                    <div
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium ${isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-600"}`}
                      style={{ borderLeftColor: r.zone.color, borderLeftWidth: 3 }}
                    >
                      <Icon icon="ph:map-pin-fill" className="w-3.5 h-3.5" style={{ color: r.zone.color }} />
                      {r.zone.name}
                    </div>
                  )}

                  {/* Status + money */}
                  <div className="flex items-center gap-3 ml-auto shrink-0">
                    <div className="text-right">
                      <p className={`text-xs font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>₹{(r.totalEarnings || 0).toLocaleString()}</p>
                      <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{r.deals?.length || 0} deals</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${memSC[isDark ? "dark" : "light"]}`}>{r.status}</span>
                    <Icon icon={isExpanded ? "ph:caret-up-bold" : "ph:caret-down-bold"} className={`w-4 h-4 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                  </div>
                </button>

                {/* Expanded: deals */}
                <AnimatePresence>
                  {isExpanded && r.deals?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={`px-4 pb-4 pt-2 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Crop Deals ({r.deals.length})</p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {r.deals.map((deal) => (
                            <div key={String(deal.dealId)} className={`rounded-xl p-3 ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-6 h-6 rounded-md overflow-hidden bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                  {deal.cropImage ? <img src={deal.cropImage} alt="" className="w-full h-full object-cover" /> : <Icon icon="ph:leaf-fill" className="w-3.5 h-3.5 text-emerald-500" />}
                                </div>
                                <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{deal.cropName}</span>
                                <span className={`text-[10px] font-bold ml-auto ${DEAL_STATUS_COLORS[deal.status] || "text-slate-400"}`}>{deal.status}</span>
                              </div>
                              <div className={`grid grid-cols-2 gap-1.5 text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                <span>Price: <strong className={isDark ? "text-slate-200" : "text-slate-700"}>₹{deal.agreedPrice}/kg</strong></span>
                                <span>Collected: <strong className={isDark ? "text-slate-200" : "text-slate-700"}>{deal.totalCollected} kg</strong></span>
                                <span>Pickups: <strong className={isDark ? "text-slate-200" : "text-slate-700"}>{deal.pickupCount}</strong></span>
                                <span>Payment: <strong className={deal.paymentStatus === "PENDING" ? (isDark ? "text-amber-400" : "text-amber-600") : (isDark ? "text-emerald-400" : "text-emerald-600")}>{deal.paymentStatus || "—"}</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Membership financials */}
                        <div className={`mt-3 flex flex-wrap gap-4 text-xs pt-3 border-t ${isDark ? "border-slate-700 text-slate-400" : "border-slate-100 text-slate-500"}`}>
                          <span>Balance: <strong className={isDark ? "text-amber-400" : "text-amber-600"}>₹{(r.balance || 0).toLocaleString()}</strong></span>
                          <span>Lifetime earnings: <strong className={isDark ? "text-emerald-400" : "text-emerald-600"}>₹{(r.totalEarnings || 0).toLocaleString()}</strong></span>
                          {r.memberSince && <span>Member since: <strong className={isDark ? "text-slate-200" : "text-slate-700"}>{new Date(r.memberSince).toLocaleDateString()}</strong></span>}
                          {r.distance > 0 && <span>Distance: <strong className={isDark ? "text-slate-200" : "text-slate-700"}>{r.distance} km</strong></span>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Pending Payments Tab ──────────────────────────────────────────────────────
const PendingPaymentsTab = ({ isDark }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedColId, setExpandedColId] = useState(null);
  const [expandedFgId, setExpandedFgId] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminAPI.getPendingPayments();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load pending payments");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader size="lg" /></div>;
  if (error) return <div className="text-center py-16 text-red-400">{error}</div>;
  if (!data?.pendingPayments?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Icon icon="ph:check-circle-fill" className="w-14 h-14 text-emerald-500 mb-3" />
        <p className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>All payments settled!</p>
        <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>No pending dues across the platform</p>
      </div>
    );
  }

  return (
    <div>
      {/* Grand total banner */}
      <div className={`flex items-center gap-4 p-5 rounded-2xl border mb-5 ${isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
          <Icon icon="ph:clock-fill" className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-amber-500" : "text-amber-600"}`}>Total Pending Platform-Wide</p>
          <p className={`text-3xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>₹{(data.grandTotal || 0).toLocaleString()}</p>
        </div>
        <div className="ml-auto">
          <p className={`text-xs ${isDark ? "text-amber-500" : "text-amber-600"}`}>{data.pendingPayments.length} collective{data.pendingPayments.length > 1 ? "s" : ""} with dues</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.pendingPayments.map((colGroup) => {
          const colId = String(colGroup.collective?._id);
          const isColExpanded = expandedColId === colId;
          return (
            <div key={colId} className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
              {/* Collective header */}
              <button
                onClick={() => setExpandedColId(isColExpanded ? null : colId)}
                className={`w-full text-left flex items-center gap-4 p-4 cursor-pointer transition-colors ${isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  {colGroup.collective?.profile ? <img src={colGroup.collective.profile} alt="" className="w-full h-full object-cover" /> : <Icon icon="ph:buildings-fill" className="w-5 h-5 text-indigo-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{colGroup.collective?.name || "Unknown"}</p>
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{colGroup.farmerGroups.length} farmer group{colGroup.farmerGroups.length > 1 ? "s" : ""} with dues</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-base font-extrabold ${isDark ? "text-amber-400" : "text-amber-600"}`}>₹{colGroup.totalPending.toLocaleString()}</p>
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>pending</p>
                </div>
                <Icon icon={isColExpanded ? "ph:caret-up-bold" : "ph:caret-down-bold"} className={`w-4 h-4 shrink-0 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
              </button>

              {/* Farmer groups inside collective */}
              <AnimatePresence>
                {isColExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className={`border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                      {colGroup.farmerGroups.map((fgGroup) => {
                        const fgId = `${colId}_${String(fgGroup.farmerGroup?._id)}`;
                        const isFgExpanded = expandedFgId === fgId;
                        return (
                          <div key={fgId} className={`border-b last:border-b-0 ${isDark ? "border-slate-800/50" : "border-slate-100"}`}>
                            <button
                              onClick={() => setExpandedFgId(isFgExpanded ? null : fgId)}
                              className={`w-full text-left flex items-center gap-4 px-6 py-3.5 cursor-pointer transition-colors ${isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}`}
                            >
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                {fgGroup.farmerGroup?.profile ? <img src={fgGroup.farmerGroup.profile} alt="" className="w-full h-full object-cover" /> : <Icon icon="ph:plant-fill" className="w-4 h-4 text-emerald-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{fgGroup.farmerGroup?.name || "Unknown"}</p>
                                <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{fgGroup.items.length} items unpaid</p>
                              </div>
                              <p className={`font-bold text-sm shrink-0 ${isDark ? "text-amber-400" : "text-amber-600"}`}>₹{fgGroup.totalPending.toLocaleString()}</p>
                              <Icon icon={isFgExpanded ? "ph:caret-up-bold" : "ph:caret-down-bold"} className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                            </button>

                            <AnimatePresence>
                              {isFgExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                                  <div className={`px-6 pb-4 pt-2 ${isDark ? "bg-slate-800/20" : "bg-slate-50/50"}`}>
                                    <div className={`rounded-xl overflow-hidden border ${isDark ? "border-slate-700/50" : "border-slate-200"}`}>
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className={isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}>
                                            {["Crop", "Schedule", "Planned", "Collected", "Rate", "Amount"].map(h => (
                                              <th key={h} className="text-left px-3 py-2 font-semibold uppercase tracking-wider">{h}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDark ? "divide-slate-700/50" : "divide-slate-100"}`}>
                                          {fgGroup.items.map((item) => (
                                            <tr key={String(item.scheduleItemId)} className={isDark ? "bg-slate-900/30" : "bg-white"}>
                                              <td className={`px-3 py-2 font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{item.cropName}</td>
                                              <td className={`px-3 py-2 font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>{item.schedule?.code || "—"}</td>
                                              <td className={`px-3 py-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item.plannedQuantity} kg</td>
                                              <td className={`px-3 py-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item.collectedQuantity} kg</td>
                                              <td className={`px-3 py-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>₹{item.agreedPrice}/kg</td>
                                              <td className={`px-3 py-2 font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}>₹{item.totalAmount.toLocaleString()}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main PlatformExplorer ─────────────────────────────────────────────────────
const TABS = [
  { id: "collections",  label: "Database Explorer",icon: "ph:database-fill",       color: "from-emerald-500 to-teal-600" },
  { id: "memberships",  label: "Memberships",     icon: "ph:handshake-fill",      color: "from-violet-500 to-purple-600" },
  { id: "payments",     label: "Pending Payments", icon: "ph:clock-countdown-fill",color: "from-amber-500 to-orange-600" },
];

const PlatformExplorer = () => {
  const { isDark } = useTheme();
  const [tab, setTab] = useState("collections");

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Platform Explorer</h1>
        <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Query, preview, and explore all database collections, cross-relationships, and payment status
        </p>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl mb-6 w-fit ${isDark ? "bg-slate-800/70" : "bg-slate-100"}`}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              tab === t.id
                ? `bg-gradient-to-r ${t.color} text-white shadow`
                : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon icon={t.icon} className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "collections" && <CollectionsTab isDark={isDark} />}
          {tab === "memberships"  && <MembershipsTab isDark={isDark} />}
          {tab === "payments"     && <PendingPaymentsTab isDark={isDark} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PlatformExplorer;
