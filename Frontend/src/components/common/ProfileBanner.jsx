import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const FIELDS = {
  FARMER_GROUP: [
    { key: "name", label: "Name", check: (u) => !!u?.name?.trim() },
    { key: "phone", label: "Phone", check: (u) => !!u?.phone?.trim() },
    { key: "leader", label: "Lead Farmer", check: (u) => !!u?.leader?.trim() },
    { key: "desc", label: "Description", check: (u) => !!u?.desc?.trim(), optional: true },
    {
      key: "address.locality",
      label: "Locality",
      check: (u) => !!u?.address?.locality?.trim(),
      optional: true,
    },
    {
      key: "address.area",
      label: "Area",
      check: (u) => !!u?.address?.area?.trim(),
      optional: true,
    },
    {
      key: "address.town",
      label: "Town",
      check: (u) => !!u?.address?.town?.trim(),
      optional: true,
    },
    {
      key: "address.district",
      label: "District",
      check: (u) => !!u?.address?.district?.trim(),
    },
    {
      key: "address.state",
      label: "State",
      check: (u) => !!u?.address?.state?.trim(),
    },
    {
      key: "address.pinCode",
      label: "Pin Code",
      check: (u) => !!u?.address?.pinCode?.trim(),
    },
  ],
  COLLECTIVE: [
    { key: "name", label: "Name", check: (u) => !!u?.name?.trim() },
    { key: "phone", label: "Phone", check: (u) => !!u?.phone?.trim() },
    { key: "leader", label: "Manager", check: (u) => !!u?.leader?.trim() },
    { key: "workers", label: "Workers", check: (u) => u?.workers != null },
    { key: "desc", label: "Description", check: (u) => !!u?.desc?.trim(), optional: true },
    {
      key: "address.locality",
      label: "Locality",
      check: (u) => !!u?.address?.locality?.trim(),
      optional: true,
    },
    {
      key: "address.area",
      label: "Area",
      check: (u) => !!u?.address?.area?.trim(),
      optional: true,
    },
    {
      key: "address.town",
      label: "Town",
      check: (u) => !!u?.address?.town?.trim(),
      optional: true,
    },
    {
      key: "address.district",
      label: "District",
      check: (u) => !!u?.address?.district?.trim(),
    },
    {
      key: "address.state",
      label: "State",
      check: (u) => !!u?.address?.state?.trim(),
    },
    {
      key: "address.pinCode",
      label: "Pin Code",
      check: (u) => !!u?.address?.pinCode?.trim(),
    },
  ],
};

export const getProfileCompletion = (user) => {
  if (!user || !user.role || user.role === "ADMIN") return 100;
  const fields = FIELDS[user.role] || [];
  if (!fields.length) return 100;
  const filled = fields.filter((f) => f.check(user)).length;
  return Math.round((filled / fields.length) * 100);
};

export const getMissingFields = (user) => {
  if (!user || !user.role || user.role === "ADMIN") return [];
  const fields = FIELDS[user.role] || [];
  return fields.filter((f) => !f.optional && !f.check(user)).map((f) => f.label);
};

// ─── Banner ────────────────────────────────────────────────────────────────
const PROFILE_PATHS = {
  FARMER_GROUP: "/dashboard/farmer/profile",
  COLLECTIVE: "/dashboard/collective/profile",
  ADMIN: "/dashboard/admin/profile",
};

const SESSION_KEY = "profile_banner_dismissed";

const ProfileBanner = ({ onVisibilityChange }) => {
  const { user, profileLoading } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true",
  );

  const completion = getProfileCompletion(user);
  const missing = getMissingFields(user);
  // Do not show if all required fields are filled
  const isVisible =
    !profileLoading &&
    missing.length > 0 &&
    !dismissed &&
    !!user &&
    user.role !== "ADMIN";

  useEffect(() => {
    onVisibilityChange?.(isVisible);
  }, [isVisible, onVisibilityChange]);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    setDismissed(true);
  };

  const profilePath = PROFILE_PATHS[user?.role];

  // Color scheme based on completion
  const colorScheme =
    completion < 40
      ? {
          bar: "bg-red-500",
          track: "bg-red-500/20",
          text: "text-red-400",
          border: "border-red-500/30",
          bg: isDark ? "bg-red-950/60" : "bg-red-50",
          icon: "ph:warning-fill",
        }
      : completion < 80
        ? {
            bar: "bg-amber-500",
            track: "bg-amber-500/20",
            text: "text-amber-400",
            border: "border-amber-500/30",
            bg: isDark ? "bg-amber-950/60" : "bg-amber-50",
            icon: "ph:info-fill",
          }
        : {
            bar: "bg-emerald-500",
            track: "bg-emerald-500/20",
            text: "text-emerald-400",
            border: "border-emerald-500/30",
            bg: isDark ? "bg-emerald-950/60" : "bg-emerald-50",
            icon: "ph:check-circle-fill",
          };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="profile-banner"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`sticky top-16 z-30 border-b backdrop-blur-sm ${colorScheme.bg} ${colorScheme.border}`}
        >
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
            {/* Icon */}
            <Icon
              icon={colorScheme.icon}
              className={`w-4 h-4 shrink-0 ${colorScheme.text}`}
            />

            {/* Text */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"} whitespace-nowrap`}
              >
                Your profile is{" "}
                <span className={`font-bold ${colorScheme.text}`}>
                  {completion}% complete
                </span>
              </p>

              {/* Progress bar */}
              <div
                className={`flex-1 max-w-32 h-1.5 rounded-full ${colorScheme.track} hidden sm:block`}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className={`h-full rounded-full ${colorScheme.bar}`}
                />
              </div>

              {/* Missing fields hint */}
              {missing.length > 0 && (
                <p
                  className={`text-xs hidden md:block ${isDark ? "text-slate-400" : "text-slate-500"} truncate`}
                >
                  Missing: {missing.slice(0, 3).join(", ")}
                  {missing.length > 3 && ` +${missing.length - 3} more`}
                </p>
              )}
            </div>

            {/* CTA */}
            {profilePath && (
              <button
                onClick={() => navigate(profilePath)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${colorScheme.text} ${colorScheme.border} hover:opacity-80`}
              >
                <Icon icon="ph:pencil-simple-fill" className="w-3.5 h-3.5" />
                Complete Profile
              </button>
            )}

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              }`}
              aria-label="Dismiss"
            >
              <Icon icon="material-symbols:close-rounded" className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileBanner;
