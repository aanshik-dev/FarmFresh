import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

const footerLinks = [
  { name: "Home Portal", path: "/" },
  { name: "Coordinator Hub", path: "/dashboard" },
  { name: "Farmer Groups", path: "/groups" },
  { name: "Harvest Schedule", path: "/harvest" },
  { name: "Collection Tracking", path: "/tracking" },
  { name: "Reports", path: "/reports" },
  { name: "About Project", path: "/about" },
  { name: "Setup Guide", path: "/guide" },
  { name: "Coordinator Login", path: "/login" },
];

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="flex flex-wrap justify-between gap-10">
          {/* Brand */}
          <div className="flex-1 min-w-[280px] max-w-lg">
            <Link to="/" className="inline-flex items-center gap-3 mb-5">
              <div className="bg-emerald-800 p-2 rounded-full text-emerald-200">
                <Icon icon="ph:plant-fill" className="w-6 h-6 md:w-7 md:h-7" />
              </div>

              <div>
                <h2 className="text-white font-bold tracking-wide text-lg">
                  MANDAKINI
                </h2>
                <p className="text-emerald-400 text-xs uppercase tracking-[0.25em]">
                  Organic Collective
                </p>
              </div>
            </Link>

            <p className="text-sm leading-relaxed">
              Established as an agricultural self-help initiatives collective in
              the Kedarnath Valley, Mandakini Organic is dedicated to improving
              harvest coordination, crop collection logistics, and sustainable
              livelihoods for Himalayan farming communities.
            </p>
          </div>

          {/* Links */}
          <div className="flex-1 min-w-[280px]">
            <h3 className="text-slate-200 text-sm uppercase tracking-widest font-semibold mb-5">
              Navigation
            </h3>

            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="w-[140px] text-sm hover:text-emerald-400 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="min-w-[280px]">
            <h3 className="text-slate-200 text-sm uppercase tracking-widest font-semibold mb-5">
              Uttarakhand Base
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Icon
                  icon="ph:map-pin-fill"
                  className="text-emerald-400 text-lg mt-0.5"
                />
                <span>
                  Kedarnath Marg, Guptkashi,
                  <br />
                  Rudraprayag, Uttarakhand — 246439
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Icon
                  icon="ph:phone-fill"
                  className="text-emerald-400 text-lg"
                />
                <span>+91 1372 264211</span>
              </div>

              <div className="flex items-center gap-3">
                <Icon
                  icon="ph:envelope-fill"
                  className="text-emerald-400 text-lg"
                />
                <span>coordination@mandakini-organic.org</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-800 my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Mandakini Organic Collective. All
            rights reserved.
          </p>

          <p>
            Built for farmer coordination, harvest planning and collection
            management.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
