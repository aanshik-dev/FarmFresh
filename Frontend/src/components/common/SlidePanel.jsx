import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";

/**
 * SlidePanel — slides in from the right side of the screen.
 *
 * Props:
 *   isOpen   : boolean
 *   onClose  : () => void
 *   title    : string
 *   children : React.ReactNode
 *   width    : string  (default "460px")
 *   subtitle : string  (optional)
 */
const SlidePanel = ({ isOpen, onClose, title, subtitle, children, width = "460px" }) => {
  const { isDark } = useTheme();

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            style={{ width, maxWidth: "100vw" }}
            className={`fixed right-0 top-0 bottom-0 z-[110] flex flex-col shadow-2xl ${
              isDark
                ? "bg-slate-900 border-l border-slate-800"
                : "bg-white border-l border-slate-200"
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-start justify-between px-6 py-5 border-b shrink-0 ${
                isDark ? "border-slate-800" : "border-slate-100"
              }`}
            >
              <div>
                <h2
                  className={`text-lg font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p
                    className={`text-xs mt-0.5 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors cursor-pointer ml-4 mt-0.5 shrink-0 ${
                  isDark
                    ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <Icon icon="material-symbols:close-rounded" className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 no-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SlidePanel;
