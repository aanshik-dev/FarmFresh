import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";

/**
 * Modal — accessible dialog component
 *
 * @param {object}   props
 * @param {boolean}  props.isOpen            - controls visibility
 * @param {Function} props.onClose           - called on backdrop click or Escape
 * @param {string}   [props.title]           - modal heading
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md']
 * @param {boolean}  [props.showClose=true]  - show the ✕ button
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.footer]   - optional footer content (buttons etc.)
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  size = "md",
  showClose = true,
  children,
  footer,
}) => {
  const { isDark } = useTheme();
  const overlayRef = useRef(null);
  const firstFocusable = useRef(null);

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstFocusable.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.target === overlayRef.current && onClose?.()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            className={`
              relative z-10 w-full ${sizeClasses[size]}
              rounded-2xl shadow-2xl overflow-hidden border
              ${isDark
                ? "bg-slate-900 border-slate-700/60 shadow-black/50"
                : "bg-white border-slate-200 shadow-slate-400/30"
              }
            `}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {(title || showClose) && (
              <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                {title && (
                  <h2
                    id="modal-title"
                    className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {title}
                  </h2>
                )}
                {showClose && (
                  <button
                    ref={firstFocusable}
                    onClick={onClose}
                    className={`ml-auto p-1.5 rounded-lg transition-all cursor-pointer ${
                      isDark
                        ? "text-slate-400 hover:text-white hover:bg-slate-700/60"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    aria-label="Close modal"
                  >
                    <Icon icon="material-symbols:close-rounded" className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            <div className={`px-6 py-5 text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {children}
            </div>

            {footer && (
              <div className={`px-6 pb-5 flex justify-end gap-3 border-t pt-4 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
