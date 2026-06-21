import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";

/**
 * Toast system
 *
 * Usage:
 *   1. Wrap your app (or a subtree) in <ToastProvider>
 *   2. In any child: const { toast } = useToast();
 *      toast.success("Saved!") / toast.error("Failed.") / toast.info("Note") / toast.warning("Watch out")
 *
 * toast(message, options) options:
 *   @param {'success'|'error'|'info'|'warning'} [type='info']
 *   @param {number} [duration=3500]   - ms before auto-dismiss (0 = manual only)
 *   @param {string} [title]           - optional bold heading above message
 */

const ToastContext = createContext(null);

const ICONS = {
  success: { icon: "ph:check-circle-fill", color: "text-emerald-400" },
  error:   { icon: "ph:x-circle-fill",     color: "text-red-400" },
  warning: { icon: "ph:warning-fill",       color: "text-amber-400" },
  info:    { icon: "ph:info-fill",          color: "text-sky-400" },
};

const BORDERS = {
  success: "border-emerald-500/30",
  error:   "border-red-500/30",
  warning: "border-amber-500/30",
  info:    "border-sky-500/30",
};

let _id = 0;

export const ToastProvider = ({ children }) => {
  const { isDark } = useTheme();
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, { type = "info", duration = 3500, title } = {}) => {
      const id = ++_id;
      setToasts((prev) => [...prev, { id, message, type, title }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = {
    show,
    success: (msg, opts) => show(msg, { ...opts, type: "success" }),
    error:   (msg, opts) => show(msg, { ...opts, type: "error" }),
    warning: (msg, opts) => show(msg, { ...opts, type: "warning" }),
    info:    (msg, opts) => show(msg, { ...opts, type: "info" }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div
        className="fixed bottom-5 right-5 z-[200] flex flex-col gap-3 pointer-events-none max-w-[calc(100vw-2.5rem)]"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.92 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`
                pointer-events-auto
                flex items-start gap-3 min-w-[260px] max-w-sm
                backdrop-blur-md border ${BORDERS[t.type]} rounded-xl
                px-4 py-3 shadow-2xl
                ${isDark ? "bg-slate-900/95 shadow-black/40" : "bg-white/95 shadow-slate-400/30"}
              `}
              role="alert"
            >
              <Icon
                icon={ICONS[t.type].icon}
                className={`w-5 h-5 mt-0.5 shrink-0 ${ICONS[t.type].color}`}
              />
              <div className="flex-1 min-w-0">
                {t.title && (
                  <p className={`text-sm font-semibold mb-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{t.title}</p>
                )}
                <p className={`text-sm break-words ${isDark ? "text-slate-300" : "text-slate-600"}`}>{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className={`shrink-0 p-0.5 rounded transition-colors cursor-pointer ${
                  isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-700"
                }`}
                aria-label="Dismiss"
              >
                <Icon icon="material-symbols:close-rounded" className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx;
};

/**
 * Standalone Toast display component (if you prefer to pass toasts manually)
 * Props: same shape as internal toast object
 */
export const Toast = ({ type = "info", title, message, onDismiss }) => {
  const { isDark } = useTheme();
  return (
    <div
      className={`
        flex items-start gap-3 min-w-[260px] max-w-sm
        backdrop-blur-md border ${BORDERS[type]} rounded-xl
        px-4 py-3 shadow-2xl
        ${isDark ? "bg-slate-900/95 shadow-black/40" : "bg-white/95 shadow-slate-400/30"}
      `}
      role="alert"
    >
      <Icon icon={ICONS[type].icon} className={`w-5 h-5 mt-0.5 shrink-0 ${ICONS[type].color}`} />
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-semibold mb-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{title}</p>}
        <p className={`text-sm break-words ${isDark ? "text-slate-300" : "text-slate-600"}`}>{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`shrink-0 p-0.5 rounded transition-colors cursor-pointer ${
            isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-700"
          }`}
          aria-label="Dismiss"
        >
          <Icon icon="material-symbols:close-rounded" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Toast;
