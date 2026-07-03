import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { farmerGroups, membershipRequests } from "../../utils/InterfaceData";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { useToast, Input } from "../../components/ui";

const FarmerGroupManagement = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [tab, setTab] = useState("members"); // members | requests
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalZone, setApprovalZone] = useState("");
  const [approvalRate, setApprovalRate] = useState("");
  const [processing, setProcessing] = useState(false);
  const [requests, setRequests] = useState(membershipRequests);
  const [sendingStatus, setSendingStatus] = useState(null);
  const [search, setSearch] = useState("");

  const pending = requests.filter(r => r.status === "pending");
  const filtered = farmerGroups.filter(g =>
    g.groupName.toLowerCase().includes(search.toLowerCase()) ||
    g.leadFarmer.toLowerCase().includes(search.toLowerCase())
  );

  const handleApprove = async () => {
    if (!approvalZone) { toast.error("Select a zone"); return; }
    setProcessing(true);
    await new Promise(r => setTimeout(r, 900));
    setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: "approved", zone: approvalZone, rate: approvalRate } : r));
    toast.success(`Membership approved for ${selectedRequest.farmerGroup}!`, { title: "Approved" });
    setSelectedRequest(null);
    setApprovalZone("");
    setApprovalRate("");
    setProcessing(false);
  };

  const handleReject = async (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
    toast.info("Membership request rejected.");
  };

  const handleRequestStatus = async (groupId) => {
    setSendingStatus(groupId);
    await new Promise(r => setTimeout(r, 600));
    toast.success("Status update request sent to farmer group!", { title: "Sent" });
    setSendingStatus(null);
  };

  const ZONES = ["Zone A", "Zone B", "Zone C", "Zone D"];

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Farmer Groups</h1>
          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{farmerGroups.length} associated groups</p>
        </div>
        {pending.length > 0 && <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25"><Icon icon="ph:clock-fill" className="w-3.5 h-3.5" />{pending.length} pending request{pending.length > 1 ? "s" : ""}</span>}
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl mb-6 w-fit ${isDark ? "bg-slate-800/70" : "bg-slate-100"}`}>
        {[{ id: "members", label: "Members", count: farmerGroups.length }, { id: "requests", label: "Requests", count: pending.length }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${tab === t.id ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow" : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-white/20" : isDark ? "bg-slate-700" : "bg-slate-200"} ${t.id === "requests" && t.count > 0 ? "bg-amber-500 text-white!" : ""}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Members tab */}
      {tab === "members" && (
        <>
          <div className="relative mb-5">
            <Icon icon="ph:magnifying-glass-fill" className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
            <input type="text" placeholder="Search groups…" value={search} onChange={e => setSearch(e.target.value)} className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none ${isDark ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`} />
          </div>
          {filtered.length === 0 ? <EmptyState icon="ph:users-three-fill" title="No groups found" /> : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(group => (
                <motion.div key={group.id} whileHover={{ y: -2 }} className={`rounded-2xl border overflow-hidden transition-all ${isDark ? "bg-slate-900/60 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:shadow-md"}`}>
                  <div className="relative h-20 bg-gradient-to-br from-emerald-700 to-teal-800">
                    <div className="absolute bottom-0 left-4 translate-y-1/2">
                      <img src={group.profilePhoto} alt="" className="w-12 h-12 rounded-xl object-cover border-2 border-white/50" />
                    </div>
                  </div>
                  <div className="px-4 pt-8 pb-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{group.groupName}</h3>
                        <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}><Icon icon="ph:user-fill" className="w-3 h-3 inline mr-0.5" />{group.leadFarmer} · {group.numberOfFarmers} farmers</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"}`}>{group.zone.split("·")[0].trim()}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {group.crops.map(c => <span key={c} className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>{c}</span>)}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequestStatus(group.id)}
                        disabled={sendingStatus === group.id}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${isDark ? "border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-400" : "border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-600"}`}
                      >
                        {sendingStatus === group.id ? <Icon icon="svg-spinners:ring-resize" className="w-3 h-3" /> : <Icon icon="ph:question-fill" className="w-3 h-3" />}
                        Request Status
                      </button>
                      <button className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${isDark ? "border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400" : "border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600"}`}>
                        <Icon icon="ph:chat-fill" className="w-3 h-3" />
                        Message
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Requests tab */}
      {tab === "requests" && (
        <div className="max-w-2xl space-y-4">
          {pending.length === 0 ? <EmptyState icon="ph:hand-fill" title="No pending requests" description="New membership requests from farmer groups will appear here." /> :
            pending.map(req => (
              <div key={req.id} className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{req.farmerGroup}</h3>
                    <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Requesting membership for: <span className="font-medium text-emerald-500">{req.crop}</span>
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      Estimated yield: {req.estimatedYield} · Requested: {req.requestDate}
                    </p>
                    {req.note && <p className={`text-xs mt-1 italic ${isDark ? "text-slate-500" : "text-slate-400"}`}>"{req.note}"</p>}
                  </div>
                  <StatusBadge status="pending" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedRequest(req)} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer hover:from-emerald-400">
                    <Icon icon="ph:check-bold" className="w-3.5 h-3.5 inline mr-1" />Approve
                  </button>
                  <button onClick={() => handleReject(req.id)} className={`flex-1 py-2 rounded-xl text-sm font-medium border cursor-pointer ${isDark ? "border-red-800/40 text-red-400 hover:bg-red-500/10" : "border-red-200 text-red-600 hover:bg-red-50"}`}>
                    <Icon icon="ph:x-bold" className="w-3.5 h-3.5 inline mr-1" />Reject
                  </button>
                </div>
              </div>
            ))
          }

          {/* Show all history too */}
          {requests.filter(r => r.status !== "pending").length > 0 && (
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Processed</p>
              {requests.filter(r => r.status !== "pending").map(req => (
                <div key={req.id} className={`rounded-2xl border p-4 mb-3 flex items-center justify-between ${isDark ? "bg-slate-900/40 border-slate-800/60" : "bg-slate-50 border-slate-200"}`}>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{req.farmerGroup} — {req.crop}</p>
                    <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{req.requestDate}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approval modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRequest(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl z-10 ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
              <h3 className={`font-bold text-lg mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Approve Membership</h3>
              <div className={`p-3 rounded-xl mb-4 ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                <p className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{selectedRequest.farmerGroup}</p>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Crop: {selectedRequest.crop} · Est. yield: {selectedRequest.estimatedYield}</p>
              </div>
              <div className="space-y-3 mb-5">
                <div>
                  <label className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Assign Zone *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ZONES.map(z => (
                      <button key={z} type="button" onClick={() => setApprovalZone(z)} className={`py-2 rounded-lg text-sm border cursor-pointer transition-all ${approvalZone === z ? "bg-emerald-500 border-emerald-500 text-white" : isDark ? "border-slate-700 text-slate-400 hover:border-slate-500" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>{z}</button>
                    ))}
                  </div>
                </div>
                <Input label="Agreed Rate (₹/kg)" type="number" placeholder="e.g. 120" value={approvalRate} onChange={e => setApprovalRate(e.target.value)} icon="ph:currency-inr-fill" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedRequest(null)} className={`flex-1 py-2.5 rounded-xl text-sm border cursor-pointer ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>Cancel</button>
                <button onClick={handleApprove} disabled={processing} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer flex items-center justify-center gap-2 ${processing ? "opacity-60" : ""}`}>
                  {processing && <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />}
                  Approve
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FarmerGroupManagement;
