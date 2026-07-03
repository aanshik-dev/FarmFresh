import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";

/**
 * SlideToggle — animated sliding pill tab switcher
 *
 * @param {{ value: string, label: string, icon?: string }[]} options
 * @param {string} value
 * @param {(val: string) => void} onChange
 * @param {'sm'|'md'|'lg'} [size='md']
 * @param {string} [className]
 */
const SlideToggle = ({ options = [], value, onChange, size = "md", className = "" }) => {
  const { isDark } = useTheme();
  const activeIndex = options.findIndex((o) => o.value === value);

  const sizeClasses = {
    sm: { track: "h-9 text-xs gap-1", pill: "text-xs", icon: "w-3.5 h-3.5" },
    md: { track: "h-11 text-sm gap-1.5", pill: "text-sm", icon: "w-4 h-4" },
    lg: { track: "h-13 text-base gap-2", pill: "text-base", icon: "w-5 h-5" },
  };

  const cls = sizeClasses[size];

  return (
    <div
      className={`relative flex rounded-xl p-1 ${cls.track} ${
        isDark ? "bg-slate-800/70 border border-slate-700/60" : "bg-slate-100 border border-slate-200"
      } ${className}`}
    >
      {/* Sliding pill */}
      {activeIndex >= 0 && (
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20"
          style={{ width: `calc(${100 / options.length}% - 4px)` }}
          animate={{ x: activeIndex * (100 / options.length * 1) + "%" }}
          initial={false}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      )}

      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            relative flex-1 flex items-center justify-center gap-1.5 font-medium
            rounded-lg z-10 transition-colors duration-200 cursor-pointer px-3
            ${cls.pill}
            ${
              value === opt.value
                ? "text-white"
                : isDark
                ? "text-slate-400 hover:text-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }
          `}
        >
          {opt.icon && <Icon icon={opt.icon} className={cls.icon} />}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SlideToggle;
