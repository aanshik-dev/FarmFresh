import React from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";

/**
 * Loader — spinner or skeleton loading indicator
 *
 * @param {object}   props
 * @param {'spinner'|'dots'|'skeleton'|'bar'} [props.variant='spinner']
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md']
 * @param {string}   [props.label]       - accessible label (also shown below spinner if labelVisible)
 * @param {boolean}  [props.labelVisible=false]
 * @param {string}   [props.className]   - extra classes on wrapper
 *
 * Skeleton-specific:
 * @param {number}   [props.lines=3]     - number of skeleton lines
 * @param {boolean}  [props.avatar=false] - show a circle placeholder (avatar)
 */
const Loader = ({
  variant = "spinner",
  size = "md",
  label = "Loading…",
  labelVisible = false,
  className = "",
  lines = 3,
  avatar = false,
}) => {
  const { isDark } = useTheme();
  const spinnerSize = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };
  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };
  const skeletonBg = isDark ? "bg-slate-700/60" : "bg-slate-200";
  const trackBg = isDark ? "bg-slate-800" : "bg-slate-200";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";

  if (variant === "skeleton") {
    return (
      <div
        className={`space-y-3 ${className}`}
        aria-label={label}
        aria-busy="true"
      >
        {avatar && (
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-12 h-12 rounded-full animate-pulse ${skeletonBg}`}
            />
            <div className="flex-1 space-y-2">
              <div
                className={`h-3 rounded-full animate-pulse w-3/4 ${skeletonBg}`}
              />
              <div
                className={`h-3 rounded-full animate-pulse w-1/2 ${skeletonBg}`}
              />
            </div>
          </div>
        )}
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-3 rounded-full animate-pulse ${skeletonBg}`}
            style={{ width: `${100 - i * 12}%` }}
          />
        ))}
      </div>
    );
  }

  if (variant === "bar") {
    return (
      <div
        className={`w-full ${className}`}
        aria-label={label}
        aria-busy="true"
      >
        <div className={`h-1 rounded-full overflow-hidden ${trackBg}`}>
          <div className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 animate-[progress_1.5s_ease-in-out_infinite] rounded-full" />
        </div>
        <style>{`
          @keyframes progress {
            0%   { width: 0%;   margin-left: 0% }
            50%  { width: 60%;  margin-left: 20% }
            100% { width: 0%;   margin-left: 100% }
          }
        `}</style>
      </div>
    );
  }

  if (variant === "dots") {
    const dotSize = {
      sm: "w-1.5 h-1.5",
      md: "w-2 h-2",
      lg: "w-3 h-3",
      xl: "w-4 h-4",
    };
    return (
      <div
        className={`flex items-center justify-center gap-1.5 ${className}`}
        aria-label={label}
        aria-busy="true"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${dotSize[size]} rounded-full bg-emerald-400 animate-bounce`}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
        {labelVisible && (
          <span className={`ml-2 ${mutedText} ${textSize[size]}`}>{label}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      aria-label={label}
      aria-busy="true"
    >
      <Icon
        icon="svg-spinners:ring-resize"
        className={`${spinnerSize[size]} text-emerald-400`}
      />
      {labelVisible && (
        <span className={`${mutedText} ${textSize[size]}`}>{label}</span>
      )}
    </div>
  );
};

export default Loader;
