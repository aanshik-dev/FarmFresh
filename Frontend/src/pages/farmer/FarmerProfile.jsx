import React, { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui";
import { Button, Input } from "../../components/ui";
import { CROPS_MASTER, farmerCropsData, collectivesList } from "../../utils/InterfaceData";
import StatusBadge from "../../components/common/StatusBadge";

const FarmerProfile = () => {
  const { isDark } = useTheme();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [description, setDescription] = useState(user?.description || "Something about this farmer group and their farming practices.");
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedCollective, setSelectedCollective] = useState("");

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    updateUser({ name, phone, address, description });
    toast.success("Profile updated!");
    setEditing(false);
    setSaving(false);
  };

  const handleSubmitReview = () => {
    if (!rating || !reviewText || !selectedCollective) { toast.error("Fill all review fields"); return; }
    toast.success("Review submitted!", { title: "Thank you!" });
    setRating(0);
    setReviewText("");
    setSelectedCollective("");
  };

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile card */}
        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          {/* Banner */}
          <div className="h-28 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px) 0 0 / 30px 30px" }} />
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4 flex-wrap gap-3">
              {/* Avatar */}
              <div className={`w-20 h-20 rounded-2xl border-4 overflow-hidden flex items-center justify-center ${isDark ? "border-slate-900 bg-emerald-800" : "border-white bg-emerald-100"}`}>
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon icon="ph:user-fill" className={`w-10 h-10 ${isDark ? "text-emerald-300" : "text-emerald-600"}`} />
                )}
              </div>

              {/* Edit button */}
              <button
                onClick={() => editing ? handleSave() : setEditing(true)}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                  editing ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20" : isDark ? "border border-slate-700 text-slate-300 hover:bg-slate-800" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {saving ? <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" /> : <Icon icon={editing ? "ph:floppy-disk-fill" : "ph:pencil-fill"} className="w-4 h-4" />}
                {editing ? (saving ? "Saving…" : "Save Changes") : "Edit Profile"}
              </button>
            </div>

            {/* Basic info */}
            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{user?.groupName || "Farmer Group"}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-100 text-emerald-700"}`}>
                  <Icon icon="ph:plant-fill" className="w-3 h-3 inline mr-0.5" />Farmer Group
                </span>
              </div>
              <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <Icon icon="ph:user-fill" className="w-3.5 h-3.5 inline mr-1" />Lead: {user?.leadFarmerName || "—"} · {user?.numberOfFarmers} farmers
              </p>
            </div>

            {/* Editable fields */}
            {editing ? (
              <div className="space-y-4">
                <Input label="Name" value={name} onChange={e => setName(e.target.value)} icon="ph:user-fill" />
                <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} icon="ph:phone-fill" />
                <Input label="Address" value={address} onChange={e => setAddress(e.target.value)} icon="ph:map-pin-fill" />
                <div>
                  <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`w-full rounded-xl border text-sm p-3 outline-none resize-none ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"}`} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
                  <Button variant="primary" onClick={handleSave} loading={saving} className="flex-1">Save</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{description}</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  {user?.phone && <span className={`flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}><Icon icon="ph:phone-fill" className="w-4 h-4" />{user.phone}</span>}
                  {user?.address && <span className={`flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}><Icon icon="ph:map-pin-fill" className="w-4 h-4" />{user.address}</span>}
                  {user?.email && <span className={`flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}><Icon icon="ph:envelope-fill" className="w-4 h-4" />{user.email}</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Crops */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>My Crops</h2>
          <div className="flex flex-wrap gap-2">
            {farmerCropsData.map(crop => (
              <div key={crop.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                <Icon icon="ph:plant-fill" className="w-4 h-4 text-emerald-500" />
                <span className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{crop.name}</span>
                <StatusBadge status={crop.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Rate & Review */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Rate a Collective</h2>
          <div className="space-y-4">
            <div>
              <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Select Collective</label>
              <select value={selectedCollective} onChange={e => setSelectedCollective(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                <option value="">Choose a collective…</option>
                {collectivesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Rating</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setRating(n)} className="cursor-pointer">
                    <Icon icon={n <= rating ? "ph:star-fill" : "ph:star"} className={`w-7 h-7 transition-colors ${n <= rating ? "text-amber-400" : isDark ? "text-slate-600 hover:text-amber-300" : "text-slate-300 hover:text-amber-400"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Your Review</label>
              <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience with this collective…" rows={3} className={`w-full rounded-xl border text-sm p-3 outline-none resize-none ${isDark ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`} />
            </div>
            <Button variant="secondary" onClick={handleSubmitReview} icon="ph:star-fill" className="w-full">Submit Review</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerProfile;
