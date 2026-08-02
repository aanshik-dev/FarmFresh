import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";

const StatCard = ({
  label,
  value,
  unit,
  valueObj,
  icon,
  sub,
  color = "emerald",
  onClick,
  trend,
  className = "",
}) => {
  const { isDark } = useTheme();

  const colorStyles = {
    emerald: {
      gradient: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/20",
      text: isDark ? "text-emerald-400" : "text-emerald-700",
      lightBg: "bg-emerald-50/70 border-emerald-200/60",
      badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400",
    },
    blue: {
      gradient: "from-blue-500 to-indigo-600",
      glow: "shadow-blue-500/20",
      text: isDark ? "text-blue-400" : "text-blue-700",
      lightBg: "bg-blue-50/70 border-blue-200/60",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400",
    },
    amber: {
      gradient: "from-amber-500 to-orange-600",
      glow: "shadow-amber-500/20",
      text: isDark ? "text-amber-400" : "text-amber-700",
      lightBg: "bg-amber-50/70 border-amber-200/60",
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400",
    },
    violet: {
      gradient: "from-violet-500 to-purple-600",
      glow: "shadow-violet-500/20",
      text: isDark ? "text-violet-400" : "text-violet-700",
      lightBg: "bg-violet-50/70 border-violet-200/60",
      badge: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-400",
    },
    teal: {
      gradient: "from-teal-500 to-emerald-600",
      glow: "shadow-teal-500/20",
      text: isDark ? "text-teal-400" : "text-teal-700",
      lightBg: "bg-teal-50/70 border-teal-200/60",
      badge: "bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-400",
    },
  };

  const theme = colorStyles[color] || colorStyles.emerald;
  const displayVal = valueObj ? valueObj.number : value;
  const displayUnit = valueObj ? valueObj.unit : unit;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${
        isDark
          ? "bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-xl"
          : "bg-white/95 border-slate-200/90 hover:border-emerald-500/40 hover:shadow-lg shadow-slate-200/50"
      } ${className}`}
    >
      {/* Top Dual-Tone Accent Stripe for Light Theme */}
      {!isDark && (
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient}`} />
      )}

      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-xs font-bold uppercase tracking-wider ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {label}
        </span>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${theme.gradient} shadow-md ${theme.glow}`}
        >
          <Icon icon={icon} className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span
          className={`text-2xl sm:text-3xl font-black tracking-tight ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          {displayVal}
        </span>
        {displayUnit && (
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? "text-slate-400" : "text-emerald-700"
            }`}
          >
            {displayUnit}
          </span>
        )}
      </div>

      {(sub || trend) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs font-medium">
          {trend && (
            <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${theme.badge}`}>
              {trend}
            </span>
          )}
          {sub && (
            <span className={isDark ? "text-slate-400" : "text-slate-600"}>
              {sub}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
