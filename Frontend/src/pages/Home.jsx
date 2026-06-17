import React from "react";
import { Icon } from "@iconify/react";

const Home = () => {
  return (
    <div className="w-screen">
      <section
        className="relative overflow-hidden bg-linear-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white py-16 sm:py-20 border-b border-emerald-800"
        id="hero-section"
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          id="hero-decorations"
        >
          <svg
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="#ffffff"
              fillOpacity="1"
              d="M0,288L80,266.7C160,245,320,203,480,202.7C640,203,800,245,960,245.3C1120,245,1280,203,1360,181.3L1440,160L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
            ></path>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="h-16 w-full"></div>
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
              id="hero-main-content"
            >
              <div
                className="inline-flex items-center space-x-2 bg-emerald-800/40 border border-emerald-500/20 rounded-full px-3 py-1 text-xs font-mono text-emerald-300"
                id="hero-announcement-badge"
              >
                {/* <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" /> */}
                <span>Agri-Allied digital coordination network</span>
              </div>

              <h1
                className="font-display font-medium text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none"
                id="hero-headline"
              >
                Coordinating{" "}
                <span className="text-amber-400 font-semibold font-display">
                  Alpine Organic
                </span>{" "}
                Cultivation in Kedarnath Valley
              </h1>

              <p
                className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 font-sans"
                id="hero-description"
              >
                Empowering 12 remote mountain farmer groups across tough
                Himalayan terrains. Seamlessly synchronize harvest cycles, track
                collection statuses, and mitigate post-harvest decay with
                localized supply chain tracking.
              </p>

              <div
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
                id="hero-actions"
              >
                <button
                  onClick="#"
                  id="hero-primary-action-btn"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-emerald-950 font-medium transition-colors shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {/* <CalendarRange className="w-5 h-5" /> */}
                  <span>Launch Coordinator Hub</span>
                </button>

                <button
                  onClick="#"
                  id="hero-secondary-action-btn"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/40 text-emerald-100 font-medium transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {/* <Info className="w-5 h-5" /> */}
                  <span>About Collective</span>
                </button>
              </div>
            </div>

            {/* Key Quick Stats Cards (Highlighting real elevation, 12 groups, local terrain) */}
            <div className="mt-12 lg:mt-0 lg:col-span-5" id="hero-stats-panel">
              <div className="bg-slate-900/40 border border-emerald-800/30 rounded-xl p-6 backdrop-blur-md grid grid-cols-2 gap-4">
                <div
                  className="bg-emerald-950/40 border border-emerald-900 p-4 rounded-lg text-center"
                  id="hero-stat-1"
                >
                  <span className="block text-3xl font-display font-bold text-emerald-400">
                    12
                  </span>
                  <span className="text-xs text-slate-300 font-mono font-medium tracking-wide uppercase mt-1 block">
                    Farmer Groups
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    Scattered across ranges
                  </span>
                </div>

                <div
                  className="bg-emerald-950/40 border border-emerald-900 p-4 rounded-lg text-center"
                  id="hero-stat-2"
                >
                  <span className="block text-3xl font-display font-bold text-amber-400">
                    2,680m
                  </span>
                  <span className="text-xs text-slate-300 font-mono font-medium tracking-wide uppercase mt-1 block">
                    Peak Altitude
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    Chopta alpine zone
                  </span>
                </div>

                <div
                  className="bg-emerald-950/40 border border-emerald-900 p-4 rounded-lg text-center col-span-2"
                  id="hero-stat-3"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-ping"></span>
                    <span className="text-xl font-display font-bold text-emerald-400">
                      100% Organic
                    </span>
                  </div>
                  <span className="text-xs text-slate-300 font-mono font-medium tracking-wide uppercase mt-1 block">
                    Local Crop Certifications
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    Rajma, Finger Millet, Alpine Garlic
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
