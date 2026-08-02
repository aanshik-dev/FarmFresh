import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { adminAPI } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";
import { Loader, Input } from "../../components/ui";

const FarmerGroupAdmin = () => {
  const { isDark } = useTheme();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await adminAPI.getFarmerGroups();
        setGroups(res.data.groups);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load farmer groups");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.leadFarmer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <Loader size="lg" />
        <p className={`mt-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading Farmer Groups...</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Farmer Groups</h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {groups.length} registered {groups.length === 1 ? "group" : "groups"} on the platform
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            icon="ph:magnifying-glass"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Icon icon="ph:plant-duotone" className={`w-16 h-16 mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
          <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>No groups found</h3>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredGroups.map((g, i) => (
              <motion.div
                key={g.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className={`rounded-2xl border p-5 transition-shadow hover:shadow-lg ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    {g.profile ? (
                      <img src={g.profile} alt={g.name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon icon="ph:plant-fill" className="w-6 h-6 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-base truncate ${isDark ? "text-white" : "text-slate-900"}`}>{g.name}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{g.leadFarmer} · {g.farmerCount} farmers</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusBadge status={g.status} size="sm" />
                      {g.rating && (
                        <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium ${isDark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
                          <Icon icon="ph:star-fill" /> {g.rating} ({g.reviews})
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Memberships", val: `${g.activeMemberships}/${g.memberships} active`, icon: "ph:handshake" },
                    { label: "Total Pickups", val: g.totalPickups, icon: "ph:truck" },
                    { label: "Earnings", val: `₹${g.totalEarnings?.toLocaleString() || 0}`, icon: "ph:wallet" },
                    { label: "Active Zones", val: g.zones?.length > 0 ? g.zones.join(", ") : "None", icon: "ph:map-pin" },
                  ].map((d) => (
                    <div key={d.label} className={`p-3 rounded-xl flex flex-col gap-1 ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                      <div className="flex items-center gap-1.5">
                        <Icon icon={d.icon} className={isDark ? "text-slate-500" : "text-slate-400"} />
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{d.label}</p>
                      </div>
                      <p className={`font-semibold truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{d.val}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default FarmerGroupAdmin;
