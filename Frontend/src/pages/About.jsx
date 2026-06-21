import React from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import PageHeader from "../components/PageHeader";
import { timeline, values } from "../utils/InterfaceData";

const About = () => {
  const { isDark } = useTheme();

  return (
    <div
      className={`w-full min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <PageHeader
        eyebrow="About the Collective"
        icon="ph:mountains-fill"
        title="Coordinating Himalayan harvests since 2019"
        description="Mandakini Organic began as a handful of farmer groups sharing a single harvest calendar by phone. Today the collective spans four altitude zones across the Kedarnath Valley, coordinating organic cultivation, collection logistics, and sustainable livelihoods for mountain farming communities."
        isDark={isDark}
      />

      <section className="px-6 sm:px-10 lg:px-20 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <h2
            className={`font-display text-2xl sm:text-3xl font-bold mb-10 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            What we stand for
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className={`rounded-2xl border p-6 flex gap-4 ${
                  isDark
                    ? "bg-slate-900/60 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <div
                  className={`shrink-0 p-3 rounded-xl h-fit ${isDark ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}
                >
                  <Icon icon={v.icon} className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className={`font-semibold mb-1.5 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {v.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {v.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        className={`px-6 sm:px-10 lg:px-20 py-16 sm:py-20 ${isDark ? "bg-slate-900/40" : "bg-white"}`}
      >
        <div className="max-w-3xl mx-auto">
          <h2
            className={`font-display text-2xl sm:text-3xl font-bold mb-10 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Our journey
          </h2>
          <div className="relative">
            <div
              className={`absolute left-[7px] top-2 bottom-2 w-px ${isDark ? "bg-emerald-800" : "bg-emerald-200"}`}
            />
            <div className="space-y-10">
              {timeline.map((t, i) => (
                <motion.div
                  key={t.year}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.08 }}
                  className="relative pl-9"
                >
                  <span
                    className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                      isDark
                        ? "bg-emerald-500 border-slate-950"
                        : "bg-emerald-500 border-slate-50"
                    }`}
                  />
                  <p
                    className={`text-xs font-mono uppercase tracking-widest mb-1 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  >
                    {t.year}
                  </p>
                  <h3
                    className={`font-semibold text-lg mb-1.5 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {t.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {t.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
