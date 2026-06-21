import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

const HeroActions = ({ isDark }) => {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-start gap-4 md:pt-2 text-sm sm:text-base md:text-sm lg:text-base"
      id="hero-actions"
    >
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(251, 191, 36, 0.3)" }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/signup")}
        id="hero-primary-action-btn"
        className="w-full sm:w-auto px-6 py-2 sm:py-3 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-emerald-950 font-semibold transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer tracking-wide"
      >
        <Icon icon="mdi:register-outline" className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>Become Partner</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/about")}
        id="hero-secondary-action-btn"
        className={`w-full sm:w-auto px-6 py-2 sm:py-3 rounded-xl border font-medium transition-colors flex items-center justify-center space-x-2 cursor-pointer backdrop-blur-sm ${
          isDark
            ? "bg-slate-900/60 border-slate-700/50 text-slate-200 hover:bg-emerald-900/20"
            : "bg-white/70 border-slate-300 text-slate-700 hover:bg-emerald-50"
        }`}
      >
        <Icon icon="lucide:info" className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
        <span>About Collective</span>
      </motion.button>
    </div>
  );
};

export default HeroActions;
