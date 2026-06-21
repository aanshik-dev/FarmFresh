import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import PageHeader from "../components/PageHeader";
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
    }, 800);
  };

  return (
    <div
      className={`w-full min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <PageHeader
        eyebrow="Get in Touch"
        icon="ph:phone-fill"
        title="Reach the Uttarakhand base"
        description="For harvest coordination, collection delays, or new group onboarding — zone coordinators are reachable by phone, email, or field radio."
        isDark={isDark}
      />

      <section className="px-6 sm:px-10 lg:px-20 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 space-y-5">
            {supportChannels.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className={`rounded-2xl border p-5 flex items-start gap-4 ${
                  isDark
                    ? "bg-slate-900/60 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <div
                  className={`shrink-0 p-2.5 rounded-xl ${isDark ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}
                >
                  <Icon icon={c.icon} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs uppercase tracking-widest font-medium mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {c.label}
                  </p>
                  <p
                    className={`font-semibold break-words ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {c.value}
                  </p>
                  <p
                    className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {c.note}
                  </p>
                </div>
              </motion.div>
            ))}

            <div
              className={`rounded-2xl border p-5 flex items-start gap-4 ${
                isDark
                  ? "bg-slate-900/60 border-slate-800"
                  : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`shrink-0 p-2.5 rounded-xl ${isDark ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}
              >
                <Icon icon="ph:map-pin-fill" className="w-5 h-5" />
              </div>
              <div>
                <p
                  className={`text-xs uppercase tracking-widest font-medium mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  Base Office
                </p>
                <p
                  className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Kedarnath Marg, Guptkashi
                </p>
                <p
                  className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Rudraprayag, Uttarakhand — 246439
                </p>
              </div>
            </div>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit}
            className={`lg:col-span-3 rounded-2xl border p-6 sm:p-8 space-y-5 ${
              isDark
                ? "bg-slate-900/60 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <h2
              className={`font-display text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Send a message
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
            <div className="flex flex-col gap-1.5">
              <label
                className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your harvest, group, or question…"
                rows={5}
                required
                className={`w-full rounded-xl border text-sm px-4 py-3 outline-none transition-all duration-200 resize-none
                  focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                  ${
                    isDark
                      ? "bg-slate-800/60 text-slate-100 placeholder:text-slate-500 border-slate-700 hover:border-slate-600"
                      : "bg-white text-slate-900 placeholder:text-slate-400 border-slate-300 hover:border-slate-400"
                  }`}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={sending}
              className="w-full sm:w-auto"
            >
              Send Message
            </Button>
          </motion.form>
        </div>
      </section>
    </div>
  );
};

export default Contacts;
