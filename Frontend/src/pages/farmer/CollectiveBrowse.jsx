import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { commonAPI, farmerMemberAPI, farmerCropAPI } from "../../services/api";

const formatAddress = (addr) => {
  if (!addr) return "No address provided";
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    const parts = [addr.locality, addr.area, addr.town, addr.district, addr.state].filter(Boolean);
    return parts.join(", ") || "No address provided";
  }
  return "No address provided";
};

const CollectiveBrowse = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [collectives, setCollectives] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [myCrops, setMyCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCollective, setSelectedCollective] = useState(null);
  const [membershipCrop, setMembershipCrop] = useState("");
  const [membershipNote, setMembershipNote] = useState("");
  const [requesting, setRequesting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [colRes, memRes, cropRes] = await Promise.all([
        commonAPI.getCollectives(),
        farmerMemberAPI.get(),
        farmerCropAPI.get()
      ]);
      setCollectives(colRes.data.collectives || []);
      setMemberships(memRes.data.memberships || []);
      setMyCrops(cropRes.data.crops || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load collectives");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Frontend search filter
  const filteredCollectives = collectives.filter(c => {
    const searchLower = search.toLowerCase();
    const cName = c.collectiveName || c.name || "";
    const cAddress = formatAddress(c.address);
    const hasMatchName = cName.toLowerCase().includes(searchLower);
    const hasMatchAddress = cAddress.toLowerCase().includes(searchLower);
    const hasMatchCrops = c.crops?.some(cr => cr?.name?.toLowerCase().includes(searchLower)) || 
                          c.handledCrops?.some(cr => cr?.name?.toLowerCase().includes(searchLower));
    
    return hasMatchName || hasMatchAddress || hasMatchCrops;
  });

  const handleRequest = async () => {
    if (!membershipCrop) { toast.error("Please select a crop"); return; }
    setRequesting(true);
    try {
      await farmerMemberAPI.sendRequest({
        collectiveId: selectedCollective._id,
        cropId: membershipCrop
      });
      toast.success(`Membership request sent to ${selectedCollective.name}!`);
      setSelectedCollective(null);
      setMembershipCrop("");
      setMembershipNote("");
      fetchData(); // Refresh memberships
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">Collectives</h1>
        <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Browse and join collectives for your crops</p>
      </div>

      {/* My memberships */}
      {memberships.length > 0 && (
        <div className={`rounded-2xl border p-5 mb-8 backdrop-blur-xl ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white/80 border-slate-200"}`}>
          <h2 className={`font-bold text-lg mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>My Active Requests & Deals</h2>
          <div className="flex flex-wrap gap-3">
            {memberships.map((m) => {
              // Extract unique collectives from deals or top level if populated
              const deals = m.crops || [];
              return deals.map((deal) => (
                <div key={deal._id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                    <Icon icon="ph:buildings-fill" className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{m.collective?.collectiveName || m.collective?.name || "Collective"}</p>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Crop: {deal.crop?.name || "—"}</p>
                  </div>
                  <div className="ml-2">
                    <StatusBadge status={(deal.status || "UNKNOWN").toLowerCase()} size="sm" />
                  </div>
                </div>
              ));
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6 max-w-2xl">
        <Icon icon="ph:magnifying-glass-fill" className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
        <input
          type="text"
          placeholder="Search by name, crop, or location…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`w-full pl-12 pr-4 py-3.5 rounded-xl border text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 ${isDark ? "bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`}
        />
      </div>

      {/* Collective cards */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-10 h-10 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
        </div>
      ) : filteredCollectives.length === 0 ? (
        <EmptyState icon="ph:buildings-fill" title="No collectives found" description="Try a different search term or check back later." />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCollectives.map((coll, i) => {
            return (
              <motion.div
                key={coll._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className={`flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 ${isDark ? "bg-slate-900/60 border-slate-800 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)]" : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xl hover:shadow-slate-200/50"}`}
              >
                {/* Header */}
                <div className="relative h-28 bg-gradient-to-br from-emerald-600 to-teal-700 flex items-end p-5">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                    <Icon icon="ph:seal-check-fill" className="w-3.5 h-3.5 text-white" />
                    Verified
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shadow-lg border-2 border-white/50 text-2xl font-bold text-emerald-600 overflow-hidden">
                    {coll.profilePhoto ? <img src={coll.profilePhoto} alt={coll.collectiveName || coll.name} className="w-full h-full object-cover" /> : (coll.collectiveName || coll.name || "?").charAt(0)}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className={`font-bold text-xl mb-1 truncate ${isDark ? "text-white" : "text-slate-900"}`}>{coll.collectiveName || coll.name || "Unknown Collective"}</h3>
                  <p className={`text-xs mb-4 flex items-center gap-1.5 truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    <Icon icon="ph:map-pin-fill" className="w-3.5 h-3.5" />{formatAddress(coll.address)}
                  </p>

                  <div className="flex gap-2 mb-4">
                    {[
                      { icon: "ph:users-three-fill", val: `${coll.farmerGroupsCount || 0} Groups` },
                      { icon: "ph:map-trifold-fill", val: `${coll.zonesCount || 0} Zones` },
                    ].map(s => (
                      <div key={s.val} className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-2 py-2 rounded-xl ${isDark ? "bg-slate-800/80 text-slate-300" : "bg-slate-50 text-slate-600"}`}>
                        <Icon icon={s.icon} className="w-4 h-4 shrink-0 text-emerald-500" />
                        <span className="truncate">{s.val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-6 flex-1">
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Handled Crops</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(coll.crops?.length > 0 || coll.handledCrops?.length > 0) ? (coll.crops || coll.handledCrops).map(cr => (
                        <span key={cr._id} className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
                          {cr.name}
                        </span>
                      )) : <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Not specified</span>}
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => setSelectedCollective(coll)}
                    className="w-full mt-auto py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    <Icon icon="ph:handshake-fill" className="w-4 h-4" />
                    Request Membership
                  </button>
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-md rounded-3xl border p-6 sm:p-8 shadow-2xl z-10 ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`font-bold text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Send Request</h3>
                <button onClick={() => setSelectedCollective(null)} className={`w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer transition-colors ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
                  <Icon icon="material-symbols:close-rounded" className="w-5 h-5" />
                </button>
              </div>

              <div className={`flex items-center gap-4 p-4 rounded-2xl mb-6 ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-xl font-bold text-emerald-600 overflow-hidden shadow-sm">
                  {selectedCollective.profilePhoto ? <img src={selectedCollective.profilePhoto} alt="" className="w-full h-full object-cover" /> : (selectedCollective.collectiveName || selectedCollective.name || "?").charAt(0)}
                </div>
                <div>
                  <p className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{selectedCollective.collectiveName || selectedCollective.name || "Unknown Collective"}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{formatAddress(selectedCollective.address)}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className={`block text-sm font-semibold mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Select your crop for this request *</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                  {myCrops.length === 0 ? (
                    <p className="text-sm text-red-500">You haven't added any crops yet. Please add crops in "My Crops" first.</p>
                  ) : myCrops.map(farmerCrop => {
                    // Check if collective handles this crop
                    const cropId = farmerCrop.crop?._id;
                    const isHandled = selectedCollective.crops?.some(c => c._id === cropId) || selectedCollective.handledCrops?.some(c => c._id === cropId);
                    
                    return (
                      <button
                        key={cropId}
                        type="button"
                        disabled={!isHandled}
                        onClick={() => setMembershipCrop(cropId)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all flex items-center gap-2 ${
                          membershipCrop === cropId 
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-md" 
                            : !isHandled 
                              ? isDark ? "border-slate-800 text-slate-600 bg-slate-900/50 cursor-not-allowed" : "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed" 
                              : isDark ? "border-slate-700 text-slate-300 hover:border-slate-500 bg-slate-800" : "border-slate-300 text-slate-600 hover:border-slate-400 bg-white"
                        }`}
                      >
                        {membershipCrop === cropId && <Icon icon="ph:check-bold" className="w-3.5 h-3.5" />}
                        {farmerCrop.crop?.name || "Unknown Crop"}
                        {!isHandled && " (Unsupported)"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-8">
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Note for Collective (optional)</label>
                <textarea 
                  value={membershipNote} 
                  onChange={e => setMembershipNote(e.target.value)} 
                  placeholder="E.g., I have 50 acres of ready-to-harvest produce..." 
                  rows={2} 
                  className={`w-full rounded-xl border text-sm p-3.5 outline-none resize-none transition-all ${isDark ? "bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"}`} 
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSelectedCollective(null)} className={`flex-1 py-3.5 rounded-xl text-sm font-semibold border cursor-pointer transition-colors ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  Cancel
                </button>
                <button 
                  onClick={handleRequest} 
                  disabled={requesting || !membershipCrop} 
                  className="flex-1 py-3.5 rounded-xl text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:shadow-none"
                >
                  {requesting ? <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-5 h-5" /> : <Icon icon="ph:paper-plane-right-fill" className="w-5 h-5" />}
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
