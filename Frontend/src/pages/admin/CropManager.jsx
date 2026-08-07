import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { adminAPI } from "../../services/api";
import { Loader, Input, useToast } from "../../components/ui";
import CustomSelect from "../../components/common/CustomSelect";

const SEASONS = ["Kharif", "Rabi", "Zaid", "Perennial", "Year-Round"];
const SEASON_FILTER_OPTIONS = [{ value: "All", label: "All Seasons" }, ...SEASONS.map((s) => ({ value: s, label: s }))];
const CATEGORIES = [
  "Grain",
  "Pulse",
  "Oilseed",
  "Cash Crop",
  "Plantation",
  "Spice",
  "Vegetable",
  "Fruit",
  "Tuber",
  "Medicinal",
  "Fodder",
  "Flower",
  "Aromatic",
  "Other",
];

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  enter: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: "easeIn" } },
};

const CropManager = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("All");
  const [activeFilter, setActiveFilter] = useState("All");

  // Navigation view: "list" | "add" | "edit"
  const [view, setView] = useState("list");
  const [editingCrop, setEditingCrop] = useState(null);
  const [saving, setSaving] = useState(false);

  // Add Form State
  const [addForm, setAddForm] = useState({ name: "", category: "Pulse", season: "Kharif", imageFile: null });
  const [addPreview, setAddPreview] = useState("");

  // Edit Form State
  const [editForm, setEditForm] = useState({ category: "", season: "", image: "", imageFile: null, isActive: true });
  const [editPreview, setEditPreview] = useState("");

  const fetchCrops = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getCrops();
      setCrops(res.data?.crops || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load crops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const openAdd = () => {
    setAddForm({ name: "", category: "Pulse", season: "Kharif", imageFile: null });
    setAddPreview("");
    setView("add");
  };

  const openEdit = (crop) => {
    setEditingCrop(crop);
    const cat = crop?.category?.trim() || "Grain";
    const seas = crop?.season?.trim() || "Kharif";
    setEditForm({
      category: cat,
      season: seas,
      image: crop?.image || "",
      imageFile: null,
      isActive: crop?.isActive !== false,
    });
    setEditPreview(crop?.image || "");
    setView("edit");
  };

  const handleAddImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAddForm((p) => ({ ...p, imageFile: file }));
      setAddPreview(URL.createObjectURL(file));
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm((p) => ({ ...p, imageFile: file }));
      setEditPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateCrop = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      toast.error("Crop name is required !!");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", addForm.name.trim());
      formData.append("category", addForm.category);
      formData.append("season", addForm.season);
      if (addForm.imageFile) {
        formData.append("image", addForm.imageFile);
      }

      const res = await adminAPI.createCrop(formData);
      toast.success(`Crop "${addForm.name.trim()}" created successfully !!`);
      setCrops((prev) => [res.data.crop, ...prev]);
      setView("list");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create crop");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCrop = async (e) => {
    e.preventDefault();
    if (!editingCrop) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("category", editForm.category);
      formData.append("season", editForm.season);
      formData.append("isActive", editForm.isActive);
      if (editForm.imageFile) {
        formData.append("image", editForm.imageFile);
      }

      const res = await adminAPI.updateCrop(editingCrop._id, formData);
      toast.success(`"${editingCrop.name}" updated successfully !!`);
      setCrops((prev) => prev.map((c) => (c._id === editingCrop._id ? { ...c, ...res.data.crop } : c)));
      setView("list");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update crop");
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    return (crops || []).filter((c) => {
      if (!c) return false;
      if (seasonFilter !== "All" && c.season !== seasonFilter) return false;
      if (activeFilter === "Active" && c.isActive === false) return false;
      if (activeFilter === "Inactive" && c.isActive !== false) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          c.name?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [crops, seasonFilter, activeFilter, search]);

  const totalActive = (crops || []).filter((c) => c.isActive !== false).length;
  const totalInactive = (crops || []).filter((c) => c.isActive === false).length;

  if (loading && view === "list") {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <Loader size="lg" />
        <p className={`mt-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading Crop Directory...</p>
      </div>
    );
  }

  if (error && view === "list") {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-600"}`}>
        <Icon icon="ph:warning-circle-fill" className="w-12 h-12 text-red-500 mb-2" />
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600">Retry</button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" variants={pageVariants} initial="initial" animate="enter" exit="exit">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Crop Manager</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
                    {totalActive} Active
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-700"}`}>
                    {totalInactive} Inactive
                  </span>
                  <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{crops.length} total</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-full sm:w-64">
                  <Input
                    icon="ph:magnifying-glass"
                    placeholder="Search by name, code, category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button
                  onClick={openAdd}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md cursor-pointer transition-all shrink-0"
                >
                  <Icon icon="ph:plus-bold" className="w-4 h-4" />
                  Add Crop
                </button>
              </div>
            </div>

            {/* Info note */}
            <div className={`flex items-start gap-3 p-4 rounded-xl border mb-5 ${isDark ? "bg-blue-500/5 border-blue-500/20" : "bg-blue-50 border-blue-200"}`}>
              <Icon icon="ph:info-fill" className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className={`text-xs leading-relaxed ${isDark ? "text-blue-400" : "text-blue-700"}`}>
                <strong>Crop Code is auto-generated on creation</strong>. You can add new crops with custom category, season, and image upload stored in Cloudinary <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded text-[11px]">Farmfresh/crop</code>.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {/* Status filter tabs */}
              <div className={`flex gap-1 p-1 rounded-xl ${isDark ? "bg-slate-800/70" : "bg-slate-100"}`}>
                {["All", "Active", "Inactive"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      activeFilter === f
                        ? f === "Inactive" ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow"
                        : f === "Active" ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow"
                        : "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow"
                        : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Season Custom Dropdown Filter */}
              <div className="w-44">
                <CustomSelect
                  options={SEASON_FILTER_OPTIONS}
                  value={seasonFilter}
                  onChange={(val) => setSeasonFilter(val)}
                  placeholder="Filter by Season"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Icon icon="ph:leaf-duotone" className={`w-16 h-16 mb-4 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
                <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>No crops found</h3>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Try adjusting your filters or search</p>
              </div>
            ) : (
              <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
                {/* Table header */}
                <div className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b ${isDark ? "text-slate-500 border-slate-800 bg-slate-950/30" : "text-slate-400 border-slate-100 bg-slate-50"}`}>
                  <span>Crop</span>
                  <span>Category</span>
                  <span>Season</span>
                  <span>Farmers Using</span>
                  <span>Collectives Using</span>
                  <span>Status</span>
                </div>

                {/* Table rows */}
                <div>
                  <AnimatePresence>
                    {filtered.map((crop, i) => (
                      <motion.div
                        key={crop._id || i}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 items-center px-5 py-3.5 transition-colors ${
                          i > 0 ? `border-t ${isDark ? "border-slate-800/50" : "border-slate-100"}` : ""
                        } ${isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"} ${
                          crop.isActive === false ? isDark ? "opacity-60" : "opacity-50" : ""
                        }`}
                      >
                        {/* Crop name */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            {crop.image ? (
                              <img src={crop.image} alt={crop.name || ""} className="w-full h-full object-cover" />
                            ) : (
                              <Icon icon="ph:leaf-fill" className="w-5 h-5 text-emerald-500" />
                            )}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{crop.name}</p>
                            <p className={`text-xs font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>{crop.code}</p>
                          </div>
                        </div>

                        {/* Category */}
                        <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>{crop.category || "-"}</span>

                        {/* Season */}
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium w-fit ${isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-700"}`}>{crop.season}</span>

                        {/* Farmer usage */}
                        <span className={`text-sm font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>{crop.farmerGroupsUsing || 0}</span>

                        {/* Collective usage */}
                        <span className={`text-sm font-semibold ${isDark ? "text-blue-400" : "text-blue-600"}`}>{crop.collectivesUsing || 0}</span>

                        {/* Status + edit */}
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                            crop.isActive !== false
                              ? isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isDark ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-700 border-red-200"
                          }`}>
                            {crop.isActive !== false ? "Active" : "Inactive"}
                          </span>
                          <button
                            onClick={() => openEdit(crop)}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"}`}
                            title="Edit crop"
                          >
                            <Icon icon="ph:pencil-simple-bold" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        ) : view === "add" ? (
          <motion.div key="add" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="max-w-2xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => setView("list")}
              className={`mb-6 flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors ${
                isDark ? "text-slate-400 hover:text-emerald-400" : "text-slate-500 hover:text-emerald-600"
              }`}
            >
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
              Back to Crop Directory
            </button>

            <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl ${
              isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-lg">
                  <Icon icon="ph:plus-bold" className="w-6 h-6" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Add New Crop</h2>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Crop Code will be auto-generated upon creation
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateCrop} className="space-y-5">
                {/* Crop Name */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Crop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Basmati Rice, Organic Rajma, Wheat"
                    className={`w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all ${
                      isDark ? "bg-slate-800/80 border-slate-700 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
                    }`}
                  />
                </div>

                {/* Category & Season Custom Dropdowns */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <CustomSelect
                    label="Category"
                    options={CATEGORIES}
                    value={addForm.category}
                    onChange={(val) => setAddForm((p) => ({ ...p, category: val }))}
                  />
                  <CustomSelect
                    label="Season"
                    options={SEASONS}
                    value={addForm.season}
                    onChange={(val) => setAddForm((p) => ({ ...p, season: val }))}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Crop Image (Uploaded to Cloudinary <code className="font-mono text-[11px] font-normal">Farmfresh/crop</code>)
                  </label>
                  <div className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDark ? "border-slate-700 bg-slate-800/30 hover:bg-slate-800/60" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}>
                    <input type="file" accept="image/*" onChange={handleAddImageChange} className="hidden" id="crop-image-input-slide" />
                    <label htmlFor="crop-image-input-slide" className="cursor-pointer block">
                      {addPreview ? (
                        <div className="relative w-full h-44 rounded-xl overflow-hidden border border-emerald-500/30 shadow-md">
                          <img src={addPreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                            <Icon icon="ph:cloud-arrow-up-fill" className="w-6 h-6" />
                          </div>
                          <p className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Click to upload crop image</p>
                          <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Supports PNG, JPG, WEBP formats</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg cursor-pointer transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {saving ? <Icon icon="ph:spinner-gap" className="animate-spin w-4 h-4" /> : <Icon icon="ph:check-bold" className="w-4 h-4" />}
                    Create Crop
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div key="edit" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="max-w-2xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => setView("list")}
              className={`mb-6 flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors ${
                isDark ? "text-slate-400 hover:text-emerald-400" : "text-slate-500 hover:text-emerald-600"
              }`}
            >
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
              Back to Crop Directory
            </button>

            <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl ${
              isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  {editPreview ? (
                    <img src={editPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Icon icon="ph:leaf-fill" className="w-6 h-6 text-emerald-500" />
                  )}
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{editingCrop?.name}</h2>
                  <p className={`text-xs mt-0.5 font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Code: {editingCrop?.code} · Read-Only
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdateCrop} className="space-y-5">
                {/* Category & Season Custom Dropdowns */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <CustomSelect
                    label="Category"
                    options={CATEGORIES}
                    value={editForm.category}
                    onChange={(val) => setEditForm((p) => ({ ...p, category: val }))}
                  />
                  <CustomSelect
                    label="Season"
                    options={SEASONS}
                    value={editForm.season}
                    onChange={(val) => setEditForm((p) => ({ ...p, season: val }))}
                  />
                </div>

                {/* Image File Upload for Edit View */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Upload New Image (Stored in Cloudinary <code className="font-mono text-[11px] font-normal">Farmfresh/crop</code>)
                  </label>
                  <div className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDark ? "border-slate-700 bg-slate-800/30 hover:bg-slate-800/60" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}>
                    <input type="file" accept="image/*" onChange={handleEditImageChange} className="hidden" id="edit-crop-image-input" />
                    <label htmlFor="edit-crop-image-input" className="cursor-pointer block">
                      {editPreview ? (
                        <div className="relative w-full h-44 rounded-xl overflow-hidden border border-emerald-500/30 shadow-md">
                          <img src={editPreview} alt="Crop Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                            <Icon icon="ph:cloud-arrow-up-fill" className="w-6 h-6" />
                          </div>
                          <p className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Click to upload new crop image</p>
                          <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>PNG, JPG, WEBP formats</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Platform Availability Toggle */}
                <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Platform Availability</p>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {editForm.isActive ? "Active - can be added by farmers & collectives" : "Inactive - blocked from being added"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditForm((p) => ({ ...p, isActive: !p.isActive }))}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${editForm.isActive ? "bg-emerald-500" : isDark ? "bg-slate-700" : "bg-slate-300"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${editForm.isActive ? "left-6" : "left-0.5"}`} />
                  </button>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg cursor-pointer transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {saving ? <Icon icon="ph:spinner-gap" className="animate-spin w-4 h-4" /> : <Icon icon="ph:floppy-disk-fill" className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CropManager;
