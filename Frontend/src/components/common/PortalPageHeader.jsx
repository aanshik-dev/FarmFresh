import React from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";

const PortalPageHeader = ({
  title,
  subtitle,
  icon = "ph:leaf-duotone",
  badge,
  actions,
  children,
  className = "",
}) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border transition-all duration-200 ${
        isDark
          ? "bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-emerald-950/40 border-slate-800 shadow-2xl"
          : "bg-gradient-to-r from-white via-emerald-50/60 to-amber-50/40 border-slate-200/90 shadow-md shadow-emerald-500/5"
      } ${className}`}
    >
      {/* Background Decorative Accent Ring */}
      <div
        className={`absolute -right-12 -top-12 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
          isDark ? "bg-emerald-500/10" : "bg-emerald-400/15"
        }`}
      />
      <div
        className={`absolute -left-12 -bottom-12 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          isDark ? "bg-teal-500/10" : "bg-amber-400/10"
        }`}
      />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          {icon && (
            <div
              className={`p-3.5 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                isDark
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-emerald-600 text-white shadow-emerald-600/25"
              }`}
            >
              <Icon icon={icon} className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {title}
              </h1>
              {badge && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isDark
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {badge}
                </span>
              )}
            </div>

            {subtitle && (
              <p
                className={`text-sm max-w-2xl font-medium ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-3 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>

      {children && <div className="relative mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/80">{children}</div>}
    </div>
  );
};

export default PortalPageHeader;
