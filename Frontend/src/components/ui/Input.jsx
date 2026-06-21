import React from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";

/**
 * Input — reusable text input component
 *
 * @param {object}   props
 * @param {string}   [props.label]           - label text shown above the input
 * @param {string}   [props.placeholder]
 * @param {'text'|'email'|'password'|'number'|'tel'|'search'} [props.type='text']
 * @param {string}   [props.value]
 * @param {Function} [props.onChange]
 * @param {string}   [props.error]           - error message; turns input red when set
 * @param {string}   [props.hint]            - helper text shown below input
 * @param {string}   [props.icon]            - Iconify icon in leading position
 * @param {boolean}  [props.disabled=false]
 * @param {boolean}  [props.required=false]
 * @param {string}   [props.className]       - extra classes for the wrapper div
 * @param {string}   [props.id]
 */
const Input = ({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  error,
  hint,
  icon,
  disabled = false,
  required = false,
  className = "",
  id,
  ...rest
}) => {
  const { isDark } = useTheme();
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Icon icon={icon} className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full rounded-xl border text-sm
            px-4 py-2.5 outline-none transition-all duration-200
            focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? "pl-10" : ""}
            ${
              isDark
                ? "bg-slate-800/60 text-slate-100 placeholder:text-slate-500"
                : "bg-white text-slate-900 placeholder:text-slate-400"
            }
            ${
              error
                ? "border-red-500/70 focus:ring-red-500/40 focus:border-red-500"
                : isDark
                ? "border-slate-700 hover:border-slate-600"
                : "border-slate-300 hover:border-slate-400"
            }
          `}
          {...rest}
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <Icon icon="ph:warning-circle-fill" className="w-3.5 h-3.5" />
          {error}
        </p>
      )}

      {hint && !error && (
        <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{hint}</p>
      )}
    </div>
  );
};

export default Input;
