import React from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const PageHeader = ({ eyebrow, title, description, icon, isDark }) => (
  <header
    className={`w-full px-6 sm:px-10 lg:px-20 pt-28 sm:pt-32 pb-12 sm:pb-16 transition-colors duration-300 ${
      isDark
        ? "bg-linear-to-br from-emerald-950 via-slate-950 to-emerald-900 text-white"
        : "bg-linear-to-br from-emerald-50 via-white to-emerald-100 text-slate-900"
    }`}
  >
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="max-w-3xl mx-auto sm:mx-0"
    >
      {eyebrow && (
        <div className={`inline-flex items-center gap-2 backdrop-blur-sm border rounded-full px-3 py-1.5 text-xs font-mono tracking-wider uppercase mb-5 ${
          isDark
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-emerald-100 border-emerald-300 text-emerald-700"
        }`}>
          {icon && <Icon icon={icon} className="w-3.5 h-3.5" />}
          <span>{eyebrow}</span>
        </div>
      )}
      <h1 className={`font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight ${isDark ? "text-slate-100" : "text-slate-800"}`}>
        {title}
      </h1>
      {description && (
        <p className={`text-sm sm:text-base mt-4 leading-relaxed max-w-2xl ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          {description}
        </p>
      )}
    </motion.div>
  </header>
);

export default PageHeader;
