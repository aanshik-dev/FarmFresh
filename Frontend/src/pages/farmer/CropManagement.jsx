import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { farmerCropsData, CROPS_MASTER } from "../../utils/InterfaceData";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import ConfirmModal from "../../components/common/ConfirmModal";
import { Button, useToast } from "../../components/ui";

const STATUS_CYCLE = ["growing", "ready", "harvested", "out_of_season"];

const CropCard = ({ crop, onUpdate, onToggleSeason, isDark }) => {
  const [expanded, setExpanded] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [updateStatus, setUpdateStatus] = useState(crop.status);
  const [imagePreview, setImagePreview] = useState(null);
  const { toast } = useToast();

  const handleImageChange = (e) => {
    const f = e.target.files[0];
    if (f) setImagePreview(URL.createObjectURL(f));
  };

  const handleSaveUpdate = () => {
    onUpdate(crop.id, { lastUpdateText: updateText, status: updateStatus });
    toast.success("Crop status updated!", { title: "Updated" });
    setShowUpdateModal(false);
    setUpdateText("");
  };

  return (
    <>
      <motion.div
        layout
        whileHover={{ y: -2 }}
        className={`rounded-2xl border overflow-hidden transition-all ${isDark ? "bg-slate-900/60 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:shadow-md"}`}
      >
        {/* Card header */}
        <div
          className={`px-5 py-4 flex items-center justify-between gap-3 ${crop.status === "out_of_season" ? "opacity-50" : ""}`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDark ? "bg-emerald-500/15" : "bg-emerald-50"}`}
            >
              <Icon icon="ph:plant-fill" className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {crop.name}
                </h3>
                <StatusBadge status={crop.status} />
              </div>
              <p
                className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                Season: {crop.season}
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded((p) => !p)}
            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
          >
            <Icon
              icon={expanded ? "ph:caret-up-bold" : "ph:caret-down-bold"}
              className="w-4 h-4"
            />
          </button>
        </div>

        {/* Progress bar */}
        {crop.status !== "out_of_season" && (
          <div className="px-5 pb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                Growth Progress
              </span>
              <span
                className={`font-medium ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
              >
                {crop.growthPercent}%
              </span>
            </div>
            <div
              className={`h-2 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
            >
              <motion.div
                className={`h-full rounded-full ${crop.status === "ready" ? "bg-amber-500" : "bg-emerald-500"}`}
                initial={{ width: 0 }}
                animate={{ width: `${crop.growthPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`border-t overflow-hidden ${isDark ? "border-slate-800" : "border-slate-100"}`}
            >
              <div className="px-5 py-4 space-y-3">
                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    {
                      label: "Planted",
                      value: crop.plantedDate
                        ? new Date(crop.plantedDate).toLocaleDateString("en-IN")
                        : "—",
                    },
                    {
                      label: "Expected Harvest",
                      value: crop.expectedHarvest
                        ? new Date(crop.expectedHarvest).toLocaleDateString(
                            "en-IN",
                          )
                        : "—",
                    },
                    {
                      label: "Collective",
                      value: crop.collective || "Not linked",
                    },
                    { label: "Last Updated", value: crop.lastUpdated },
                  ].map((d) => (
                    <div
                      key={d.label}
                      className={`rounded-lg px-3 py-2 ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                    >
                      <p
                        className={`${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {d.label}
                      </p>
                      <p
                        className={`font-medium mt-0.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}
                      >
                        {d.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Last update note */}
                {crop.lastUpdateText && (
                  <div
                    className={`rounded-lg p-3 text-xs ${isDark ? "bg-slate-800/40 text-slate-400" : "bg-slate-50 text-slate-500"}`}
                  >
                    <Icon
                      icon="ph:chat-circle-text-fill"
                      className="w-3.5 h-3.5 inline mr-1"
                    />
                    {crop.lastUpdateText}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setShowUpdateModal(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-linear-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer"
                  >
                    <Icon icon="ph:pencil-fill" className="w-3.5 h-3.5" />
                    Update Status
                  </button>
                  <button
                    onClick={() => onToggleSeason(crop.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                      crop.status === "out_of_season"
                        ? "border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
                        : isDark
                          ? "border-slate-700 text-slate-400 hover:border-slate-500"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <Icon
                      icon={
                        crop.status === "out_of_season"
                          ? "ph:sun-fill"
                          : "ph:moon-fill"
                      }
                      className="w-3.5 h-3.5"
                    />
                    {crop.status === "out_of_season"
                      ? "Mark In Season"
                      : "Out of Season"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Update modal */}
      <AnimatePresence>
        {showUpdateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowUpdateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl z-10 ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Update — {crop.name}
                </h3>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
                >
                  <Icon
                    icon="material-symbols:close-rounded"
                    className="w-4 h-4"
                  />
                </button>
              </div>

              {/* Status selector */}
              <div className="mb-4">
                <p
                  className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Growth Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_CYCLE.filter((s) => s !== "out_of_season").map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setUpdateStatus(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-all ${
                          updateStatus === s
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : isDark
                              ? "border-slate-700 text-slate-400 hover:border-slate-500"
                              : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {s.replace("_", " ")}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Update text */}
              <div className="mb-4">
                <p
                  className={`text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Update Note
                </p>
                <textarea
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                  placeholder="Describe the current crop condition, any issues, expected timeline…"
                  rows={3}
                  className={`w-full rounded-xl border text-sm p-3 outline-none resize-none transition-all focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`}
                />
              </div>

              {/* Image upload */}
              <div className="mb-5">
                <p
                  className={`text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Attach Photo (optional)
                </p>
                <label
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed cursor-pointer text-sm ${isDark ? "border-slate-700 text-slate-500 hover:border-emerald-500/50" : "border-slate-300 text-slate-400 hover:border-emerald-400"}`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Icon icon="ph:image-fill" className="w-4 h-4" />
                  {imagePreview ? "Photo attached ✓" : "Upload field photo"}
                </label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt=""
                    className="mt-2 w-full h-32 object-cover rounded-xl"
                  />
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm border cursor-pointer ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUpdate}
                  className="flex-1 py-2.5 rounded-xl text-sm bg-linear-to-r from-emerald-500 to-emerald-600 text-white font-semibold cursor-pointer hover:from-emerald-400 hover:to-emerald-500"
                >
                  Save Update
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const CropManagement = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [crops, setCrops] = useState(farmerCropsData);
  const [filter, setFilter] = useState("all");

  const handleUpdate = (id, data) => {
    setCrops((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...data, lastUpdated: "Just now" } : c,
      ),
    );
  };

  const handleToggleSeason = (id) => {
    setCrops((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status:
                c.status === "out_of_season" ? "growing" : "out_of_season",
            }
          : c,
      ),
    );
    toast.info("Crop season status updated.");
  };

  const filters = [
    { id: "all", label: "All Crops" },
    { id: "growing", label: "Growing" },
    { id: "ready", label: "Ready" },
    { id: "out_of_season", label: "Out of Season" },
  ];

  const filtered =
    filter === "all" ? crops : crops.filter((c) => c.status === filter);

  return (
    <div
      className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1
            className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            My Crops
          </h1>
          <p
            className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            {crops.length} crops registered
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium cursor-pointer shadow-lg shadow-emerald-500/20">
          <Icon icon="ph:plus-bold" className="w-4 h-4" />
          Add Crop
        </button>
      </div>

      {/* Filters */}
      <div
        className={`flex gap-1 p-1 rounded-xl mb-6 w-fit ${isDark ? "bg-slate-800/70" : "bg-slate-100"}`}
      >
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              filter === f.id
                ? "bg-linear-to-r from-emerald-500 to-emerald-600 text-white shadow"
                : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {f.label}
            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === f.id ? "bg-white/20" : isDark ? "bg-slate-700" : "bg-slate-200"}`}
            >
              {f.id === "all"
                ? crops.length
                : crops.filter((c) => c.status === f.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Crop grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="ph:plant-fill"
          title="No crops in this category"
          description="Add crops from the button above or change the filter."
          size="md"
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((crop) => (
            <CropCard
              key={crop.id}
              crop={crop}
              onUpdate={handleUpdate}
              onToggleSeason={handleToggleSeason}
              isDark={isDark}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CropManagement;
