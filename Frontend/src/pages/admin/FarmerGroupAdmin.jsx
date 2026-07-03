import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { farmerGroups } from "../../utils/InterfaceData";
import StatusBadge from "../../components/common/StatusBadge";

const FarmerGroupAdmin = () => {
  const { isDark } = useTheme();
  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Farmer Groups</h1>
        <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{farmerGroups.length} registered groups</p>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {farmerGroups.map((g, i) => (
          <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="flex items-start gap-3 mb-3">
              <img src={g.profilePhoto} alt="" className="w-12 h-12 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>{g.groupName}</p>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{g.leadFarmer} · {g.numberOfFarmers} farmers</p>
              </div>
              <StatusBadge status={g.status} size="sm" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[{ label: "Zone", val: g.zone.split("·")[0].trim() }, { label: "Yield", val: g.yield }, { label: "Collective", val: g.collective.split(" ")[0] }, { label: "Rating", val: `★ ${g.rating}` }].map(d => (
                <div key={d.label} className={`p-2 rounded-lg ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                  <p className={`${isDark ? "text-slate-500" : "text-slate-400"}`}>{d.label}</p>
                  <p className={`font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{d.val}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FarmerGroupAdmin;
