import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { adminAPI } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";
import { Loader, Input } from "../../components/ui";

const CollectiveAdmin = () => {
  const { isDark } = useTheme();
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCollectives = async () => {
      try {
        const res = await adminAPI.getCollectives();
        setCollectives(res.data.collectives);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load collectives");
      } finally {
        setLoading(false);
      }
    };
    fetchCollectives();
  }, []);

  const filteredCollectives = collectives.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <Loader size="lg" />
        <p className={`mt-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading Collectives...</p>
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
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Collectives</h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {collectives.length} active {collectives.length === 1 ? "collective" : "collectives"}
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            icon="ph:magnifying-glass"
            placeholder="Search collectives..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {filteredCollectives.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Icon icon="ph:buildings-duotone" className={`w-16 h-16 mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
          <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>No collectives found</h3>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Try adjusting your search terms</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredCollectives.map((c, i) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className={`rounded-2xl border p-5 transition-shadow hover:shadow-lg flex flex-col justify-between ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                      {c.profile ? (
                        <img src={c.profile} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon icon="ph:buildings-fill" className="w-6 h-6 text-indigo-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`font-bold text-base truncate ${isDark ? "text-white" : "text-slate-900"}`}>{c.name}</p>
                        <Icon icon="ph:seal-check-fill" className="w-4 h-4 text-blue-500 shrink-0" />
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {c.contactPerson} · {c.address}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <StatusBadge status={c.status} size="sm" />
                        {c.rating && (
                          <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium ${isDark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
                            <Icon icon="ph:star-fill" /> {c.rating} ({c.reviews})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    {[
                      { label: "Memberships", val: c.memberships, icon: "ph:users" },
                      { label: "Workers", val: c.totalWorkers, icon: "ph:hard-hat" },
                      { label: "Drivers", val: c.totalDrivers, icon: "ph:steering-wheel" },
                      { label: "Harvests", val: c.totalHarvests, icon: "ph:package" },
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
                </div>

                {c.activeZones && c.activeZones.length > 0 && (
                  <div>
                    <p className={`text-[10px] uppercase font-bold tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Active Zones</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.activeZones.map((z) => (
                        <span key={z} className={`text-xs px-2 py-1 rounded-md border ${isDark ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-600"}`}>
                          {z}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CollectiveAdmin;
