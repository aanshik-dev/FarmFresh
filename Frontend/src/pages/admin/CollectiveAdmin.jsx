import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { collectivesList } from "../../utils/InterfaceData";

const CollectiveAdmin = () => {
  const { isDark } = useTheme();
  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Collectives</h1>
        <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{collectivesList.length} collectives</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {collectivesList.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="flex items-start gap-3 mb-4">
              <img src={c.profilePhoto} alt="" className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{c.name}</p>
                  {c.isVerified && <Icon icon="ph:seal-check-fill" className="w-4 h-4 text-blue-400" />}
                </div>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{c.address}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[{ label: "Groups", val: c.farmerGroups }, { label: "Workers", val: c.workers }, { label: "Harvest", val: c.totalHarvest }, { label: "Rating", val: `★ ${c.rating}` }].map(d => (
                <div key={d.label} className={`p-2 rounded-lg ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                  <p className={isDark ? "text-slate-500" : "text-slate-400"}>{d.label}</p>
                  <p className={`font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{d.val}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {c.zones.map(z => <span key={z} className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"}`}>{z}</span>)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CollectiveAdmin;
