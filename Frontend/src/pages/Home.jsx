import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import FarmerGroupCard from "../components/FarmerGroupCard";
import { farmerGroups } from "../utils/InterfaceData";
import { useTheme } from "../context/ThemeContext";
import { HeroActions } from "../components/ui";

const carouselImages = [
  "/assets/hero/Farmer_Women_1.png",
  "/assets/hero/Farmer_Men_1.png",
  "/assets/hero/Farmer_Women_2.png",
  "/assets/hero/Farmer_Men_2.png",
  "/assets/hero/Farmer_Women_3.png",
  "/assets/hero/Farmer_Men_3.png",
  "/assets/hero/Farmer_Women_4.png",
  "/assets/hero/Farmer_Men_4.png",
  "/assets/hero/Farmer_Women_5.png",
  "/assets/hero/Farmer_Men_5.png",
  "/assets/hero/Farmer_Men_6.png",
];

const Home = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 1, staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: "easeOut" },
    },
  };

  return (
    <div
      className={`w-screen overflow-x-hidden transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <header
        className={`w-full flex flex-col md:flex-row items-center md:items-stretch flex-wrap justify-center py-20 px-8 md:py-20 md:px-12 lg:py-24 lg:px-36 transition-colors duration-300 ${
          isDark
            ? "bg-linear-to-br from-emerald-950 via-slate-950 to-emerald-900 text-white"
            : "bg-linear-to-br from-emerald-50 via-white to-emerald-100 text-slate-900"
        }`}
      >
        <motion.div
          className="flex-4 space-y-6 pt-10 min-w-80"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className={`inline-flex items-center space-x-2 backdrop-blur-sm border rounded-full px-3 py-1.5 md:px-4 md:py-1.5 text-xs font-mono tracking-wider uppercase shadow-lg ${
              isDark
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/5"
                : "bg-emerald-100 border-emerald-300 text-emerald-700 shadow-emerald-200/50"
            }`}
          >
            <Icon
              icon="lucide:sparkles"
              className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400 animate-pulse"
            />
            <span>Agri-Allied digital coordination network</span>
          </motion.div>

          <motion.h1
            className={`font-display font-bold text-4xl sm:text-5xl md:text-4xl lg:text-[56px] tracking-tight leading-[1.3] sm:leading-[1.1] md:leading-[1.2] ${isDark ? "text-slate-100" : "text-slate-800"}`}
            id="hero-headline"
            variants={itemVariants}
          >
            Coordinating{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-amber-300 to-yellow-500 font-extrabold">
              Alpine Organic
            </span>{" "}
            Cultivation in Kedarnath Valley
          </motion.h1>

          <motion.p
            className={`text-sm sm:text-lg mx-auto lg:mx-0 font-sans leading-relaxed opacity-95 ${isDark ? "text-slate-300" : "text-slate-600"}`}
            id="hero-description"
            variants={itemVariants}
          >
            Empowering remote mountain farmer groups across tough Himalayan
            terrains. Seamlessly synchronize harvest cycles, track collection
            statuses, and mitigate post-harvest decay.
          </motion.p>

          <HeroActions isDark={isDark} />

          <motion.div
            className={`flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 md:pt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            variants={itemVariants}
          >
            <div className="flex items-center space-x-2">
              <Icon icon="lucide:users" className="w-4 h-4 text-amber-400" />
              <span>12+ Farmer Groups</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon
                icon="lucide:trending-up"
                className="w-4 h-4 text-emerald-400"
              />
              <span>40% Less Decay</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon icon="lucide:leaf" className="w-4 h-4 text-green-400" />
              <span>100% Organic</span>
            </div>
          </motion.div>
        </motion.div>

        <div className="flex-3 flex flex-col justify-center items-end">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="max-w-110 min-w-60 pointer-events-none select-none flex items-center justify-center"
              style={{
                maskImage:
                  "linear-gradient(to top, transparent 0%, black 8%, black 100%)",
                WebkitMaskImage:
                  "linear-gradient(to top, transparent 0%, black 15%, black 100%)",
              }}
            >
              <img
                src={carouselImages[currentImageIndex]}
                alt="Happy Farmer"
                className="w-full h-full object-contain"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </header>

      <main
        className={`w-full py-20 transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <section className="w-full py-10 px-10">
          <div className="flex flex-wrap gap-8 md:gap-x-[5%] md:gap-y-12 justify-center">
            {farmerGroups.map((group) => (
              <FarmerGroupCard key={group.id} group={group} isDark={isDark} />
            ))}
          </div>
        </section>

        <section className="w-full px-8 md:px-16 pt-10 pb-4">
          <div
            className={`max-w-5xl mx-auto rounded-3xl border px-6 py-10 sm:px-12 sm:py-12 flex flex-col items-center text-center gap-4 ${
              isDark
                ? "bg-gradient-to-br from-emerald-900/40 via-slate-900/60 to-emerald-950/40 border-emerald-800/50"
                : "bg-gradient-to-br from-emerald-50 via-white to-amber-50 border-emerald-200"
            }`}
          >
            <span
              className={`inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
            >
              <Icon icon="ph:cube-fill" className="w-3.5 h-3.5" />
              Design System
            </span>
            <h2
              className={`font-display text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}
            >
              Browse the FarmFresh Component Library
            </h2>
            <p
              className={`text-sm sm:text-base max-w-xl ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              Buttons, inputs, modals, toasts and loaders — every building block
              used across the platform, documented in one place.
            </p>
            <button
              onClick={() => navigate("/ui")}
              className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Icon icon="ph:squares-four-fill" className="w-4 h-4" />
              <span>View UI Components</span>
              <Icon icon="ph:arrow-right-bold" className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
