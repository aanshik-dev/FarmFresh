import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useTheme } from "../context/ThemeContext";

const footerLinks = [
  { name: "Home Portal", path: "/" },
  { name: "Collection Hub", path: "/collection" },
  { name: "Assistance & Analytics", path: "/assistance" },
  { name: "About Collective", path: "/about" },
  { name: "Contacts", path: "/contacts" },
  { name: "UI Components", path: "/ui" },
  { name: "Coordinator Login", path: "/login" },
  { name: "Become a Partner", path: "/signup" },
];

const Footer = () => {
  const { isDark } = useTheme();

  return (
    <footer className={`border-t transition-colors duration-300 ${
      isDark
        ? "bg-slate-900 border-slate-800 text-slate-400"
        : "bg-white border-slate-200 text-slate-500"
    }`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="flex flex-wrap justify-center gap-10">
          {/* Brand */}
          <div className="flex-1 min-w-[280px] max-w-lg flex flex-col md:items-baseline items-center">
            <Link to="/" className="inline-flex items-center gap-3 mb-5">
              <div className={`p-2 rounded-full ${isDark ? "bg-emerald-800 text-emerald-200" : "bg-emerald-100 text-emerald-700"}`}>
                <Icon icon="ph:plant-fill" className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div>
                <h2 className={`font-bold tracking-widest text-lg text-nowrap quantico uppercase ${isDark ? "text-white" : "text-slate-800"}`}>
                  FarmFresh
                </h2>
                <p className="text-emerald-500 text-xs uppercase tracking-widest font-thin quantico">
                  Organic Collective
                </p>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-center md:text-left">
              Established as an agricultural self-help initiatives collective in
              the Kedarnath Valley, Mandakini Organic is dedicated to improving
              harvest coordination, crop collection logistics, and sustainable
              livelihoods for Himalayan farming communities.
            </p>
          </div>

          {/* Links */}
          <div className="flex-1 min-w-[280px]">
            <h3 className={`text-sm uppercase tracking-widest font-semibold mb-5 text-center md:text-left ${isDark ? "text-slate-200" : "text-slate-700"}`}>
              Navigation
            </h3>
            <div className="flex justify-center md:justify-start flex-wrap gap-x-8 gap-y-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm hover:text-emerald-500 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="min-w-[280px]">
            <h3 className={`text-sm uppercase tracking-widest font-semibold mb-5 text-center md:text-left ${isDark ? "text-slate-200" : "text-slate-700"}`}>
              Uttarakhand Base
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Icon icon="ph:map-pin-fill" className="text-emerald-500 text-lg mt-0.5" />
                <span>
                  Kedarnath Marg, Guptkashi,<br />
                  Rudraprayag, Uttarakhand — 246439
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Icon icon="ph:phone-fill" className="text-emerald-500 text-lg" />
                <span>+91 1372 264211</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon icon="ph:envelope-fill" className="text-emerald-500 text-lg" />
                <span>coordination@mandakini-organic.org</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`h-px my-8 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />

        <div className={`flex flex-col md:flex-row justify-between text-center items-center gap-3 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          <p>© {new Date().getFullYear()} Mandakini Organic Collective. All rights reserved.</p>
          <p>Built for farmer coordination, harvest planning and collection management.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
