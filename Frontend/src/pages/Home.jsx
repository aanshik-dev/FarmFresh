import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import FarmerGroupCard from "../components/FarmerGroupCard";
import { farmerGroups } from "../utils/InterfaceData";

<div className="flex flex-wrap gap-8 justify-center py-10">
  {farmerGroups.map((group) => (
    <FarmerGroupCard key={group.id} group={group} />
  ))}
</div>;

// Replace these URLs with your actual transparent PNG cutouts
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % carouselImages.length,
      );
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
    <div className="w-screen overflow-x-hidden bg-slate-950">
      <header className="w-full flex flex-col md:flex-row items-center md:items-stretch flex-wrap justify-center bg-linear-to-br from-emerald-950 via-slate-950 to-emerald-900 text-white py-20 px-8 md:py-20 md:px-12 lg:py-24 lg:px-36">
        <motion.div
          className="flex-4 space-y-6 pt-10 min-w-80"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="inline-flex items-center space-x-2 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/30 rounded-full px-3 py-1.5 md:px-4 md:py-1.5 text-xs font-mono tracking-wider text-emerald-400 uppercase shadow-lg shadow-emerald-500/5">
            <Icon
              icon="lucide:sparkles"
              className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400 animate-pulse"
            />
            <span>Agri-Allied digital coordination network</span>
          </motion.div>

          <motion.h1
            className="font-display font-bold text-4xl sm:text-5xl md:text-4xl lg:text-[56px] tracking-tight leading-[1.3] sm:leading-[1.1] md:leading-[1.2] text-slate-100"
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
            className="text-slate-300 text-sm sm:text-lg mx-auto lg:mx-0 font-sans leading-relaxed opacity-95"
            id="hero-description"
            variants={itemVariants}
          >
            Empowering remote mountain farmer groups across tough Himalayan
            terrains. Seamlessly synchronize harvest cycles, track collection
            statuses, and mitigate post-harvest decay.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-start gap-4 md:pt-2 text-sm sm:text-base md:text-sm lg:text-base"
            id="hero-actions"
            variants={itemVariants}
          >
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 30px rgba(251, 191, 36, 0.3)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {}}
              id="hero-primary-action-btn"
              className="w-full sm:w-auto px-6 py-2 sm:py-3 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-emerald-950 font-semibold transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer tracking-wide"
            >
              <Icon
                icon="mdi:register-outline"
                className="w-4 h-4 sm:w-5 sm:h-5"
              />
              <span>Become Partner</span>
            </motion.button>

            <motion.button
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(16, 185, 129, 0.2)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {}}
              id="hero-secondary-action-btn"
              className="w-full sm:w-auto px-6 py-2 sm:py-3  rounded-xl bg-slate-900/60 border border-slate-700/50 text-slate-200 font-medium transition-colors flex items-center justify-center space-x-2 cursor-pointer backdrop-blur-sm"
            >
              <Icon
                icon="lucide:info"
                className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400"
              />
              <span>About Collective</span>
            </motion.button>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center lg:justify-start gap-4  sm:gap-6 md:pt-2 text-slate-400 text-sm"
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

        <div className="flex-3 flex flex-col justify-center items-end ">
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

      <main className="w-full py-20">
        <section className="w-full py-10 px-10">
          <div className="flex flex-wrap gap-8 md:gap-x-[5%] md:gap-y-12 justify-center">
            {farmerGroups.map((group) => (
              <FarmerGroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
