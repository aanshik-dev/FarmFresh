import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

// Placeholder high-quality transparent PNG cutouts of happy people/farmers
// Replace these URLs with your actual local paths or hosted transparent PNG cutouts
const carouselImages = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600", // Replace with PNG cutout
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600", // Replace with PNG cutout
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=600", // Replace with PNG cutout
];

const Home = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-slide effect every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="w-screen overflow-x-hidden bg-slate-950">
      <section
        className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-900 text-white py-20 lg:py-28 border-b border-emerald-900/40"
        id="hero-section"
      >
        {/* --- Modern Backdrop Mesh & Ambient Light --- */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Subtle Grid overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{ 
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, 
              backgroundSize: '24px 24px' 
            }}
          />
          {/* Top Left Glow */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
          {/* Center Right Glow */}
          <div className="absolute top-1/4 right-[-10%] w-[500px]/20 h-[500px] bg-amber-500/5 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            
            {/* --- Left Column Content --- */}
            <motion.div
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
              id="hero-main-content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 text-xs font-mono tracking-wider text-emerald-400 uppercase shadow-xs"
                id="hero-announcement-badge"
                variants={itemVariants}
              >
                <Icon icon="lucide:sparkles" className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Agri-Allied digital coordination network</span>
              </motion.div>

              <motion.h1
                className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-slate-100"
                id="hero-headline"
                variants={itemVariants}
              >
                Coordinating{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 font-extrabold">
                  Alpine Organic
                </span>{" "}
                Cultivation in Kedarnath Valley
              </motion.h1>

              <motion.p
                className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 font-sans leading-relaxed opacity-95"
                id="hero-description"
                variants={itemVariants}
              >
                Empowering 12 remote mountain farmer groups across tough
                Himalayan terrains. Seamlessly synchronize harvest cycles, track
                collection statuses, and mitigate post-harvest decay.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
                id="hero-actions"
                variants={itemVariants}
              >
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {}}
                  id="hero-primary-action-btn"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-emerald-950 font-semibold transition-all shadow-xl shadow-amber-500/10 flex items-center justify-center space-x-2 cursor-pointer tracking-wide"
                >
                  <Icon icon="lucide:calendar-range" className="w-5 h-5" />
                  <span>Launch Coordinator Hub</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, backgroundColor: "rgba(16, 185, 129, 0.15)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {}}
                  id="hero-secondary-action-btn"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-200 font-medium transition-colors flex items-center justify-center space-x-2 cursor-pointer backdrop-blur-xs"
                >
                  <Icon icon="lucide:info" className="w-5 h-5 text-emerald-400" />
                  <span>About Collective</span>
                </motion.button>
              </motion.div>
            </motion.div>

            {/* --- Right Column: Automatic Non-interactive PNG Carousel --- */}
            <div className="mt-16 lg:mt-0 lg:col-span-5 flex items-center justify-center relative min-h-[400px] lg:min-h-[500px]" id="hero-stats-panel">
              {/* Decorative radial lighting directly behind the cutout */}
              <div className="absolute w-72 h-72 bg-emerald-500/10 rounded-full blur-[80px]" />
              
              <div className="relative w-full h-full max-w-[380px] aspect-[4/5] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full pointer-events-none select-none flex items-center justify-center"
                  >
                    <img
                      src={carouselImages[currentImageIndex]}
                      alt="Happy Farmer"
                      className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(16,185,129,0.15)]"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;