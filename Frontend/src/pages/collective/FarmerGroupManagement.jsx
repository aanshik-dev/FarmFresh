import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import EmptyState from "../../components/common/EmptyState";
import ImageCarouselModal from "../../components/common/ImageCarouselModal";
import { useToast } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import {
  collectiveMemberAPI,
  collectiveZoneAPI,
  collectiveDealAPI,
} from "../../services/api";
import axios from "axios";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatAddress = (addr) => {
  if (!addr) return "No address provided";
  if (typeof addr === "string") return addr;
  const parts = [
    addr.locality,
    addr.area,
    addr.town,
    addr.district,
    addr.state,
  ].filter(Boolean);
  return parts.join(", ") || "No address provided";
};

const shortAddr = (addr) => {
  if (!addr) return "—";
  if (typeof addr === "string") return addr || "—";
  return (
    [addr.town, addr.district].filter(Boolean).join(", ") || formatAddress(addr)
  );
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtDT = (dt) => {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

// ── Farmer Group Row Card (Left List) ──────────────────────────────────────────
const FGRow = ({ farmer, isDark, isSelected, onClick }) => {
  const deals = Array.isArray(farmer.deals) ? farmer.deals : [];
  const activeDeals = deals.filter(
    (d) => d.status === "APPROVED" || d.status === "REQUESTED",
  );
  const zoneName = farmer.membership?.zone?.name;
  const zoneColor = farmer.membership?.zone?.color || "#10b981";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`group flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
        isSelected
          ? isDark
            ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30"
            : "bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/20"
          : isDark
            ? "bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700"
            : "bg-white border-slate-200/80 hover:bg-slate-50"
      }`}
    >
      {/* Avatar */}
      <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700 shadow-md">
        {farmer.profile || farmer.profilePhoto ? (
          <img
            src={farmer.profile || farmer.profilePhoto}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-base font-bold">
            {(farmer.name || farmer.groupName || "FG")
              .substring(0, 2)
              .toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`text-base font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {farmer.name || farmer.groupName || "Farmer Group"}
          </h3>
          {zoneName && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border"
              style={{
                backgroundColor: `${zoneColor}15`,
                color: zoneColor,
                borderColor: `${zoneColor}30`,
              }}
            >
              {zoneName}
            </span>
          )}
        </div>

        {/* Leader & Farmers count & location */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
          <span
            className={`flex items-center gap-1 font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            <Icon
              icon="ph:user-bold"
              className="w-3.5 h-3.5 text-emerald-500 shrink-0"
            />
            {farmer.leadFarmer || "N/A"} (
            {farmer.farmerCount || farmer.numberOfFarmers || 1} farmers)
          </span>

          <span
            className={`truncate flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            <Icon
              icon="ph:map-pin-fill"
              className="w-3.5 h-3.5 text-teal-500 shrink-0"
            />
            {shortAddr(farmer.address)}
          </span>
        </div>

        {/* Partnered Crops Summary */}
        {activeDeals.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {activeDeals.slice(0, 3).map((d) => {
              const cropName = d.crop?.crop?.name || d.crop?.name || "Crop";
              return (
                <span
                  key={d._id}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                    isDark
                      ? "bg-slate-800/80 text-emerald-300 border-slate-700/60"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                  }`}
                >
                  {cropName} {d.agreedPrice > 0 ? `(₹${d.agreedPrice}/kg)` : ""}
                </span>
              );
            })}
            {activeDeals.length > 3 && (
              <span
                className={`text-[10px] font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                +{activeDeals.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Detail Panel ──────────────────────────────────────────────────────────────
const DetailPanel = ({
  farmer,
  isDark,
  onGetStatus,
  onTerminateDeal,
  onOpenCarousel,
  onClose,
}) => {
  if (!farmer) return null;

  const [panelTab, setPanelTab] = useState("overview");
  const deals = Array.isArray(farmer.deals) ? farmer.deals : [];
  const zone = farmer.membership?.zone;

  const grownCropsList = useMemo(() => {
    const set = new Set();
    deals.forEach((d) => {
      const name = d.crop?.crop?.name || d.crop?.name;
      if (name) set.add(name);
    });
    if (farmer.desc) {
      const match = farmer.desc.match(/grow\s+([^.]+)/i);
      if (match && match[1]) {
        match[1].split(/,|\band\b/i).forEach((c) => {
          const trimmed = c.trim();
          if (trimmed && trimmed.length < 20) set.add(trimmed);
        });
      }
    }
    return Array.from(set);
  }, [farmer, deals]);

  const PANEL_TABS = [
    { key: "overview", label: "Overview", icon: "ph:info-bold" },
    {
      key: "crops",
      label: `Dealing Crops (${deals.length})`,
      icon: "ph:plant-bold",
    },
  ];

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800 shadow-2xl shadow-black/40" : "bg-white border-slate-200 shadow-2xl shadow-slate-200/50"}`}
    >
      {/* Hero Header */}
      <div className={`relative overflow-hidden p-5 pb-5 ${isDark ? "bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900" : "bg-gradient-to-br from-emerald-400 to-teal-500"}`}>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center cursor-pointer transition-colors"
            title="Close details"
          >
            <Icon icon="ph:x-bold" className="w-4 h-4" />
          </button>
        )}

        <div className="relative z-10 flex items-end gap-4">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-white/20 ring-2 ring-white/30 shadow-lg">
            {farmer.profile || farmer.profilePhoto ? (
              <img
                src={farmer.profile || farmer.profilePhoto}
                alt={farmer.name || farmer.groupName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                {(farmer.name || farmer.groupName || "FG")
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h2 className="text-xl font-bold text-white leading-tight truncate">
              {farmer.name || farmer.groupName || "Farmer Group"}
            </h2>
            <p className="text-xs text-white/80 mt-0.5 truncate">
              Lead Farmer:{" "}
              <strong className="text-white">
                {farmer.leadFarmer || "N/A"}
              </strong>{" "}
              · {farmer.farmerCount || farmer.numberOfFarmers || 1} Farmers
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {zone?.name && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-black/30 text-white"
                  style={{ borderColor: zone.color || "#10b981" }}
                >
                  Zone: {zone.name}
                </span>
              )}
              <span className="text-[10px] font-semibold text-white/90 bg-white/15 px-2.5 py-0.5 rounded-full">
                {shortAddr(farmer.address)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subsections Tab Bar */}
      <div
        className={`flex border-b ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/50"}`}
      >
        {PANEL_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setPanelTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              panelTab === t.key
                ? "border-emerald-500 text-emerald-500 bg-emerald-500/5"
                : `border-transparent ${isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"}`
            }`}
          >
            <Icon icon={t.icon} className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Body Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {panelTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Contact Information */}
              <div
                className={`rounded-xl p-3.5 border ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
              >
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Contact & Group Details
                </p>
                <div className="space-y-2.5">
                  {farmer.phone && (
                    <a
                      href={`tel:${farmer.phone}`}
                      className="flex items-center gap-2.5 group/link"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-emerald-500/15" : "bg-emerald-50"}`}
                      >
                        <Icon
                          icon="ph:phone-fill"
                          className="w-4 h-4 text-emerald-500"
                        />
                      </div>
                      <div>
                        <p
                          className={`text-xs font-bold group-hover/link:text-emerald-500 transition-colors ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {farmer.phone}
                        </p>
                        <p
                          className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          Phone · Tap to call
                        </p>
                      </div>
                    </a>
                  )}
                  {farmer.email && (
                    <a
                      href={`mailto:${farmer.email}`}
                      className="flex items-center gap-2.5"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-blue-500/15" : "bg-blue-50"}`}
                      >
                        <Icon
                          icon="ph:envelope-simple-fill"
                          className="w-4 h-4 text-blue-500"
                        />
                      </div>
                      <p
                        className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
                      >
                        {farmer.email}
                      </p>
                    </a>
                  )}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-violet-500/15" : "bg-violet-50"}`}
                    >
                      <Icon
                        icon="ph:map-pin-fill"
                        className="w-4 h-4 text-violet-500"
                      />
                    </div>
                    <p
                      className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      {formatAddress(farmer.address)}
                    </p>
                  </div>
                  {farmer.membership?.memberSince && (
                    <div className="flex items-center gap-2.5 pt-1">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-amber-500/15" : "bg-amber-50"}`}
                      >
                        <Icon
                          icon="ph:calendar-bold"
                          className="w-4 h-4 text-amber-500"
                        />
                      </div>
                      <p
                        className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
                      >
                        Member since {fmtDate(farmer.membership.memberSince)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Group Description & Crops Grown */}
              <div
                className={`rounded-xl p-3.5 border ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
              >
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  About & Dealing Crop
                </p>
                {farmer.desc && (
                  <p
                    className={`text-xs leading-relaxed mb-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    {farmer.desc}
                  </p>
                )}

                {grownCropsList.length > 0 && (
                  <div>
                    <p
                      className={`text-[10px] font-semibold mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Dealing Crop:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {grownCropsList.map((cName) => (
                        <span
                          key={cName}
                          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            isDark
                              ? "bg-slate-900/80 border-slate-700 text-emerald-400"
                              : "bg-white border-slate-200 text-emerald-700 shadow-sm"
                          }`}
                        >
                          <Icon
                            icon="ph:leaf-fill"
                            className="w-3 h-3 text-emerald-500"
                          />
                          {cName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Logistics & Route info */}
              <div
                className={`p-3.5 rounded-xl border ${
                  isDark
                    ? "bg-slate-800/40 border-slate-700/60"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Assigned Zone & Route
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span
                      className={isDark ? "text-slate-400" : "text-slate-500"}
                    >
                      Zone:
                    </span>
                    <span className="font-bold text-emerald-400">
                      {farmer?.membership?.zone?.name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={isDark ? "text-slate-400" : "text-slate-500"}
                    >
                      Distance:
                    </span>
                    <span className="font-bold">
                      {farmer?.membership?.distance
                        ? `${farmer.membership.distance} km`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={isDark ? "text-slate-400" : "text-slate-500"}
                    >
                      Est. Time:
                    </span>
                    <span className="font-bold">
                      {farmer?.membership?.estTime
                        ? `${farmer.membership.estTime} mins`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {panelTab === "crops" && (
            <motion.div
              key="crops"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              {deals.length === 0 ? (
                <div className="text-center py-8">
                  <Icon
                    icon="ph:plant-duotone"
                    className="w-10 h-10 mx-auto mb-2 text-slate-500 opacity-40"
                  />
                  <p
                    className={`text-sm font-semibold ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    No crop deals associated
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    Partnered crop deals will appear here.
                  </p>
                </div>
              ) : (
                deals.map((deal) => {
                  const cropInfo = deal.crop?.crop || deal.crop || {};
                  const cropName = cropInfo.name || "Crop";
                  const cropCode = cropInfo.code || "—";
                  const cropCategory = cropInfo.category || "General";
                  const cropSeason = cropInfo.season || "—";

                  const isApproved = deal.status === "APPROVED";
                  const isRequested = deal.status === "REQUESTED";
                  const isQueryPending =
                    deal.queryPending || deal.growth?.queryStatus === "OPEN";

                  const statusStyle =
                    {
                      APPROVED:
                        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                      REQUESTED:
                        "bg-amber-500/15 text-amber-400 border-amber-500/30",
                      REJECTED: "bg-red-500/15 text-red-400 border-red-500/30",
                      F_TERMINATE:
                        "bg-red-500/15 text-red-400 border-red-500/30",
                      C_TERMINATE:
                        "bg-red-500/15 text-red-400 border-red-500/30",
                    }[deal.status] ||
                    "bg-slate-500/15 text-slate-400 border-slate-500/30";

                  const stageLabel = String(
                    deal.growth?.stage || "SOWING",
                  ).toUpperCase();
                  const farmerMessage =
                    deal.growth?.message ||
                    deal.growth?.note ||
                    deal.message ||
                    deal.note;
                  const imagesList =
                    Array.isArray(deal.growth?.images)
                      ? deal.growth.images
                      : [];
                  const lastUpdateDate =
                    deal.growth?.lastUpdated ||
                    deal.updatedAt ||
                    deal.createdAt;
                  const lastUpdatedText = fmtDT(lastUpdateDate);

                  const daysSinceUpdate = lastUpdateDate
                    ? (Date.now() - new Date(lastUpdateDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                    : 999;
                  const canRequestStatus = daysSinceUpdate >= 10;
                  const daysRemaining = Math.max(
                    1,
                    Math.ceil(10 - daysSinceUpdate),
                  );

                  return (
                    <div
                      key={deal._id}
                      className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
                        isDark
                          ? "bg-slate-900/60 border-slate-800"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      {/* Row 1: Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                              isDark
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-emerald-100 text-emerald-600"
                            }`}
                          >
                            <Icon icon="ph:plant-fill" className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm leading-snug">
                              {cropName}
                            </h4>
                            <p
                              className={`text-[11px] font-mono ${
                                isDark ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              {cropCode} · {cropCategory} ({cropSeason})
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusStyle}`}
                        >
                          {deal.status}
                        </span>
                      </div>

                      {/* Row 2: Metrics Strip */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 block">
                            {deal.agreedPrice > 0 ? "Agreed Rate" : "Demanded Rate"}
                          </span>
                          <span className="font-extrabold text-emerald-400">
                            {deal.agreedPrice > 0
                              ? `₹${deal.agreedPrice}/kg`
                              : deal.demandedPrice > 0
                                ? `₹${deal.demandedPrice}/kg`
                                : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 block">
                            Growth Stage
                          </span>
                          <span className="font-bold text-white flex items-center gap-1">
                            <Icon icon="ph:seedling-fill" className="w-3.5 h-3.5 text-emerald-400" />
                            {stageLabel}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 block">
                            Updated
                          </span>
                          <span className="font-medium text-[11px] text-slate-300 truncate block">
                            {lastUpdatedText}
                          </span>
                        </div>
                      </div>

                      {/* Row 3: Photo Stack Collection & Farmer Note */}
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                        {imagesList.length > 0 && (
                          <div
                            onClick={() => onOpenCarousel && onOpenCarousel(imagesList, 0)}
                            className="group relative flex-1 sm:max-w-[180px] p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-emerald-500/50 cursor-pointer transition-all flex items-center gap-3 shrink-0"
                          >
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700 shrink-0 shadow-md group-hover:scale-105 transition-transform">
                              <img src={imagesList[0]} alt="Crop" className="w-full h-full object-cover" />
                              {imagesList.length > 1 && (
                                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center text-white text-xs font-bold">
                                  +{imagesList.length - 1}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 flex items-center gap-1 transition-colors">
                                <Icon icon="ph:images-square-fill" className="w-4 h-4 text-emerald-400 shrink-0" />
                                {imagesList.length} {imagesList.length === 1 ? "Photo" : "Photos"}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">Click for carousel</p>
                            </div>
                          </div>
                        )}

                        {farmerMessage && (
                          <div className="flex-1 p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 text-xs flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 mb-0.5 text-blue-400 font-bold">
                              <Icon icon="ph:chat-teardrop-text-fill" className="w-3.5 h-3.5" />
                              Farmer Note
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed italic line-clamp-2">&quot;{farmerMessage}&quot;</p>
                          </div>
                        )}
                      </div>

                      {deal.status === "REJECTED" && deal.rejectionReason && (
                        <p className="text-xs text-red-400 font-medium">
                          Reason: {deal.rejectionReason}
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-end pt-2 border-t border-slate-200/60 dark:border-slate-700/60 gap-2">
                        {isApproved &&
                          (isQueryPending ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Icon
                                icon="ph:hourglass-medium-bold"
                                className="w-3.5 h-3.5 animate-spin"
                              />
                              Query Pending
                            </span>
                          ) : !canRequestStatus ? (
                            <button
                              disabled
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center gap-1 cursor-not-allowed opacity-60"
                              title={`Status updated ${Math.floor(daysSinceUpdate)} day(s) ago. You can request status again in ${daysRemaining} day(s).`}
                            >
                              <Icon
                                icon="ph:clock-bold"
                                className="w-3.5 h-3.5"
                              />
                              Get Status ({daysRemaining}d)
                            </button>
                          ) : (
                            <button
                              onClick={() => onGetStatus(deal._id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/30 flex items-center gap-1 cursor-pointer transition-all"
                              title="Request current crop status from farmer group"
                            >
                              <Icon
                                icon="ph:paper-plane-tilt-bold"
                                className="w-3.5 h-3.5"
                              />
                              Get Status
                            </button>
                          ))}

                        {(isApproved || isRequested) && (
                          <button
                            onClick={() => onTerminateDeal(deal._id, cropName)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 flex items-center gap-1 cursor-pointer transition-all"
                            title="Terminate Deal"
                          >
                            <Icon
                              icon="ph:prohibit-bold"
                              className="w-3.5 h-3.5"
                            />
                            Terminate
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ── Main Page Component ──────────────────────────────────────────────────────
const FarmerGroupManagement = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();

  const [carouselData, setCarouselData] = useState({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });

  const [tab, setTab] = useState("members"); // "members" | "requests"
  const [memberData, setMemberData] = useState({
    requests: [],
    approved: [],
    rejected: [],
    terminated: [],
    cancelled: [],
  });
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Navigation State & Selected Farmer Group
  const [view, setView] = useState("list"); // "list" | "approve_form"
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Form state for review & approval
  const [approving, setApproving] = useState(false);
  const [selectedZone, setSelectedZone] = useState("");
  const [cropDecisions, setCropDecisions] = useState({});
  const [formStep, setFormStep] = useState(1);
  const [logistics, setLogistics] = useState({
    route: "",
    distance: "",
    estTime: "",
  });
  const [fetchingRoute, setFetchingRoute] = useState(false);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [memberRes, zoneRes] = await Promise.all([
        collectiveMemberAPI.get(),
        collectiveZoneAPI.get(),
      ]);
      const mData = memberRes.data?.memberData || {
        requests: [],
        approved: [],
        rejected: [],
        terminated: [],
        cancelled: [],
      };
      setMemberData(mData);
      setZones(zoneRes.data?.zones || []);
    } catch (err) {
      toast.error("Failed to load membership data");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const membersList = Array.isArray(memberData.approved)
    ? memberData.approved
    : [];
  const requestsList = Array.isArray(memberData.requests)
    ? memberData.requests
    : [];

  // Search filter
  const filteredMembers = useMemo(() => {
    if (!search.trim()) return membersList;
    const q = search.toLowerCase();

    return membersList.filter((f) => {
      const nameMatch = (f.name || f.groupName || "").toLowerCase().includes(q);
      const leadMatch = (f.leadFarmer || "").toLowerCase().includes(q);
      const emailMatch = (f.email || "").toLowerCase().includes(q);
      const phoneMatch = (f.phone || "").toLowerCase().includes(q);
      const addrMatch = formatAddress(f.address).toLowerCase().includes(q);
      const cropMatch = (f.deals || []).some((d) => {
        const cropName = d.crop?.crop?.name || d.crop?.name || "";
        return cropName.toLowerCase().includes(q);
      });

      return (
        nameMatch ||
        leadMatch ||
        emailMatch ||
        phoneMatch ||
        addrMatch ||
        cropMatch
      );
    });
  }, [membersList, search]);

  // Auto select first member (only in members list view)
  useEffect(() => {
    if (tab === "members" && view === "list") {
      if (filteredMembers.length > 0) {
        if (
          !selectedFarmer ||
          !filteredMembers.some((f) => f._id === selectedFarmer._id)
        ) {
          setSelectedFarmer(filteredMembers[0]);
        }
      } else {
        setSelectedFarmer(null);
      }
    }
  }, [filteredMembers, selectedFarmer, tab, view]);

  // Keep selected fresh after data refresh
  useEffect(() => {
    if (selectedFarmer) {
      const updated =
        membersList.find((f) => f._id === selectedFarmer._id) ||
        requestsList.find((f) => f._id === selectedFarmer._id);
      if (updated) setSelectedFarmer(updated);
    }
  }, [membersList, requestsList]);

  // Open Approval Form for Pending Request
  const openApproveForm = (farmer) => {
    setSelectedFarmer(farmer);
    const initialZone = farmer.membership?.zone?._id || "";
    setSelectedZone(initialZone);

    // Check if logistics already exist
    const initialLogistics = {
      route: farmer.membership?.route || "",
      distance:
        farmer.membership?.distance !== undefined &&
        farmer.membership?.distance !== null &&
        farmer.membership?.distance > 0
          ? String(farmer.membership.distance)
          : "",
      estTime:
        farmer.membership?.estTime !== undefined &&
        farmer.membership?.estTime !== null &&
        farmer.membership?.estTime > 0
          ? String(farmer.membership.estTime)
          : "",
    };
    setLogistics(initialLogistics);

    // Check if ALL 4 step 1 fields are present (zone, route, distance, estTime)
    const isStep1Complete = Boolean(
      initialZone &&
      initialLogistics.route.trim() &&
      initialLogistics.distance.trim() &&
      initialLogistics.estTime.trim(),
    );

    // If all step 1 data is present, go directly to step 2, otherwise open step 1
    if (isStep1Complete) {
      setFormStep(2);
    } else {
      setFormStep(1);
    }

    const initialDecisions = {};
    (farmer.deals || []).forEach((d) => {
      initialDecisions[d._id] = {
        action: "ACCEPT",
        price: d.demandedPrice > 0 ? String(d.demandedPrice) : "",
        reason: "",
      };
    });
    setCropDecisions(initialDecisions);
    setView("approve_form");
  };

  const handleAutoFillRoute = async () => {
    if (!user?.coord?.lat || !user?.coord?.long) {
      toast.error("Collective coordinates are missing in your profile!");
      return;
    }
    if (!selectedFarmer?.coord?.lat || !selectedFarmer?.coord?.long) {
      toast.error("Farmer Group coordinates are missing!");
      return;
    }

    setFetchingRoute(true);
    try {
      const cLon = user.coord.long;
      const cLat = user.coord.lat;
      const fLon = selectedFarmer.coord.long;
      const fLat = selectedFarmer.coord.lat;

      const url = `https://router.project-osrm.org/route/v1/driving/${cLon},${cLat};${fLon},${fLat}?overview=full&geometries=polyline`;
      const res = await axios.get(url);

      if (res.data?.routes?.length > 0) {
        const routeData = res.data.routes[0];
        setLogistics({
          route: routeData.geometry || "",
          distance: (routeData.distance / 1000).toFixed(2), // Convert meters to km
          estTime: Math.ceil(routeData.duration / 60).toString(), // Convert seconds to minutes
        });
        toast.success("Route details auto-filled successfully!");
      } else {
        toast.error("Could not find a valid route.");
      }
    } catch (err) {
      toast.error("Failed to fetch route from OSRM.");
    } finally {
      setFetchingRoute(false);
    }
  };

  const handleDecisionToggle = (dealId, action) => {
    setCropDecisions((prev) => ({
      ...prev,
      [dealId]: { ...prev[dealId], action },
    }));
  };

  const handleDecisionFieldChange = (dealId, field, value) => {
    setCropDecisions((prev) => ({
      ...prev,
      [dealId]: { ...prev[dealId], [field]: value },
    }));
  };

  // Submit Reviewed Membership Request (Accept / Partial Reject)
  const handleReviewSubmit = async () => {
    if (!selectedFarmer) return;

    const acceptedCrops = [];
    const rejectedCrops = [];

    for (const deal of selectedFarmer.deals || []) {
      const dec = cropDecisions[deal._id] || {
        action: "ACCEPT",
        price: "",
        reason: "",
      };
      const cropName = deal.crop?.crop?.name || deal.crop?.name || "Crop";

      if (dec.action === "ACCEPT") {
        const price = Number(dec.price);
        if (!price || price <= 0) {
          toast.error(
            `Please enter a valid agreed price for accepted crop: ${cropName}`,
          );
          return;
        }
        acceptedCrops.push({ dealId: deal._id, agreedPrice: price });
      } else {
        if (!dec.reason || !dec.reason.trim()) {
          toast.error(`Please provide a rejection reason for: ${cropName}`);
          return;
        }
        rejectedCrops.push({ dealId: deal._id, reason: dec.reason.trim() });
      }
    }

    if (
      acceptedCrops.length > 0 &&
      (!selectedZone || !logistics.route || !logistics.distance)
    ) {
      toast.error(
        "Please ensure zone, route, and distance are filled for accepted crops.",
      );
      return;
    }

    setApproving(true);
    try {
      await collectiveMemberAPI.accept({
        farmerId: selectedFarmer._id,
        crops: acceptedCrops,
        rejectedCrops,
        zoneId: selectedZone || undefined,
        route: logistics.route || undefined,
        distance: logistics.distance ? Number(logistics.distance) : undefined,
        estTime: logistics.estTime ? Number(logistics.estTime) : undefined,
      });

      toast.success(
        `Processed request for ${selectedFarmer.name || selectedFarmer.groupName || "Farmer Group"}!`,
      );
      setView("list");
      fetchData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to process membership request",
      );
    } finally {
      setApproving(false);
    }
  };

  // Request Crop Status
  const handleGetStatus = async (dealId) => {
    if (!dealId) return;
    try {
      const res = await collectiveDealAPI.queryStatus(dealId);
      toast.success(
        res.data?.message || "Status request sent to farmer group!",
      );
      fetchData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to request crop status",
      );
    }
  };

  // Terminate Deal
  const handleTerminateDeal = async (dealId, cropName) => {
    if (!dealId) return;
    if (
      !window.confirm(
        `Are you sure you want to terminate partnership for ${cropName || "this crop"}?`,
      )
    )
      return;
    try {
      const res = await collectiveMemberAPI.terminate({
        dealId,
        reason: "Terminated by collective",
      });
      toast.success(res.data?.message || "Partnership deal terminated");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to terminate deal");
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
  };

  const formVariants = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: 30, transition: { duration: 0.2 } },
  };

  return (
    <div
      className={`min-h-screen p-5 sm:p-7 overflow-x-hidden transition-colors duration-200 ${isDark ? "bg-slate-950 text-white" : "bg-gradient-to-br from-slate-50 via-emerald-50/20 to-amber-50/20 text-slate-900"}`}
    >
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                  Farmer Group Directory
                </h1>
                <p
                  className={`text-xs sm:text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Browse, review, and manage associated farmer groups and crop
                  partnerships
                </p>
              </div>

              {/* Stats Bar */}
              <div className="flex items-center gap-2.5">
                {[
                  {
                    label: "Active Members",
                    value: membersList.length,
                    icon: "ph:users-three-fill",
                    color: "text-emerald-500",
                  },
                  {
                    label: "Pending Requests",
                    value: requestsList.length,
                    icon: "ph:clock-fill",
                    color: "text-amber-500",
                  },
                  {
                    label: "Total Zones",
                    value: zones.length,
                    icon: "ph:map-trifold-fill",
                    color: "text-blue-500",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}
                  >
                    <Icon icon={s.icon} className={`w-4 h-4 ${s.color}`} />
                    <div>
                      <p
                        className={`text-sm font-extrabold leading-none ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {s.value}
                      </p>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {s.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs: Active Members vs Pending Requests */}
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div
                className={`flex gap-1.5 p-1.5 rounded-2xl border backdrop-blur-md ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}
              >
                {[
                  {
                    id: "members",
                    label: "Active Members",
                    count: membersList.length,
                    icon: "ph:users-three-bold",
                  },
                  {
                    id: "requests",
                    label: "Pending Requests",
                    count: requestsList.length,
                    icon: "ph:clock-bold",
                    badge: requestsList.length > 0,
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      tab === t.id
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                        : isDark
                          ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon icon={t.icon} className="w-4 h-4" />
                    {t.label}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${tab === t.id ? "bg-white/25 text-white" : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}
                    >
                      {t.count}
                    </span>
                    {t.badge && tab !== t.id && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-md" />
                    )}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              {tab === "members" && (
                <div className="relative flex-1 max-w-md">
                  <Icon
                    icon="ph:magnifying-glass-bold"
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  />
                  <input
                    type="text"
                    placeholder="Search by group name, leader, phone, or crop..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 ${
                      isDark
                        ? "bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
                        : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                    }`}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <Icon icon="ph:x-circle-fill" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Icon
                  icon="svg-spinners:12-dots-scale-rotate"
                  className={`w-10 h-10 ${isDark ? "text-emerald-400" : "text-emerald-500"}`}
                />
              </div>
            ) : tab === "members" ? (
              /* ── Active Members Tab ── */
              filteredMembers.length === 0 ? (
                <EmptyState
                  icon="ph:users-three-fill"
                  title="No farmer groups found"
                  description={
                    search
                      ? "No farmer group matched your search query."
                      : "You have no active farmer groups in your network yet."
                  }
                />
              ) : (
                <div className="relative flex justify-end min-h-[calc(100vh-120px)] w-full">
                  <div
                    className="w-full lg:w-auto lg:absolute lg:top-0 lg:left-0 lg:bottom-0 lg:right-[calc(42%+1.25rem)] lg:overflow-y-auto lg:pr-1"
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: isDark
                        ? "#334155 transparent"
                        : "#cbd5e1 transparent",
                    }}
                  >
                    <div className="space-y-2.5 pb-4">
                      {filteredMembers.map((farmer) => (
                        <FGRow
                          key={farmer._id}
                          farmer={farmer}
                          isDark={isDark}
                          isSelected={selectedFarmer?._id === farmer._id}
                          onClick={() => {
                            setSelectedFarmer(farmer);
                            setMobileDrawerOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {selectedFarmer && (
                    <div className="hidden lg:block lg:w-[42%] lg:shrink-0">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedFarmer._id}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 16 }}
                          transition={{ duration: 0.2 }}
                        >
                          <DetailPanel
                            farmer={selectedFarmer}
                            isDark={isDark}
                            onGetStatus={handleGetStatus}
                            onTerminateDeal={handleTerminateDeal}
                            onOpenCarousel={(imgs, idx) =>
                              setCarouselData({
                                isOpen: true,
                                images: imgs,
                                initialIndex: idx,
                              })
                            }
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}

                  <AnimatePresence>
                    {mobileDrawerOpen && selectedFarmer && (
                      <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setMobileDrawerOpen(false)}
                          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          exit={{ y: "100%" }}
                          transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                          }}
                          className="relative z-10 w-full max-h-[85vh] overflow-y-auto rounded-t-3xl shadow-2xl"
                        >
                          <DetailPanel
                            farmer={selectedFarmer}
                            isDark={isDark}
                            onGetStatus={handleGetStatus}
                            onTerminateDeal={handleTerminateDeal}
                            onOpenCarousel={(imgs, idx) =>
                              setCarouselData({
                                isOpen: true,
                                images: imgs,
                                initialIndex: idx,
                              })
                            }
                            onClose={() => setMobileDrawerOpen(false)}
                          />
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )
            ) : (
              /* ── Pending Requests Tab ── */
              <div className="max-w-4xl">
                {requestsList.length === 0 ? (
                  <EmptyState
                    icon="ph:hand-shake-fill"
                    title="No pending requests"
                    description="New membership requests from farmer groups will appear here for review and approval."
                  />
                ) : (
                  <div className="space-y-4">
                    {requestsList.map((farmer) => (
                      <div
                        key={farmer._id}
                        className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-5 p-5 rounded-2xl border backdrop-blur-xl ${
                          isDark
                            ? "bg-slate-900/60 border-slate-800/80 shadow-xl shadow-black/20"
                            : "bg-white border-slate-200 shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className={`w-14 h-14 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center font-bold text-lg ${
                              isDark
                                ? "bg-slate-800 text-emerald-400"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {farmer.profile || farmer.profilePhoto ? (
                              <img
                                src={farmer.profile || farmer.profilePhoto}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (farmer.name || farmer.groupName || "FG")
                                .substring(0, 2)
                                .toUpperCase()
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">
                              {farmer.name ||
                                farmer.groupName ||
                                "Farmer Group"}
                            </h3>
                            <p
                              className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              Leader:{" "}
                              <strong
                                className={
                                  isDark ? "text-slate-200" : "text-slate-700"
                                }
                              >
                                {farmer.leadFarmer || "N/A"}
                              </strong>{" "}
                              · {farmer.farmerCount || 1} farmers ·{" "}
                              {shortAddr(farmer.address)}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {(farmer.deals || []).map((d) => {
                                const cropName =
                                  d.crop?.crop?.name || d.crop?.name || "Crop";
                                return (
                                  <span
                                    key={d._id}
                                    className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border ${
                                      isDark
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    }`}
                                  >
                                    {cropName}{" "}
                                    {d.demandedPrice > 0
                                      ? `(Demand: ₹${d.demandedPrice}/kg)`
                                      : ""}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
                          <button
                            onClick={() => openApproveForm(farmer)}
                            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all cursor-pointer"
                          >
                            Review Request
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          /* ── Review & Approve Form Page (Partial Accept/Reject & Zone) ── */
          <motion.div
            key="approve_form"
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="max-w-2xl mx-auto"
          >
            <button
              onClick={() => setView("list")}
              className={`mb-4 flex items-center gap-2 text-sm font-semibold cursor-pointer transition-colors ${
                isDark
                  ? "text-slate-400 hover:text-emerald-400"
                  : "text-slate-500 hover:text-emerald-600"
              }`}
            >
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
              Back to Farmer Groups
            </button>

            <div
              className={`rounded-2xl border p-5 sm:p-6 shadow-lg ${
                isDark
                  ? "bg-slate-900 border-slate-800 shadow-black/40"
                  : "bg-white border-slate-200 shadow-slate-200/60"
              }`}
            >
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDark
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  <Icon icon="ph:handshake-bold" className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    Review Membership Request
                  </h2>
                  <p
                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Review crops requested by{" "}
                    {selectedFarmer?.name || selectedFarmer?.groupName}. Accept
                    or reject crops individually, set prices, and assign a zone.
                  </p>
                </div>
              </div>

              {/* Step Tab Selector */}
              <div className="flex items-center gap-2 mb-5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormStep(1)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    formStep === 1
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] flex items-center justify-center">
                    1
                  </span>
                  1. Logistics & Zone
                </button>
                <button
                  type="button"
                  onClick={() => setFormStep(2)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    formStep === 2
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] flex items-center justify-center">
                    2
                  </span>
                  2. Crop Decisions
                </button>
              </div>

              {selectedFarmer && (
                <div className="space-y-4">
                  {/* STEP 1: Logistics & Routing */}
                  {formStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="space-y-4"
                    >
                      {/* Zone Assignment */}
                      <div
                        className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                      >
                        <h4 className="text-xs font-bold mb-2.5 flex items-center gap-2">
                          <Icon
                            icon="ph:map-pin-bold"
                            className="w-3.5 h-3.5 text-emerald-500"
                          />
                          Assign Operating Zone *
                        </h4>
                        {zones.length === 0 ? (
                          <p
                            className={`text-[10px] ${isDark ? "text-amber-400" : "text-amber-600"}`}
                          >
                            No zones configured. Please create zones in Zone
                            Management first.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {zones.map((z) => {
                              const isSelected = selectedZone === z._id;
                              return (
                                <button
                                  key={z._id}
                                  type="button"
                                  onClick={() => setSelectedZone(z._id)}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                    isSelected
                                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30"
                                      : isDark
                                        ? "border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700"
                                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  <span className="truncate">{z.name}</span>
                                  {isSelected && (
                                    <Icon
                                      icon="ph:check-circle-fill"
                                      className="w-4 h-4 text-emerald-500 shrink-0 ml-1"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Routing Details */}
                      <div
                        className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold flex items-center gap-2">
                            <Icon
                              icon="ph:navigation-arrow-bold"
                              className="w-3.5 h-3.5 text-blue-500"
                            />
                            Logistics & Routing *
                          </h4>
                          <button
                            type="button"
                            onClick={handleAutoFillRoute}
                            disabled={fetchingRoute}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/30 transition-all cursor-pointer"
                          >
                            {fetchingRoute ? (
                              <Icon
                                icon="svg-spinners:12-dots-scale-rotate"
                                className="w-3 h-3"
                              />
                            ) : (
                              <Icon
                                icon="ph:magic-wand-bold"
                                className="w-3 h-3"
                              />
                            )}
                            Auto-Fill Route
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="space-y-1">
                            <label
                              className={`text-[10px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              Distance (km)
                            </label>
                            <input
                              type="number"
                              value={logistics.distance}
                              onChange={(e) =>
                                setLogistics((p) => ({
                                  ...p,
                                  distance: e.target.value,
                                }))
                              }
                              placeholder="e.g. 15.5"
                              className={`w-full px-3 py-2 rounded-lg border text-xs outline-none transition-all ${isDark ? "bg-slate-900/50 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label
                              className={`text-[10px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              Est. Time (mins)
                            </label>
                            <input
                              type="number"
                              value={logistics.estTime}
                              onChange={(e) =>
                                setLogistics((p) => ({
                                  ...p,
                                  estTime: e.target.value,
                                }))
                              }
                              placeholder="e.g. 45"
                              className={`w-full px-3 py-2 rounded-lg border text-xs outline-none transition-all ${isDark ? "bg-slate-900/50 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label
                            className={`text-[10px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            Route Geometry Status
                          </label>
                          <div
                            className={`w-full px-3 py-2 rounded-lg border text-xs flex items-center justify-between ${isDark ? "bg-slate-900/50 border-slate-700" : "bg-white border-slate-200"}`}
                          >
                            <span
                              className={
                                logistics.route
                                  ? "text-emerald-500 font-bold"
                                  : "text-slate-400"
                              }
                            >
                              {logistics.route
                                ? "✅ Route Path Data Generated (Ready for Maps)"
                                : "No route data generated yet"}
                            </span>
                            {logistics.route && (
                              <Icon
                                icon="ph:map-trifold-bold"
                                className="w-4 h-4 text-emerald-500"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Step 1 Actions */}
                      <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setView("list")}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                            isDark
                              ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={
                            !selectedZone ||
                            !logistics.route ||
                            !logistics.distance
                          }
                          onClick={() => setFormStep(2)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-blue-500 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                          Next: Review Crops
                          <Icon
                            icon="ph:arrow-right-bold"
                            className="w-4 h-4"
                          />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: Crop Decisions */}
                  {formStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="space-y-4"
                    >
                      {/* Farmer's Note (Moved to Step 2) */}
                      {selectedFarmer.membership?.note && (
                        <div className="p-3 rounded-xl border-l-4 border-emerald-500 bg-slate-50 dark:bg-slate-800/40 border-t border-r border-b border-slate-200 dark:border-slate-800">
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            <Icon
                              icon="ph:chat-text-bold"
                              className="w-3.5 h-3.5 text-emerald-500"
                            />
                            Message from Farmer
                          </p>
                          <p
                            className={`text-xs italic leading-relaxed ${isDark ? "text-slate-200" : "text-slate-700"}`}
                          >
                            "{selectedFarmer.membership.note}"
                          </p>
                        </div>
                      )}

                      {/* Crop Decisions (Accept / Reject per crop) */}
                      <div>
                        <h4 className="text-xs font-bold mb-2 flex items-center gap-2">
                          <Icon
                            icon="ph:coins-bold"
                            className="w-3.5 h-3.5 text-amber-500"
                          />
                          Requested Crops & Negotiated Rates
                        </h4>
                        <div className="space-y-2">
                          {(selectedFarmer.deals || []).map((deal) => {
                            const cropName =
                              deal.crop?.crop?.name ||
                              deal.crop?.name ||
                              "Crop";
                            const decision = cropDecisions[deal._id] || {
                              action: "ACCEPT",
                              price: "",
                              reason: "",
                            };

                            return (
                              <div
                                key={deal._id}
                                className={`p-3 rounded-xl border transition-all ${
                                  decision.action === "ACCEPT"
                                    ? isDark
                                      ? "bg-slate-800/40 border-slate-700"
                                      : "bg-white border-slate-200"
                                    : isDark
                                      ? "bg-red-950/20 border-red-900/40"
                                      : "bg-red-50/60 border-red-200"
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                                  <div>
                                    <span className="font-bold text-xs">
                                      {cropName}
                                    </span>
                                    {deal.demandedPrice > 0 && (
                                      <span
                                        className={`text-[10px] ml-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                      >
                                        Demanded:{" "}
                                        <strong className="text-amber-500">
                                          ₹{deal.demandedPrice}/kg
                                        </strong>
                                      </span>
                                    )}
                                  </div>

                                  {/* Accept / Reject Segmented Buttons */}
                                  <div
                                    className={`flex items-center p-0.5 rounded-lg border shrink-0 ${isDark ? "bg-slate-900 border-slate-700" : "bg-slate-100 border-slate-200"}`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDecisionToggle(deal._id, "ACCEPT")
                                      }
                                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                        decision.action === "ACCEPT"
                                          ? "bg-emerald-500 text-white shadow-sm"
                                          : isDark
                                            ? "text-slate-400 hover:text-slate-200"
                                            : "text-slate-600 hover:text-slate-900"
                                      }`}
                                    >
                                      Accept
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDecisionToggle(deal._id, "REJECT")
                                      }
                                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                        decision.action === "REJECT"
                                          ? "bg-red-500 text-white shadow-sm"
                                          : isDark
                                            ? "text-slate-400 hover:text-slate-200"
                                            : "text-slate-600 hover:text-slate-900"
                                      }`}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </div>

                                {decision.action === "ACCEPT" ? (
                                  <div className="relative">
                                    <Icon
                                      icon="ph:currency-inr-bold"
                                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                                    />
                                    <input
                                      type="number"
                                      placeholder="Agreed purchase price per kg (Crop Price) *"
                                      value={decision.price}
                                      onChange={(e) =>
                                        handleDecisionFieldChange(
                                          deal._id,
                                          "price",
                                          e.target.value,
                                        )
                                      }
                                      className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none transition-all ${
                                        isDark
                                          ? "bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500"
                                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
                                      }`}
                                    />
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <Icon
                                      icon="ph:warning-circle-bold"
                                      className={`absolute left-3 top-2 w-3.5 h-3.5 ${isDark ? "text-red-400" : "text-red-500"}`}
                                    />
                                    <input
                                      type="text"
                                      placeholder="Rejection reason for this crop *"
                                      value={decision.reason}
                                      onChange={(e) =>
                                        handleDecisionFieldChange(
                                          deal._id,
                                          "reason",
                                          e.target.value,
                                        )
                                      }
                                      className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none transition-all ${
                                        isDark
                                          ? "bg-red-950/30 border-red-900/50 text-white focus:border-red-500"
                                          : "bg-red-50 border-red-200 text-slate-900 focus:border-red-500"
                                      }`}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Form Action Buttons */}
                      <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setFormStep(1)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                            isDark
                              ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Icon
                            icon="ph:arrow-left-bold"
                            className="inline w-3 h-3 mr-1"
                          />
                          Back to Logistics
                        </button>
                        <button
                          type="button"
                          onClick={handleReviewSubmit}
                          disabled={approving || !selectedZone}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                          {approving ? (
                            <Icon
                              icon="svg-spinners:12-dots-scale-rotate"
                              className="w-4 h-4"
                            />
                          ) : (
                            <Icon icon="ph:check-bold" className="w-4 h-4" />
                          )}
                          Save & Submit Review
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageCarouselModal
        isOpen={carouselData.isOpen}
        onClose={() => setCarouselData((prev) => ({ ...prev, isOpen: false }))}
        images={carouselData.images}
        initialIndex={carouselData.initialIndex}
      />
    </div>
  );
};

export default FarmerGroupManagement;
