import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui";
import EmptyState from "../../components/common/EmptyState";
import CropSelect from "../../components/common/CropSelect";
import ConfirmModal from "../../components/common/ConfirmModal";
import ImageCarouselModal from "../../components/common/ImageCarouselModal";
import DatePicker from "../../components/common/DatePicker";
import {
  farmerCropAPI,
  commonAPI,
  farmerDealAPI,
  farmerMemberAPI,
} from "../../services/api";
import api from "../../services/api";

const CATEGORY_ICON = {
  Grain: "ph:basket-fill",
  Vegetable: "ph:leaf-fill",
  Fruit: "ph:tree-fill",
  Pulse: "ph:circle-dashed-fill",
  Spice: "ph:star-fill",
  Oilseed: "ph:drop-fill",
};

const SEASON_META = {
  Kharif: {
    gradient: "from-amber-400 to-orange-500",
    chip: "bg-amber-400/15 text-amber-500",
    icon: "bg-amber-400/20",
  },
  Rabi: {
    gradient: "from-sky-400 to-blue-500",
    chip: "bg-sky-400/15 text-sky-500",
    icon: "bg-sky-400/20",
  },
  Zaid: {
    gradient: "from-rose-400 to-pink-500",
    chip: "bg-rose-400/15 text-rose-500",
    icon: "bg-rose-400/20",
  },
  Perennial: {
    gradient: "from-violet-400 to-purple-500",
    chip: "bg-violet-400/15 text-violet-500",
    icon: "bg-violet-400/20",
  },
};

const DEFAULT_META = {
  gradient: "from-emerald-400 to-teal-500",
  chip: "bg-emerald-400/15 text-emerald-500",
  icon: "bg-emerald-400/20",
};

const STAGE_LABEL = {
  SOWING: "Sowing",
  GROWING: "Growing",
  MATURE: "Mature",
  HARVESTED: "Harvested",
  READY: "Ready",
  OTHER: "Other",
};

const STAGE_PROGRESS = {
  OTHER: 0,
  SOWING: 15,
  GROWING: 40,
  MATURE: 65,
  HARVESTED: 85,
  READY: 100,
};

const getSeasonMeta = (s) => SEASON_META[s] || DEFAULT_META;
const getCategoryIcon = (c) => CATEGORY_ICON[c] || "ph:plant-fill";
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not set";

// ── Shared image block ────────────────────────────────────────────────────────
const CropImg = ({
  image,
  category,
  season,
  cls = "w-14 h-14 rounded-xl",
  iconCls = "w-6 h-6",
}) => {
  const [failed, setFailed] = useState(false);
  const meta = getSeasonMeta(season);
  return (
    <div className={`relative overflow-hidden shrink-0 ${cls} ${meta.icon}`}>
      {image && !failed ? (
        <img
          src={image}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white opacity-80">
          <Icon icon={getCategoryIcon(category)} className={iconCls} />
        </div>
      )}
    </div>
  );
};

// ── CropCard ──────────────────────────────────────────────────────────────────
const CropCard = ({
  crop,
  isDark,
  onEdit,
  onDelete,
  onSelect,
  isSelected,
  index,
}) => {
  const deal = crop.dealCrop;
  const collective = deal?.membership?.collective ?? deal?.collective ?? null;
  const isLinked = !!deal;
  const isActionNeeded = deal?.growth?.queryStatus === "OPEN";
  const meta = getSeasonMeta(crop.crop?.season);
  const currentStage = String(deal?.growth?.stage || "OTHER").toUpperCase();
  const progressPct = STAGE_PROGRESS[currentStage] || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => onSelect(crop)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border cursor-pointer transition-all duration-200 ${
        isSelected
          ? isDark
            ? "bg-emerald-500/10 border-slate-700/60 shadow-lg ring-1 ring-emerald-500/30"
            : "bg-emerald-50/80 border-slate-200 shadow-lg ring-1 ring-emerald-400/25"
          : isDark
            ? "bg-slate-900/50 border-slate-800/60 hover:border-slate-700 hover:bg-slate-800/40"
            : "bg-white/90 border-slate-200 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      {/* gradient stripe */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${meta.gradient}`} />

      <div className="p-4 flex flex-col flex-1">
        {/* Identity */}
        <div className="flex items-center gap-3 mb-3">
          <CropImg
            image={crop.crop?.image}
            category={crop.crop?.category}
            season={crop.crop?.season}
            cls="w-14 h-14 rounded-2xl"
            iconCls="w-7 h-7"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm leading-snug truncate">
                {crop.crop?.name}
              </h3>
              {isActionNeeded && (
                <span className="shrink-0 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-red-500 text-white flex items-center gap-0.5 shadow-sm">
                  <Icon icon="ph:warning-circle-fill" className="w-3 h-3" />
                  Action Needed
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500"}`}
              >
                {crop.crop?.code}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500"}`}
              >
                {crop.crop?.category}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.chip}`}
              >
                {crop.crop?.season}
              </span>
            </div>
          </div>
        </div>

        {/* Growth Stage Progress Bar */}
        {isLinked && (
          <div className="mb-3 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Icon
                  icon="ph:plant-bold"
                  className="w-3.5 h-3.5 text-emerald-400"
                />
                Growth Stage:{" "}
                <span className="text-white font-bold">
                  {STAGE_LABEL[currentStage] || currentStage}
                </span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {progressPct}%
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Compact stats */}
        <div
          className={`grid grid-cols-3 gap-2 px-3 py-2 rounded-xl mb-3 text-xs ${isDark ? "bg-slate-950/50" : "bg-slate-50"}`}
        >
          <div className="flex flex-col items-center gap-0.5">
            <Icon
              icon="ph:scales-fill"
              className={`w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            />
            <span className="font-bold">{crop.yield ?? "—"} kg</span>
            <span
              className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Yield
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Icon
              icon="ph:map-trifold-fill"
              className={`w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            />
            <span className="font-bold">
              {crop.farmland ? `${crop.farmland} ac` : "—"}
            </span>
            <span
              className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Area
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Icon
              icon="ph:calendar-blank-fill"
              className={`w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            />
            <span className="font-bold text-[10px] text-center">
              {fmtDate(crop.plantedDate)}
            </span>
            <span
              className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Planted
            </span>
          </div>
        </div>

        {/* Collective */}
        <div className="flex-1 mb-3">
          {isLinked && collective ? (
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border h-full ${isDark ? "bg-emerald-950/30 border-emerald-500/20" : "bg-emerald-50 border-emerald-200/70"}`}
            >
              <div
                className={`relative w-10 h-10 rounded-xl overflow-hidden shrink-0 ${isDark ? "bg-emerald-900/40" : "bg-emerald-100"}`}
              >
                {collective.profile ? (
                  <img
                    src={collective.profile}
                    alt={collective.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon
                      icon="ph:buildings-fill"
                      className="w-5 h-5 text-emerald-500"
                    />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 leading-none mb-0.5">
                  Linked Collective
                </p>
                <p
                  className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-slate-800"}`}
                >
                  {collective.name}
                </p>
              </div>
              <Icon
                icon="ph:link-bold"
                className="w-3.5 h-3.5 text-emerald-500 shrink-0"
              />
            </div>
          ) : (
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border h-full ${isDark ? "bg-slate-800/40 border-slate-700/50" : "bg-slate-100 border-slate-200"}`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
              >
                <Icon icon="ph:link-break" className="w-5 h-5 text-slate-400" />
              </div>
              <p
                className={`text-xs font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                Not linked to collective
              </p>
            </div>
          )}
        </div>

        {/* Same Size Actions: Edit and Delete */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(crop)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600" : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"}`}
          >
            <Icon
              icon="ph:pencil-fill"
              className="w-3.5 h-3.5 text-emerald-400"
            />
            Edit
          </button>
          <button
            onClick={() => onDelete(crop)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${isDark ? "border-red-900/40 text-red-400 hover:bg-red-900/30" : "border-red-200 text-red-600 hover:bg-red-50"}`}
          >
            <Icon icon="ph:trash-fill" className="w-3.5 h-3.5 text-red-400" />
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── DetailPanel ───────────────────────────────────────────────────────────────
const DetailPanel = ({
  crop,
  isDark,
  onEdit,
  onDelete,
  onRefresh,
  onClose,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const deal = crop?.dealCrop;
  const collective = deal?.membership?.collective ?? deal?.collective ?? null;
  const isLinked = !!deal;
  const isQueryOpen = deal?.growth?.queryStatus === "OPEN";
  const meta = getSeasonMeta(crop?.crop?.season);
  const [panelTab, setPanelTab] = useState("overview");

  // Pickup History state
  const [pickupHistory, setPickupHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Status Update state (multi-image upload)
  const fileInputRef = useRef(null);
  const [updateStage, setUpdateStage] = useState("SOWING");
  const [updateNote, setUpdateNote] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [unlinking, setUnlinking] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinkChecked, setUnlinkChecked] = useState(false);

  const [carouselData, setCarouselData] = useState({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });

  const existingImages = Array.isArray(deal?.growth?.images)
    ? deal.growth.images
    : [];

  // Prefill form when opening or switching to update tab
  useEffect(() => {
    if (deal?.growth) {
      setUpdateStage(deal.growth.stage || "SOWING");
      setUpdateNote(deal.growth.message || deal.growth.note || "");
    } else {
      setUpdateStage("SOWING");
      setUpdateNote("");
    }
    setSelectedFiles([]);
    setPreviews([]);
  }, [crop?._id, deal?._id, panelTab]);

  // Handle multi-image file selection with 2MB size limit per image
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB limit
    const oversizedFiles = files.filter((f) => f.size > MAX_SIZE);
    if (oversizedFiles.length > 0) {
      toast.error("Each image must be under 2MB in size !!");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFiles(files);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleUpdateStatus = async () => {
    if (!deal?._id) return;
    setSubmitting(true);
    try {
      let uploadedUrls = [];
      if (selectedFiles.length > 0) {
        setUploading(true);
        const farmerUid = user?.uid || user?.code || "FG";
        const cropCode = crop?.crop?.code || crop?.code || "CROP";
        for (let i = 0; i < selectedFiles.length; i++) {
          const formData = new FormData();
          formData.append("image", selectedFiles[i]);
          formData.append("folder", "Farmfresh/cropStatus");
          formData.append("fileName", `${farmerUid}_${cropCode}_${i + 1}`);
          const { data } = await api.post("/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          if (data.url) uploadedUrls.push(data.url);
        }
      } else {
        // Retain existing images if no new files selected
        uploadedUrls = existingImages;
      }

      await farmerDealAPI.updateStatus(deal._id, {
        stage: updateStage,
        message: updateNote || undefined,
        imgUrl: uploadedUrls[0] || undefined,
        images: uploadedUrls,
      });

      toast.success("Crop status update sent!");
      setSelectedFiles([]);
      setPreviews([]);
      onRefresh();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to send status update",
      );
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const confirmUnlink = async () => {
    if (!deal?._id) return;
    setUnlinking(true);
    try {
      await farmerMemberAPI.terminate({ dealId: deal._id });
      toast.success("Deal terminated");
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to terminate");
    } finally {
      setUnlinking(false);
      setShowUnlinkModal(false);
    }
  };

  const PANEL_TABS = [
    { key: "overview", label: "Overview", icon: "ph:info-bold" },
    ...(isLinked
      ? [
          {
            key: "update",
            label: "Send Update",
            icon: "ph:paper-plane-tilt-bold",
            badge: isQueryOpen,
          },
          {
            key: "history",
            label: "Pickup History",
            icon: "ph:truck-bold",
          },
        ]
      : []),
  ];

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800 shadow-2xl shadow-black/40" : "bg-white border-slate-200 shadow-2xl shadow-slate-200/50"}`}
    >
      {/* Hero header */}
      <div
        className={`relative overflow-hidden bg-gradient-to-br ${meta.gradient}`}
        style={{ minHeight: "120px" }}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center cursor-pointer transition-colors"
          >
            <Icon icon="ph:x-bold" className="w-4 h-4" />
          </button>
        )}
        <div className="relative z-10 p-5 pb-4">
          <div className="flex items-end gap-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-white/20 ring-2 ring-white/30">
              <CropImg
                image={crop?.crop?.image}
                category={crop?.crop?.category}
                season={crop?.crop?.season}
                cls="w-full h-full"
                iconCls="w-10 h-10"
              />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                {crop?.crop?.code}
              </p>
              <h2 className="text-xl font-bold text-white leading-tight truncate">
                {crop?.crop?.name}
              </h2>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-[10px] font-semibold text-white/80 bg-white/15 px-2 py-0.5 rounded-full">
                  {crop?.crop?.category}
                </span>
                <span className="text-[10px] font-semibold text-white/80 bg-white/15 px-2 py-0.5 rounded-full">
                  {crop?.crop?.season}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className={`flex border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}
      >
        {PANEL_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setPanelTab(t.key)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold cursor-pointer transition-all border-b-2 ${
              panelTab === t.key
                ? "border-emerald-500 text-emerald-500"
                : `border-transparent ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-700"}`
            }`}
          >
            <Icon icon={t.icon} className="w-3.5 h-3.5" />
            {t.label}
            {t.badge && (
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {panelTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Crop stats */}
              <div
                className={`rounded-xl p-3.5 border ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
              >
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  Crop Details
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Est. Yield", value: `${crop.yield ?? "—"} kg` },
                    {
                      label: "Farmland",
                      value: crop.farmland ? `${crop.farmland} acres` : "—",
                    },
                    { label: "Planted Date", value: fmtDate(crop.plantedDate) },
                    { label: "Status", value: crop.status },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p
                        className={`text-[10px] font-semibold mb-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {label}
                      </p>
                      <p className="text-sm font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {isLinked && deal ? (
                <>
                  {collective && (
                    <div
                      className={`rounded-xl p-3.5 border ${isDark ? "bg-emerald-950/30 border-emerald-500/20" : "bg-emerald-50 border-emerald-200/70"}`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-2">
                        Linked Collective
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 shrink-0">
                          {collective.name?.charAt(0) || "C"}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">
                            {collective.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {collective.phone || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className={`rounded-xl p-3.5 border ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Deal Summary
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <p className="text-[10px] text-slate-500">
                          Agreed Price
                        </p>
                        <p className="text-sm font-bold text-emerald-400">
                          ₹{deal.agreedPrice || 0}/kg
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">
                          Current Stage
                        </p>
                        <p className="text-sm font-bold text-white">
                          {STAGE_LABEL[deal.growth?.stage] || "Sowing"}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  className={`rounded-xl p-4 border text-center ${isDark ? "bg-slate-800/40 border-slate-700/50" : "bg-slate-100 border-slate-200"}`}
                >
                  <Icon
                    icon="ph:link-break"
                    className="w-8 h-8 mx-auto mb-2 text-slate-500"
                  />
                  <p className="text-sm font-semibold text-slate-400">
                    Not linked to any collective
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => onEdit(crop)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Icon
                    icon="ph:pencil-fill"
                    className="w-3.5 h-3.5 text-emerald-400"
                  />{" "}
                  Edit Crop
                </button>
                <button
                  onClick={() => onDelete(crop)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Icon
                    icon="ph:trash-fill"
                    className="w-3.5 h-3.5 text-red-400"
                  />{" "}
                  Delete
                </button>
              </div>
            </motion.div>
          )}

          {panelTab === "update" && (
            <motion.div
              key="update"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* TOP: Image Upload & Previous Image View Area */}
              <div>
                {/* Existing Uploaded Photos (Read-Only) when no new file selected */}
                {selectedFiles.length === 0 && existingImages.length > 0 && (
                  <div className="mb-3 p-3 rounded-xl border border-slate-700/60 bg-slate-900/40">
                    <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Current Photos</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Click to view carousel
                      </span>
                    </p>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {existingImages.map((src, i) => (
                        <div
                          key={i}
                          onClick={() =>
                            setCarouselData({
                              isOpen: true,
                              images: existingImages,
                              initialIndex: i,
                            })
                          }
                          className="block relative w-16 h-16 rounded-lg overflow-hidden border border-slate-700 group shrink-0 cursor-pointer"
                        >
                          <img
                            src={src}
                            alt={`Crop ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label className="text-xs font-bold uppercase tracking-wider block mb-2 text-slate-300">
                  Upload Photos
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 text-center cursor-pointer transition-all bg-slate-900/40"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Icon
                    icon="ph:camera-bold"
                    className="w-8 h-8 mx-auto text-emerald-400 mb-1"
                  />
                  <p className="text-xs text-slate-300 font-semibold">
                    Click to select photos
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Max 2MB per photo
                  </p>
                </div>

                {/* Previews grid for newly selected files */}
                {previews.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                      New Photos Selected
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {previews.map((src, i) => (
                        <div
                          key={i}
                          className="relative h-16 rounded-lg overflow-hidden border border-emerald-500/40"
                        >
                          <img
                            src={src}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stage selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-2 text-slate-300">
                  Growth Stage *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(STAGE_LABEL).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setUpdateStage(key)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all text-center ${
                        updateStage === key
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                          : "border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note for collective */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 text-slate-300">
                  Note for Collective
                </label>
                <textarea
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="e.g. Harvest looks ready for pickup in 3 days…"
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={submitting || uploading}
                className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white cursor-pointer shadow-lg shadow-emerald-500/20 hover:from-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting || uploading ? (
                  <Icon
                    icon="svg-spinners:12-dots-scale-rotate"
                    className="w-5 h-5"
                  />
                ) : (
                  <Icon icon="ph:paper-plane-tilt-fill" className="w-4 h-4" />
                )}
                Send Crop Status Update
              </button>
            </motion.div>
          )}

          {/* Separate Pickup History Tab for this Crop */}
          {panelTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {historyLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Icon
                    icon="svg-spinners:12-dots-scale-rotate"
                    className="w-8 h-8 text-emerald-400"
                  />
                </div>
              ) : pickupHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Icon
                    icon="ph:truck"
                    className="w-10 h-10 mx-auto mb-2 text-slate-600"
                  />
                  <p className="text-sm font-semibold text-slate-400">
                    No pickups recorded for this crop yet
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Pickup details will appear here after collection.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pickupHistory.map((item) => (
                    <div
                      key={item._id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-emerald-400">
                          {item.scheduleCode || "SCHEDULE"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.paymentStatus === "PAID" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}
                        >
                          {item.paymentStatus || "PENDING"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-2 bg-slate-950/60 rounded-lg text-center">
                        <div>
                          <p className="text-slate-500">Collected</p>
                          <p className="font-bold text-white">
                            {item.collectedQuantity || 0} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Agreed Rate</p>
                          <p className="font-bold text-white">
                            ₹{item.agreedPrice || 0}/kg
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Total Money</p>
                          <p className="font-bold text-emerald-400">
                            ₹{(item.totalAmount || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>
                          Collective:{" "}
                          <strong className="text-white">
                            {item.collective?.name || "—"}
                          </strong>
                        </span>
                        <span>
                          Date: {fmtDate(item.pickupDate || item.completedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <ImageCarouselModal
          isOpen={carouselData.isOpen}
          onClose={() =>
            setCarouselData((prev) => ({ ...prev, isOpen: false }))
          }
          images={carouselData.images}
          initialIndex={carouselData.initialIndex}
        />
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const CropManagement = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [crops, setCrops] = useState([]);
  const [masterCrops, setMasterCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const [view, setView] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    yld: "",
    plantedDate: "",
    farmland: "",
  });

  const [selectedCrop, setSelectedCrop] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cropToDelete, setCropToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cropsRes, masterRes] = await Promise.all([
        farmerCropAPI.get(),
        commonAPI.getCrops(),
      ]);
      const cropData =
        cropsRes.data?.data?.cropData ?? cropsRes.data?.crops ?? [];
      // Filter out INACTIVE crops from state completely
      setCrops(cropData.filter((c) => c.status !== "INACTIVE"));
      setMasterCrops(masterRes.data.crops || []);
    } catch {
      toast.error("Failed to load crop data");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ code: "", yld: "", plantedDate: "", farmland: "" });
    setView("form");
  };

  const openEdit = (crop) => {
    setEditingId(crop._id);
    setForm({
      code: crop.crop?.code || "",
      yld:
        crop.yield !== undefined && crop.yield !== null
          ? String(crop.yield)
          : "",
      plantedDate: crop.plantedDate ? crop.plantedDate.split("T")[0] : "",
      farmland:
        crop.farmland !== undefined && crop.farmland !== null
          ? String(crop.farmland)
          : "",
    });
    setView("form");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingId && !form.code) {
      toast.error("Please select a crop");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        yield: form.yld !== "" ? Number(form.yld) : undefined,
        yld: form.yld !== "" ? Number(form.yld) : undefined,
        plantedDate: form.plantedDate || undefined,
        farmland: form.farmland !== "" ? Number(form.farmland) : undefined,
      };
      if (editingId) {
        await farmerCropAPI.edit(editingId, payload);
        toast.success("Crop updated successfully!");
      } else {
        await farmerCropAPI.add({ code: form.code, ...payload });
        toast.success("Crop added successfully!");
      }
      setView("list");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save crop");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!cropToDelete) return;
    setIsDeleting(true);
    try {
      await farmerCropAPI.delete(cropToDelete._id);
      toast.success("Crop deleted successfully");
      setCropToDelete(null);
      if (selectedCrop?._id === cropToDelete._id) setSelectedCrop(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete crop");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCrops = crops.filter((c) => {
    if (c.status === "INACTIVE") return false; // Never render inactive crops
    if (activeTab === "linked") return !!c.dealCrop;
    if (activeTab === "unlinked") return !c.dealCrop;
    return true;
  });

  useEffect(() => {
    if (
      filteredCrops.length > 0 &&
      (!selectedCrop || !filteredCrops.some((c) => c._id === selectedCrop._id))
    ) {
      setSelectedCrop(filteredCrops[0]);
    }
  }, [filteredCrops, selectedCrop]);

  return (
    <div
      className={`min-h-screen p-5 sm:p-7 overflow-x-hidden ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}
    >
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                  My Crop Management
                </h1>
                <p
                  className={`text-xs sm:text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Track active crops, farmland area, growth progress, and pickup
                  history
                </p>
              </div>

              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold cursor-pointer shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all"
              >
                <Icon icon="ph:plus-bold" className="w-4 h-4" />
                Add New Crop
              </button>
            </div>

            {/* Filter Pills */}
            <div
              className={`flex items-center gap-1.5 p-1.5 rounded-2xl border mb-6 w-fit backdrop-blur-md ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}
            >
              {[
                {
                  key: "all",
                  label: "All Crops",
                  icon: "ph:list-bullets-bold",
                },
                { key: "linked", label: "Linked", icon: "ph:link-bold" },
                {
                  key: "unlinked",
                  label: "Unlinked",
                  icon: "ph:link-break-bold",
                },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    activeTab === t.key
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20"
                      : isDark
                        ? "text-slate-400 hover:text-slate-200"
                        : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Icon icon={t.icon} className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Icon
                  icon="svg-spinners:12-dots-scale-rotate"
                  className={`w-10 h-10 ${isDark ? "text-emerald-400" : "text-emerald-500"}`}
                />
              </div>
            ) : filteredCrops.length === 0 ? (
              <EmptyState
                icon="ph:plant-fill"
                title="No crops found"
                description="Add your first crop to start tracking growth and connecting with collectives."
              />
            ) : (
              <div className="relative flex justify-end min-h-[calc(100vh-200px)] w-full">
                <div className="w-full lg:w-auto lg:absolute lg:top-0 lg:left-0 lg:bottom-0 lg:right-[calc(38%+1.25rem)] lg:overflow-y-auto lg:pr-1">
                  <div className="grid sm:grid-cols-2 gap-4 pb-4">
                    {filteredCrops.map((crop, i) => (
                      <CropCard
                        key={crop._id}
                        crop={crop}
                        isDark={isDark}
                        index={i}
                        onEdit={openEdit}
                        onDelete={setCropToDelete}
                        onSelect={(c) => {
                          setSelectedCrop(c);
                          setMobileDrawerOpen(true);
                        }}
                        isSelected={selectedCrop?._id === crop._id}
                      />
                    ))}
                  </div>
                </div>

                {selectedCrop && (
                  <div className="hidden lg:block lg:w-[38%] lg:shrink-0">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedCrop._id}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                      >
                        <DetailPanel
                          crop={selectedCrop}
                          isDark={isDark}
                          onEdit={openEdit}
                          onDelete={setCropToDelete}
                          onRefresh={fetchData}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          /* Form View */
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-2xl mx-auto"
          >
            <button
              onClick={() => setView("list")}
              className={`mb-6 flex items-center gap-2 text-sm font-semibold cursor-pointer transition-colors ${isDark ? "text-slate-400 hover:text-emerald-400" : "text-slate-500 hover:text-emerald-600"}`}
            >
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" /> Back to
              Crop List
            </button>

            <div
              className={`rounded-3xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl ${isDark ? "bg-slate-900/80 border-slate-800 shadow-black/40" : "bg-white/90 border-slate-200 shadow-slate-200/50"}`}
            >
              <h2 className="text-2xl font-bold mb-2">
                {editingId ? "Edit Crop Details" : "Register New Crop"}
              </h2>

              <form onSubmit={handleSave} className="space-y-5">
                {!editingId && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-2 text-slate-300">
                      Select Crop *
                    </label>
                    <CropSelect
                      crops={masterCrops}
                      value={form.code}
                      onChange={(code) => setForm((p) => ({ ...p, code }))}
                      placeholder="Choose crop..."
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-2 text-slate-300">
                      Est. Yield (kg)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.yld}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, yld: e.target.value }))
                      }
                      placeholder="e.g. 500"
                      className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-sm text-white outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-2 text-slate-300">
                      Farmland / Cultivated Area (acres)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.farmland}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, farmland: e.target.value }))
                      }
                      placeholder="e.g. 2.5"
                      className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-sm text-white outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-2 text-slate-300">
                    Planted Date
                  </label>
                  <DatePicker
                    value={form.plantedDate}
                    onChange={(v) => setForm((p) => ({ ...p, plantedDate: v }))}
                    placeholder="Select planted date"
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-sm text-white outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white cursor-pointer flex items-center justify-center gap-2 hover:from-emerald-400 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-60"
                  >
                    {saving ? (
                      <Icon
                        icon="svg-spinners:12-dots-scale-rotate"
                        className="w-5 h-5"
                      />
                    ) : (
                      <Icon icon="ph:check-bold" className="w-4 h-4" />
                    )}
                    {editingId ? "Save Changes" : "Save Crop"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!cropToDelete}
        onClose={() => setCropToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Crop?"
        description={`Are you sure you want to delete ${cropToDelete?.crop?.name || "this crop"}?`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Crop"}
        variant="danger"
        icon="ph:trash-bold"
      />
    </div>
  );
};

export default CropManagement;
