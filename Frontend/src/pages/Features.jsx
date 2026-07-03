import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../context/ThemeContext";

const Features = () => {
  const { isDark } = useTheme();

  const featuresList = [
    {
      title: "Real-time Supply Chain Tracking",
      description: "Track your harvest from farm to collective in real-time, ensuring transparency and reducing post-harvest losses.",
      icon: "ph:truck-fill",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Fair Pricing Engine",
      description: "Our platform ensures farmer groups get fair, transparent prices based on real-time market data and crop quality.",
      icon: "ph:currency-inr-fill",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Automated Pickups",
      description: "Collectives can seamlessly schedule driver pickups across different altitude zones to optimize logistics.",
      icon: "ph:calendar-check-fill",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Inventory & Storage Management",
      description: "Digital logs for crop inventory help collectives manage storage capacity and predict shortages.",
      icon: "ph:warehouse-fill",
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      title: "Altitude Zone Mapping",
      description: "Specific tracking for high-altitude crops to manage the unique harvest cycles of the Kedarnath region.",
      icon: "ph:mountains-fill",
      color: "text-teal-500",
      bg: "bg-teal-500/10",
    },
    {
      title: "Instant Notifications",
      description: "SMS and push alerts keep farmers informed about pickup schedules, approvals, and collective announcements.",
      icon: "ph:bell-ringing-fill",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className={`min-h-screen pt-24 pb-20 ${isDark ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-800"}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-16">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className={`text-4xl md:text-5xl font-extrabold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>
              Platform Features
            </h1>
            <p className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              FarmFresh brings modern technology to traditional farming. 
              Discover how our tools help farmer groups and collectives thrive.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresList.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                isDark 
                  ? "bg-slate-900/60 border-slate-800 hover:border-slate-700" 
                  : "bg-white border-slate-200 hover:border-emerald-200"
              }`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${feature.bg}`}>
                <Icon icon={feature.icon} className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                {feature.title}
              </h3>
              <p className={`leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Features;
