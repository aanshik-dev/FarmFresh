import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";

/**
 * ConfirmModal — generic confirmation dialog
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {() => void} onConfirm
 * @param {string} [title='Are you sure?']
 * @param {string} [description]
 * @param {string} [confirmLabel='Confirm']
 * @param {'danger'|'primary'} [variant='danger']
 * @param {boolean} [loading=false]
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  variant = "danger",
  loading = false,
  icon,
}) => {
  const { isDark } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl z-10 ${
              isDark
                ? "bg-slate-900 border-slate-700 shadow-black/60"
                : "bg-white border-slate-200 shadow-slate-300/40"
            }`}
          >
            <div className="flex flex-col items-center text-center gap-3">
              {icon && (
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    variant === "danger"
                      ? "bg-red-500/15 text-red-400"
                      : "bg-emerald-500/15 text-emerald-400"
                  }`}
                >
                  <Icon icon={icon} className="w-7 h-7" />
                </div>
              )}
              <h3
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {title}
              </h3>
              {description && (
                <p
                  className={`text-sm leading-relaxed ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {description}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                  isDark
                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  variant === "danger"
                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-lg shadow-red-500/20"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20"
                } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {loading && (
                  <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />
                )}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
