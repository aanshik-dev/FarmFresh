import React, { useState, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { farmerSidebarLinks, collectiveSidebarLinks, adminSidebarLinks } from "../../utils/InterfaceData";
import { farmerNotifications, collectiveNotifications } from "../../utils/InterfaceData";

// ──────────────────────────────────────────────────
// Top Header
// ──────────────────────────────────────────────────
const TopHeader = ({ onToggleSidebar, sidebarOpen }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const notifCount = role === "COLLECTIVE" ? collectiveNotifications.filter(n => !n.read).length
    : role === "FARMER_GROUP" ? farmerNotifications.filter(n => !n.read).length : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const roleBadge = {
    FARMER_GROUP: { label: "Farmer Group", icon: "ph:plant-fill", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" },
    COLLECTIVE:   { label: "Collective",   icon: "ph:buildings-fill", color: "text-blue-400 bg-blue-500/15 border-blue-500/30" },
    ADMIN:        { label: "Admin",        icon: "ph:shield-fill",    color: "text-amber-400 bg-amber-500/15 border-amber-500/30" },
  }[role] || { label: role, icon: "ph:user-fill", color: "text-slate-400 bg-slate-500/15 border-slate-500/30" };

  const handleLogout = () => {
    logout();
    navigate("/");
    setProfileOpen(false);
  };

  const notifPath = role === "FARMER_GROUP" ? "/dashboard/farmer/notifications"
    : role === "COLLECTIVE" ? "/dashboard/collective/notifications" : null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 h-16 flex items-center px-4 gap-3 border-b ${
        isDark
          ? "bg-slate-950/90 border-slate-800/80 backdrop-blur-md"
          : "bg-white/90 border-slate-200 backdrop-blur-md"
      }`}
    >
      {/* Sidebar toggle (mobile) */}
      <button
        onClick={onToggleSidebar}
        className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-colors cursor-pointer ${
          isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
        }`}
      >
        <Icon icon={sidebarOpen ? "material-symbols:close-rounded" : "material-symbols:menu-rounded"} className="w-5 h-5" />
      </button>

      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer shrink-0"
        onClick={() => navigate("/")}
      >
        <div className={`p-1.5 rounded-lg ${isDark ? "bg-emerald-800/70 text-emerald-300" : "bg-emerald-100 text-emerald-600"}`}>
          <Icon icon="ph:plant-fill" className="w-5 h-5" />
        </div>
        <span className={`font-bold text-sm quantico uppercase tracking-widest hidden sm:block ${isDark ? "text-white" : "text-slate-900"}`}>
          FarmFresh
        </span>
      </div>

      {/* Center greeting */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        <p className={`text-sm font-medium truncate hidden md:block ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          🌱 {greeting},{" "}
          <span className={isDark ? "text-white font-semibold" : "text-slate-900 font-semibold"}>
            {user?.name?.split(" ")[0]}!
          </span>
        </p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors cursor-pointer ${
            isDark ? "hover:bg-slate-800 text-amber-400" : "hover:bg-amber-50 text-amber-500"
          }`}
        >
          <Icon icon={isDark ? "ph:sun-fill" : "ph:moon-stars-fill"} className="w-4.5 h-4.5" />
        </button>

        {/* Notifications */}
        {notifPath && (
          <button
            onClick={() => navigate(notifPath)}
            className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors cursor-pointer ${
              isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon icon="ph:bell-fill" className="w-4.5 h-4.5" />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {notifCount}
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
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500/40" />
            ) : (
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                isDark ? "bg-emerald-700 text-emerald-200" : "bg-emerald-100 text-emerald-700"
              }`}>
                {user?.name?.charAt(0) || "?"}
              </div>
            )}
            <div className="hidden sm:flex flex-col items-start">
              <span className={`text-xs font-semibold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                {user?.name?.split(" ")[0] || "User"}
              </span>
              <span className={`text-[10px] leading-tight ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                {roleBadge.label}
              </span>
            </div>
            <Icon icon="ph:caret-down-fill" className={`w-3 h-3 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute right-0 top-full mt-2 w-52 rounded-2xl border shadow-2xl py-1.5 z-50 ${
                  isDark ? "bg-slate-900 border-slate-700 shadow-black/60" : "bg-white border-slate-200 shadow-slate-300/40"
                }`}
              >
                {/* User info row */}
                <div className={`px-4 py-3 border-b mb-1 ${isDark ? "border-slate-700/60" : "border-slate-100"}`}>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{user?.name}</p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{user?.email}</p>
                  <span className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${roleBadge.color}`}>
                    <Icon icon={roleBadge.icon} className="w-2.5 h-2.5" />
                    {roleBadge.label}
                  </span>
                </div>

                {[
                  { label: "Profile", icon: "ph:user-circle-fill", path: role === "FARMER_GROUP" ? "/dashboard/farmer/profile" : role === "COLLECTIVE" ? "/dashboard/collective/profile" : null },
                  { label: "Settings", icon: "ph:gear-six-fill", path: role === "FARMER_GROUP" ? "/dashboard/farmer/settings" : role === "COLLECTIVE" ? "/dashboard/collective/settings" : role === "ADMIN" ? "/dashboard/admin/settings" : null },
                ].filter(i => i.path).map(item => (
                  <button
                    key={item.label}
                    onClick={() => { navigate(item.path); setProfileOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors cursor-pointer ${
                      isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon icon={item.icon} className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}

                <div className={`border-t mt-1 pt-1 ${isDark ? "border-slate-700/60" : "border-slate-100"}`}>
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

// ──────────────────────────────────────────────────
// Sidebar
// ──────────────────────────────────────────────────
const Sidebar = ({ isOpen, isCollapsed, onCollapse, onClose, role }) => {
  const { isDark } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = role === "FARMER_GROUP" ? farmerSidebarLinks
    : role === "COLLECTIVE" ? collectiveSidebarLinks
    : adminSidebarLinks;

  const handleNav = (path) => {
    navigate(path);
    onClose?.(); // close on mobile
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Desktop sidebar (always mounted, just changes width)
  const DesktopSidebar = () => (
    <motion.aside
      animate={{ width: isCollapsed ? 68 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`hidden md:flex flex-col fixed left-0 top-16 bottom-0 z-30 border-r overflow-hidden ${
        isDark ? "bg-slate-950 border-slate-800/80" : "bg-white border-slate-200"
      }`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden py-3 no-scrollbar">
        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 px-2">
          {links.map((link) => {
            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + "/");
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                title={isCollapsed ? link.label : undefined}
                className={`
                  relative flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer
                  ${isCollapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"}
                  ${isActive
                    ? isDark
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : isDark
                    ? "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 border border-transparent"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent"
                  }
                `}
              >
                <Icon icon={link.icon} className="w-5 h-5 shrink-0" />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {link.label}
                  </motion.span>
                )}
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

      {/* Bottom: collapse toggle + logout */}
      <div className={`border-t py-3 px-2 flex flex-col gap-1 ${isDark ? "border-slate-800/80" : "border-slate-200"}`}>
        {/* Collapse toggle */}
        <button
          onClick={onCollapse}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors cursor-pointer ${
            isCollapsed ? "justify-center" : ""
          } ${isDark ? "text-slate-500 hover:bg-slate-800 hover:text-slate-300" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon icon={isCollapsed ? "ph:sidebar-simple-fill" : "ph:sidebar-fill"} className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm">Collapse</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors cursor-pointer text-red-400 hover:bg-red-500/10 ${
            isCollapsed ? "justify-center" : ""
          }`}
          title={isCollapsed ? "Log out" : undefined}
        >
          <Icon icon="ph:sign-out-fill" className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm">Log Out</span>}
        </button>

        {/* Developer info */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mx-1 mt-2 px-3 py-2 rounded-xl text-[10px] leading-relaxed ${
              isDark ? "bg-slate-800/60 text-slate-500" : "bg-slate-50 text-slate-400"
            }`}
          >
            <p className="font-semibold mb-0.5">FarmFresh v1.0</p>
            <p>Built for Kedarnath Valley organic farmers</p>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );

  // Mobile sidebar (overlay)
  const MobileSidebar = () => (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed left-0 top-0 bottom-0 w-72 z-50 flex flex-col border-r shadow-2xl md:hidden ${
              isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            {/* Mobile header */}
            <div className={`flex items-center justify-between px-4 py-4 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isDark ? "bg-emerald-800/70 text-emerald-300" : "bg-emerald-100 text-emerald-600"}`}>
                  <Icon icon="ph:plant-fill" className="w-5 h-5" />
                </div>
                <span className={`font-bold quantico uppercase tracking-widest text-sm ${isDark ? "text-white" : "text-slate-900"}`}>FarmFresh</span>
              </div>
              <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-lg ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"}`}>
                <Icon icon="material-symbols:close-rounded" className="w-5 h-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-1 px-3 py-3 flex-1 overflow-y-auto no-scrollbar">
              {links.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => handleNav(link.path)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                        : isDark ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon icon={link.icon} className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Mobile logout */}
            <div className={`border-t px-3 py-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Icon icon="ph:sign-out-fill" className="w-5 h-5" />
                <span className="text-sm font-medium">Log Out</span>
              </button>
              <p className={`text-[10px] text-center mt-2 ${isDark ? "text-slate-600" : "text-slate-400"}`}>FarmFresh v1.0 • Kedarnath Valley</p>
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

// ──────────────────────────────────────────────────
// Mobile Icon Rail (always visible on mobile)
// ──────────────────────────────────────────────────
const MobileIconRail = ({ role }) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const links = (role === "FARMER_GROUP" ? farmerSidebarLinks
    : role === "COLLECTIVE" ? collectiveSidebarLinks
    : adminSidebarLinks).slice(0, 5); // show top 5 on mobile rail

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t px-2 py-2 ${
      isDark ? "bg-slate-950/95 border-slate-800 backdrop-blur-md" : "bg-white/95 border-slate-200 backdrop-blur-md"
    }`}>
      {links.map((link) => {
        const isActive = location.pathname === link.path;
        return (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
              isActive
                ? isDark ? "text-emerald-400" : "text-emerald-600"
                : isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            <Icon icon={link.icon} className="w-5 h-5" />
            <span className="text-[9px] font-medium">{link.label.split(" ")[0]}</span>
          </button>
        );
      })}
    </nav>
  );
};

// ──────────────────────────────────────────────────
// AppShell — the main authenticated layout
// ──────────────────────────────────────────────────
const AppShell = () => {
  const { isDark } = useTheme();
  const { role, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = useCallback(() => setSidebarOpen(p => !p), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleCollapseSidebar = useCallback(() => setSidebarCollapsed(p => !p), []);

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const sidebarWidth = sidebarCollapsed ? 68 : 240;

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <TopHeader onToggleSidebar={handleToggleSidebar} sidebarOpen={sidebarOpen} />
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onCollapse={handleCollapseSidebar}
        onClose={handleCloseSidebar}
        role={role}
      />

      {/* Main content — shifts right of sidebar on desktop */}
      <main
        className="pt-16 pb-20 md:pb-0 transition-all duration-300 min-h-screen"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        {/* Remove sidebar margin on mobile — handled by the overlay drawer */}
        <style>{`@media (max-width: 767px) { main { margin-left: 0 !important; } }`}</style>
        <Outlet />
      </main>

      {/* Mobile bottom navigation rail */}
      <MobileIconRail role={role} />
    </div>
  );
};

export default AppShell;
