import React from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { timeline, values } from "../utils/InterfaceData";

const About = () => {
  const { isDark } = useTheme();

  return (
    <div className={`w-full min-h-screen overflow-hidden transition-colors duration-500 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 sm:px-10 lg:px-20">
        {/* Abstract Background Elements */}
        {isDark && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[60%] bg-emerald-600/10 rounded-[100%] blur-[120px]" />
            <div className="absolute top-[20%] left-[-20%] w-[40%] h-[50%] bg-teal-600/10 rounded-[100%] blur-[100px]" />
          </div>
        )}
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 ${isDark ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200 shadow-sm"}`}
          >
            <Icon icon="ph:mountains-fill" className={`w-4 h-4 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
            <span className={`text-sm font-semibold tracking-wide uppercase ${isDark ? "text-slate-300" : "text-slate-600"}`}>About the Collective</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 tracking-tight leading-tight ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Coordinating Himalayan harvests <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">since 2019</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`text-lg md:text-xl leading-relaxed max-w-3xl mx-auto ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Mandakini Organic began as a handful of farmer groups sharing a single harvest calendar by phone. Today the collective spans four altitude zones across the Kedarnath Valley, coordinating organic cultivation, collection logistics, and sustainable livelihoods for mountain farming communities.
          </motion.p>
        </div>
      </section>

      {/* Values Section */}
      <section className="px-6 sm:px-10 lg:px-20 py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`font-display text-3xl sm:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              What we stand for
            </h2>
            <p className={`max-w-2xl mx-auto ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Our core values guide every decision we make for the collective and our partner farmers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group rounded-3xl border p-8 flex flex-col sm:flex-row gap-6 transition-all duration-300 hover:-translate-y-1 ${
                  isDark
                    ? "bg-slate-900/40 backdrop-blur-md border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 shadow-2xl shadow-black/20"
                    : "bg-white border-slate-200 hover:border-emerald-200 hover:shadow-xl shadow-sm"
                }`}
              >
                <div className={`shrink-0 p-4 rounded-2xl h-fit transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}>
                  <Icon icon={v.icon} className="w-8 h-8" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    {v.title}
                  </h3>
                  <p className={`leading-relaxed ${isDark ? "text-slate-400 group-hover:text-slate-300" : "text-slate-600"} transition-colors`}>
                    {v.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className={`px-6 sm:px-10 lg:px-20 py-24 ${isDark ? "bg-slate-900/30 border-t border-slate-800/50" : "bg-slate-100/50 border-t border-slate-200"}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`font-display text-3xl sm:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              Our Journey
            </h2>
            <p className={`max-w-2xl mx-auto ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              From a small initiative to a valley-wide collective.
            </p>
          </div>
          
          <div className="relative wrap overflow-hidden p-4 h-full">
            {/* Center line */}
            <div className={`absolute left-[20px] md:left-1/2 top-0 bottom-0 w-1 md:-ml-[1px] rounded-full ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
            
            <div className="space-y-12">
              {timeline.map((t, i) => {
                const isEven = i % 2 === 0;
                return (
                  <motion.div
                    key={t.year}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={`flex flex-col md:flex-row items-start md:items-center w-full relative ${isEven ? "md:justify-end" : ""}`}
                  >
                    {/* Dot */}
                    <div className={`absolute left-[12px] md:left-1/2 w-5 h-5 rounded-full border-4 z-10 md:-translate-x-1/2 shadow-lg ${
                      isDark ? "bg-emerald-400 border-slate-900 shadow-emerald-900/50" : "bg-emerald-500 border-white shadow-emerald-200"
                    }`} />
                    
                    {/* Content Card */}
                    <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${isEven ? "md:mr-auto md:pr-12 md:text-right" : "md:ml-auto md:pl-12"}`}>
                      <div className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                        isDark 
                          ? "bg-slate-900/80 border-slate-800 hover:border-emerald-500/30" 
                          : "bg-white border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-md"
                      }`}>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest mb-3 ${isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}>
                          {t.year}
                        </span>
                        <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                          {t.title}
                        </h3>
                        <p className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          {t.text}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
