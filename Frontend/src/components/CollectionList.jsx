import React, { useState } from "react";
import { Icon } from "@iconify/react";

const CollectionItem = ({ item, isDark }) => {
  const [isOpen, setIsOpen] = useState(false);

  const isCompleted = item.status === "Completed";

  return (
    <div
      className={`
        rounded-xl overflow-hidden transition-all duration-200 border
        ${
          isDark
            ? "bg-slate-900/60 backdrop-blur-sm border-slate-800/80 hover:border-slate-700"
            : "bg-white border-slate-200 hover:border-slate-300"
        }
      `}
    >
      {/* Clickable Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none transition-colors
          ${
            isOpen
              ? isDark
                ? "bg-slate-800/40"
                : "bg-slate-50/80"
              : "hover:bg-slate-800/10"
          }
        `}
      >
        {/* Left Side: Basic Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`p-2 rounded-lg mt-0.5 ${
              isDark ? "bg-slate-800 text-emerald-400" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <Icon icon="mdi:package-variant-closed" className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className={`text-base font-bold truncate ${isDark ? "text-white" : "text-slate-800"}`}
            >
              {item.farmerGroupName}
            </h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
              <span className={`flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <Icon icon="mdi:earth" className={isDark ? "text-emerald-400" : "text-emerald-600"} />
                {item.zone}
              </span>
              <span className={`flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <Icon icon="mdi:calendar-clock" className={isDark ? "text-emerald-400" : "text-emerald-600"} />
                {item.scheduledDate}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Key Metrics & Action */}
        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/20">
          <div className="flex items-center gap-3">
            {/* Quantity */}
            <span
              className={`text-sm font-bold flex items-center gap-1 ${
                isDark ? "text-emerald-400" : "text-emerald-700"
              }`}
            >
              <Icon icon="mdi:scale-balance" className="w-4 h-4" />
              {item.quantityKg} kg
            </span>

            {/* Status Badge */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isCompleted
                  ? isDark
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                  : isDark
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-amber-100 text-amber-700 border border-amber-300"
              }`}
            >
              {item.status}
            </span>
          </div>

          {/* Collapse Icon */}
          <Icon
            icon="mdi:chevron-down"
            className={`w-5 h-5 transition-transform duration-300 ${
              isDark ? "text-slate-400" : "text-slate-500"
            } ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Collapsible Content */}
      <div
        className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? "max-h-96 border-t" : "max-h-0"}
          ${isDark ? "border-slate-800/60" : "border-slate-100"}
        `}
      >
        <div className="p-4 space-y-4 text-sm">
          {/* Crops Row */}
          <div>
            <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Crops in Collection
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {item.crops.map((crop) => (
                <span
                  key={crop}
                  className={`px-2.5 py-0.5 rounded-md text-xs ${
                    isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {crop}
                </span>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          {item.coordinatorNote && (
            <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800/40" : "bg-slate-50"}`}>
              <p className={`text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <Icon icon="mdi:clipboard-text-outline" className="text-emerald-500" />
                Coordinator Note
              </p>
              <p className={`mt-1 text-xs italic ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                "{item.coordinatorNote}"
              </p>
            </div>
          )}

          {/* Footer Meta Details */}
          <div className="flex flex-wrap justify-between items-center pt-2 text-[11px]">
            <div className={`flex gap-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <span>ID: <strong className={isDark ? "text-slate-400" : "text-slate-600"}>{item.id}</strong></span>
              <span>Group ID: <strong className={isDark ? "text-slate-400" : "text-slate-600"}>{item.farmerGroupId}</strong></span>
            </div>
            <span className={isDark ? "text-slate-500" : "text-slate-400"}>
              Logged: {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * CollectionListView - Container Component
 */
const CollectionListView = ({ collections, isDark = true }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-3">
      {/* Optional Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}>
          <Icon icon="mdi:archive-clock-outline" className="text-emerald-500" />
          Collection Logistics
        </h2>
        <span className={`text-xs px-2 py-1 rounded-md ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"}`}>
          Total: {collections.length}
        </span>
      </div>

      {/* List Container */}
      <div className="space-y-2.5">
        {collections.map((item) => (
          <CollectionItem key={item.id} item={item} isDark={isDark} />
        ))}
      </div>
    </div>
  );
};

export default CollectionListView;