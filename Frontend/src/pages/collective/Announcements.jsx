import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import ConfirmModal from "../../components/common/ConfirmModal";
import EmptyState from "../../components/common/EmptyState";
import { collectiveAnnouncementAPI, commonAPI } from "../../services/api";

const Announcements = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState([]);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", targetCrops: [] });
  
  const [deleteId, setDeleteId] = useState(null); // not supported by backend yet, but kept in UI

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [annRes, cropsRes] = await Promise.all([
        collectiveAnnouncementAPI.get(),
        commonAPI.getCrops()
      ]);
      setAnnouncements(annRes.data.announcements || []);
      setCrops(cropsRes.data.crops || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleCrop = (cropId) => {
    setForm(prev => {
      if (prev.targetCrops.includes(cropId)) {
        return { ...prev, targetCrops: prev.targetCrops.filter(id => id !== cropId) };
      }
      return { ...prev, targetCrops: [...prev.targetCrops, cropId] };
    });
  };

  const handleCreate = async () => {
    if (!form.title || !form.body) { toast.error("Title and content are required"); return; }
    setCreating(true);
    try {
      await collectiveAnnouncementAPI.create(form);
      toast.success("Announcement published!", { title: "Published" });
      setShowModal(false);
      setForm({ title: "", body: "", targetCrops: [] });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish announcement");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = () => { 
    // Mock delete since API doesn't support it yet
    setAnnouncements(prev => prev.filter(a => a._id !== deleteId)); 
    toast.info("Announcement deleted locally."); 
    setDeleteId(null); 
  };

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            Announcements
          </h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {announcements.length} published announcements
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold cursor-pointer shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
        >
          <Icon icon="ph:megaphone-fill" className="w-4 h-4" />New Announcement
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-10 h-10 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState 
          icon="ph:megaphone-fill" 
          title="No announcements" 
          description="Create your first announcement to notify farmer groups." 
          size="lg"
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {announcements.map((a, i) => (
            <motion.div 
              key={a._id} 
              initial={{ opacity: 0, y: 16 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }} 
              className={`relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl ${
                isDark ? "bg-slate-900/60 border-slate-800/60 shadow-xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-lg shadow-slate-200/50"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    isDark ? "bg-violet-500/20 text-violet-400" : "bg-violet-50 text-violet-600"
                  }`}>
                    <Icon icon="ph:megaphone-fill" className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>{a.title}</h3>
                    <p className={`text-xs mt-1.5 flex items-center gap-1.5 font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <Icon icon="ph:calendar-blank-fill" className="w-3.5 h-3.5" />
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setDeleteId(a._id)} 
                  className={`p-2 rounded-xl flex-shrink-0 transition-colors ${
                    isDark ? "hover:bg-red-500/20 text-slate-500 hover:text-red-400" : "hover:bg-red-50 text-slate-400 hover:text-red-500"
                  }`}
                >
                  <Icon icon="ph:trash-fill" className="w-4 h-4" />
                </button>
              </div>

              <div className={`p-4 rounded-xl mb-4 ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  {a.body}
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto">
                {a.targetCrops && a.targetCrops.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Tags:</span>
                    {a.targetCrops.map(c => (
                      <span key={c._id || c} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                        {c.name || "Crop"}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>General Update</span>
                )}
                
                <span className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                  <Icon icon="ph:eye-fill" className="w-4 h-4" />
                  {a.readBy?.length || 0} views
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className={`relative w-full max-w-lg rounded-3xl border p-6 sm:p-8 shadow-2xl z-10 ${
                isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                  <Icon icon="ph:megaphone-fill" className="w-5 h-5" />
                </div>
                <h3 className={`font-bold text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>New Announcement</h3>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={`text-sm font-semibold mb-2 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Title *</label>
                  <input 
                    value={form.title} 
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} 
                    placeholder="e.g. Price update for Rajma season" 
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
                      isDark ? "bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    }`} 
                  />
                </div>
                
                <div>
                  <label className={`text-sm font-semibold mb-2 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Target Crops (Optional)</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-2 pb-2">
                    {crops.map(c => (
                      <button 
                        key={c._id} 
                        type="button" 
                        onClick={() => toggleCrop(c._id)} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer flex items-center gap-1.5 ${
                          form.targetCrops.includes(c._id) 
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-md" 
                            : isDark ? "border-slate-700 text-slate-400 hover:border-slate-500 bg-slate-800/50" : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"
                        }`}
                      >
                        {form.targetCrops.includes(c._id) && <Icon icon="ph:check-bold" className="w-3 h-3" />}
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Select specific crops this announcement applies to, or leave empty for general broadcast.</p>
                </div>

                <div>
                  <label className={`text-sm font-semibold mb-2 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Content *</label>
                  <textarea 
                    value={form.body} 
                    onChange={e => setForm(p => ({ ...p, body: e.target.value }))} 
                    placeholder="Write your announcement message here..." 
                    rows={5} 
                    className={`w-full rounded-xl border text-sm p-4 outline-none resize-none transition-all ${
                      isDark ? "bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    }`} 
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => setShowModal(false)} 
                  className={`flex-1 py-3.5 rounded-xl text-sm font-semibold border cursor-pointer transition-colors ${
                    isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate} 
                  disabled={creating} 
                  className="flex-1 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer flex items-center justify-center gap-2 hover:from-emerald-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {creating ? <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-5 h-5" /> : <Icon icon="ph:paper-plane-right-fill" className="w-4 h-4" />}
                  Publish Announcement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Delete announcement?" 
        description="This action will remove the announcement from farmers' views. This cannot be undone." 
        confirmLabel="Delete" 
        variant="danger" 
        icon="ph:trash-fill" 
      />
    </div>
  );
};

export default Announcements;
