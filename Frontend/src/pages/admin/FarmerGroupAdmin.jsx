import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const BASE = "http://localhost:5000/api/admin";

const FarmerGroupAdmin = () => {
  const { isDark } = useTheme();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    leadfarmer: "",
    email: "",
    phone: "",
    desc: ""
  });

  const fetchGroups = () => {
    setLoading(true);
    fetch(`${BASE}/farmer-groups`)
      .then((r) => r.json())
      .then((data) => setGroups(data))
      .catch((err) => console.error("Failed to load farmer groups:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleOpenModal = (group = null) => {
    if (group) {
      setEditingId(group.id);
      setFormData({
        name: group.groupName || "",
        leadfarmer: group.leadFarmer || "",
        email: group.email || "",
        phone: group.phone || "",
        desc: group.desc || ""
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", leadfarmer: "", email: "", phone: "", desc: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const url = editingId ? `${BASE}/farmer-groups/${editingId}` : `${BASE}/farmer-groups`;
    const method = editingId ? "PATCH" : "POST";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchGroups();
      } else {
        console.error("Failed to save");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      const res = await fetch(`${BASE}/farmer-groups/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchGroups();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && groups.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading farmer groups…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Farmer Groups</h1>
          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {groups.length} registered groups · Live from Database
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Icon icon="ph:plus-bold" className="w-4 h-4 mr-2" /> Add Group
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {groups.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`relative rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
          >
            {/* Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => handleOpenModal(g)} className={`p-1.5 rounded-md ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                <Icon icon="ph:pencil-simple-fill" className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(g.id)} className={`p-1.5 rounded-md ${isDark ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'}`}>
                <Icon icon="ph:trash-fill" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start gap-3 mb-3 pr-16">
              {g.profilePhoto ? (
                <img src={g.profilePhoto} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
              ) : (
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                  {g.groupName?.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>{g.groupName}</p>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{g.leadFarmer} · {g.numberOfFarmers} farmers</p>
              </div>
            </div>

            {/* Crop tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {(g.crops || []).map((c) => (
                <span
                  key={c}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}
                >
                  {c}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: "Zone", val: g.zone?.split("·")[0]?.trim() || "—" },
                { label: "Yield", val: g.yield },
                { label: "Collective", val: g.collective?.split(" ")[0] || "—" },
                { label: "Rating", val: `★ ${g.rating}` },
              ].map((d) => (
                <div key={d.label} className={`p-2 rounded-lg ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                  <p className={`${isDark ? "text-slate-500" : "text-slate-400"}`}>{d.label}</p>
                  <p className={`font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{d.val}</p>
                </div>
              ))}
            </div>

            <div className={`mt-3 pt-3 border-t text-xs flex justify-between items-center ${isDark ? "border-slate-800 text-slate-500" : "border-slate-100 text-slate-400"}`}>
              <span className="flex items-center gap-1">
                <Icon icon="ph:envelope-simple-fill" className="w-3 h-3" />
                {g.email}
              </span>
              <StatusBadge status={g.status} size="sm" />
            </div>
          </motion.div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit Farmer Group" : "Add Farmer Group"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave}>
              {editingId ? "Save Changes" : "Create Group"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input 
            label="Group Name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            placeholder="e.g. Mandal Valley Growers"
          />
          <Input 
            label="Lead Farmer" 
            value={formData.leadfarmer} 
            onChange={(e) => setFormData({...formData, leadfarmer: e.target.value})} 
            placeholder="e.g. Anita Rawat"
          />
          <Input 
            label="Email Address" 
            type="email"
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            placeholder="e.g. anita@mandalgrowers.in"
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
            placeholder="Brief description of the group"
          />
        </div>
      </Modal>
    </div>
  );
};

export default FarmerGroupAdmin;
