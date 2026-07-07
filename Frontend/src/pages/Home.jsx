import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

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
];

const FEATURES = [
  {
    icon: "ph:plant-fill",
    color: "from-emerald-500 to-teal-600",
    title: "Crop Lifecycle Tracking",
    desc: "Monitor growth stages, mark readiness, and attach images to every crop update.",
  },
  {
    icon: "ph:calendar-check-fill",
    color: "from-blue-500 to-indigo-600",
    title: "Smart Pickup Scheduling",
    desc: "Collectives schedule pickups, assign drivers, and notify farmers — all in one flow.",
  },
  {
    icon: "ph:buildings-fill",
    color: "from-violet-500 to-purple-600",
    title: "Multi-Collective Membership",
    desc: "Farmers join multiple collectives for different crops. One crop, one collective — always.",
  },
  {
    icon: "ph:map-trifold-fill",
    color: "from-amber-500 to-orange-600",
    title: "Zone-Based Management",
    desc: "Organize farmer groups into altitude zones for optimal collection route planning.",
  },
  {
    icon: "ph:truck-fill",
    color: "from-sky-500 to-cyan-600",
    title: "Driver Assignment",
    desc: "Collectives manage their driver fleet, assign drivers to pickups by zone.",
  },
  {
    icon: "ph:trend-down-fill",
    color: "from-rose-500 to-pink-600",
    title: "Decay Analytics",
    desc: "Real-time dashboards track post-harvest decay trends across all zones.",
  },
  {
    icon: "ph:megaphone-fill",
    color: "from-lime-500 to-green-600",
    title: "Announcements",
    desc: "Collectives broadcast price updates, schedule changes, and general notices to farmers.",
  },
  {
    icon: "ph:star-fill",
    color: "from-yellow-400 to-amber-600",
    title: "Ratings & Reviews",
    desc: "Farmer groups rate collectives to maintain transparency and service quality.",
  },
];

const STEPS = [
  {
    role: "farmer",
    step: 1,
    icon: "ph:user-plus-fill",
    title: "Register Your Group",
    desc: "Sign up as a Farmer Group with your lead farmer details and complete your profile.",
  },
  {
    role: "farmer",
    step: 2,
    icon: "ph:plant-fill",
    title: "Add Your Crops",
    desc: "List the crops you grow, set their growth status, and track them through the season.",
  },
  {
    role: "farmer",
    step: 3,
    icon: "ph:handshake-fill",
    title: "Join a Collective",
    desc: "Browse and request membership in collectives for each of your crops.",
  },
  {
    role: "collective",
    step: 1,
    icon: "ph:buildings-fill",
    title: "Register Your Collective",
    desc: "Set up your collective profile with crops handled, prices, and zone coverage.",
  },
  {
    role: "collective",
    step: 2,
    icon: "ph:users-three-fill",
    title: "Approve Farmer Groups",
    desc: "Review membership requests from farmer groups and assign them to zones.",
  },
  {
    role: "collective",
    step: 3,
    icon: "ph:calendar-check-fill",
    title: "Schedule Pickups",
    desc: "Create pickup schedules, assign drivers, and notify farmer groups automatically.",
  },
];

const TESTIMONIALS = [
  {
    name: "Debendra Semwal",
    role: "Farmer Group Lead, Triyuginarayan",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    text: "FarmFresh transformed how we sell our rajma. No more calling the coordinator every day — we just update our crop status and the pickup gets scheduled.",
    rating: 5,
  },
  {
    name: "Anita Rawat",
    role: "Lead Farmer, Mandal Valley Growers",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    text: "The zone-based scheduling means our potatoes are picked up while they're still fresh. Decay dropped from 22% to under 5% this season!",
    rating: 5,
  },
  {
    name: "Ravi Sharma",
    role: "Collective Coordinator, Mandakini",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
    text: "Managing 14 farmer groups used to be chaos. Now I can see all crop statuses on one dashboard and plan driver routes in minutes.",
    rating: 5,
  },
];

const STATS = [
  { value: "20+", label: "Farmer Groups", icon: "ph:users-three-fill" },
  { value: "28t", label: "Annual Harvest", icon: "ph:scales-fill" },
  { value: "6%", label: "Post-harvest Decay", icon: "ph:trend-down-fill" },
  { value: "3", label: "Active Collectives", icon: "ph:buildings-fill" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const Home = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [imgIdx, setImgIdx] = useState(0);
  const [stepsTab, setStepsTab] = useState("farmer");
  const [visibleStats, setVisibleStats] = useState(false);

  useEffect(() => {
    const t = setInterval(
      () => setImgIdx((p) => (p + 1) % carouselImages.length),
      3500,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisibleStats(true);
      },
      { threshold: 0.3 },
    );
    const el = document.getElementById("stats-section");
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      className={`w-full overflow-x-hidden transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* ── HERO ── */}
      <header
        className={`relative w-full flex flex-col lg:flex-row items-center gap-8 pt-26 pb-16 px-6 sm:px-12 lg:px-32 overflow-hidden ${
          isDark
            ? "bg-linear-to-br from-emerald-950 via-slate-950 to-slate-900"
            : "bg-linear-to-br from-emerald-50 via-white to-emerald-100"
        }`}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-0 w-80 h-80 rounded-full bg-emerald-500/8 blur-3xl" />

        <motion.div
          className="flex-4 space-y-7 pt-10 min-w-80"
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
            <span>Agri-Allied coordination network</span>
          </motion.div>

          <motion.h1
            className={`font-display font-bold text-4xl sm:text-5xl md:text-4xl lg:text-6xl tracking-tight leading-[1.3] sm:leading-[1.1] md:leading-[1.2] ${isDark ? "text-slate-100" : "text-slate-800"}`}
            id="hero-headline"
            variants={itemVariants}
          >
            Building{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-amber-300 to-yellow-200 font-extrabold">
              Stronger <br /> Agricultural
            </span>{" "}
            Networks
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

          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-3 justify-center lg:justify-start"
          >
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Icon icon="ph:plant-fill" className="w-5 h-5" />
              Join as Farmer Group
            </button>
            <button
              onClick={() => navigate("/register")}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border transition-all cursor-pointer ${
                isDark
                  ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                  : "border-slate-200 text-slate-700 hover:bg-white"
              }`}
            >
              <Icon icon="ph:buildings-fill" className="w-5 h-5" />
              Register Collective
            </button>
          </motion.div>

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
          <div className="w-[80vw] aspect-9/11 lg:w-[30vw] lg:aspect-10/11 overflow-hidden flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={imgIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="min-w-60 max-w-110 pointer-events-none select-none flex items-center justify-center"
                style={{
                  maskImage:
                    "linear-gradient(to top, transparent 0%, black 8%, black 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to top, transparent 0%, black 15%, black 100%)",
                }}
              >
                <img
                  src={carouselImages[imgIdx]}
                  alt="Happy Farmer"
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── STATS ── */}
      <section
        id="stats-section"
        className={`w-full py-12 px-6 ${isDark ? "bg-slate-900/80" : "bg-white"}`}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={visibleStats ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`flex flex-col items-center text-center p-5 rounded-2xl border ${
                isDark
                  ? "bg-slate-800/50 border-slate-700/50"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}
              >
                <Icon icon={s.icon} className="w-5 h-5" />
              </div>
              <p
                className={`text-3xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {s.value}
              </p>
              <p
                className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        className={`w-full py-20 px-6 sm:px-12 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span
              className={`inline-block text-xs font-mono uppercase tracking-widest mb-3 px-3 py-1 rounded-full ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}
            >
              Features
            </span>
            <h2
              className={`text-3xl sm:text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Everything you need to manage your harvest
            </h2>
            <p
              className={`mt-3 text-base max-w-xl mx-auto ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Built specifically for the Himalayan agri-supply chain.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className={`rounded-2xl border p-5 transition-all ${
                  isDark
                    ? "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl mb-4 flex items-center justify-center bg-linear-to-br ${f.color} shadow-lg`}
                >
                  <Icon icon={f.icon} className="w-5 h-5 text-white" />
                </div>
                <h3
                  className={`font-semibold text-sm mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {f.title}
                </h3>
                <p
                  className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        className={`w-full py-20 px-6 sm:px-12 ${isDark ? "bg-slate-900" : "bg-white"}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span
              className={`inline-block text-xs font-mono uppercase tracking-widest mb-3 px-3 py-1 rounded-full ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-700"}`}
            >
              How it works
            </span>
            <h2
              className={`text-3xl sm:text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Simple for both sides of the supply chain
            </h2>
          </div>

          {/* Tab */}
          <div className="flex justify-center mb-10">
            <div
              className={`inline-flex rounded-xl p-1 gap-1 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              {[
                { id: "farmer", label: "Farmer Group", icon: "ph:plant-fill" },
                {
                  id: "collective",
                  label: "Collective",
                  icon: "ph:buildings-fill",
                },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStepsTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    stepsTab === t.id
                      ? "bg-linear-to-r from-emerald-500 to-emerald-600 text-white shadow"
                      : isDark
                        ? "text-slate-400 hover:text-white"
                        : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon icon={t.icon} className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.filter((s) => s.role === stepsTab).map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative rounded-2xl border p-6 ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br ${stepsTab === "farmer" ? "from-emerald-500 to-teal-600" : "from-blue-500 to-indigo-600"} shadow-lg`}
                  >
                    <Icon icon={step.icon} className="w-5 h-5 text-white" />
                  </div>
                  <span
                    className={`text-4xl font-black opacity-10 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {step.step}
                  </span>
                </div>
                <h3
                  className={`font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {step.desc}
                </p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-emerald-500/40" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section
        className={`w-full py-20 px-6 sm:px-12 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span
              className={`inline-block text-xs font-mono uppercase tracking-widest mb-3 px-3 py-1 rounded-full ${isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-700"}`}
            >
              Testimonials
            </span>
            <h2
              className={`text-3xl sm:text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Voices from the valley
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`rounded-2xl border p-6 flex flex-col gap-4 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <div className="flex">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Icon
                      key={j}
                      icon="ph:star-fill"
                      className="w-4 h-4 text-amber-400"
                    />
                  ))}
                </div>
                <p
                  className={`text-sm leading-relaxed italic flex-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.photo}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p
                      className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {t.name}
                    </p>
                    <p
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {t.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section
        className={`w-full py-16 px-6 sm:px-12 ${isDark ? "bg-slate-900" : "bg-white"}`}
      >
        <div
          className={`max-w-4xl mx-auto rounded-3xl border p-10 sm:p-14 text-center relative overflow-hidden ${
            isDark
              ? "bg-linear-to-br from-emerald-950/80 via-slate-900 to-emerald-900/50 border-emerald-800/40"
              : "bg-linear-to-br from-emerald-50 via-white to-amber-50 border-emerald-200"
          }`}
        >
          <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <Icon
            icon="ph:plant-fill"
            className="w-12 h-12 mx-auto mb-4 text-emerald-500"
          />
          <h2
            className={`text-3xl sm:text-4xl font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Ready to transform your harvest?
          </h2>
          <p
            className={`text-base mb-8 max-w-lg mx-auto ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Join dozens of farmer groups and collectives already using FarmFresh
            to reduce waste and maximize income.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Icon icon="ph:plant-fill" className="w-5 h-5" />
              Get Started Free
            </button>
            <button
              onClick={() => navigate("/about")}
              className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold border transition-all cursor-pointer ${
                isDark
                  ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Learn More
              <Icon icon="ph:arrow-right-bold" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
