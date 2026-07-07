import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../context/ThemeContext";

const Features = () => {
  const { isDark } = useTheme();

  const featuresList = [
    {
      title: "Real-time Supply Chain",
      description:
        "Track your harvest from farm to collective in real-time, ensuring total transparency and minimizing post-harvest losses.",
      icon: "ph:truck-fill",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      glow: "group-hover:shadow-emerald-500/20",
    },
    {
      title: "Fair Pricing Engine",
      description:
        "Our platform ensures farmer groups get fair, transparent prices based on real-time market data and crop quality.",
      icon: "ph:currency-inr-fill",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      glow: "group-hover:shadow-amber-500/20",
    },
    {
      title: "Automated Pickups",
      description:
        "Collectives can seamlessly schedule driver pickups across different altitude zones to optimize logistics and save fuel.",
      icon: "ph:calendar-check-fill",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      glow: "group-hover:shadow-blue-500/20",
    },
    {
      title: "Smart Inventory",
      description:
        "Digital logs for crop inventory help collectives manage storage capacity dynamically and predict local shortages.",
      icon: "ph:warehouse-fill",
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      glow: "group-hover:shadow-violet-500/20",
    },
    {
      title: "Altitude Zone Mapping",
      description:
        "Specific tracking for high-altitude crops to manage the unique harvest cycles of the Kedarnath region effectively.",
      icon: "ph:mountains-fill",
      color: "text-teal-500",
      bg: "bg-teal-500/10",
      glow: "group-hover:shadow-teal-500/20",
    },
    {
      title: "Instant Alerts",
      description:
        "Automated SMS and push alerts keep farmers informed about pickup schedules, approvals, and vital collective announcements.",
      icon: "ph:bell-ringing-fill",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      glow: "group-hover:shadow-rose-500/20",
    },
  ];

  return (
    <div
      className={`min-h-screen relative overflow-hidden transition-colors duration-500 pt-28 pb-20 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* Background Glow Effects (Dark Mode Only) */}
      {isDark && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
        </>
      )}

      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-6 ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}
            >
              <Icon icon="ph:sparkle-fill" className="w-4 h-4" />
              <span>Powerful Capabilities</span>
            </div>

            <h1
              className={`text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Supercharge your{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-500">
                harvest workflow
              </span>
            </h1>

            <p
              className={`text-lg md:text-xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              FarmFresh brings modern technology to traditional farming.
              Discover how our intuitive tools help farmer groups and
              collectives thrive.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featuresList.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`group relative p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? "bg-slate-900/40 backdrop-blur-xl border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                  : "bg-white border-slate-200 hover:border-emerald-200 shadow-sm hover:shadow-xl"
              } ${isDark ? feature.glow : ""}`}
            >
              {/* Icon Container */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${feature.bg}`}
              >
                <Icon
                  icon={feature.icon}
                  className={`w-7 h-7 ${feature.color}`}
                />
              </div>

              {/* Content */}
              <h3
                className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {feature.title}
              </h3>
              <p
                className={`leading-relaxed text-sm ${isDark ? "text-slate-400 group-hover:text-slate-300" : "text-slate-600 group-hover:text-slate-700"} transition-colors`}
              >
                {feature.description}
              </p>

              {/* Decorative corner accent */}
              <div
                className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-transparent via-transparent to-current opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-bl-[100px] rounded-tr-3xl ${feature.color}`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
