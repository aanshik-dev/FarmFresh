import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import CropSelect from "../../components/common/CropSelect";
import ConfirmModal from "../../components/common/ConfirmModal";
import { collectiveCropAPI, commonAPI } from "../../services/api";

const CATEGORY_ICON = {
  Grain: "ph:basket-fill",
  Vegetable: "ph:leaf-fill",
  Fruit: "ph:tree-fill",
  Pulse: "ph:circle-dashed-fill",
  Spice: "ph:star-fill",
  Oilseed: "ph:drop-fill",
};

const SEASON_META = {
  Kharif: { gradient: "from-amber-400 to-orange-500", chip: "bg-amber-400/15 text-amber-500", icon: "bg-amber-400/20" },
  Rabi: { gradient: "from-sky-400 to-blue-500", chip: "bg-sky-400/15 text-sky-500", icon: "bg-sky-400/20" },
  Zaid: { gradient: "from-rose-400 to-pink-500", chip: "bg-rose-400/15 text-rose-500", icon: "bg-rose-400/20" },
  Perennial: { gradient: "from-violet-400 to-purple-500", chip: "bg-violet-400/15 text-violet-500", icon: "bg-violet-400/20" },
};

const DEFAULT_META = { gradient: "from-emerald-400 to-teal-500", chip: "bg-emerald-400/15 text-emerald-500", icon: "bg-emerald-400/20" };

const getSeasonMeta = (s) => SEASON_META[s] || DEFAULT_META;
const getCategoryIcon = (c) => CATEGORY_ICON[c] || "ph:plant-fill";

// ── Shared Image Component ───────────────────────────────────────────────────
const CropImg = ({ image, category, season, cls = "w-11 h-11 rounded-xl", iconCls = "w-5 h-5" }) => {
  const [failed, setFailed] = useState(false);
  const meta = getSeasonMeta(season);
  return (
    <div className={`relative overflow-hidden shrink-0 ${cls} ${meta.icon}`}>
      {image && !failed ? (
        <img src={image} alt="" className="w-full h-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white opacity-80">
          <Icon icon={getCategoryIcon(category)} className={iconCls} />
        </div>
      )}
    </div>
  );
};

const CropInventory = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [crops, setCrops] = useState([]);
  const [masterCrops, setMasterCrops] = useState([]);
  const [backendStats, setBackendStats] = useState({ totalCrops: 0, totalQuantity: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View state: "list" | "form"
  const [view, setView] = useState("list");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showArchived, setShowArchived] = useState(false);

  // Selected crop for detail drawer / panel
  const [selectedCrop, setSelectedCrop] = useState(null);

  // Form State for Add / Edit
  const [editingCrop, setEditingCrop] = useState(null); // null = Add, object = Edit
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    price: "",
    quantity: "0",
  });

  // Delete Modal State
  const [cropToDelete, setCropToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const [inventoryRes, masterRes] = await Promise.all([
        collectiveCropAPI.get(),
        commonAPI.getCrops(),
      ]);

      const resData = inventoryRes.data?.data || inventoryRes.data || {};
      const inventoryList = resData.inventory || inventoryRes.data?.crops || [];

      setCrops(Array.isArray(inventoryList) ? inventoryList : []);
      setBackendStats({
        totalCrops: resData.totalCrops ?? inventoryList.length,
        totalQuantity: resData.totalQuantity ?? 0,
        totalAmount: resData.totalAmount ?? 0,
      });

      setMasterCrops(masterRes.data?.crops || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load crop inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Add Form
  const openAddForm = () => {
    setEditingCrop(null);
    setForm({ code: "", price: "", quantity: "0" });
    setView("form");
  };

  // Open Edit Form
  const openEditForm = (crop) => {
    setEditingCrop(crop);
    setForm({
      code: crop.code || "",
      price: crop.price !== undefined && crop.price !== null ? String(crop.price) : "",
      quantity: crop.quantity !== undefined && crop.quantity !== null ? String(crop.quantity) : "0",
    });
    setView("form");
  };

  // Handle Form Submit (Add or Edit)
  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (editingCrop) {
      // Edit validation
      if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) <= 0) {
        toast.error("Please enter a valid price greater than 0");
        return;
      }
      if (form.quantity !== "" && (isNaN(Number(form.quantity)) || Number(form.quantity) < 0)) {
        toast.error("Stock quantity cannot be negative");
        return;
      }

      setSaving(true);
      try {
        const payload = {
          id: editingCrop._id,
          price: Number(form.price),
          quantity: form.quantity !== "" ? Number(form.quantity) : 0,
        };
        const res = await collectiveCropAPI.edit(payload);
        toast.success(res.data?.message || `${editingCrop.name} updated successfully!`);
        setView("list");
        fetchData(true);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to update crop");
      } finally {
        setSaving(false);
      }
    } else {
      // Add validation
      if (!form.code) {
        toast.error("Please select a crop from the directory");
        return;
      }
      if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) <= 0) {
        toast.error("Please enter a valid price greater than 0");
        return;
      }
      if (form.quantity !== "" && (isNaN(Number(form.quantity)) || Number(form.quantity) < 0)) {
        toast.error("Stock quantity cannot be negative");
        return;
      }

      setSaving(true);
      try {
        const payload = {
          code: form.code,
          price: Number(form.price),
        };
        const res = await collectiveCropAPI.add(payload);
        const addedCropId = res.data?.crop?._id;

        // Optionally set initial stock if user entered quantity > 0
        if (addedCropId && form.quantity !== "" && Number(form.quantity) > 0) {
          await collectiveCropAPI.edit({
            id: addedCropId,
            price: Number(form.price),
            quantity: Number(form.quantity),
          });
        }

        toast.success(res.data?.message || "Crop added to inventory successfully!");
        setView("list");
        fetchData(true);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to add crop");
      } finally {
        setSaving(false);
      }
    }
  };

  // Handle Delete Confirm
  const confirmDelete = async () => {
    if (!cropToDelete) return;
    setIsDeleting(true);
    try {
      const res = await collectiveCropAPI.delete({ cropId: cropToDelete._id });
      toast.success(res.data?.message || `${cropToDelete.name} removed from inventory!`);
      setCropToDelete(null);
      if (selectedCrop?._id === cropToDelete._id) setSelectedCrop(null);
      fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove crop");
    } finally {
      setIsDeleting(false);
    }
  };

  // Dynamic Categories
  const categories = useMemo(() => {
    const set = new Set();
    crops.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [crops]);

  // Filtered Crops
  const filteredCrops = useMemo(() => {
    return crops.filter((crop) => {
      if (!showArchived && crop.status !== "ACTIVE") return false;
      if (selectedCategory !== "ALL" && crop.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = crop.name?.toLowerCase().includes(q);
        const codeMatch = crop.code?.toLowerCase().includes(q);
        const catMatch = crop.category?.toLowerCase().includes(q);
        const seasonMatch = crop.season?.toLowerCase().includes(q);
        return nameMatch || codeMatch || catMatch || seasonMatch;
      }

      return true;
    });
  }, [crops, showArchived, selectedCategory, searchQuery]);

  // Stats Calculation (Strictly Active Crops)
  const activeCrops = useMemo(() => crops.filter((c) => c.status === "ACTIVE"), [crops]);
  const stats = useMemo(() => {
    const totalCropsCount = activeCrops.length;
    const totalQty = activeCrops.reduce((acc, c) => acc + (Number(c.quantity) || 0), 0);
    const totalVal = activeCrops.reduce(
      (acc, c) => acc + (Number(c.quantity) || 0) * (Number(c.price) || 0),
      0
    );
    const lowStockCount = activeCrops.filter((c) => (c.quantity || 0) < 100).length;

    return {
      totalCrops: totalCropsCount,
      totalQuantity: totalQty,
      totalAmount: totalVal,
      lowStockCount,
    };
  }, [activeCrops]);

  // Reversed Exit Animation Variants for List & Form
  const listVariants = {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.2, ease: "easeIn" } },
  };

  const formVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit: { opacity: 0, x: 40, transition: { duration: 0.2, ease: "easeIn" } },
  };

  return (
    <div className={`min-h-screen p-5 sm:p-7 overflow-x-hidden ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" variants={listVariants} initial="initial" animate="animate" exit="exit">
            {/* ── Top Header ────────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                    Crop Inventory & Pricing
                  </h1>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${isDark ? "bg-slate-800/80 text-emerald-400 border-slate-700" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
                    Collective View
                  </span>
                </div>
                <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Manage procurement crops, set purchase prices, and track live inventory stock
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => fetchData(true)}
                  title="Refresh Data"
                  disabled={refreshing || loading}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isDark
                      ? "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 shadow-sm"
                  }`}
                >
                  <Icon icon="ph:arrows-clockwise-bold" className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-500" : ""}`} />
                </button>

                <button
                  onClick={openAddForm}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold cursor-pointer shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Icon icon="ph:plus-bold" className="w-4 h-4" />
                  Add Crop
                </button>
              </div>
            </div>

            {/* ── Summary Stats Cards (Compact Height) ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
              {[
                {
                  label: "Active Crops",
                  value: stats.totalCrops,
                  unit: "items",
                  icon: "ph:plant-fill",
                  gradient: "from-emerald-500/20 to-emerald-500/5",
                  color: "text-emerald-500",
                },
                {
                  label: "Total Stock",
                  value: stats.totalQuantity.toLocaleString("en-IN"),
                  unit: "kg",
                  icon: "ph:package-fill",
                  gradient: "from-blue-500/20 to-blue-500/5",
                  color: "text-blue-500",
                },
                {
                  label: "Inventory Value",
                  value: `₹${stats.totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 1 })}`,
                  unit: "est.",
                  icon: "ph:currency-inr-fill",
                  gradient: "from-amber-500/20 to-amber-500/5",
                  color: "text-amber-500",
                },
                {
                  label: "Low Stock Items",
                  value: stats.lowStockCount,
                  unit: "< 100 kg",
                  icon: "ph:warning-fill",
                  gradient: "from-red-500/20 to-red-500/5",
                  color: stats.lowStockCount > 0 ? "text-red-500" : "text-slate-400",
                },
              ].map((card, idx) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`relative overflow-hidden rounded-2xl border p-3.5 sm:p-4 backdrop-blur-xl ${
                    isDark ? "bg-slate-900/60 border-slate-800/80 shadow-lg shadow-black/20" : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full bg-gradient-to-br ${card.gradient} blur-xl pointer-events-none`} />
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"} ${card.color}`}>
                      <Icon icon={card.icon} className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDark ? "bg-slate-800/50 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {card.unit}
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">{card.value}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{card.label}</p>
                </motion.div>
              ))}
            </div>

            {/* ── Toolbar ───────────────────────────────────────────────────────────── */}
            <div className={`rounded-2xl border p-4 mb-6 backdrop-blur-xl ${isDark ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[240px]">
                  <Icon icon="ph:magnifying-glass-bold" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by crop name, code, category..."
                    className={`w-full pl-10 pr-9 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? "bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    }`}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}>
                      <Icon icon="ph:x-circle-fill" className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Pills & Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                            : isDark
                            ? "bg-slate-800 text-slate-400 hover:text-slate-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {cat === "ALL" ? "All Categories" : cat}
                      </button>
                    ))}
                  </div>

                  <div className="h-6 w-[1px] bg-slate-700/50 hidden sm:block" />

                  {/* Toggle Archived */}
                  <button
                    onClick={() => setShowArchived((p) => !p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      showArchived
                        ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                        : isDark
                        ? "border-slate-800 text-slate-400 hover:text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon icon={showArchived ? "ph:eye-fill" : "ph:eye-slash-fill"} className="w-3.5 h-3.5" />
                    {showArchived ? "Archived Included" : "Active Only"}
                  </button>

                  {/* View Mode */}
                  <div className={`flex items-center p-1 rounded-xl border ${isDark ? "bg-slate-800/60 border-slate-700/80" : "bg-slate-100 border-slate-200"}`}>
                    <button
                      onClick={() => setViewMode("grid")}
                      title="Grid View"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        viewMode === "grid"
                          ? isDark ? "bg-slate-700 text-emerald-400 shadow-sm" : "bg-white text-emerald-600 shadow-sm"
                          : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Icon icon="ph:squares-four-bold" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      title="Table View"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        viewMode === "table"
                          ? isDark ? "bg-slate-700 text-emerald-400 shadow-sm" : "bg-white text-emerald-600 shadow-sm"
                          : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Icon icon="ph:table-bold" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Main Inventory Content ────────────────────────────────────────────── */}
            {loading ? (
              <div className="flex flex-col items-center justify-center h-72">
                <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-12 h-12 mb-3 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading crop inventory data...</p>
              </div>
            ) : filteredCrops.length === 0 ? (
              <EmptyState
                icon="ph:plant-fill"
                title="No crops found"
                description={
                  searchQuery || selectedCategory !== "ALL"
                    ? "No crops matched your current filter criteria. Try adjusting search terms."
                    : "Your crop inventory is currently empty. Click 'Add Crop' to start procuring crops."
                }
              />
            ) : viewMode === "grid" ? (
              /* ── Grid Cards View (Slightly More Compact) ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {filteredCrops.map((crop, i) => {
                  const isInactive = crop.status === "INACTIVE";
                  const stockVal = Number(crop.quantity || 0);
                  const meta = getSeasonMeta(crop.season);

                  return (
                    <motion.div
                      key={crop._id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedCrop(crop)}
                      className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl flex flex-col justify-between cursor-pointer transition-all ${
                        selectedCrop?._id === crop._id
                          ? isDark
                            ? "bg-emerald-500/10 border-slate-700 shadow-xl ring-1 ring-emerald-500/30"
                            : "bg-emerald-50/80 border-slate-200 shadow-xl ring-1 ring-emerald-400/25"
                          : isInactive
                          ? isDark ? "bg-slate-900/30 border-slate-800 opacity-60" : "bg-slate-100/60 border-slate-200 opacity-60"
                          : isDark
                          ? "bg-slate-900/60 border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700"
                          : "bg-white border-slate-200 shadow-sm hover:shadow-md"
                      }`}
                    >
                      {/* Gradient stripe */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${meta.gradient}`} />

                      <div>
                        {/* Top card header */}
                        <div className="flex items-start justify-between gap-2.5 mb-3 pt-1">
                          <div className="flex items-center gap-2.5">
                            <CropImg image={crop.image} category={crop.category} season={crop.season} cls="w-10 h-10 rounded-xl" iconCls="w-5 h-5" />
                            <div>
                              <h3 className="font-bold text-base leading-tight">{crop.name}</h3>
                              <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                                isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}>
                                {crop.code}
                              </span>
                            </div>
                          </div>

                          {isInactive ? (
                            <StatusBadge status="inactive" size="sm" />
                          ) : stockVal < 100 ? (
                            <StatusBadge status="low_stock" size="sm" />
                          ) : (
                            <StatusBadge status="in_stock" size="sm" />
                          )}
                        </div>

                        {/* Category & Season Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                            isDark ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                            {crop.category || "General"}
                          </span>
                          {crop.season && (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${meta.chip}`}>
                              {crop.season}
                            </span>
                          )}
                        </div>

                        {/* Pricing & Stock section */}
                        <div className={`rounded-xl p-2.5 mb-3 grid grid-cols-2 gap-2 border ${
                          isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-100"
                        }`}>
                          <div>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              Offering Price
                            </p>
                            <p className={`text-base font-extrabold mt-0.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                              ₹{(Number(crop.price) || 0).toLocaleString("en-IN")}
                              <span className="text-xs font-normal">/kg</span>
                            </p>
                          </div>
                          <div>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              In Stock
                            </p>
                            <p className="text-base font-extrabold mt-0.5">
                              {stockVal.toLocaleString("en-IN")}
                              <span className="text-xs font-normal ml-0.5">kg</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditForm(crop)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                            isDark ? "border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600" : "border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <Icon icon="ph:pencil-simple-bold" className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        {!isInactive && (
                          <button
                            onClick={() => setCropToDelete(crop)}
                            className={`p-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                              isDark ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20" : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                          >
                            <Icon icon="ph:trash-bold" className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* ── Table View ── */
              <div className={`rounded-2xl border overflow-hidden backdrop-blur-xl ${isDark ? "bg-slate-900/60 border-slate-800/80 shadow-2xl shadow-black/20" : "bg-white border-slate-200 shadow-xl shadow-slate-200/50"}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className={isDark ? "bg-slate-800/50 border-b border-slate-800" : "bg-slate-50 border-b border-slate-200"}>
                      <tr>
                        <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Crop Detail</th>
                        <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Category & Season</th>
                        <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Offering Price</th>
                        <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Available Stock</th>
                        <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Status</th>
                        <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-right ${isDark ? "text-slate-400" : "text-slate-500"}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-slate-800/70" : "divide-slate-100"}`}>
                      {filteredCrops.map((crop, i) => {
                        const isInactive = crop.status === "INACTIVE";
                        const stockVal = Number(crop.quantity || 0);

                        return (
                          <tr
                            key={crop._id}
                            onClick={() => setSelectedCrop(crop)}
                            className={`group cursor-pointer transition-colors ${
                              isInactive
                                ? isDark ? "bg-slate-900/20 opacity-60" : "bg-slate-50/50 opacity-60"
                                : isDark ? "hover:bg-slate-800/40" : "hover:bg-emerald-50/40"
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3.5">
                                <CropImg image={crop.image} category={crop.category} season={crop.season} cls="w-10 h-10 rounded-xl" iconCls="w-5 h-5" />
                                <div>
                                  <p className="font-bold text-base flex items-center gap-2">
                                    {crop.name}
                                    {isInactive && (
                                      <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                        Archived
                                      </span>
                                    )}
                                  </p>
                                  <p className={`text-xs font-mono font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>{crop.code}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold w-max px-2.5 py-0.5 rounded-md ${
                                  isDark ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}>
                                  <Icon icon="ph:tag-bold" className="w-3 h-3 text-emerald-500" />
                                  {crop.category || "General"}
                                </span>
                                {crop.season && (
                                  <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    Season: <strong className={isDark ? "text-slate-300" : "text-slate-700"}>{crop.season}</strong>
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <p className={`font-bold text-base ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                                ₹{(Number(crop.price) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                <span className={`text-xs font-normal ml-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>/kg</span>
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              <p className="font-semibold text-sm">{stockVal.toLocaleString("en-IN")} kg</p>
                              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                Val: ₹{((Number(crop.price) || 0) * stockVal).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              {isInactive ? (
                                <StatusBadge status="inactive" size="sm" />
                              ) : stockVal < 100 ? (
                                <StatusBadge status="low_stock" size="sm" />
                              ) : (
                                <StatusBadge status="in_stock" size="sm" />
                              )}
                            </td>

                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditForm(crop)}
                                  className={`p-2 rounded-xl cursor-pointer transition-all ${
                                    isDark
                                      ? "hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-transparent hover:border-slate-700"
                                      : "hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-transparent hover:border-emerald-200"
                                  }`}
                                >
                                  <Icon icon="ph:pencil-simple-fill" className="w-4 h-4" />
                                </button>
                                {!isInactive && (
                                  <button
                                    onClick={() => setCropToDelete(crop)}
                                    className={`p-2 rounded-xl cursor-pointer transition-all ${
                                      isDark
                                        ? "hover:bg-red-500/20 text-red-400 border border-transparent hover:border-red-500/30"
                                        : "hover:bg-red-50 text-red-500 border border-transparent hover:border-red-200"
                                    }`}
                                  >
                                    <Icon icon="ph:trash-fill" className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* ── Add / Edit Form View (Reversed Exit Animation) ── */
          <motion.div key="form" variants={formVariants} initial="initial" animate="animate" exit="exit" className="max-w-3xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => setView("list")}
              className={`mb-6 flex items-center gap-2 text-sm font-semibold cursor-pointer transition-colors ${
                isDark ? "text-slate-400 hover:text-emerald-400" : "text-slate-500 hover:text-emerald-600"
              }`}
            >
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
              Back to Inventory List
            </button>

            {/* Form Container */}
            <div className={`rounded-3xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl ${
              isDark ? "bg-slate-900/80 border-slate-800/80 shadow-black/40" : "bg-white/90 border-slate-200 shadow-slate-200/50"
            }`}>
              <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-200 dark:border-slate-800">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"
                }`}>
                  <Icon icon={editingCrop ? "ph:pencil-fill" : "ph:plus-bold"} className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {editingCrop ? `Edit ${editingCrop.name}` : "Register New Crop to Inventory"}
                  </h2>
                  <p className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {editingCrop
                      ? "Update price offering and available stock quantity for this crop."
                      : "Select a crop from directory, set procurement price, and optionally set initial stock."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {editingCrop ? (
                  /* Read-only Master Crop info */
                  <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                    isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <CropImg image={editingCrop.image} category={editingCrop.category} season={editingCrop.season} cls="w-14 h-14 rounded-2xl" iconCls="w-7 h-7" />
                    <div>
                      <p className="font-bold text-base">{editingCrop.name}</p>
                      <p className={`text-xs font-mono mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Code: {editingCrop.code} · Category: {editingCrop.category || "General"} · Season: {editingCrop.season}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Crop Directory Selector */
                  <div>
                    <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Select Crop (Master Directory) *
                    </label>
                    <CropSelect
                      crops={masterCrops}
                      value={form.code}
                      onChange={(code) => setForm((p) => ({ ...p, code }))}
                      placeholder="Search and choose a crop..."
                    />
                  </div>
                )}

                {/* Offering Price & Quantity inputs (Stock is optional in Add, editable in Edit, 0 allowed, negative prohibited) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Offering Price (₹ per kg) *
                    </label>
                    <div className="relative">
                      <Icon icon="ph:currency-inr-bold" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        value={form.price}
                        onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                        placeholder="e.g. 28.50"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                          isDark
                            ? "bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {editingCrop ? "Current Inventory Stock (kg)" : "Initial Stock (kg, optional)"}
                    </label>
                    <div className="relative">
                      <Icon icon="ph:package-fill" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input
                        type="number"
                        min="0"
                        value={form.quantity}
                        onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                        placeholder="0"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                          isDark
                            ? "bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border cursor-pointer transition-colors ${
                      isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white cursor-pointer flex items-center justify-center gap-2 hover:from-emerald-400 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-60"
                  >
                    {saving ? (
                      <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-5 h-5" />
                    ) : (
                      <Icon icon="ph:check-bold" className="w-4 h-4" />
                    )}
                    {editingCrop ? "Save Changes" : "Save Crop"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm Delete Modal ────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!cropToDelete}
        onClose={() => setCropToDelete(null)}
        onConfirm={confirmDelete}
        title={`Remove ${cropToDelete?.name || "Crop"}?`}
        description={`Are you sure you want to remove ${cropToDelete?.name || "this crop"} from your procurement inventory? This will set its status to inactive and update active deals.`}
        confirmLabel={isDeleting ? "Removing..." : "Remove Crop"}
        variant="danger"
        loading={isDeleting}
        icon="ph:trash-bold"
      />
    </div>
  );
};

export default CropInventory;
