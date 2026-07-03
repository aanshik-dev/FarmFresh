import React from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ProgressWizard — step indicator for multi-step forms
 *
 * @param {{ label: string, icon: string }[]} steps
 * @param {number} currentStep — 0-indexed
 * @param {string} [className]
 */
const ProgressWizard = ({ steps, currentStep, className = "" }) => {
  const { isDark } = useTheme();

  return (
    <div className={`flex items-center justify-between w-full ${className}`}>
      {steps.map((step, i) => {
        const isDone = i < currentStep;
        const isActive = i === currentStep;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <motion.div
                animate={
                  isDone
                    ? { scale: 1, backgroundColor: "#10b981" }
                    : isActive
                    ? { scale: 1.1 }
                    : { scale: 1 }
                }
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                  ${isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isActive
                    ? isDark
                      ? "border-emerald-400 bg-emerald-500/20 text-emerald-400"
                      : "border-emerald-500 bg-emerald-50 text-emerald-600"
                    : isDark
                    ? "border-slate-600 bg-slate-800 text-slate-500"
                    : "border-slate-300 bg-white text-slate-400"
                  }
                `}
              >
                {isDone ? (
                  <Icon icon="ph:check-bold" className="w-4 h-4" />
                ) : (
                  <Icon icon={step.icon} className="w-4 h-4" />
                )}
              </motion.div>
              <span
                className={`text-xs text-center hidden sm:block font-medium truncate max-w-20 ${
                  isActive
                    ? isDark ? "text-emerald-400" : "text-emerald-600"
                    : isDone
                    ? isDark ? "text-emerald-500" : "text-emerald-600"
                    : isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 transition-colors duration-500 ${
                  isDone
                    ? "bg-emerald-500"
                    : isDark
                    ? "bg-slate-700"
                    : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressWizard;
