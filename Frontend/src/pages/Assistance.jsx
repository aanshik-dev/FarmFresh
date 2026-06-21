import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/dashboard/StatCard";
import HarvestTrendChart from "../components/dashboard/HarvestTrendChart";
import ZoneBarChart from "../components/dashboard/ZoneBarChart";
import CropDonutChart from "../components/dashboard/CropDonutChart";
import DecayLineChart from "../components/dashboard/DecayLineChart";
import {
  dashboardStats,
  monthlyHarvest,
  zoneBreakdown,
  cropDistribution,
  decayTrend,
  faqs,
} from "../utils/InterfaceData";

const ChartCard = ({ title, subtitle, isDark, children }) => (
  <div
    className={`rounded-2xl border p-5 sm:p-6 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
  >
    <div className="mb-4">
      <h3
        className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
      >
        {title}
      </h3>
      {subtitle && (
        <p
          className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          {subtitle}
        </p>
      )}
    </div>
    {children}
  </div>
);

const FaqItem = ({ item, isOpen, onToggle, isDark }) => (
  <div
    className={`rounded-xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
  >
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between gap-4 text-left px-5 py-4 cursor-pointer transition-colors ${
        isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-50"
      }`}
    >
      <span
        className={`font-medium text-sm sm:text-base ${isDark ? "text-white" : "text-slate-900"}`}
      >
        {item.q}
      </span>
      <Icon
        icon="ph:caret-down-bold"
        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
      />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <p
            className={`px-5 pb-4 text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            {item.a}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const Assistance = () => {
  const { isDark } = useTheme();
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div
      className={`w-full min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <PageHeader
        eyebrow="Assistance & Analytics"
        icon="ph:chart-line-up-fill"
        title="Coordination dashboard"
        description="A live view of harvest volume, zone performance, and decay reduction across the collective, plus answers to common coordination questions."
        isDark={isDark}
      />

      <section className="px-6 sm:px-10 lg:px-20 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10">
            {dashboardStats.map((stat, i) => (
              <StatCard
                key={stat.label}
                stat={stat}
                isDark={isDark}
                index={i}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <ChartCard
              title="Monthly Harvest Volume"
              subtitle="Kilograms collected across all zones"
              isDark={isDark}
            >
              <HarvestTrendChart data={monthlyHarvest} isDark={isDark} />
            </ChartCard>
            <ChartCard
              title="Yield by Zone"
              subtitle="Altitude-based collection zones"
              isDark={isDark}
            >
              <ZoneBarChart data={zoneBreakdown} isDark={isDark} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard
              title="Crop Distribution"
              subtitle="Share of total yield by crop"
              isDark={isDark}
            >
              <CropDonutChart data={cropDistribution} isDark={isDark} />
            </ChartCard>
            <ChartCard
              title="Post-Harvest Decay"
              subtitle="Percentage lost before collection"
              isDark={isDark}
            >
              <DecayLineChart data={decayTrend} isDark={isDark} />
            </ChartCard>
          </div>
        </div>
      </section>

      <section
        className={`px-6 sm:px-10 lg:px-20 py-16 sm:py-20 ${isDark ? "bg-slate-900/40" : "bg-white"}`}
      >
        <div className="max-w-3xl mx-auto">
          <h2
            className={`font-display text-2xl sm:text-3xl font-bold mb-8 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <FaqItem
                key={item.q}
                item={item}
                isDark={isDark}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Assistance;
