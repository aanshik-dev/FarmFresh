import React from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";

/**
 * EmptyState — placeholder when a list or section has no content
 *
 * @param {string} [icon='ph:tray-fill']
 * @param {string} title
 * @param {string} [description]
 * @param {React.ReactNode} [action]
 * @param {'sm'|'md'|'lg'} [size='md']
 * @param {string} [className]
 */
const EmptyState = ({
  icon = "ph:tray-fill",
  title,
  description,
  action,
  size = "md",
  className = "",
}) => {
  const { isDark } = useTheme();

  const sizes = {
    sm: { wrapper: "py-8", icon: "w-10 h-10", title: "text-base", desc: "text-xs" },
    md: { wrapper: "py-14", icon: "w-14 h-14", title: "text-lg", desc: "text-sm" },
    lg: { wrapper: "py-20", icon: "w-20 h-20", title: "text-xl", desc: "text-base" },
  };

  const s = sizes[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center ${s.wrapper} ${className}`}>
      <div
        className={`rounded-2xl p-4 mb-4 ${
          isDark ? "bg-slate-800/60 text-slate-500" : "bg-slate-100 text-slate-400"
        }`}
      >
        <Icon icon={icon} className={s.icon} />
      </div>
      <p className={`font-semibold mb-1 ${s.title} ${isDark ? "text-slate-300" : "text-slate-700"}`}>
        {title}
      </p>
      {description && (
        <p className={`max-w-xs mb-4 ${s.desc} ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};

export default EmptyState;
