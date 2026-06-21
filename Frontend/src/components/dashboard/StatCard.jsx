import React from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const StatCard = ({ stat, isDark, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.35, delay: index * 0.06 }}
    className={`rounded-2xl border p-5 flex flex-col gap-3 ${
      isDark
        ? "bg-slate-900/60 border-slate-800"
        : "bg-white border-slate-200"
    }`}
  >
    <div className="flex items-center justify-between">
      <div className={`p-2 rounded-xl ${isDark ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}>
        <Icon icon={stat.icon} className="w-5 h-5" />
      </div>
    </div>
    <div>
      <p className={`text-2xl sm:text-3xl font-bold font-display ${isDark ? "text-white" : "text-slate-900"}`}>
        {stat.value}
      </p>
      <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{stat.label}</p>
    </div>
    <p className={`text-xs font-medium ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>{stat.trend}</p>
  </motion.div>
);

export default StatCard;
