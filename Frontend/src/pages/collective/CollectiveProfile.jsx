import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useToast, Button, Input } from "../../components/ui";
import { collectivesList, zonesData } from "../../utils/InterfaceData";

const CollectiveProfile = () => {
  const { isDark } = useTheme();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState("Premier organic produce collective in the Kedarnath corridor, operating since 2018.");
  const [address, setAddress] = useState(user?.address || "Rudraprayag District, Uttarakhand");
  const [phone, setPhone] = useState("+91 1372 264211");
  const [saving, setSaving] = useState(false);

  const profile = collectivesList[0];

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    updateUser({ description, address, phone });
    toast.success("Profile updated!");
    setEditing(false);
    setSaving(false);
  };

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Main card */}
        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          {/* Banner */}
          <div className="h-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px) 0 0 / 30px 30px" }} />
            {profile.isVerified && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
                <Icon icon="ph:seal-check-fill" className="w-4 h-4" />Verified Collective
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4 flex-wrap gap-3">
              <div className={`w-20 h-20 rounded-2xl border-4 overflow-hidden flex items-center justify-center ${isDark ? "border-slate-900 bg-blue-900" : "border-white bg-blue-100"}`}>
                <Icon icon="ph:buildings-fill" className={`w-10 h-10 ${isDark ? "text-blue-300" : "text-blue-600"}`} />
              </div>
              <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${editing ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg" : isDark ? "border border-slate-700 text-slate-300 hover:bg-slate-800" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {saving ? <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" /> : <Icon icon={editing ? "ph:floppy-disk-fill" : "ph:pencil-fill"} className="w-4 h-4" />}
                {editing ? (saving ? "Saving…" : "Save") : "Edit Profile"}
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{user?.collectiveName || profile.name}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" : "bg-blue-100 text-blue-700"}`}>
                  <Icon icon="ph:buildings-fill" className="w-3 h-3 inline mr-0.5" />Collective
                </span>
              </div>
              <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Est. {profile.established} · {profile.workers} workers</p>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`w-full rounded-xl border text-sm p-3 outline-none resize-none ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"}`} />
                </div>
                <Input label="Address" value={address} onChange={e => setAddress(e.target.value)} icon="ph:map-pin-fill" />
                <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} icon="ph:phone-fill" />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
                  <Button variant="primary" onClick={handleSave} loading={saving} className="flex-1">Save</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {[{ icon: "ph:map-pin-fill", val: address }, { icon: "ph:phone-fill", val: phone }, { icon: "ph:envelope-fill", val: profile.email }].map(item => (
                    <span key={item.val} className={`flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}><Icon icon={item.icon} className="w-4 h-4 shrink-0" />{item.val}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Crops */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Crops & Pricing</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {profile.crops.map(crop => (
              <div key={crop.name} className={`flex items-center justify-between p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{crop.name}</span>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>₹{crop.pricePerKg}/kg</p>
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{crop.stock} kg stock</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zones */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Zones Covered</h2>
          <div className="flex flex-wrap gap-2">
            {profile.zones.map(z => {
              const zone = zonesData.find(zd => zd.name === z);
              return (
                <div key={z} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <span className="w-2 h-2 rounded-full" style={{ background: zone?.color || "#10b981" }} />
                  <span className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{z}</span>
                  {zone && <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{zone.altitude}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Farmer Groups", value: profile.farmerGroups, icon: "ph:users-three-fill", color: "text-emerald-400 bg-emerald-500/10" },
            { label: "Total Harvest", value: profile.totalHarvest, icon: "ph:scales-fill", color: "text-blue-400 bg-blue-500/10" },
            { label: "Rating", value: `${profile.rating} ★`, icon: "ph:star-fill", color: "text-amber-400 bg-amber-500/10" },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-4 text-center ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}><Icon icon={s.icon} className="w-5 h-5" /></div>
              <p className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{s.value}</p>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollectiveProfile;
