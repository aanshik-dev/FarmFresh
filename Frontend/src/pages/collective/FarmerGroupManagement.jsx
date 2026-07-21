import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/ui";
import { collectiveMemberAPI, collectiveZoneAPI } from "../../services/api";

const FarmerGroupManagement = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  
  const [tab, setTab] = useState("members"); // "members" | "requests"
  const [memberData, setMemberData] = useState({ requests: [], approved: [], rejected: [], terminated: [], cancelled: [] });
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Navigation State
  const [view, setView] = useState("list"); // "list" | "form"
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [approving, setApproving] = useState(false);
  
  // Form state for approval
  const [selectedZone, setSelectedZone] = useState("");
  const [agreedPrices, setAgreedPrices] = useState({}); // { dealId: price }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [memberRes, zoneRes] = await Promise.all([
        collectiveMemberAPI.get(),
        collectiveZoneAPI.get()
      ]);
      setMemberData(memberRes.data.memberData || { requests: [], approved: [], rejected: [], terminated: [], cancelled: [] });
      setZones(zoneRes.data.zones || []);
    } catch (err) {
      toast.error("Failed to load membership data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtering members based on search
  const membersList = memberData.approved || [];
  const requestsList = memberData.requests || [];
  
  const filteredMembers = membersList.filter(f => {
    const nameStr = f.name || f.groupName || "";
    const leadStr = f.leadFarmer || "";
    const searchLower = search.toLowerCase();
    return nameStr.toLowerCase().includes(searchLower) || leadStr.toLowerCase().includes(searchLower);
  });

  const openApproveForm = (farmer) => {
    setSelectedFarmer(farmer);
    setSelectedZone(farmer.membership?.zone?._id || "");
    const initialPrices = {};
    farmer.deals.forEach(d => { initialPrices[d._id] = "" });
    setAgreedPrices(initialPrices);
    setView("form");
  };

  const handlePriceChange = (dealId, value) => {
    setAgreedPrices(p => ({ ...p, [dealId]: value }));
  };

  const handleApprove = async () => {
    // Collect crops for approval
    const crops = [];
    for (const deal of selectedFarmer.deals) {
      const price = Number(agreedPrices[deal._id]);
      if (!price || price <= 0) {
        toast.error(`Please enter a valid price for crop: ${deal.crop?.name}`);
        return;
      }
      crops.push({ dealId: deal._id, agreedPrice: price });
    }

    setApproving(true);
    try {
      // 1. Accept membership request
      await collectiveMemberAPI.accept({ farmerId: selectedFarmer._id, crops });
      
      // 2. Assign zone if a new zone was selected and it differs from existing
      if (selectedZone && selectedZone !== selectedFarmer.membership?.zone?._id) {
        await collectiveMemberAPI.assignZone(selectedFarmer.membership._id, { zoneId: selectedZone });
      }

      toast.success(`Approved membership for ${selectedFarmer.name || selectedFarmer.groupName || "Farmer Group"}!`);
      setView("list");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve membership");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (farmer) => {
    if (!window.confirm(`Are you sure you want to reject ${farmer.name || farmer.groupName || "this farmer group"}?`)) return;
    const dealIds = farmer.deals.map(d => d._id);
    try {
      await collectiveMemberAPI.reject({ dealIds });
      toast.success("Membership request rejected");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject request");
    }
  };

  const handleTerminate = async (dealId, cropName) => {
    if (!window.confirm(`Terminate partnership for ${cropName}?`)) return;
    try {
      await collectiveMemberAPI.terminate({ dealId });
      toast.success("Partnership terminated");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to terminate");
    }
  };

  // Animation variants
  const listVariants = {
    initial: { x: -50, opacity: 0 },
    enter: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { x: -50, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }
  };

  const formVariants = {
    initial: { x: 50, opacity: 0 },
    enter: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { x: 50, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }
  };

  return (
    <div className={`min-h-screen p-5 sm:p-7 overflow-x-hidden ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" variants={listVariants} initial="initial" animate="enter" exit="exit">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                  Farmer Groups
                </h1>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Manage your network of associated farmer groups
                </p>
              </div>
              {requestsList.length > 0 && (
                <span className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium">
                  <Icon icon="ph:bell-ringing-fill" className="w-4 h-4" />
                  {requestsList.length} Pending Request{requestsList.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className={`flex gap-2 p-1.5 rounded-xl mb-8 w-fit backdrop-blur-md ${isDark ? "bg-slate-900/60 border border-slate-800" : "bg-white border border-slate-200 shadow-sm"}`}>
              {[
                { id: "members", label: "Active Members", count: membersList.length }, 
                { id: "requests", label: "Pending Requests", count: requestsList.length }
              ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setTab(t.id)} 
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    tab === t.id 
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20" 
                      : isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tab === t.id ? "bg-white/25" : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-10 h-10 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
              </div>
            ) : (
              <>
                {/* Members tab */}
                {tab === "members" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="relative mb-6 max-w-md">
                      <Icon icon="ph:magnifying-glass-bold" className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input 
                        type="text" 
                        placeholder="Search farmer groups..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                          isDark 
                            ? "bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        }`} 
                      />
                    </div>
                    
                    {filteredMembers.length === 0 ? (
                      <EmptyState icon="ph:users-three-fill" title="No members found" description="You have no active farmer groups in your network." />
                    ) : (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMembers.map(farmer => (
                          <motion.div 
                            key={farmer._id} 
                            whileHover={{ y: -4 }} 
                            className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
                              isDark 
                                ? "bg-slate-900/40 border-slate-800/60 shadow-xl shadow-black/20 hover:border-emerald-500/30" 
                                : "bg-white/80 border-slate-200 shadow-lg shadow-slate-200/50 hover:border-emerald-400/50"
                            }`}
                          >
                            <div className="h-24 bg-gradient-to-br from-emerald-600 to-teal-700 relative">
                              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                              <div className="absolute -bottom-8 left-5">
                                <div className={`w-16 h-16 rounded-2xl border-4 flex items-center justify-center font-bold text-xl overflow-hidden ${
                                  isDark ? "bg-slate-800 border-slate-900 text-emerald-400" : "bg-white border-white text-emerald-600"
                                }`}>
                                  {(farmer.profile || farmer.profilePhoto) ? (
                                    <img src={farmer.profile || farmer.profilePhoto} alt={farmer.name || farmer.groupName} className="w-full h-full object-cover" />
                                  ) : (
                                    (farmer.name || farmer.groupName || "FG").substring(0,2).toUpperCase()
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="px-5 pt-10 pb-5">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-bold text-lg">{farmer.name || farmer.groupName || "Farmer Group"}</h3>
                                  <p className={`text-xs font-medium flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    <Icon icon="ph:user-bold" className="w-3.5 h-3.5" />
                                    {farmer.leadFarmer || "N/A"} · {farmer.farmerCount || farmer.numberOfFarmers || 1} farmers
                                  </p>
                                </div>
                                {farmer.membership?.zone?.name && (
                                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                                    isDark ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-600 border border-blue-200"
                                  }`}>
                                    {farmer.membership.zone.name}
                                  </span>
                                )}
                              </div>
                              
                              {/* Deals Loop */}
                              <div className="space-y-2 mt-4">
                                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Partnered Crops</p>
                                {farmer.deals.map(deal => (
                                  <div key={deal._id} className={`flex items-center justify-between p-2.5 rounded-lg border ${
                                    isDark ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-100"
                                  }`}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-slate-800 text-emerald-400" : "bg-white text-emerald-600 shadow-sm"}`}>
                                        <Icon icon="ph:plant-fill" className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold">{deal.crop?.name}</p>
                                        <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Agreed: ₹{deal.agreedPrice}/kg</p>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => handleTerminate(deal._id, deal.crop?.name)}
                                      className={`p-1.5 rounded-md transition-colors ${
                                        isDark ? "hover:bg-red-500/20 text-slate-500 hover:text-red-400" : "hover:bg-red-50 text-slate-400 hover:text-red-500"
                                      }`}
                                      title="Terminate Partnership"
                                    >
                                      <Icon icon="ph:x-bold" className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Requests tab */}
                {tab === "requests" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
                    {requestsList.length === 0 ? (
                      <EmptyState icon="ph:hand-shake-fill" title="No pending requests" description="New membership requests from farmer groups will appear here." />
                    ) : (
                      <div className="space-y-4">
                        {requestsList.map(farmer => (
                          <div key={farmer._id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 rounded-2xl border backdrop-blur-xl ${
                            isDark 
                              ? "bg-slate-900/40 border-slate-800/60 shadow-xl shadow-black/20" 
                              : "bg-white/80 border-slate-200 shadow-lg shadow-slate-200/50"
                          }`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg ${
                                isDark ? "bg-slate-800 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                              }`}>
                                {farmer.profile ? (
                                  <img src={farmer.profile} alt="" className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                  (farmer.name || farmer.groupName || "FG").substring(0,2).toUpperCase()
                                )}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{farmer.name || farmer.groupName || "Farmer Group"}</h3>
                                <div className={`flex flex-wrap gap-1.5 mt-1.5`}>
                                  {farmer.deals.map(d => (
                                    <span key={d._id} className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                                      isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                                    }`}>
                                      {d.crop?.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button 
                                onClick={() => handleReject(farmer)}
                                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                                  isDark ? "border-red-900/30 text-red-400 hover:bg-red-900/20" : "border-red-200 text-red-500 hover:bg-red-50"
                                }`}
                              >
                                Reject
                              </button>
                              <button 
                                onClick={() => openApproveForm(farmer)}
                                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all"
                              >
                                Review & Approve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div key="form" variants={formVariants} initial="initial" animate="enter" exit="exit" className="max-w-3xl mx-auto">
            <button 
              onClick={() => setView("list")}
              className={`mb-6 flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors ${
                isDark ? "text-slate-400 hover:text-emerald-400" : "text-slate-500 hover:text-emerald-600"
              }`}
            >
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
              Back to Memberships
            </button>

            <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl ${
              isDark ? "bg-slate-900/50 border-slate-800/60 shadow-2xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50"
            }`}>
              <h2 className="text-2xl font-bold mb-2">
                Approve Membership
              </h2>
              <p className={`text-sm mb-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Review the request from {selectedFarmer?.groupName}. Assign a zone and negotiate prices.
              </p>

              {selectedFarmer && (
                <div className="space-y-6">
                  {/* Zone Assignment */}
                  <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Icon icon="ph:map-pin-bold" className="w-4 h-4 text-emerald-500" />
                      Assign Zone
                    </h4>
                    {zones.length === 0 ? (
                      <p className={`text-sm ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                        No zones available. Create zones first in Zone Management.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {zones.map(z => (
                          <button
                            key={z._id}
                            onClick={() => setSelectedZone(z._id)}
                            className={`py-3 px-4 text-left rounded-lg text-sm border font-medium transition-all ${
                              selectedZone === z._id
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                                : isDark
                                  ? "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500"
                                  : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300"
                            }`}
                          >
                            {z.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Set Prices for Crops */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Icon icon="ph:coins-bold" className="w-4 h-4 text-amber-500" />
                      Set Agreed Rates
                    </h4>
                    <div className="space-y-3">
                      {selectedFarmer.deals.map(deal => (
                        <div key={deal._id} className={`p-5 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-700" : "bg-white border-slate-200"}`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-sm">{deal.crop?.name}</span>
                            <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Requested</span>
                          </div>
                          <div className="relative">
                            <Icon icon="ph:currency-inr-bold" className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                            <input
                              type="number"
                              placeholder="Price per kg"
                              value={agreedPrices[deal._id] || ""}
                              onChange={(e) => handlePriceChange(deal._id, e.target.value)}
                              className={`w-full pl-9 pr-4 py-3 rounded-lg border text-sm outline-none transition-all ${
                                isDark 
                                  ? "bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500" 
                                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6 mt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setView("list")}
                      className={`flex-1 py-3.5 rounded-xl text-sm font-semibold border transition-colors ${
                        isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={approving || !selectedZone}
                      className="flex-1 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {approving ? <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-5 h-5" /> : <Icon icon="ph:check-bold" className="w-4 h-4" />}
                      Approve & Connect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FarmerGroupManagement;
