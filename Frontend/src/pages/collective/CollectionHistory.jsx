import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { pickupSchedules } from "../../utils/InterfaceData";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";

const CollectionHistory = () => {
  const { isDark } = useTheme();
  const completed = pickupSchedules.filter(s => s.status === "completed");
  const totalKg = completed.reduce((s, p) => s + p.quantity, 0);

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Collection History</h1>
        <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{completed.length} completed pickups · {totalKg} kg total</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: "ph:check-circle-fill", label: "Completed", value: completed.length, color: "text-emerald-400 bg-emerald-500/10" },
          { icon: "ph:scales-fill", label: "Total Kg", value: `${totalKg} kg`, color: "text-blue-400 bg-blue-500/10" },
          { icon: "ph:truck-fill", label: "Drivers Used", value: [...new Set(completed.map(s => s.driverId))].length, color: "text-amber-400 bg-amber-500/10" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}><Icon icon={s.icon} className="w-5 h-5" /></div>
            <p className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{s.value}</p>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {completed.length === 0 ? <EmptyState icon="ph:clock-counter-clockwise-fill" title="No completed pickups" description="Completed pickups will appear here." /> : (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <table className="w-full text-sm">
            <thead className={isDark ? "bg-slate-800/50" : "bg-slate-50"}>
              <tr>
                {["Date", "Farmer Group", "Crop", "Qty", "Driver", "Zone", "Status"].map(h => (
                  <th key={h} className={`text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-100"}`}>
              {completed.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className={isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}>
                  <td className={`px-5 py-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{new Date(s.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className={`px-5 py-4 font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{s.farmerGroup.split(" ").slice(0, 2).join(" ")}</td>
                  <td className={`px-5 py-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{s.crop}</td>
                  <td className={`px-5 py-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{s.quantity} kg</td>
                  <td className={`px-5 py-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{s.driver.split(" ")[0]}</td>
                  <td className={`px-5 py-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{s.zone}</td>
                  <td className="px-5 py-4"><StatusBadge status={s.status} size="sm" /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CollectionHistory;
