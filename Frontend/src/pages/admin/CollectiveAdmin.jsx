import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const BASE = "http://localhost:5000/api/admin";

const CollectiveAdmin = () => {
  const { isDark } = useTheme();
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    desc: ""
  });

  const fetchCollectives = () => {
    setLoading(true);
    fetch(`${BASE}/collectives`)
      .then((r) => r.json())
      .then((data) => setCollectives(data))
      .catch((err) => console.error("Failed to load collectives:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCollectives();
  }, []);

  const handleOpenModal = (collective = null) => {
    if (collective) {
      setEditingId(collective.id);
      setFormData({
        name: collective.name || "",
        email: collective.email || "",
        phone: collective.phone || "",
        desc: collective.desc || ""
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", email: "", phone: "", desc: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const url = editingId ? `${BASE}/collectives/${editingId}` : `${BASE}/collectives`;
    const method = editingId ? "PATCH" : "POST";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchCollectives();
      } else {
        console.error("Failed to save");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this collective?")) return;
    try {
      const res = await fetch(`${BASE}/collectives/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCollectives();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && collectives.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading collectives…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Collectives</h1>
          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {collectives.length} collectives · Live from Database
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Icon icon="ph:plus-bold" className="w-4 h-4 mr-2" /> Add Collective
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {collectives.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
          >
            {/* Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => handleOpenModal(c)} className={`p-1.5 rounded-md ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                <Icon icon="ph:pencil-simple-fill" className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(c.id)} className={`p-1.5 rounded-md ${isDark ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'}`}>
                <Icon icon="ph:trash-fill" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start gap-3 mb-4 pr-16">
              {c.profilePhoto ? (
                <img src={c.profilePhoto} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
              ) : (
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                  {c.name?.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{c.name}</p>
                  {c.isVerified && <Icon icon="ph:seal-check-fill" className="w-4 h-4 text-blue-400 shrink-0" />}
                </div>
                <p className={`text-xs flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                   <Icon icon="ph:envelope-simple-fill" className="w-3 h-3" />
                   {c.email}
                </p>
              </div>
            </div>

            {c.desc && (
              <p className={`text-xs mb-3 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {c.desc.length > 80 ? c.desc.slice(0, 80) + "…" : c.desc}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              {[
                { label: "Groups", val: c.farmerGroups },
                { label: "Workers", val: c.workers },
                { label: "Harvest", val: c.totalHarvest },
                { label: "Rating", val: `★ ${c.rating}` },
              ].map((d) => (
                <div key={d.label} className={`p-2 rounded-lg ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                  <p className={isDark ? "text-slate-500" : "text-slate-400"}>{d.label}</p>
                  <p className={`font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{d.val}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1">
              {(c.zones || []).map((z) => (
                <span
                  key={z}
                  className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}
                >
                  {z}
                </span>
              ))}
            </div>

            <div className={`mt-3 pt-3 border-t text-xs ${isDark ? "border-slate-800 text-slate-500" : "border-slate-100 text-slate-400"}`}>
              Est. {c.established} · {c.reviews} reviews
            </div>
          </motion.div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit Collective" : "Add Collective"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>
              {editingId ? "Save Changes" : "Create Collective"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input 
            label="Collective Name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            placeholder="e.g. Mandakini Organic Collective"
          />
          <Input 
            label="Email Address" 
            type="email"
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            placeholder="e.g. hello@mandakini.org"
          />
          <Input 
            label="Phone Number" 
            value={formData.phone} 
            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
            placeholder="e.g. 9876543210"
          />
          <Input 
            label="Description" 
            value={formData.desc} 
            onChange={(e) => setFormData({...formData, desc: e.target.value})} 
            placeholder="Brief description of the collective"
          />
        </div>
      </Modal>
    </div>
  );
};

export default CollectiveAdmin;
