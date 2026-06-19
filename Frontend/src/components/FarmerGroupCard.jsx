import React from "react";
import { Icon } from "@iconify/react";

const FarmerGroupCard = ({ group }) => {
  const isDark = group.theme === "dark";

  return (
    <div
      className={`
        w-full max-w-sm rounded-2xl shadow-xl overflow-hidden transition-all duration-300 
        hover:-translate-y-1 hover:shadow-2xl
        ${
          isDark
            ? "bg-slate-900/80 backdrop-blur-sm border border-slate-800 hover:shadow-emerald-500/10"
            : "bg-white/90 backdrop-blur-sm border border-slate-200 hover:shadow-emerald-500/20"
        }
      `}
    >
      {/* Header with gradient and profile */}
      <div
        className={`
          p-4 flex items-center gap-4
          ${
            isDark
              ? "bg-gradient-to-r from-emerald-900/60 via-emerald-800/40 to-amber-800/30"
              : "bg-gradient-to-r from-emerald-50 via-emerald-100/50 to-amber-50"
          }
        `}
      >
        <img
          src={group.profile}
          alt=""
          className="w-14 h-14 rounded-full border-2 object-cover shadow-lg"
          style={{
            borderColor: isDark ? "#34d399" : "#059669", // emerald-400 / emerald-600
          }}
        />
        <div className="flex-1 min-w-0">
          <h3
            className={`text-lg font-bold truncate ${
              isDark ? "text-white" : "text-slate-800"
            }`}
          >
            {group.groupName}
          </h3>
          <p
            className={`text-sm flex items-center gap-1 truncate ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            <Icon
              icon="mdi:map-marker-outline"
              className={isDark ? "text-emerald-400" : "text-emerald-600"}
            />
            <span className="truncate">{group.address}</span>
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 space-y-3">
        {/* Status, Yield, Distance */}
        <div className="flex justify-between items-center">
          <span
            className={`
              px-2.5 py-0.5 rounded-full text-xs font-medium 
              ${
                group.status === "Ready"
                  ? isDark
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                  : isDark
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-amber-100 text-amber-700 border border-amber-300"
              }
            `}
          >
            {group.status}
          </span>
          <span
            className={`font-bold text-sm flex items-center gap-1 ${
              isDark ? "text-emerald-400" : "text-emerald-700"
            }`}
          >
            <Icon icon="mdi:chart-line" className="w-4 h-4" />
            {group.yield}
          </span>
          <span
            className={`text-sm flex items-center gap-1 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            <Icon
              icon="mdi:map-marker-distance"
              className={isDark ? "text-emerald-400" : "text-emerald-600"}
            />
            {group.distance}
          </span>
        </div>

        {/* Crops */}
        <div>
          <p
            className={`text-[10px] uppercase tracking-wider font-medium ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Crops
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {group.crops.map((crop) => (
              <span
                key={crop}
                className={`
                  px-2.5 py-0.5 rounded-md text-xs
                  ${
                    isDark
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-100 text-slate-700"
                  }
                `}
              >
                {crop}
              </span>
            ))}
          </div>
        </div>

        {/* Lead Farmer & Phone */}
        <div
          className={`
            flex items-center justify-between pt-3
            ${isDark ? "border-t border-slate-800" : "border-t border-slate-200"}
          `}
        >
          <div>
            <p
              className={`text-[10px] uppercase tracking-wider font-medium ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Lead Farmer
            </p>
            <p
              className={`text-sm font-semibold ${
                isDark ? "text-white" : "text-slate-800"
              }`}
            >
              {group.leadFarmer}
            </p>
          </div>
          <div
            className={`flex items-center gap-2 text-sm ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            <Icon
              icon="mdi:phone-outline"
              className={isDark ? "text-emerald-400" : "text-emerald-600"}
            />
            <span>{group.phone}</span>
          </div>
        </div>

        {/* Email & Zone */}
        <div
          className={`
            flex justify-between text-xs pt-2
            ${isDark ? "border-t border-slate-800" : "border-t border-slate-200"}
          `}
        >
          <span
            className={`flex items-center gap-1 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            <Icon
              icon="mdi:email-outline"
              className={isDark ? "text-emerald-400" : "text-emerald-600"}
            />
            {group.email}
          </span>
          <span
            className={`flex items-center gap-1 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            <Icon
              icon="mdi:earth"
              className={isDark ? "text-emerald-400" : "text-emerald-600"}
            />
            {group.zone}
          </span>
        </div>

        {/* Footer with update and action */}
        <div
          className={`
            flex justify-between items-center pt-2
            ${isDark ? "border-t border-slate-800" : "border-t border-slate-200"}
          `}
        >
          <span
            className={`text-[10px] ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Updated {group.lastUpdated}
          </span>
          <button
            className={`
              px-4 py-1.5 rounded-lg text-sm font-medium transition-all shadow-lg
              ${
                isDark
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-emerald-500/20 hover:shadow-emerald-400/30"
                  : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-emerald-500/30 hover:shadow-emerald-400/40"
              }
            `}
          >
            Get Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmerGroupCard;