import React, { useState, useCallback, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  farmerSidebarLinks,
  collectiveSidebarLinks,
  adminSidebarLinks,
} from "../../utils/InterfaceData";
import {
  farmerNotifAPI,
  farmerCropAPI,
  collectiveNotifAPI,
  collectiveMemberAPI,
} from "../../services/api";
import ProfileBanner from "../common/ProfileBanner";
import RaiseIssueModal from "../common/RaiseIssueModal";

// Quotes for dynamic greeting
const QUOTES = {
  morning: [
    { text: "Dew on the leaves, hope in the soil", icon: "ph:sun-dim-fill" },
    { text: "A fresh sunrise, a fresh harvest", icon: "ph:sun-horizon-fill" },
    { text: "The early bird catches the best yields", icon: "ph:bird-fill" },
    { text: "Fields are waking up, time to grow", icon: "ph:plant-fill" }
  ],
  noon: [
    { text: "Sun is high, crops are growing", icon: "ph:sun-fill" },
    { text: "Midday hustle for a golden harvest", icon: "ph:clock-fill" },
    { text: "Bright noon, bright future", icon: "ph:sparkle-fill" }
  ],
  afternoon: [
    { text: "The sun softens, the roots deepen", icon: "ph:tree-fill" },
    { text: "Steady work brings steady growth", icon: "ph:spade-fill" },
    { text: "Golden light on green fields", icon: "ph:leaf-fill" }
  ],
  evening: [
    { text: "The sun sets, the earth rests", icon: "ph:moon-stars-fill" },
    { text: "Another day of growth complete", icon: "ph:check-circle-fill" },
    { text: "Golden hour over golden fields", icon: "ph:camera-fill" }
  ],
  night: [
    { text: "Quiet night, growing roots", icon: "ph:moon-fill" },
    { text: "Under the stars, the soil heals", icon: "ph:star-fill" },
    { text: "Rest well, the crops sleep too", icon: "ph:cloud-moon-fill" }
  ]
};

// Top Header
const TopHeader = ({ onToggleSidebar, sidebarOpen, sidebarCollapsed, onCollapse, unreadNotifCount, onRaiseIssue }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const [quote, setQuote] = useState({ text: "", icon: "ph:plant-fill" });

  useEffect(() => {
    const hour = new Date().getHours();
    let timeOfDay = "night";
    if (hour >= 4 && hour < 11) timeOfDay = "morning";
    else if (hour >= 11 && hour < 14) timeOfDay = "noon";
    else if (hour >= 14 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 21) timeOfDay = "evening";

    const options = QUOTES[timeOfDay];
    setQuote(options[Math.floor(Math.random() * options.length)]);
  }, []);

  const roleBadge = {
    FARMER_GROUP: {
      label: "Farmer Group",
      icon: "ph:plant-fill",
      color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
    },
    COLLECTIVE: {
      label: "Collective",
      icon: "ph:buildings-fill",
      color: "text-blue-400 bg-blue-500/15 border-blue-500/30",
    },
    ADMIN: {
      label: "Admin",
      icon: "ph:shield-fill",
      color: "text-amber-400 bg-amber-500/15 border-amber-500/30",
    },
  }[role] || {
    label: role,
    icon: "ph:user-fill",
    color: "text-slate-400 bg-slate-500/15 border-slate-500/30",
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setProfileOpen(false);
  };

  const notifPath =
    role === "FARMER_GROUP"
      ? "/dashboard/farmer/notifications"
      : role === "COLLECTIVE"
        ? "/dashboard/collective/notifications"
        : null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 h-16 flex items-center px-4 gap-3 border-b ${
        isDark
          ? "bg-slate-950/90 border-slate-800/80 backdrop-blur-md"
          : "bg-white/90 border-slate-200 backdrop-blur-md"
      }`}
    >
      {/* Brand Section: Hamburger + Plant Icon + FarmFresh Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Desktop Collapse Button */}
        <button
          onClick={onCollapse}
          className={`hidden md:flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-colors cursor-pointer ${
            isDark
              ? "hover:bg-slate-800 text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
          }`}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon
            icon={sidebarCollapsed ? "material-symbols:menu-rounded" : "material-symbols:menu-open-rounded"}
            className="w-5 h-5"
          />
        </button>

        {/* Mobile Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className={`flex md:hidden items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-colors cursor-pointer ${
            isDark
              ? "hover:bg-slate-800 text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
          }`}
        >
          <Icon
            icon={
              sidebarOpen
                ? "material-symbols:close-rounded"
                : "material-symbols:menu-rounded"
            }
            className="w-5 h-5"
          />
        </button>

        {/* FarmFresh Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div
            className={`p-1.5 rounded-lg shrink-0 ${
              isDark
                ? "bg-emerald-800/70 text-emerald-300"
                : "bg-emerald-100 text-emerald-600"
            }`}
          >
            <Icon icon="ph:plant-fill" className="w-5 h-5" />
          </div>
          <span
            className={`font-bold text-sm quantico uppercase tracking-widest whitespace-nowrap ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            FarmFresh
          </span>
        </div>
      </div>

      {/* Center greeting */}
      <div className="flex-1"></div>
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center hidden md:flex min-w-0 pointer-events-none">
        <div className={`flex items-center gap-2 text-sm font-medium truncate ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          <Icon icon={quote.icon} className={`w-4 h-4 shrink-0 ${isDark ? "text-amber-400" : "text-amber-500"}`} />
          <p className="truncate">
            <span
              className={
                isDark
                  ? "text-white font-semibold"
                  : "text-slate-900 font-semibold"
              }
            >
              {user?.name?.split(" ")[0]}
            </span>
            <span className="mx-2 opacity-40">•</span>
            <span className="italic">{quote.text}</span>
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors cursor-pointer ${
            isDark
              ? "hover:bg-slate-800 text-amber-400"
              : "hover:bg-amber-50 text-amber-500"
          }`}
        >
          <Icon
            icon={isDark ? "ph:sun-fill" : "ph:moon-stars-fill"}
            className="w-4.5 h-4.5"
          />
        </button>

        {/* Raise Support Issue Icon */}
        <button
          onClick={onRaiseIssue}
          className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors cursor-pointer ${
            isDark
              ? "hover:bg-slate-800 text-amber-400"
              : "hover:bg-amber-50 text-amber-600"
          }`}
          title="Raise Support Issue"
        >
          <Icon icon="ph:warning-circle-fill" className="w-4.5 h-4.5" />
        </button>

        {/* Notifications Icon with Live Sync Badge */}
        {notifPath && (
          <button
            onClick={() => navigate(notifPath)}
            className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? "hover:bg-slate-800 text-slate-400 hover:text-white"
                : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
            }`}
            title="Notifications"
          >
            <Icon icon="ph:bell-fill" className="w-4.5 h-4.5" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center shadow-md">
                {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
              </span>
            )}
          </button>
        )}

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors cursor-pointer ${
              isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
            }`}
          >
            {user?.profile ? (
              <img
                src={user.profile}
                alt=""
                className="w-7 h-7 rounded-lg ring-1 object-cover ring-slate-500/40"
              />
            ) : (
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDark
                    ? "bg-emerald-700 text-emerald-200"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {user?.name?.charAt(0) || "?"}
              </div>
            )}
            <div className="hidden sm:flex flex-col items-start">
              <span
                className={`text-xs font-semibold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {user?.name?.split(" ")[0] || "User"}
              </span>
              <span
                className={`text-[10px] leading-tight ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                {roleBadge.label}
              </span>
            </div>
            <Icon
              icon="ph:caret-down-fill"
              className={`w-3 h-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute right-0 top-full mt-2 w-52 rounded-2xl border shadow-2xl py-1.5 z-50 ${
                  isDark
                    ? "bg-slate-900 border-slate-700 shadow-black/60"
                    : "bg-white border-slate-200 shadow-slate-300/40"
                }`}
              >
                <div
                  className={`px-4 py-3 border-b mb-1 ${isDark ? "border-slate-700/60" : "border-slate-100"}`}
                >
                  <p
                    className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {user?.name}
                  </p>
                  <p
                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {user?.email}
                  </p>
                  <span
                    className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${roleBadge.color}`}
                  >
                    <Icon icon={roleBadge.icon} className="w-2.5 h-2.5" />
                    {roleBadge.label}
                  </span>
                </div>

                {[
                  {
                    label: "Profile",
                    icon: "ph:user-circle-fill",
                    path:
                      role === "FARMER_GROUP"
                        ? "/dashboard/farmer/profile"
                        : role === "COLLECTIVE"
                          ? "/dashboard/collective/profile"
                          : role === "ADMIN"
                            ? "/dashboard/admin/profile"
                            : null,
                  },
                  {
                    label: "Settings",
                    icon: "ph:gear-six-fill",
                    path:
                      role === "FARMER_GROUP"
                        ? "/dashboard/farmer/settings"
                        : role === "COLLECTIVE"
                          ? "/dashboard/collective/settings"
                          : role === "ADMIN"
                            ? "/dashboard/admin/settings"
                            : null,
                  },
                ]
                  .filter((i) => i.path)
                  .map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        navigate(item.path);
                        setProfileOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors cursor-pointer ${
                        isDark
                          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon icon={item.icon} className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}

                <div
                  className={`border-t mt-1 pt-1 ${isDark ? "border-slate-700/60" : "border-slate-100"}`}
                >
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Icon icon="ph:sign-out-fill" className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ isOpen, isCollapsed, onCollapse, onClose, role, unreadNotifCount, actionNeededCropsCount, pendingFarmerRequestsCount }) => {
  const { isDark } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links =
    role === "FARMER_GROUP"
      ? farmerSidebarLinks
      : role === "COLLECTIVE"
        ? collectiveSidebarLinks
        : adminSidebarLinks;

  const handleNav = (path) => {
    navigate(path);
    onClose?.();
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderBadges = (linkPath) => {
    const isNotif = linkPath.includes("/notifications");
    const isCrops = linkPath.includes("/crops");
    const isFarmerGroups = linkPath.includes("/farmer-groups") || linkPath.includes("/farmers");

    if (isNotif && unreadNotifCount > 0) {
      return (
        <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-500 text-white shrink-0 shadow-sm">
          {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
        </span>
      );
    }

    if (isCrops && actionNeededCropsCount > 0) {
      return (
        <span className="ml-auto text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-500 text-white shrink-0 shadow-sm">
          Action
        </span>
      );
    }

    if (isFarmerGroups && pendingFarmerRequestsCount > 0) {
      return (
        <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500 text-white shrink-0 shadow-sm">
          {pendingFarmerRequestsCount}
        </span>
      );
    }

    return null;
  };

  // Desktop sidebar
  const DesktopSidebar = () => (
    <motion.aside
      animate={{ width: isCollapsed ? 68 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`hidden md:flex flex-col fixed left-0 top-16 bottom-0 z-30 border-r overflow-hidden ${
        isDark
          ? "bg-slate-950 border-slate-800/80"
          : "bg-white border-slate-200"
      }`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden py-3 no-scrollbar">
        <nav className="flex flex-col gap-0.5 px-2">
          {links.map((link) => {
            const isActive =
              location.pathname === link.path ||
              location.pathname.startsWith(link.path + "/");
            const isFarmerGroups = link.path.includes("/farmer-groups") || link.path.includes("/farmers");

            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                title={isCollapsed ? link.label : undefined}
                className={`
                  relative flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer
                  ${isCollapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"}
                  ${
                    isActive
                      ? isDark
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : isDark
                        ? "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 border border-transparent"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent"
                  }
                `}
              >
                <div className="relative shrink-0">
                  <Icon icon={link.icon} className="w-5 h-5" />
                  {isCollapsed && (link.path.includes("/notifications") && unreadNotifCount > 0) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />
                  )}
                  {isCollapsed && (link.path.includes("/crops") && actionNeededCropsCount > 0) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
                  )}
                  {isCollapsed && (isFarmerGroups && pendingFarmerRequestsCount > 0) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
                  )}
                </div>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium whitespace-nowrap flex-1 text-left"
                  >
                    {link.label}
                  </motion.span>
                )}
                {!isCollapsed && renderBadges(link.path)}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-emerald-500"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div
        className={`border-t py-3 px-2 flex flex-col gap-1 ${isDark ? "border-slate-800/80" : "border-slate-200"}`}
      >
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors cursor-pointer text-red-400 hover:bg-red-500/10 ${
            isCollapsed ? "justify-center" : ""
          }`}
          title={isCollapsed ? "Log out" : undefined}
        >
          <Icon icon="ph:sign-out-fill" className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Log Out</span>}
        </button>

        <motion.a
          href="https://aanshik-dev.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          title={isCollapsed ? "Developer Profile" : undefined}
          className={`mt-2 rounded-xl flex items-center border transition-all duration-200 ${
            isCollapsed ? "justify-center p-2 mx-auto" : "gap-2.5 px-3 py-2.5 mx-1"
          } ${
            isDark
              ? "bg-emerald-950/20 text-slate-400 border-emerald-900/30 hover:border-emerald-500/50 hover:bg-emerald-900/30"
              : "bg-emerald-50 text-slate-500 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100/50"
          }`}
        >
          <div className={`p-1 rounded-lg shrink-0 flex items-center justify-center ${isDark ? "" : "bg-emerald-900 shadow-sm"}`}>
            <img src="/assets/Symbol.svg" alt="Aanshik-dev" className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-tight">
              <span className={`font-bold text-[13px] ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>Aanshik-dev</span>
              <span className="text-[11px]">Full Stack Developer</span>
            </div>
          )}
        </motion.a>
      </div>
    </motion.aside>
  );

  // Mobile sidebar (overlay)
  const MobileSidebar = () => (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col md:hidden border-r ${
              isDark
                ? "bg-slate-950 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div
              className={`flex items-center justify-between px-4 py-4 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${isDark ? "bg-emerald-800/70 text-emerald-300" : "bg-emerald-100 text-emerald-600"}`}
                >
                  <Icon icon="ph:plant-fill" className="w-5 h-5" />
                </div>
                <span
                  className={`font-bold quantico uppercase tracking-widest text-sm ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  FarmFresh
                </span>
              </div>
              <button
                onClick={onClose}
                className={`w-8 h-8 flex items-center justify-center rounded-lg ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"}`}
              >
                <Icon
                  icon="material-symbols:close-rounded"
                  className="w-5 h-5"
                />
              </button>
            </div>

            <nav className="flex flex-col gap-1 px-3 py-3 flex-1 overflow-y-auto no-scrollbar">
              {links.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => handleNav(link.path)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? isDark
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-emerald-50 text-emerald-700"
                        : isDark
                          ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon icon={link.icon} className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium flex-1 text-left">{link.label}</span>
                    {renderBadges(link.path)}
                  </button>
                );
              })}
            </nav>

            <div
              className={`border-t px-3 py-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}
            >
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Icon icon="ph:sign-out-fill" className="w-5 h-5" />
                <span className="text-sm font-medium">Log Out</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
};

// ── Mobile Icon Rail ──────────────────────────────────────────────────────────
const MobileIconRail = ({ role, unreadNotifCount, actionNeededCropsCount, pendingFarmerRequestsCount }) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const links = (
    role === "FARMER_GROUP"
      ? farmerSidebarLinks
      : role === "COLLECTIVE"
        ? collectiveSidebarLinks
        : adminSidebarLinks
  ).slice(0, 5);

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t px-2 py-2 ${
        isDark
          ? "bg-slate-950/95 border-slate-800 backdrop-blur-md"
          : "bg-white/95 border-slate-200 backdrop-blur-md"
      }`}
    >
      {links.map((link) => {
        const isActive = location.pathname === link.path;
        const isNotif = link.path.includes("/notifications");
        const isCrops = link.path.includes("/crops");
        const isFarmerGroups = link.path.includes("/farmer-groups") || link.path.includes("/farmers");

        return (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
              isActive
                ? isDark
                  ? "text-emerald-400"
                  : "text-emerald-600"
                : isDark
                  ? "text-slate-500"
                  : "text-slate-400"
            }`}
          >
            <div className="relative">
              <Icon icon={link.icon} className="w-5 h-5" />
              {isNotif && unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />
              )}
              {isCrops && actionNeededCropsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
              )}
              {isFarmerGroups && pendingFarmerRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
              )}
            </div>
            <span className="text-[9px] font-medium">
              {link.label.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

// ── AppShell ──────────────────────────────────────────────────────────────────
const AppShell = () => {
  const { isDark } = useTheme();
  const { role, isAuthenticated, fetchAndSyncUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  // Live Sync Badge counts
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [actionNeededCropsCount, setActionNeededCropsCount] = useState(0);
  const [pendingFarmerRequestsCount, setPendingFarmerRequestsCount] = useState(0);

  const syncBadges = useCallback(async () => {
    if (role === "FARMER_GROUP") {
      try {
        const [notifRes, cropRes] = await Promise.all([
          farmerNotifAPI.get(),
          farmerCropAPI.get(),
        ]);
        const notifs = notifRes.data?.notifications || [];
        setUnreadNotifCount(notifs.filter((n) => !n.isRead).length);

        const crops = cropRes.data?.crops || cropRes.data?.data?.cropData || [];
        const openQueries = crops.filter((c) => c.dealCrop?.growth?.queryStatus === "OPEN").length;
        setActionNeededCropsCount(openQueries);
      } catch {
        // Silently handle
      }
    } else if (role === "COLLECTIVE") {
      try {
        const [notifRes, memberRes] = await Promise.all([
          collectiveNotifAPI.get(),
          collectiveMemberAPI.get(),
        ]);
        const notifs = notifRes.data?.notifications || [];
        setUnreadNotifCount(notifs.filter((n) => !n.isRead).length);

        const mData = memberRes.data?.memberData || {};
        const pendingReqs = Array.isArray(mData.requests) ? mData.requests.length : 0;
        setPendingFarmerRequestsCount(pendingReqs);
      } catch {
        // Silently handle
      }
    }
  }, [role]);

  useEffect(() => {
    fetchAndSyncUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAuthenticated) {
      syncBadges();
      const interval = setInterval(syncBadges, 10000);
      const onBadgeSync = () => syncBadges();
      window.addEventListener("farmfresh:badges-sync", onBadgeSync);
      return () => {
        clearInterval(interval);
        window.removeEventListener("farmfresh:badges-sync", onBadgeSync);
      };
    }
  }, [isAuthenticated, syncBadges]);

  const handleToggleSidebar = useCallback(() => setSidebarOpen((p) => !p), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleCollapseSidebar = useCallback(
    () => setSidebarCollapsed((p) => !p),
    [],
  );

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const sidebarWidth = sidebarCollapsed ? 68 : 240;

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <TopHeader
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        unreadNotifCount={unreadNotifCount}
        onRaiseIssue={() => setIssueModalOpen(true)}
      />
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onCollapse={handleCollapseSidebar}
        onClose={handleCloseSidebar}
        role={role}
        unreadNotifCount={unreadNotifCount}
        actionNeededCropsCount={actionNeededCropsCount}
        pendingFarmerRequestsCount={pendingFarmerRequestsCount}
      />

      <main
        className={`pb-20 md:pb-0 transition-all duration-300 min-h-screen pt-16`}
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <ProfileBanner onVisibilityChange={setBannerVisible} />
        <style>{`@media (max-width: 767px) { main { margin-left: 0 !important; } }`}</style>
        <Outlet />
      </main>

      <MobileIconRail
        role={role}
        unreadNotifCount={unreadNotifCount}
        actionNeededCropsCount={actionNeededCropsCount}
        pendingFarmerRequestsCount={pendingFarmerRequestsCount}
      />

      <RaiseIssueModal
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
      />
    </div>
  );
};

export default AppShell;
