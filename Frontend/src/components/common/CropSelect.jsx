import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

const CropSelect = ({
  crops = [],
  value,
  onChange,
  disabled = false,
  placeholder = "Select a crop...",
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCrop = crops.find((c) => c.code === value);

  const handleSelect = (cropCode) => {
    if (disabled) return;
    onChange(cropCode);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
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
                ? "bg-slate-800/50 border-slate-700 text-white hover:border-slate-600"
                : "bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300"
        }`}
      >
        {selectedCrop ? (
          <div className="flex items-center justify-between w-full pr-2">
            {/* Left side: Circular image + Crop Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs ${
                  isDark
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {selectedCrop.image ? (
                  <img
                    src={selectedCrop.image}
                    alt={selectedCrop.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Icon icon="ph:plant-fill" className="w-4 h-4" />
                )}
              </div>
              <span className="font-semibold truncate text-sm">
                {selectedCrop.name}
              </span>
            </div>

            {/* Right side: Crop ID / Code */}
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ml-2 ${
                isDark
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {selectedCrop.code}
            </span>
          </div>
        ) : (
          <span className={isDark ? "text-slate-400" : "text-slate-500"}>
            {placeholder}
          </span>
        )}

        <Icon
          icon="ph:caret-down-bold"
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-emerald-500" : isDark ? "text-slate-400" : "text-slate-500"}`}
        />
      </button>

      {/* Downward Custom Listview Dropdown */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 2 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={`absolute top-full left-0 right-0 z-50 rounded-2xl border  shadow-2xl overflow-hidden  ${
              isDark
                ? "bg-slate-900 border-slate-700 shadow-black/60"
                : "bg-white border-slate-200 shadow-slate-300/50"
            }`}
          >
            {/* Scrollable list bounded to exactly 5 crop items height */}
            <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
              {crops.length === 0 ? (
                <div
                  className={`p-3 text-center text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  No crops available
                </div>
              ) : (
                crops.map((c) => {
                  const isSelected = c.code === value;
                  return (
                    <div
                      key={c.code}
                      onClick={() => handleSelect(c.code)}
                      className={`flex items-center justify-between px-3.5 py-2 transition-colors cursor-pointer ${
                        isSelected
                          ? isDark
                            ? "bg-emerald-500/15 text-white font-medium"
                            : "bg-emerald-50 text-slate-900 font-medium"
                          : isDark
                            ? "hover:bg-slate-800/80 text-slate-200"
                            : "hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      {/* Left Side: Circular Image + Crop Name */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs ${
                            isDark
                              ? "bg-slate-800 text-emerald-400"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {c.image ? (
                            <img
                              src={c.image}
                              alt={c.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon
                              icon="ph:plant-fill"
                              className="w-3.5 h-3.5"
                            />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold truncate leading-snug">
                            {c.name}
                          </span>
                          {c.season && (
                            <span
                              className={`text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {c.season} {c.category ? `• ${c.category}` : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Crop ID / Code (No Border) */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span
                          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? "bg-emerald-500 text-white"
                              : isDark
                                ? "bg-slate-800 text-emerald-400"
                                : "bg-slate-100 text-emerald-700"
                          }`}
                        >
                          {c.code}
                        </span>
                        {isSelected && (
                          <Icon
                            icon="ph:check-bold"
                            className="w-3.5 h-3.5 text-emerald-500"
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CropSelect;
