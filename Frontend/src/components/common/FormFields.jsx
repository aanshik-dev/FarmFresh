import React from "react";

// Field wrapper — error prop is used only for the red border, message is shown via toast
export const Field = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-slate-300">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

export const inputCls = (isDark) =>
  `w-full rounded-xl border text-sm px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all ${
    isDark
      ? "bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-600"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
  }`;
