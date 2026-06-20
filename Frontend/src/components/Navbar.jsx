import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { navLinks } from "../utils/InterfaceData";
import { AnimatePresence, motion } from "framer-motion";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <div
      className={`selection:bg-green-400/30 w-full fixed top-0 left-0 z-50 ${isMobileMenuOpen ? "h-screen bg-[#0e001f84]" : ""}`}
    >
      <div className={`w-full`}>
        <div
          className={`flex px-8  md:px-16 lg:px-24 sm:gap-8 w-full h-16 md:h-17 relative z-40 border-b ${
            isScrolled
              ? " bg-emerald-950/72 shadow-green-950/60 text-white shadow-lg backdrop-blur-md border-b border-emerald-900"
              : "border-[#ffffff00]"
          }`}
        >
          <div className="h-full text-amber-50 flex justify-start items-center transition-all duration-300">
            <div
              className="h-full flex items-center justify-center gap-3 sm:gap-5 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="bg-emerald-800 p-1.5 sm:p-2 rounded-full text-emerald-200">
                <Icon icon="ph:plant-fill" className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div>
                <p className="text-md md:text-xl quantico uppercase tracking-widest text-nowrap">
                  FarmFresh
                </p>
                <p className="uppercase text-xs tracking-widest text-emerald-400  font-thin quantico">
                  Organic Collective
                </p>
              </div>
            </div>
          </div>

          {/* Navbar */}
          <div className="flex-1 gap-8 hidden lg:flex h-full transition-all duration-300">
            <div className="flex gap-2 flex-1 h-full items-center justify-center">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 lg:px-4 py-1 text-lg transition-all duration-200 blinker relative ${
                    location.pathname === link.path
                      ? "font-semibold text-emerald-300 bg-emerald-900/40"
                      : "text-gray-300 hover:text-white hover:bg-emerald-900/25"
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
          {/* Mobile Menu Button */}
          <div className="flex-1 flex h-full items-center  justify-end lg:hidden text-white text-3xl transition-all duration-300">
            <button
              className="lg:hidden rounded-full cursor-pointer"
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

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, y: "-100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "-100%" }}
              transition={{ duration: 0.3 }}
              className={`lg:hidden py-4 border-t border-b text-white z-20 relative ${isScrolled ? " bg-[#001f10]/71 backdrop-blur-xl shadow-[#00180e] shadow-2xl border-[#2a3b30]" : "border-[#ffffff00]"}`}
            >
              <div className="flex flex-col gap-4 mx-4 py-5 px-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      location.pathname === link.path
                        ? "bg-green-600/62"
                        : "border-b border-green-600/43 hover:bg-green-600/16"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
      <div
        className="w-full h-full"
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>
    </div>
  );
};

export default Navbar;
