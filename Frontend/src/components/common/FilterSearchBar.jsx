import React from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";

const FilterSearchBar = ({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  tabs = [],
  activeTab,
  onTabChange,
  actions,
  className = "",
}) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        isDark
          ? "bg-slate-900/60 border-slate-800 shadow-lg"
          : "bg-white/95 border-slate-200/90 shadow-sm shadow-slate-200/40"
      } ${className}`}
    >
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        {onSearchChange !== undefined && (
          <div className="relative flex-1 min-w-[240px]">
            <Icon
              icon="ph:magnifying-glass-duotone"
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-medium transition-all outline-none border ${
                isDark
                  ? "bg-slate-950/70 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                  isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-800"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Icon icon="ph:x-bold" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Dropdown Filters */}
        {filters.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            {filters.map((flt, idx) => (
              <div key={idx} className="relative min-w-[140px] flex-1 sm:flex-none">
                {flt.icon && (
                  <Icon
                    icon={flt.icon}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  />
                )}
                <select
                  value={flt.value}
                  onChange={(e) => flt.onChange(e.target.value)}
                  className={`w-full ${
                    flt.icon ? "pl-9" : "pl-3.5"
                  } pr-8 py-2.5 rounded-xl text-sm font-medium transition-all outline-none border appearance-none cursor-pointer ${
                    isDark
                      ? "bg-slate-950/70 border-slate-800 text-slate-200 focus:border-emerald-500"
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500 focus:bg-white"
                  }`}
                >
                  {flt.options.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Icon
                  icon="ph:caret-down-bold"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Actions Slot */}
        {actions && <div className="flex items-center gap-2.5 flex-wrap shrink-0">{actions}</div>}
      </div>

      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange && onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? isDark
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-md shadow-emerald-500/10"
                      : "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.icon && <Icon icon={tab.icon} className="w-4 h-4" />}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? isDark
                          ? "bg-emerald-500/30 text-emerald-300"
                          : "bg-white/20 text-white"
                        : isDark
                        ? "bg-slate-800 text-slate-400"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterSearchBar;
