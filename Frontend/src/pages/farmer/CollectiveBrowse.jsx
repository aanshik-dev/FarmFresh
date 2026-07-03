import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { collectivesList, CROPS_MASTER, farmerCropsData } from "../../utils/InterfaceData";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/ui";

const CollectiveBrowse = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCollective, setSelectedCollective] = useState(null);
  const [membershipCrop, setMembershipCrop] = useState("");
  const [membershipNote, setMembershipNote] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [memberships, setMemberships] = useState([
    { collectiveId: "col_001", crop: "rajma", status: "approved", date: "2026-06-15" },
  ]);

  const myCropIds = farmerCropsData.filter(c => c.status !== "out_of_season").map(c => c.id.toLowerCase());
  const myCropsLinked = farmerCropsData.filter(c => c.collective).map(c => c.name.toLowerCase());

  const filtered = collectivesList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase()) ||
    c.crops.some(cr => cr.name.toLowerCase().includes(search.toLowerCase()))
  );

  const getMemberStatus = (collectiveId) => memberships.find(m => m.collectiveId === collectiveId);

  const handleRequest = async () => {
    if (!membershipCrop) { toast.error("Please select a crop"); return; }
    setRequesting(true);
    await new Promise(r => setTimeout(r, 1000));
    setMemberships(prev => [...prev, { collectiveId: selectedCollective.id, crop: membershipCrop, status: "pending", date: new Date().toISOString().split("T")[0] }]);
    toast.success(`Membership request sent to ${selectedCollective.name}!`, { title: "Request Sent" });
    setSelectedCollective(null);
    setMembershipCrop("");
    setMembershipNote("");
    setRequesting(false);
  };

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Collectives</h1>
        <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Browse and join collectives for your crops</p>
      </div>

      {/* My memberships */}
      {memberships.length > 0 && (
        <div className={`rounded-2xl border p-5 mb-6 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>My Memberships</h2>
          <div className="flex flex-wrap gap-2">
            {memberships.map((m, i) => {
              const coll = collectivesList.find(c => c.id === m.collectiveId);
              return (
                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <Icon icon="ph:buildings-fill" className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className={`text-xs font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{coll?.name}</p>
                    <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{m.crop} · {m.date}</p>
                  </div>
                  <StatusBadge status={m.status} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Icon icon="ph:magnifying-glass-fill" className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
        <input
          type="text"
          placeholder="Search by name, crop, or location…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 ${isDark ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`}
        />
      </div>

      {/* Collective cards */}
      {filtered.length === 0 ? (
        <EmptyState icon="ph:buildings-fill" title="No collectives found" description="Try a different search term." />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(coll => {
            const memberStatus = getMemberStatus(coll.id);
            return (
              <motion.div
                key={coll.id}
                whileHover={{ y: -3 }}
                className={`rounded-2xl border overflow-hidden transition-all ${isDark ? "bg-slate-900/60 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:shadow-md"}`}
              >
                {/* Header */}
                <div className="relative h-24 bg-gradient-to-br from-emerald-600 to-teal-700 flex items-end p-4">
                  {coll.isVerified && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                      <Icon icon="ph:seal-check-fill" className="w-3 h-3" />
                      Verified
                    </div>
                  )}
                  <img
                    src={coll.profilePhoto}
                    alt={coll.name}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-white/50 shadow-lg"
                  />
                </div>

                <div className="p-5">
                  <h3 className={`font-bold text-base mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{coll.name}</h3>
                  <p className={`text-xs mb-3 flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    <Icon icon="ph:map-pin-fill" className="w-3 h-3" />{coll.address}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon key={i} icon={i < Math.floor(coll.rating) ? "ph:star-fill" : "ph:star"} className={`w-3.5 h-3.5 ${i < Math.floor(coll.rating) ? "text-amber-400" : isDark ? "text-slate-600" : "text-slate-300"}`} />
                    ))}
                    <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{coll.rating} ({coll.reviews})</span>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-2 mb-3">
                    {[
                      { icon: "ph:users-three-fill", val: `${coll.farmerGroups} Groups` },
                      { icon: "ph:person-fill", val: `${coll.workers} Workers` },
                      { icon: "ph:package-fill", val: coll.totalHarvest },
                    ].map(s => (
                      <div key={s.val} className={`flex-1 flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                        <Icon icon={s.icon} className="w-3 h-3 shrink-0" />
                        <span className="truncate">{s.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Crops */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {coll.crops.map(cr => (
                      <span key={cr.name} className={`text-[10px] px-2 py-0.5 rounded-full border ${isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                        {cr.name} · ₹{cr.pricePerKg}/kg
                      </span>
                    ))}
                  </div>

                  {/* Action */}
                  {memberStatus ? (
                    <div className={`flex items-center gap-2 py-2 rounded-xl text-xs font-medium justify-center ${memberStatus.status === "approved" ? isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700" : isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-700"}`}>
                      <Icon icon={memberStatus.status === "approved" ? "ph:check-circle-fill" : "ph:clock-fill"} className="w-4 h-4" />
                      {memberStatus.status === "approved" ? "Member" : "Request Pending"}
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedCollective(coll)}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer hover:from-emerald-400 hover:to-emerald-500 transition-all"
                    >
                      <Icon icon="ph:handshake-fill" className="w-3.5 h-3.5 inline mr-1" />
                      Request Membership
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Membership request modal */}
      <AnimatePresence>
        {selectedCollective && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCollective(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl z-10 ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Request Membership</h3>
                <button onClick={() => setSelectedCollective(null)} className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
                  <Icon icon="material-symbols:close-rounded" className="w-4 h-4" />
                </button>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                <img src={selectedCollective.profilePhoto} alt="" className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{selectedCollective.name}</p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{selectedCollective.address}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Which crop for this membership? *</label>
                <div className="flex flex-wrap gap-2">
                  {farmerCropsData.filter(c => c.status !== "out_of_season" && !c.collective).map(crop => {
                    const isHandled = selectedCollective.crops.some(c => c.name.toLowerCase() === crop.name.toLowerCase());
                    return (
                      <button
                        key={crop.id}
                        type="button"
                        disabled={!isHandled}
                        onClick={() => setMembershipCrop(crop.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-all ${
                          membershipCrop === crop.id ? "bg-emerald-500 border-emerald-500 text-white" :
                          !isHandled ? isDark ? "border-slate-800 text-slate-600 cursor-not-allowed" : "border-slate-100 text-slate-300 cursor-not-allowed" :
                          isDark ? "border-slate-700 text-slate-400 hover:border-slate-500" : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {crop.name}{!isHandled && " (not handled)"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-5">
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Note (optional)</label>
                <textarea value={membershipNote} onChange={e => setMembershipNote(e.target.value)} placeholder="Any special details for the collective…" rows={2} className={`w-full rounded-xl border text-sm p-3 outline-none resize-none ${isDark ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`} />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setSelectedCollective(null)} className={`flex-1 py-2.5 rounded-xl text-sm border cursor-pointer ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>Cancel</button>
                <button onClick={handleRequest} disabled={requesting || !membershipCrop} className={`flex-1 py-2.5 rounded-xl text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 ${(requesting || !membershipCrop) ? "opacity-60 cursor-not-allowed" : ""}`}>
                  {requesting && <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />}
                  Send Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollectiveBrowse;
