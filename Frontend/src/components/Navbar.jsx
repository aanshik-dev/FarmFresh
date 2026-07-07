import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { navLinks } from "../utils/InterfaceData";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { LoginButton, SignupButton } from "./ui/AuthButtons";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (!isMobileMenuOpen) {
        setIsScrolled(window.scrollY > 40);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`
        relative flex items-center justify-center w-9 h-9 shrink-0 rounded-full
        transition-all duration-300 cursor-pointer
        ${isDark
          ? "bg-emerald-900/50 hover:bg-emerald-800/70 text-amber-300 border border-emerald-700/50"
          : "bg-amber-100 hover:bg-amber-200 text-amber-600 border border-amber-300"
        }
      `}
    >
      <motion.div
        key={isDark ? "moon" : "sun"}
        initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
        transition={{ duration: 0.2 }}
      >
        <Icon
          icon={isDark ? "ph:moon-stars-fill" : "ph:sun-fill"}
          className="w-4.5 h-4.5"
        />
      </motion.div>
    </button>
  );

  return (
    <div
      className={`selection:bg-green-400/30 w-full fixed top-0 left-0 z-50 ${isMobileMenuOpen ? "h-screen bg-[#0e001f84]" : ""}`}
    >
      <div className={`w-full`}>
        <div
          className={`flex items-center px-5 sm:px-8 md:px-16 lg:px-24 gap-3 sm:gap-6 w-full h-16 md:h-17 relative z-40 border-b ${
            isScrolled
              ? isDark
                ? "bg-emerald-950/72 shadow-green-950/60 text-white shadow-lg backdrop-blur-md border-b border-emerald-900"
                : "bg-white/80 shadow-emerald-900/10 text-slate-800 shadow-lg backdrop-blur-md border-b border-emerald-200"
              : "border-[#ffffff00]"
          }`}
        >
          <div className={`h-full flex justify-start items-center shrink-0 transition-all duration-300 ${isDark ? "text-amber-50" : "text-slate-800"}`}>
            <div
              className="h-full flex items-center justify-center gap-2.5 sm:gap-5 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className={`p-1.5 sm:p-2 rounded-full shrink-0 ${isDark ? "bg-emerald-800 text-emerald-200" : "bg-emerald-100 text-emerald-700"}`}>
                <Icon icon="ph:plant-fill" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              </div>
              <div>
                <p className={`text-sm sm:text-md md:text-xl quantico uppercase tracking-widest text-nowrap ${isDark ? "text-amber-50" : "text-slate-800"}`}>
                  FarmFresh
                </p>
                <p className="hidden sm:block uppercase text-xs tracking-widest text-emerald-500 font-thin quantico">
                  Organic Collective
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 gap-8 hidden lg:flex h-full transition-all duration-300">
            <div className="flex gap-2 flex-1 h-full items-center justify-center">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 lg:px-4 py-1 text-lg transition-all duration-200 blinker relative ${
                    location.pathname === link.path
                      ? isDark
                        ? "font-semibold text-emerald-300 bg-emerald-900/40"
                        : "font-semibold text-emerald-700 bg-emerald-100/70"
                      : isDark
                      ? "text-gray-300 hover:text-white hover:bg-emerald-900/25"
                      : "text-slate-800 hover:text-black hover:bg-emerald-100/50"
                  }`}
                >
                  {link.label}
                  {location.pathname === link.path && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex h-full items-center justify-end gap-2 sm:gap-3 ml-auto">
            <div className="hidden lg:flex items-center gap-2.5 mr-1">
              <LoginButton isDark={isDark} />
              <SignupButton isDark={isDark} />
            </div>

            <ThemeToggle />

            <button
              className={`lg:hidden flex items-center justify-center w-9 h-9 shrink-0 rounded-full cursor-pointer text-2xl ${isDark ? "text-white" : "text-slate-700"}`}
              onClick={() => {
                setIsScrolled(true);
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <Icon icon="material-symbols:close-rounded" />
              ) : (
                <Icon icon="material-symbols:menu-rounded" />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Dark backdrop overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 top-16 bg-slate-950/40 backdrop-blur-xs z-10"
              />

              {/* Floating Glassmorphic Menu */}
              <motion.nav
                initial={{ opacity: 0, scale: 0.95, y: -15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`absolute left-4 right-4 top-18 rounded-3xl border p-5 z-20 shadow-2xl ${
                  isDark
                    ? "bg-slate-900/90 backdrop-blur-xl border-slate-800/80 shadow-black/60"
                    : "bg-white/95 backdrop-blur-xl border-slate-200/80 shadow-slate-200/50"
                }`}
              >
                <div className="flex flex-col gap-3">
                  {/* Staggered Links */}
                  {navLinks.map((link, idx) => {
                    const isActive = location.pathname === link.path;
                    const getIcon = (path) => {
                      if (path === "/") return "ph:house-fill";
                      if (path === "/about") return "ph:info-fill";
                      if (path === "/features") return "ph:sparkle-fill";
                      if (path === "/contact") return "ph:envelope-fill";
                      return "ph:link-bold";
                    };

                    return (
                      <motion.div
                        key={link.path}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Link
                          to={link.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                            isActive
                              ? isDark
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : isDark
                              ? "text-slate-300 hover:bg-slate-800/50 border border-transparent"
                              : "text-slate-600 hover:bg-slate-50 border border-transparent"
                          }`}
                        >
                          <Icon icon={getIcon(link.path)} className={`w-5 h-5 ${isActive ? "text-emerald-400" : isDark ? "text-slate-500" : "text-slate-400"}`} />
                          {link.label}
                        </Link>
                      </motion.div>
                    );
                  })}

                  {/* Divider */}
                  <div className={`h-px my-2 ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />

                  {/* Auth Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: navLinks.length * 0.05 }}
                    className="flex flex-col gap-2.5"
                  >
                    <LoginButton isDark={isDark} full />
                    <SignupButton isDark={isDark} full />
                  </motion.div>
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Navbar;
