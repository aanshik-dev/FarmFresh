import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { supportChannels } from "../utils/InterfaceData";
import { Button, Input, useToast } from "../components/ui";

const Contacts = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setName("");
      setEmail("");
      setMessage("");
      toast.success("A coordinator will respond within 24 hours.", {
        title: "Message sent",
      });
    }, 1000);
  };

  return (
    <div
      className={`w-full min-h-screen overflow-hidden transition-colors duration-500 pt-32 pb-24 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* Background Ornaments (Dark Mode) */}
      {isDark && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[10%] w-[40%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]" />
        </div>
      )}

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center px-6 sm:px-10 mb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${isDark ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50 border border-blue-200"}`}
          >
            <Icon
              icon="ph:headset-fill"
              className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-600"}`}
            />
            <span
              className={`text-sm font-semibold tracking-wide uppercase ${isDark ? "text-blue-300" : "text-blue-700"}`}
            >
              Get in Touch
            </span>
          </div>
          <h1
            className={`text-4xl md:text-5xl font-extrabold mb-6 tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Reach the{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-yellow-300 to-emerald-400">
              Uttarakhand Base
            </span>
          </h1>
          <p
            className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            For harvest coordination, collection delays, or new group onboarding
            — our zone coordinators are always ready to help.
          </p>
        </motion.div>
      </div>

      <section className="px-6 sm:px-10 lg:px-20 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Contact Information Cards */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`rounded-3xl p-8 border ${
                isDark
                  ? "bg-slate-900/60 backdrop-blur-xl border-slate-800 shadow-xl shadow-black/40"
                  : "bg-white border-slate-200 shadow-xl shadow-slate-200/50"
              }`}
            >
              <h3
                className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Contact Methods
              </h3>
              <div className="space-y-6">
                {supportChannels.map((c, i) => (
                  <div key={c.label} className="flex gap-4 group">
                    <div
                      className={`shrink-0 p-3 rounded-2xl h-fit transition-transform group-hover:scale-110 group-hover:rotate-3 ${isDark ? "bg-slate-800 text-blue-400" : "bg-slate-100 text-blue-600"}`}
                    >
                      <Icon icon={c.icon} className="w-6 h-6" />
                    </div>
                    <div>
                      <p
                        className={`text-xs uppercase tracking-widest font-bold mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {c.label}
                      </p>
                      <p
                        className={`font-semibold text-lg ${isDark ? "text-white group-hover:text-blue-400" : "text-slate-900 group-hover:text-blue-600"} transition-colors`}
                      >
                        {c.value}
                      </p>
                      <p
                        className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {c.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Base Office Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`rounded-3xl p-8 border overflow-hidden relative group ${
                isDark
                  ? "bg-slate-900/60 backdrop-blur-xl border-slate-800 shadow-xl shadow-black/40"
                  : "bg-linear-to-r from-emerald-500 to-emerald-600 text-white shadow-xl"
              }`}
            >
              {/* Decorative map icon background */}
              <Icon
                icon="ph:map-trifold-duotone"
                className={`absolute -right-4 -bottom-4 w-40 h-40 opacity-5 group-hover:opacity-10 transition-opacity duration-500 ${isDark ? "text-emerald-500" : "text-white"}`}
              />

              <div className="relative z-10 flex gap-4">
                <div
                  className={`shrink-0 p-3 rounded-2xl h-fit ${isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-800 text-emerald-300"}`}
                >
                  <Icon icon="ph:map-pin-fill" className="w-6 h-6" />
                </div>
                <div>
                  <p
                    className={`text-xs uppercase tracking-widest font-bold mb-1 ${isDark ? "text-slate-500" : "text-emerald-100"}`}
                  >
                    Base Office
                  </p>
                  <p
                    className={`font-semibold text-lg mb-1 ${isDark ? "text-white" : "text-white"}`}
                  >
                    Kedarnath Marg, Guptkashi
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-emerald-100/90"}`}
                  >
                    Rudraprayag, Uttarakhand — 246439
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`lg:col-span-3 rounded-3xl border p-8 sm:p-10 ${
              isDark
                ? "bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-2xl shadow-black/40 relative overflow-hidden"
                : "bg-white border-slate-200 shadow-xl shadow-slate-200/50"
            }`}
          >
            {/* Form Glow */}
            {isDark && (
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
            )}

            <div className="relative z-10">
              <div className="mb-8">
                <h2
                  className={`font-display text-2xl sm:text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Send a message
                </h2>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Fill out the form below and we'll get back to you shortly.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Your Name"
                    placeholder="e.g. Anita Rawat"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon="ph:user-fill"
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon="ph:envelope-fill"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your harvest, group, or question…"
                    rows={5}
                    required
                    className={`w-full rounded-2xl border text-sm px-5 py-4 outline-none transition-all duration-300 resize-none
                      focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                      ${
                        isDark
                          ? "bg-slate-950/50 text-slate-100 placeholder:text-slate-600 border-slate-800 hover:border-slate-700"
                          : "bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-300 hover:border-slate-400"
                      }`}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={sending}
                    className="w-full sm:w-auto px-8 rounded-xl font-bold tracking-wide shadow-lg shadow-emerald-500/20"
                  >
                    {sending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Contacts;
