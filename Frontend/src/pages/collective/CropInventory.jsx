import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import CropSelect from "../../components/common/CropSelect";
import ConfirmModal from "../../components/common/ConfirmModal";
import { collectiveCropAPI, collectiveMemberAPI, commonAPI } from "../../services/api";

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
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

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

// ── Crop Detail View ─────────────────────────────────────────
const CropDetailView = ({ crop, isDark, memberData, onBack }) => {
  if (!crop) return null;
  const meta = getSeasonMeta(crop.season);

  const approvedMembers = Array.isArray(memberData?.approved) ? memberData.approved : [];

  // Filter farmer groups supplying this crop code
  const supplyingGroups = useMemo(() => {
    const list = [];
    approvedMembers.forEach((fg) => {
      const deals = Array.isArray(fg.deals) ? fg.deals : [];
      deals.forEach((d) => {
        const dealCode = d.crop?.crop?.code || d.crop?.code;
        if (dealCode === crop.code && (d.status === "APPROVED" || d.status === "REQUESTED")) {
          list.push({
            farmerGroup: fg.name || fg.groupName || "Farmer Group",
            leadFarmer: fg.leadFarmer || "N/A",
            phone: fg.phone,
            address: fg.address,
            agreedPrice: d.agreedPrice || d.demandedPrice || 0,
            growthStage: d.growth?.stage || "SOWING",
            plantedDate: d.crop?.plantedDate || d.plantedDate,
            yield: d.crop?.yield || d.yield || 0,
            farmland: d.crop?.farmland || d.farmland || 0,
            dealStatus: d.status,
          });
        }
      });
    });
    return list;
  }, [approvedMembers, crop.code]);

  const aggregateYield = useMemo(() => {
    return supplyingGroups.reduce((acc, item) => acc + (Number(item.yield) || 0), 0);
  }, [supplyingGroups]);

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="max-w-4xl mx-auto w-full"
    >
      <button
        onClick={onBack}
        className={`mb-6 flex items-center gap-2 text-sm font-semibold cursor-pointer transition-colors ${
          isDark ? "text-slate-400 hover:text-emerald-400" : "text-slate-500 hover:text-emerald-600"
        }`}
      >
        <Icon icon="ph:arrow-left-bold" className="w-4 h-4" /> Back to Inventory
      </button>

      <div className={`rounded-2xl border p-6 shadow-xl ${
        isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-4">
            <CropImg image={crop.image} category={crop.category} season={crop.season} cls="w-16 h-16 rounded-2xl" iconCls="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold text-white">{crop.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {crop.code}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${meta.chip}`}>
                  {crop.season}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Target Price</p>
            <p className="text-2xl font-black text-emerald-400">₹{crop.price}<span className="text-sm font-semibold text-emerald-400/70">/kg</span></p>
          </div>
        </div>

        {/* 8 Smart Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <div className={`p-3 rounded-lg border flex flex-col justify-center ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Code</p>
            <p className={`text-sm font-mono font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{crop.code}</p>
          </div>
          <div className={`p-3 rounded-lg border flex flex-col justify-center ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Category</p>
            <p className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>{crop.category || "General"}</p>
          </div>
          <div className={`p-3 rounded-lg border flex flex-col justify-center ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">In-Stock Qty</p>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{crop.quantity || 0} kg</p>
          </div>
          <div className={`p-3 rounded-lg border flex flex-col justify-center ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Stock Value</p>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>₹{(crop.price * (crop.quantity || 0)).toLocaleString("en-IN")}</p>
          </div>

          <div className={`p-3 rounded-lg border flex flex-col justify-center ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Suppliers</p>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{supplyingGroups.length} Groups</p>
          </div>
          <div className={`p-3 rounded-lg border flex flex-col justify-center ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Aggr. Weight</p>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{aggregateYield} kg</p>
          </div>
          <div className={`p-3 rounded-lg border flex flex-col justify-center ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Season</p>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{crop.season}</p>
          </div>
          <div className={`p-3 rounded-lg border flex flex-col justify-center ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Status</p>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{crop.status}</p>
          </div>
        </div>

        {/* Supplying Farmer Groups Breakdown */}
        <div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Icon icon="ph:users-three-bold" className="w-5 h-5 text-emerald-400" />
            Active Supply Lines
          </h3>

          {supplyingGroups.length === 0 ? (
            <div className={`p-8 rounded-xl border border-dashed text-center ${isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-300 bg-slate-50"}`}>
              <Icon icon="ph:users-three" className={`w-10 h-10 mx-auto mb-3 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
              <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>No farmer groups currently supply this crop.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {supplyingGroups.map((fg, idx) => (
                <div key={idx} className={`p-5 rounded-xl border transition-all ${isDark ? "border-slate-800 bg-slate-950/60 hover:border-slate-700" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h4 className={`font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}>{fg.farmerGroup}</h4>
                      <p className={`text-xs mt-1 flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        <Icon icon="ph:user-bold" /> {fg.leadFarmer} &middot; <Icon icon="ph:phone-fill" /> {fg.phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Agreed Rate</p>
                        <span className="text-sm font-bold text-emerald-400">₹{fg.agreedPrice}/kg</span>
                      </div>
                      <StatusBadge status={fg.dealStatus?.toLowerCase()} size="sm" />
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 rounded-xl border text-center ${isDark ? "bg-slate-900/60 border-slate-800/60" : "bg-slate-50 border-slate-200"}`}>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Growth Stage</p>
                      <p className="font-bold text-sm text-emerald-400">{fg.growthStage}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Planted Date</p>
                      <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{fmtDate(fg.plantedDate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Est. Yield</p>
                      <p className="font-bold text-sm text-amber-400">{fg.yield} kg</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Farmland</p>
                      <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{fg.farmland} ac</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Main CropInventory Component ─────────────────────────────────────────────
const CropInventory = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [crops, setCrops] = useState([]);
  const [masterCrops, setMasterCrops] = useState([]);
  const [memberData, setMemberData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [view, setView] = useState("list");
  const [viewMode, setViewMode] = useState("table");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showArchived, setShowArchived] = useState(false);

  const [selectedCrop, setSelectedCrop] = useState(null);

  const [editingCrop, setEditingCrop] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", price: "", quantity: "0" });

  const [cropToDelete, setCropToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const [inventoryRes, masterRes, memberRes] = await Promise.all([
        collectiveCropAPI.get(),
        commonAPI.getCrops(),
        collectiveMemberAPI.get(),
      ]);

      const resData = inventoryRes.data?.data || inventoryRes.data || {};
      const inventoryList = resData.inventory || inventoryRes.data?.crops || [];

      setCrops(Array.isArray(inventoryList) ? inventoryList : []);
      setMasterCrops(masterRes.data?.crops || []);
      setMemberData(memberRes.data?.memberData || {});
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load crop inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAddForm = () => {
    setEditingCrop(null);
    setForm({ code: "", price: "", quantity: "0" });
    setView("form");
  };

  const openEditForm = (crop) => {
    setEditingCrop(crop);
    setForm({
      code: crop.code || "",
      price: crop.price !== undefined && crop.price !== null ? String(crop.price) : "",
      quantity: crop.quantity !== undefined && crop.quantity !== null ? String(crop.quantity) : "0",
    });
    setView("form");
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (editingCrop) {
      if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) <= 0) {
        toast.error("Please enter a valid price greater than 0");
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
      if (!form.code) {
        toast.error("Please select a crop from directory");
        return;
      }
      if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) <= 0) {
        toast.error("Please enter a valid price greater than 0");
        return;
      }
      setSaving(true);
      try {
        const payload = { code: form.code, price: Number(form.price) };
        const res = await collectiveCropAPI.add(payload);
        const addedCropId = res.data?.crop?._id;

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

  const categories = useMemo(() => {
    const set = new Set();
    crops.forEach((c) => { if (c.category) set.add(c.category); });
    return ["ALL", ...Array.from(set)];
  }, [crops]);

  const filteredCrops = useMemo(() => {
    return crops.filter((crop) => {
      if (!showArchived && crop.status !== "ACTIVE") return false;
      if (selectedCategory !== "ALL" && crop.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return crop.name?.toLowerCase().includes(q) || crop.code?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [crops, showArchived, selectedCategory, searchQuery]);

  const activeCrops = useMemo(() => crops.filter((c) => c.status === "ACTIVE"), [crops]);
  const stats = useMemo(() => {
    const totalCropsCount = activeCrops.length;
    const totalQty = activeCrops.reduce((acc, c) => acc + (Number(c.quantity) || 0), 0);
    const totalVal = activeCrops.reduce((acc, c) => acc + (Number(c.quantity) || 0) * (Number(c.price) || 0), 0);
    const lowStockCount = activeCrops.filter((c) => (c.quantity || 0) < 100).length;

    return { totalCrops: totalCropsCount, totalQuantity: totalQty, totalAmount: totalVal, lowStockCount };
  }, [activeCrops]);

  return (
    <div className={`min-h-screen p-5 sm:p-7 overflow-x-hidden transition-colors duration-200 ${isDark ? "bg-slate-950 text-white" : "bg-gradient-to-br from-slate-50 via-emerald-50/20 to-amber-50/20 text-slate-900"}`}>
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                  Crop Inventory & Pricing
                </h1>
                <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Manage procurement crops, target prices, and supplying farmer group details
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={openAddForm} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold cursor-pointer shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 transition-all">
                  <Icon icon="ph:plus-bold" className="w-4 h-4" /> Add Crop
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
              {[
                { label: "Active Crops", value: stats.totalCrops, unit: "items", icon: "ph:plant-fill", color: "text-emerald-500" },
                { label: "Total Stock", value: stats.totalQuantity.toLocaleString("en-IN"), unit: "kg", icon: "ph:package-fill", color: "text-blue-500" },
                { label: "Inventory Value", value: `₹${stats.totalAmount.toLocaleString("en-IN")}`, unit: "est.", icon: "ph:currency-inr-fill", color: "text-amber-500" },
                { label: "Low Stock Items", value: stats.lowStockCount, unit: "< 100 kg", icon: "ph:warning-fill", color: stats.lowStockCount > 0 ? "text-red-500" : "text-slate-400" },
              ].map((card) => (
                <div key={card.label} className={`rounded-2xl border p-4 backdrop-blur-xl ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon icon={card.icon} className={`w-5 h-5 ${card.color}`} />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDark ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200"}`}>{card.unit}</span>
                  </div>
                  <p className="text-2xl font-extrabold">{card.value}</p>
                  <p className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{card.label}</p>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1">
                <Icon icon="ph:magnifying-glass-bold" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by crop name or code..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none ${isDark ? "bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className={`flex items-center p-1 rounded-xl border ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-100"}`}>
                  <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg ${viewMode === "grid" ? (isDark ? "bg-slate-800 text-emerald-400" : "bg-white text-emerald-600 shadow-sm") : "text-slate-500 hover:text-slate-700"}`}>
                    <Icon icon="ph:squares-four-bold" className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-lg ${viewMode === "table" ? (isDark ? "bg-slate-800 text-emerald-400" : "bg-white text-emerald-600 shadow-sm") : "text-slate-500 hover:text-slate-700"}`}>
                    <Icon icon="ph:table-bold" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Crop Cards */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-10 h-10 text-emerald-400" />
              </div>
            ) : filteredCrops.length === 0 ? (
              <EmptyState icon="ph:plant-fill" title="No crops found" description="Add your first procurement crop." />
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCrops.map((crop) => (
                  <div
                    key={crop._id}
                    onClick={() => { setSelectedCrop(crop); setView("detail"); }}
                    className={`relative overflow-hidden rounded-2xl border p-3.5 cursor-pointer transition-all ${
                      isDark ? "bg-slate-900/40 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/80 shadow-md" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <CropImg image={crop.image} category={crop.category} season={crop.season} cls="w-12 h-12 rounded-xl" iconCls="w-5 h-5" />
                        <div>
                          <h3 className="font-bold text-base text-white mb-0.5">{crop.name}</h3>
                          <p className="text-[10px] text-slate-400 font-medium mb-1">{crop.category} &middot; {crop.season}</p>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${isDark ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-emerald-600 bg-emerald-50 border-emerald-200"}`}>{crop.code}</span>
                        </div>
                      </div>
                      <StatusBadge status={crop.quantity < 100 ? "low_stock" : "in_stock"} size="sm" />
                    </div>

                    <div className={`grid grid-cols-2 gap-2 p-2 rounded-xl border mb-3 text-center ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Target Price</p>
                        <p className="text-sm font-black text-emerald-400">₹{crop.price}<span className="text-[10px] font-semibold text-emerald-400/70">/kg</span></p>
                      </div>
                      <div className={`flex flex-col items-center justify-center border-l ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">In Stock</p>
                        <p className={`text-sm font-black ${isDark ? "text-white" : "text-slate-900"}`}>{crop.quantity} <span className="text-[10px] font-semibold text-slate-400">kg</span></p>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 pt-2 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEditForm(crop)} className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-slate-100"}`}>
                        Edit Settings
                      </button>
                      <button onClick={() => setCropToDelete(crop)} className={`p-1.5 rounded-lg border transition-colors ${isDark ? "border-red-500/20 text-red-400 hover:bg-red-500/10" : "border-red-200 text-red-500 hover:bg-red-50"}`}>
                        <Icon icon="ph:trash-bold" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-2xl border overflow-hidden ${isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"}`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] whitespace-nowrap text-sm text-left">
                    <thead className={`border-b text-xs uppercase ${isDark ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                      <tr>
                        <th className="p-4">Crop</th>
                        <th className="p-4">Category & Season</th>
                        <th className="p-4">Target Price</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
                      {filteredCrops.map((crop) => (
                      <tr key={crop._id} onClick={() => { setSelectedCrop(crop); setView("detail"); }} className={`cursor-pointer transition-colors ${isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}>
                        <td className="p-4 flex items-center gap-3">
                          <CropImg image={crop.image} category={crop.category} season={crop.season} />
                          <div>
                            <p className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{crop.name}</p>
                            <p className={`text-xs font-mono ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>{crop.code}</p>
                          </div>
                        </td>
                        <td className="p-4">{crop.category} · {crop.season}</td>
                        <td className={`p-4 font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>₹{crop.price}/kg</td>
                        <td className="p-4 font-bold">{crop.quantity} kg</td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => openEditForm(crop)} className="p-2 text-slate-300 hover:text-emerald-400">
                            <Icon icon="ph:pencil-simple-bold" className="w-4 h-4" />
                          </button>
                          <button onClick={() => setCropToDelete(crop)} className="p-2 text-red-400 hover:text-red-300">
                            <Icon icon="ph:trash-bold" className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        ) : view === "detail" && selectedCrop ? (
          <CropDetailView
            key="detail"
            crop={selectedCrop}
            isDark={isDark}
            memberData={memberData}
            onBack={() => { setSelectedCrop(null); setView("list"); }}
          />
        ) : (
          /* Form View */
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-2xl mx-auto">
            <button onClick={() => setView("list")} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-emerald-400">
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" /> Back to Inventory
            </button>

            <div className={`rounded-2xl border p-5 shadow-2xl ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>{editingCrop ? `Edit ${editingCrop.name}` : "Add Crop to Procurement Inventory"}</h2>
              <form onSubmit={handleSave} className="space-y-3">
                {!editingCrop && (
                  <div>
                    <label className={`text-xs font-bold uppercase block mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Select Crop *</label>
                    <CropSelect crops={masterCrops} value={form.code} onChange={(code) => setForm((p) => ({ ...p, code }))} placeholder="Choose crop..." />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs font-bold uppercase block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Offering Price (₹/kg) *</label>
                    <input type="number" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${isDark ? "border-slate-700 bg-slate-800 text-white focus:border-emerald-500" : "border-slate-300 bg-slate-50 text-slate-900 focus:border-emerald-400"}`} />
                  </div>
                  <div>
                    <label className={`text-xs font-bold uppercase block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>In-Stock Quantity (kg)</label>
                    <input type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${isDark ? "border-slate-700 bg-slate-800 text-white focus:border-emerald-500" : "border-slate-300 bg-slate-50 text-slate-900 focus:border-emerald-400"}`} />
                  </div>
                </div>
                <div className={`flex gap-2 pt-3 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <button type="button" onClick={() => setView("list")} className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-slate-100"}`}>Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
                    {saving ? <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-4 h-4" /> : "Save Crop"}
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
        onConfirm={confirmDelete}
        title={`Remove ${cropToDelete?.name || "Crop"}?`}
        description="Are you sure you want to remove this crop from inventory?"
        confirmLabel={isDeleting ? "Removing..." : "Remove Crop"}
        variant="danger"
        icon="ph:trash-bold"
      />
    </div>
  );
};

export default CropInventory;
