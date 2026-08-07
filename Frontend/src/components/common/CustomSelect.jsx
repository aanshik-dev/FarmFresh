import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

const CustomSelect = ({
  options = [],
  value,
  onChange,
  label,
  placeholder = "Select option...",
  disabled = false,
  className = "",
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return String(opt.value).toLowerCase() === String(value).toLowerCase();
    }
    return String(opt).toLowerCase() === String(value).toLowerCase();
  });

  const getLabel = (opt) => {
    if (opt !== undefined && opt !== null) {
      return typeof opt === "object" ? opt.label : opt;
    }
    return value || placeholder;
  };

  const handleSelect = (opt) => {
    const val = typeof opt === "object" ? opt.value : opt;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((p) => !p)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all cursor-pointer ${
          disabled
            ? isDark
              ? "bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            : isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/20"
            : isDark
            ? "bg-slate-800/80 border-slate-700 text-white hover:border-slate-600"
            : "bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300"
        }`}
      >
        <span className={selectedOption ? "font-semibold" : isDark ? "text-slate-400" : "text-slate-500"}>
          {getLabel(selectedOption)}
        </span>
        <Icon
          icon="ph:caret-down-bold"
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-500" : isDark ? "text-slate-400" : "text-slate-500"
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 4 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute top-full left-0 right-0 z-50 rounded-xl border shadow-2xl overflow-hidden ${
              isDark ? "bg-slate-900 border-slate-700 shadow-black/60" : "bg-white border-slate-200 shadow-slate-300/50"
            }`}
          >
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
              {options.map((opt, idx) => {
                const optVal = typeof opt === "object" ? opt.value : opt;
                const optLabel = typeof opt === "object" ? opt.label : opt;
                const isSelected = optVal === value;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelect(opt)}
                    className={`flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                      isSelected
                        ? isDark
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-emerald-50 text-emerald-700"
                        : isDark
                        ? "hover:bg-slate-800/80 text-slate-200"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <span>{optLabel}</span>
                    {isSelected && <Icon icon="ph:check-bold" className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
