import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { announcementsData } from "../../utils/InterfaceData";
import { useToast } from "../../components/ui";
import ConfirmModal from "../../components/common/ConfirmModal";
import EmptyState from "../../components/common/EmptyState";

const Announcements = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState(announcementsData);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ title: "", content: "", target: "All Farmer Groups" });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.title || !form.content) { toast.error("Title and content are required"); return; }
    setCreating(true);
    await new Promise(r => setTimeout(r, 700));
    setAnnouncements(prev => [{
      id: `ann_${Date.now()}`,
      ...form,
      author: "You",
      createdAt: new Date().toISOString().split("T")[0],
      readCount: 0,
      totalRecipients: 14,
      pinned: false,
    }, ...prev]);
    toast.success("Announcement published!", { title: "Published" });
    setShowModal(false);
    setForm({ title: "", content: "", target: "All Farmer Groups" });
    setCreating(false);
  };

  const togglePin = (id) => setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a).sort((a, b) => b.pinned - a.pinned));
  const handleDelete = () => { setAnnouncements(prev => prev.filter(a => a.id !== deleteId)); toast.info("Announcement deleted."); setDeleteId(null); };

  const TARGETS = ["All Farmer Groups", "Zone A", "Zone B", "Zone C", "Zone D"];

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Announcements</h1>
          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{announcements.length} announcements</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium cursor-pointer shadow-lg shadow-emerald-500/20">
          <Icon icon="ph:megaphone-fill" className="w-4 h-4" />New Announcement
        </button>
      </div>

      {announcements.length === 0 ? <EmptyState icon="ph:megaphone-fill" title="No announcements" description="Create your first announcement to notify farmer groups." /> : (
        <div className="max-w-3xl space-y-4">
          {announcements.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-2xl border p-5 ${a.pinned ? isDark ? "border-amber-500/30 bg-amber-500/5" : "border-amber-200 bg-amber-50" : isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.pinned && <Icon icon="ph:push-pin-fill" className="w-4 h-4 text-amber-400 shrink-0" />}
                  <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{a.title}</h3>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => togglePin(a.id)} title={a.pinned ? "Unpin" : "Pin"} className={`p-1.5 rounded-lg cursor-pointer ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"} ${a.pinned ? "text-amber-400!" : ""}`}><Icon icon={a.pinned ? "ph:push-pin-slash-fill" : "ph:push-pin-fill"} className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(a.id)} className={`p-1.5 rounded-lg cursor-pointer ${isDark ? "hover:bg-red-500/10 text-slate-400 hover:text-red-400" : "hover:bg-red-50 text-slate-400 hover:text-red-500"}`}><Icon icon="ph:trash-fill" className="w-4 h-4" /></button>
                </div>
              </div>
              <p className={`text-sm leading-relaxed mb-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{a.content}</p>
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}><Icon icon="ph:users-three-fill" className="w-3 h-3" />{a.target}</span>
                  <span className={`flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}><Icon icon="ph:eye-fill" className="w-3 h-3" />{a.readCount}/{a.totalRecipients} read</span>
                </div>
                <span className={isDark ? "text-slate-600" : "text-slate-300"}>{a.author} · {a.createdAt}</span>
              </div>
              {/* Read progress bar */}
              <div className={`mt-3 h-1.5 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(a.readCount / a.totalRecipients) * 100}%` }} />
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
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} className={`relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl z-10 ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
              <h3 className={`font-bold text-xl mb-5 ${isDark ? "text-white" : "text-slate-900"}`}>New Announcement</h3>
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Title *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Price update for Rajma season" className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`} />
                </div>
                <div>
                  <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Target Audience</label>
                  <div className="flex flex-wrap gap-2">
                    {TARGETS.map(t => <button key={t} type="button" onClick={() => setForm(p => ({ ...p, target: t }))} className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer ${form.target === t ? "bg-emerald-500 border-emerald-500 text-white" : isDark ? "border-slate-700 text-slate-400 hover:border-slate-500" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>{t}</button>)}
                  </div>
                </div>
                <div>
                  <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Content *</label>
                  <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Write your announcement here…" rows={5} className={`w-full rounded-xl border text-sm p-3 outline-none resize-none ${isDark ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`} />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm border cursor-pointer ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>Cancel</button>
                <button onClick={handleCreate} disabled={creating} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer flex items-center justify-center gap-2 ${creating ? "opacity-70" : ""}`}>
                  {creating && <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />}
                  <Icon icon="ph:megaphone-fill" className="w-4 h-4" />
                  Publish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete announcement?" description="This cannot be undone." confirmLabel="Delete" variant="danger" icon="ph:trash-fill" />
    </div>
  );
};

export default Announcements;
