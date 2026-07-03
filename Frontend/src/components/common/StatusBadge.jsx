import React from "react";
import { Icon } from "@iconify/react";

const STATUS_CONFIG = {
  // Crop statuses
  ready:        { label: "Ready",          icon: "ph:check-circle-fill",   bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  growing:      { label: "Growing",        icon: "ph:plant-fill",          bg: "bg-blue-500/15",    text: "text-blue-400",   border: "border-blue-500/30" },
  out_of_season:{ label: "Out of Season",  icon: "ph:moon-fill",           bg: "bg-slate-500/15",   text: "text-slate-400",  border: "border-slate-500/30" },
  harvested:    { label: "Harvested",      icon: "ph:package-fill",        bg: "bg-amber-500/15",   text: "text-amber-400",  border: "border-amber-500/30" },
  // Membership statuses
  pending:      { label: "Pending",        icon: "ph:clock-fill",          bg: "bg-amber-500/15",   text: "text-amber-400",  border: "border-amber-500/30" },
  approved:     { label: "Approved",       icon: "ph:check-circle-fill",   bg: "bg-emerald-500/15", text: "text-emerald-400",border: "border-emerald-500/30" },
  rejected:     { label: "Rejected",       icon: "ph:x-circle-fill",       bg: "bg-red-500/15",     text: "text-red-400",    border: "border-red-500/30" },
  // Schedule statuses
  scheduled:    { label: "Scheduled",      icon: "ph:calendar-check-fill", bg: "bg-blue-500/15",    text: "text-blue-400",   border: "border-blue-500/30" },
  in_progress:  { label: "In Progress",    icon: "ph:truck-fill",          bg: "bg-violet-500/15",  text: "text-violet-400", border: "border-violet-500/30" },
  completed:    { label: "Completed",      icon: "ph:check-fat-fill",      bg: "bg-emerald-500/15", text: "text-emerald-400",border: "border-emerald-500/30" },
  cancelled:    { label: "Cancelled",      icon: "ph:prohibit-fill",       bg: "bg-red-500/15",     text: "text-red-400",    border: "border-red-500/30" },
  delayed:      { label: "Delayed",        icon: "ph:warning-fill",        bg: "bg-amber-500/15",   text: "text-amber-400",  border: "border-amber-500/30" },
  // User statuses
  active:       { label: "Active",         icon: "ph:circle-fill",         bg: "bg-emerald-500/15", text: "text-emerald-400",border: "border-emerald-500/30" },
  inactive:     { label: "Inactive",       icon: "ph:circle-fill",         bg: "bg-slate-500/15",   text: "text-slate-400",  border: "border-slate-500/30" },
  suspended:    { label: "Suspended",      icon: "ph:warning-circle-fill", bg: "bg-red-500/15",     text: "text-red-400",    border: "border-red-500/30" },
  // Issue statuses
  open:         { label: "Open",           icon: "ph:dot-outline-fill",    bg: "bg-red-500/15",     text: "text-red-400",    border: "border-red-500/30" },
  resolved:     { label: "Resolved",       icon: "ph:check-circle-fill",   bg: "bg-emerald-500/15", text: "text-emerald-400",border: "border-emerald-500/30" },
  // Inventory
  low_stock:    { label: "Low Stock",      icon: "ph:warning-fill",        bg: "bg-red-500/15",     text: "text-red-400",    border: "border-red-500/30" },
  in_stock:     { label: "In Stock",       icon: "ph:check-circle-fill",   bg: "bg-emerald-500/15", text: "text-emerald-400",border: "border-emerald-500/30" },
};

/**
 * StatusBadge — colored pill badge with icon and label
 *
 * @param {'ready'|'growing'|'out_of_season'|'harvested'|'pending'|'approved'|'rejected'|
 *          'scheduled'|'in_progress'|'completed'|'cancelled'|'active'|'inactive'|
 *          'suspended'|'open'|'resolved'|'low_stock'|'in_stock'} status
 * @param {'sm'|'md'} [size='md']
 * @param {boolean} [showIcon=true]
 * @param {string} [className]
 */
const StatusBadge = ({ status, size = "md", showIcon = true, className = "" }) => {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    icon: "ph:circle-fill",
    bg: "bg-slate-500/15",
    text: "text-slate-400",
    border: "border-slate-500/30",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium border rounded-full
        ${cfg.bg} ${cfg.text} ${cfg.border}
        ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}
        ${className}
      `}
    >
      {showIcon && <Icon icon={cfg.icon} className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />}
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
