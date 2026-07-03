import React, { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { zonesData, farmerGroups } from "../../utils/InterfaceData";
import { useToast } from "../../components/ui";
import StatusBadge from "../../components/common/StatusBadge";

const ZoneManagement = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [zones, setZones] = useState(zonesData);
  const [selected, setSelected] = useState(null);

  const selectedZoneGroups = selected ? farmerGroups.filter(g => g.zone.includes(selected.name)) : [];

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Zones</h1>
        <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{zones.length} altitude zones managed</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Zone cards */}
        <div className="space-y-4">
          {zones.map((z, i) => (
            <motion.div
              key={z.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelected(selected?.id === z.id ? null : z)}
              className={`rounded-2xl border p-5 cursor-pointer transition-all ${selected?.id === z.id ? isDark ? "border-emerald-500/40 bg-emerald-500/8" : "border-emerald-300 bg-emerald-50" : isDark ? "bg-slate-900/60 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:shadow-md"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: z.color + "20" }}>
                    <span className="text-lg font-bold" style={{ color: z.color }}>{z.name.split(" ")[1]}</span>
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{z.name}</h3>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{z.altitude}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>{z.farmerGroupCount} groups</span>
              </div>
              <p className={`text-sm mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{z.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {z.cropTypes.map(ct => <span key={ct} className={`text-[10px] px-2 py-0.5 rounded-full border ${isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}>{ct}</span>)}
                <span className={`text-xs ml-auto ${isDark ? "text-slate-500" : "text-slate-400"}`}>Coord.: {z.coordinator}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Zone detail */}
        <div className={`rounded-2xl border p-5 h-fit ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          {selected ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black" style={{ background: selected.color + "20", color: selected.color }}>{selected.name.split(" ")[1]}</div>
                <div>
                  <h2 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>{selected.name}</h2>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{selected.altitude} · {selected.coordinator}</p>
                </div>
              </div>
              <p className={`text-sm mb-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{selected.description}</p>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Farmer Groups in this Zone ({selectedZoneGroups.length})</h3>
              <div className="space-y-2">
                {selectedZoneGroups.length === 0 ? (
                  <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No groups assigned to this zone yet.</p>
                ) : selectedZoneGroups.map(g => (
                  <div key={g.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                    <img src={g.profilePhoto} alt="" className="w-9 h-9 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{g.groupName}</p>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{g.leadFarmer} · {g.numberOfFarmers} farmers</p>
                    </div>
                    <span className={`text-[10px] font-medium ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>{g.yield}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Icon icon="ph:map-trifold-fill" className={`w-10 h-10 mb-3 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
              <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>Select a zone to see its farmer groups and details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZoneManagement;
