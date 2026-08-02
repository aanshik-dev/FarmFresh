import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useTheme } from "../context/ThemeContext";

const footerLinks = [
  { name: "Home Portal", path: "/" },
  { name: "Features", path: "/features" },
  { name: "About Collective", path: "/about" },
  { name: "Contacts", path: "/contact" },
  { name: "Coordinator Login", path: "/login" },
  { name: "Become a Partner", path: "/register" },
  {
    name: "Developer",
    path: "https://aanshik-dev.vercel.app",
    isExternal: true,
  },
];

const Footer = () => {
  const { isDark } = useTheme();

  return (
    <footer
      className={`border-t transition-colors duration-300 ${
        isDark
          ? "bg-slate-900 border-slate-800 text-slate-400"
          : "bg-white border-slate-200 text-slate-500"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="flex flex-wrap justify-center gap-10">
          {/* Brand */}
          <div className="flex-1 w-full sm:w-auto sm:min-w-[260px] max-w-lg flex flex-col md:items-baseline items-center">
            <Link to="/" className="inline-flex items-center gap-3 mb-5">
              <div
                className={`p-2 rounded-full ${isDark ? "bg-emerald-800 text-emerald-200" : "bg-emerald-100 text-emerald-700"}`}
              >
                <Icon icon="ph:plant-fill" className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div>
                <h2
                  className={`font-bold tracking-widest text-lg text-nowrap quantico uppercase ${isDark ? "text-white" : "text-slate-800"}`}
                >
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
          <div className="flex-1 w-full sm:w-auto sm:min-w-[260px]">
            <h3
              className={`text-sm uppercase tracking-widest font-semibold mb-5 text-center md:text-left ${isDark ? "text-slate-200" : "text-slate-700"}`}
            >
              Navigation
            </h3>
            <div className="flex justify-center md:justify-start flex-wrap gap-x-8 gap-y-3">
              {footerLinks.map((link) =>
                link.isExternal ? (
                  <a
                    key={link.path}
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-emerald-500 transition-colors"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="text-sm hover:text-emerald-500 transition-colors"
                  >
                    {link.name}
                  </Link>
                ),
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="w-full sm:w-auto sm:min-w-[260px]">
            <h3
              className={`text-sm uppercase tracking-widest font-semibold mb-5 text-center md:text-left ${isDark ? "text-slate-200" : "text-slate-700"}`}
            >
              Uttarakhand Base
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Icon
                  icon="ph:map-pin-fill"
                  className="text-emerald-500 text-lg mt-0.5"
                />
                <span>
                  Kedarnath Marg, Guptkashi,
                  <br />
                  Rudraprayag, Uttarakhand - 246439
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Icon
                  icon="ph:phone-fill"
                  className="text-emerald-500 text-lg"
                />
                <span>+91 1372 264211</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon
                  icon="ph:envelope-fill"
                  className="text-emerald-500 text-lg"
                />
                <span>coordination@mandakini-organic.org</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`h-px my-8 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
        />

        <div
          className={`flex flex-col md:flex-row justify-between text-center items-center gap-3 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          <p>
            © {new Date().getFullYear()} Mandakini Organic Collective. All
            rights reserved.
          </p>
          <p className="flex items-center justify-center md:justify-end gap-1">
            Built for farmer coordination by{" "}
            <a
              href="https://aanshik-dev.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-800 hover:text-emerald-600 font-semibold transition-colors"
            >
              <span
                className={`p-1 pb-1.5 rounded-full flex items-center justify-center ${isDark ? "" : "bg-emerald-900 shadow-sm"}`}
              >
                <img
                  src="/assets/Symbol.svg"
                  alt="Aanshik-dev"
                  className="w-3 h-3"
                />
              </span>
              Aanshik-dev
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
