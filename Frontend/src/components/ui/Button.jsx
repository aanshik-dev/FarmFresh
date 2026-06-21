import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";

/**
 * Button — reusable button component
 *
 * @param {object}   props
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'}  [props.size='md']
 * @param {boolean}  [props.disabled=false]
 * @param {boolean}  [props.loading=false]   - shows a spinner and disables click
 * @param {string}   [props.icon]            - Iconify icon string shown before label
 * @param {string}   [props.iconRight]       - Iconify icon string shown after label
 * @param {string}   [props.className]       - extra Tailwind classes
 * @param {Function} [props.onClick]
 * @param {React.ReactNode} props.children
 */
const Button = ({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  iconRight,
  className = "",
  onClick,
  children,
  ...rest
}) => {
  const { isDark } = useTheme();
  const isDisabled = disabled || loading;

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3 text-base gap-2.5",
  };

  const iconSize = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-5 h-5" };

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-500/0",
    secondary:
      "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 shadow-lg shadow-amber-400/20 border border-amber-400/0",
    outline: isDark
      ? "bg-transparent border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
      : "bg-transparent border border-emerald-600 text-emerald-700 hover:bg-emerald-50",
    ghost: isDark
      ? "bg-transparent text-slate-300 hover:bg-slate-700/50 hover:text-white border border-transparent"
      : "bg-transparent text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 border border-transparent",
    danger:
      "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-lg shadow-red-500/20 border border-red-500/0",
  };

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.03 }}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-xl
        transition-all duration-200 cursor-pointer select-none
        focus-visible:outline-2 focus-visible:outline-emerald-400 focus-visible:outline-offset-2
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
        ${className}
      `}
      {...rest}
    >
      {loading ? (
        <Icon icon="svg-spinners:ring-resize" className={iconSize[size]} />
      ) : (
        icon && <Icon icon={icon} className={iconSize[size]} />
      )}
      {children}
      {iconRight && !loading && (
        <Icon icon={iconRight} className={iconSize[size]} />
      )}
    </motion.button>
  );
};

export default Button;
