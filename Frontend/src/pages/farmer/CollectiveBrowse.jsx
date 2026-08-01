import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { commonAPI, farmerMemberAPI, farmerCropAPI } from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatAddress = (addr) => {
  if (!addr) return 'No address provided';
  if (typeof addr === 'string') return addr;
  const parts = [addr.locality, addr.area, addr.town, addr.district, addr.state].filter(Boolean);
  return parts.join(', ') || 'No address provided';
};

const shortAddr = (addr) => {
  if (!addr) return '—';
  if (typeof addr === 'string') return addr || '—';
  return [addr.town, addr.district].filter(Boolean).join(', ') || formatAddress(addr);
};

const fmtDist = (d) => {
  if (d == null || isNaN(Number(d))) return null;
  const val = Number(d);
  return val < 1 ? `${Math.round(val * 1000)} m` : `${Math.round(val)} km`;
};

// ── Collective List Row ───────────────────────────────────────────────────────
const CollRow = ({ coll, isDark, isSelected, onClick, partnerStatus }) => {
  const topCrops = (coll.crops || []).slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`group flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
        isSelected
          ? isDark ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30' : 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/20'
          : isDark ? 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700' : 'bg-white border-slate-200/80 hover:bg-slate-50'
      }`}
    >
      {/* Avatar */}
      <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700 shadow-md">
        {coll.profile ? (
          <img src={coll.profile} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">{(coll.name || '?').charAt(0)}</div>
        )}
        {partnerStatus && (
          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            partnerStatus === 'ACTIVE' ? 'bg-emerald-500 border-emerald-700' : 'bg-amber-500 border-amber-700'
          }`}>
            <Icon icon={partnerStatus === 'ACTIVE' ? 'ph:check-bold' : 'ph:clock-bold'} className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{coll.name || 'Unknown'}</p>
          {coll.distance != null && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
              {fmtDist(coll.distance)}
            </span>
          )}
        </div>

        {/* Address, Phone & Rating */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
          <span className={`truncate flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Icon icon="ph:map-pin-fill" className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            {shortAddr(coll.address)}
          </span>

          {coll.phone && (
            <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <Icon icon="ph:phone-fill" className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              {coll.phone}
            </span>
          )}

          {Number(coll.ratingAvg) > 0 && (
            <span className="flex items-center gap-1 font-bold text-amber-500">
              <Icon icon="ph:star-fill" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              {Number(coll.ratingAvg).toFixed(1)}
            </span>
          )}
        </div>

        {/* Top Crop Badges */}
        {topCrops.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {topCrops.map(cr => (
              <span key={cr._id || cr.code || cr.name} className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                isDark ? 'bg-slate-800/80 text-emerald-300 border-slate-700/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
              }`}>
                {cr.name}
              </span>
            ))}
            {(coll.crops?.length || 0) > 4 && (
              <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                +{(coll.crops.length - 4)} more
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Detail Panel ──────────────────────────────────────────────────────────────
const DetailPanel = ({ coll, isDark, myCrops = [], memberData = {}, onRequest, requesting, onCancelRequest, onTerminateDeal, onClose }) => {
  const [tab, setTab] = useState('overview');
  const [selectedCrops, setSelectedCrops] = useState({});
  const [prices, setPrices] = useState({});
  const [note, setNote] = useState('');

  useEffect(() => { setTab('overview'); setSelectedCrops({}); setPrices({}); setNote(''); }, [coll?._id]);

  if (!coll) return null;

  const activeMyCrops = (myCrops || []).filter(fc => fc && fc.status === 'ACTIVE');
  const collCropCodes = new Set((coll.crops || []).map(c => c.code));
  const collCropPriceByCode = {};
  for (const c of (coll.crops || [])) { collCropPriceByCode[c.code] = c.price || 0; }

  const approvedMembers = Array.isArray(memberData?.approved) ? memberData.approved : [];
  const requestMembers = Array.isArray(memberData?.requests) ? memberData.requests : [];

  const myDeals = [...approvedMembers, ...requestMembers]
    .filter(m => m && (m.collective?._id === coll._id || m.collective === coll._id || m._id === coll._id))
    .flatMap(m => Array.isArray(m.deals) ? m.deals : []);

  const activeDealCropIds = new Set(
    myDeals
      .filter(d => d && (d.status === 'REQUESTED' || d.status === 'APPROVED'))
      .map(d => {
        if (!d.crop) return null;
        return typeof d.crop === 'object' ? d.crop._id?.toString() : d.crop.toString();
      })
      .filter(Boolean)
  );

  const toggleCrop = (id) => setSelectedCrops(p => ({ ...p, [id]: !p[id] }));
  const selectedCount = Object.values(selectedCrops).filter(Boolean).length;

  const handleSubmit = () => {
    const crops = Object.entries(selectedCrops)
      .filter(([, v]) => v)
      .map(([id]) => ({ cropId: id, demandedPrice: Number(prices[id]) || 0 }));
    if (crops.length === 0) return;
    onRequest(coll, crops, note);
  };

  const TABS = [
    { key: 'overview', label: 'Overview', icon: 'ph:info-bold' },
    { key: 'request', label: 'Request', icon: 'ph:paper-plane-tilt-bold' },
    ...(myDeals.length > 0 ? [{ key: 'deals', label: 'My Deals', icon: 'ph:handshake-bold' }] : []),
  ];

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/40' : 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50'}`}>
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-5 pb-5">
        {onClose && (
          <button onClick={onClose} className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center cursor-pointer transition-colors" title="Close details">
            <Icon icon="ph:x-bold" className="w-4 h-4" />
          </button>
        )}
        <div className="relative z-10 flex items-end gap-4">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-white/20 ring-2 ring-white/30 shadow-lg">
            {coll.profile ? (
              <img src={coll.profile} alt={coll.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">{(coll.name || '?').charAt(0)}</div>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h2 className="text-xl font-bold text-white leading-tight truncate">{coll.name || 'Unknown'}</h2>
            <p className="text-xs text-white/80 mt-0.5 truncate">Managed by {coll.manager || '—'}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Number(coll.ratingAvg) > 0 && (
                <span className="text-[10px] font-bold text-amber-300 bg-black/25 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-400/20">
                  <Icon icon="ph:star-fill" className="w-3 h-3 text-amber-400" />{Number(coll.ratingAvg).toFixed(1)}
                </span>
              )}
              <span className="text-[10px] font-semibold text-white/90 bg-white/15 px-2.5 py-0.5 rounded-full">
                {coll.farmerGroupsCount || 0} Partners
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold cursor-pointer transition-all border-b-2 ${
              tab === t.key ? 'border-emerald-500 text-emerald-500' : `border-transparent ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'}`
            }`}>
            <Icon icon={t.icon} className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Contact */}
              <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Contact Information</p>
                <div className="space-y-2">
                  {coll.phone && (
                    <a href={`tel:${coll.phone}`} className="flex items-center gap-2.5 group/link">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-50'}`}>
                        <Icon icon="ph:phone-fill" className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold group-hover/link:text-emerald-500 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{coll.phone}</p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Phone · Tap to call</p>
                      </div>
                    </a>
                  )}
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-violet-500/15' : 'bg-violet-50'}`}>
                      <Icon icon="ph:map-pin-fill" className="w-4 h-4 text-violet-500" />
                    </div>
                    <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formatAddress(coll.address)}</p>
                  </div>
                </div>
              </div>

              {/* Handled Crops */}
              <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Crops Handled ({coll.crops?.length || 0})
                </p>
                {coll.crops?.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 max-h-52 overflow-y-auto pr-1">
                    {coll.crops.map(cr => (
                      <div
                        key={cr._id || cr.code || cr.name}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                          isDark ? 'bg-slate-900/80 border-slate-700/80 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                        }`}
                      >
                        <Icon icon="ph:leaf-fill" className="w-3 h-3 text-emerald-400" />
                        <span>{cr.name}</span>
                        <span className="font-bold text-emerald-400">{cr.price > 0 ? `₹${cr.price}/kg` : '—'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No crops listed</p>
                )}
              </div>

              <button onClick={() => setTab('request')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 transition-all">
                <Icon icon="ph:handshake-fill" className="w-4 h-4" />Send Membership Request
              </button>
            </motion.div>
          )}

          {/* Request tab */}
          {tab === 'request' && (
            <motion.div key="request" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className={`rounded-xl p-3 border flex items-start gap-2 ${isDark ? 'bg-blue-950/30 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                <Icon icon="ph:info-fill" className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Select your crops and demand price to request membership.</p>
              </div>

              <div className="space-y-2">
                {activeMyCrops.map(fc => {
                  const cropCode = fc.crop?.code;
                  const isHandled = collCropCodes.has(cropCode);
                  const isAlreadyDeal = activeDealCropIds.has(fc._id?.toString());
                  const disabled = !isHandled || isAlreadyDeal;
                  const checked = !!selectedCrops[fc._id];

                  return (
                    <div key={fc._id} className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all ${
                      disabled
                        ? isDark ? 'bg-slate-900/40 border-slate-800/80 opacity-60' : 'bg-slate-100/70 border-slate-200/80 opacity-75'
                        : checked ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700/50'
                    }`}>
                      <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleCrop(fc._id)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white">{fc.crop?.name}</p>
                        <p className="text-[10px] text-slate-400">Yield: {fc.yield ?? '—'} kg</p>
                      </div>
                      {checked && !disabled && (
                        <input type="number" placeholder="₹/kg" value={prices[fc._id] || ''} onChange={(e) => setPrices(p => ({ ...p, [fc._id]: e.target.value }))}
                          className="w-24 px-2.5 py-1.5 rounded-lg text-xs font-semibold border outline-none bg-slate-900 border-slate-700 text-white focus:border-emerald-500" />
                      )}
                    </div>
                  );
                })}
              </div>

              <button onClick={handleSubmit} disabled={requesting || selectedCount === 0}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-50">
                Send Request ({selectedCount} crops)
              </button>
            </motion.div>
          )}

          {/* Redesigned My Deals Tab */}
          {tab === 'deals' && (
            <motion.div key="deals" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {myDeals.length === 0 ? (
                <p className="text-center py-8 text-sm text-slate-500">No active deals with this collective</p>
              ) : myDeals.map(deal => {
                const isRequested = deal.status === 'REQUESTED';
                const isApproved = deal.status === 'APPROVED';

                return (
                  <div key={deal._id} className="rounded-xl p-4 border border-slate-800 bg-slate-900/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          <Icon icon="ph:plant-fill" className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{deal.crop?.crop?.name || deal.crop?.name || 'Crop'}</h4>
                          <p className="text-[10px] text-slate-400">Code: {deal.crop?.crop?.code || '—'}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                        isApproved ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      }`}>
                        {deal.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-slate-950/60 rounded-lg">
                      {deal.demandedPrice > 0 && (
                        <div>
                          <p className="text-slate-500 text-[10px]">Demanded Rate</p>
                          <p className="font-bold text-white">₹{deal.demandedPrice}/kg</p>
                        </div>
                      )}
                      {deal.agreedPrice > 0 && (
                        <div>
                          <p className="text-slate-500 text-[10px]">Agreed Rate</p>
                          <p className="font-bold text-emerald-400">₹{deal.agreedPrice}/kg</p>
                        </div>
                      )}
                    </div>

                    {(isRequested || isApproved) && (
                      <div className="pt-2 border-t border-slate-800 flex justify-end">
                        {isRequested && (
                          <button
                            onClick={() => onCancelRequest(deal._id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 cursor-pointer transition-all flex items-center gap-1"
                          >
                            <Icon icon="ph:x-circle-bold" className="w-3.5 h-3.5" /> Cancel Request
                          </button>
                        )}
                        {isApproved && (
                          <button
                            onClick={() => onTerminateDeal(deal._id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 cursor-pointer transition-all flex items-center gap-1"
                          >
                            <Icon icon="ph:prohibit-bold" className="w-3.5 h-3.5" /> Terminate Deal
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const CollectiveBrowse = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();

  const [collectives, setCollectives] = useState([]);
  const [memberData, setMemberData] = useState({});
  const [myCrops, setMyCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [dealToTerminate, setDealToTerminate] = useState(null);
  const [isTerminating, setIsTerminating] = useState(false);

  // Top Tabs: "explore" | "partners"
  const [mainTab, setMainTab] = useState("explore");

  // Filter & Sort state
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating'); // Default sort by rating

  const farmerLat = user?.coordinates?.lat;
  const farmerLng = user?.coordinates?.lng;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (farmerLat && farmerLng) { params.lat = farmerLat; params.long = farmerLng; params.radius = 500; }
      const [colRes, memRes, cropRes] = await Promise.all([
        commonAPI.getCollectives(params),
        farmerMemberAPI.get(),
        farmerCropAPI.get(),
      ]);
      setCollectives(colRes.data.collectives || []);
      setMemberData(memRes.data.memberData || {});
      const cropData = cropRes.data?.data?.cropData ?? cropRes.data?.cropData ?? cropRes.data?.crops ?? [];
      setMyCrops(Array.isArray(cropData) ? cropData : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load data');
    } finally { setLoading(false); }
  }, [farmerLat, farmerLng, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getPartnerStatus = useCallback((collId) => {
    if (!collId) return null;
    const id = collId.toString();
    const approved = Array.isArray(memberData?.approved) ? memberData.approved : [];
    const requests = Array.isArray(memberData?.requests) ? memberData.requests : [];

    for (const entry of approved) {
      const entryId = (entry._id || entry.collective?._id || entry.collective)?.toString();
      if (entryId === id) return 'ACTIVE';
    }
    for (const entry of requests) {
      const entryId = (entry._id || entry.collective?._id || entry.collective)?.toString();
      if (entryId === id) return 'PENDING';
    }
    return null;
  }, [memberData]);

  // Filter logic according to user rules
  const filtered = useMemo(() => {
    let list = [...collectives];

    if (mainTab === "explore") {
      // EXPLORE TAB RULES: Do not include collectives with 0 crops or no phone number
      list = list.filter(c => (c.crops?.length || 0) > 0 && !!c.phone);
    } else if (mainTab === "partners") {
      // MY PARTNERS TAB RULES: Only active or pending partner collectives
      list = list.filter(c => getPartnerStatus(c._id) === "ACTIVE" || getPartnerStatus(c._id) === "PENDING");
    }

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c =>
        (c.name || '').toLowerCase().includes(s) ||
        formatAddress(c.address).toLowerCase().includes(s) ||
        (c.crops || []).some(cr => cr.name?.toLowerCase().includes(s))
      );
    }

    // Sort feature (rating, distance, name, crops count)
    list.sort((a, b) => {
      if (sortBy === 'rating') return (Number(b.ratingAvg) || 0) - (Number(a.ratingAvg) || 0);
      if (sortBy === 'distance') return (a.distance ?? 9999) - (b.distance ?? 9999);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'crops') return (b.crops?.length || 0) - (a.crops?.length || 0);
      return 0;
    });

    return list;
  }, [collectives, search, sortBy, mainTab, getPartnerStatus]);

  // Auto-select first collective
  useEffect(() => {
    if (filtered.length > 0) {
      if (!selected || !filtered.some(c => c._id === selected._id)) {
        setSelected(filtered[0]);
      }
    } else {
      setSelected(null);
    }
  }, [filtered, selected]);

  const handleRequest = async (coll, crops, note) => {
    setRequesting(true);
    try {
      await farmerMemberAPI.sendRequest({ collectiveId: coll._id, crops, note });
      toast.success(`Membership request sent to ${coll.name}!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally { setRequesting(false); }
  };

  const handleCancelRequest = async (dealId) => {
    if (!dealId) return;
    try {
      const res = await farmerMemberAPI.cancel({ dealIds: [dealId] });
      toast.success(res.data?.message || 'Request cancelled successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleTerminateDeal = async () => {
    if (!dealToTerminate) return;
    setIsTerminating(true);
    try {
      const res = await farmerMemberAPI.terminate({ dealId: dealToTerminate, reason: 'Terminated by farmer' });
      toast.success(res.data?.message || 'Deal terminated successfully!');
      setDealToTerminate(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to terminate deal');
    } finally {
      setIsTerminating(false);
    }
  };

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
          Collectives
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Discover collectives and manage your partner deals
        </p>
      </div>

      {/* Top Tabs: Explore & My Partners */}
      <div className="flex gap-2 p-1.5 rounded-xl mb-6 w-fit backdrop-blur-md bg-slate-900/60 border border-slate-800">
        <button
          onClick={() => setMainTab("explore")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            mainTab === "explore"
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          Explore
        </button>
        <button
          onClick={() => setMainTab("partners")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            mainTab === "partners"
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          My Partners
        </button>
      </div>

      {/* Search Bar + Rating Sort Dropdown (No heavy filters in My Partners) */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Icon icon="ph:magnifying-glass-fill" className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search collective by name or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all focus:border-emerald-500 ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900'}`}
          />
        </div>

        {/* Rating Sort Feature */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`appearance-none pl-3.5 pr-9 py-2.5 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-800'}`}
          >
            <option value="rating">Sort by: Highest Rating ⭐</option>
            <option value="distance">Sort by: Distance</option>
            <option value="name">Sort by: Name (A-Z)</option>
            <option value="crops">Sort by: Crop Count</option>
          </select>
          <Icon icon="ph:caret-down-bold" className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-10 h-10 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="ph:buildings-fill"
          title={mainTab === "partners" ? "No partner collectives yet" : "No collectives found"}
          description={mainTab === "partners" ? "Send membership requests in Explore tab to connect." : "No collectives match your search."}
        />
      ) : (
        <div className="relative flex justify-end min-h-[calc(100vh-160px)] w-full">
          {/* Left — Scrollable list */}
          <div className="w-full lg:w-auto lg:absolute lg:top-0 lg:left-0 lg:bottom-0 lg:right-[calc(42%+1.25rem)] lg:overflow-y-auto lg:pr-1">
            <div className="space-y-2.5 pb-4">
              {filtered.map((coll) => (
                <CollRow
                  key={coll._id}
                  coll={coll}
                  isDark={isDark}
                  isSelected={selected?._id === coll._id}
                  onClick={() => {
                    setSelected(coll);
                    setMobileDrawerOpen(true);
                  }}
                  partnerStatus={getPartnerStatus(coll._id)}
                />
              ))}
            </div>
          </div>

          {/* Right — Detail panel (Desktop) */}
          {selected && (
            <div className="hidden lg:block lg:w-[42%] lg:shrink-0">
              <AnimatePresence mode="wait">
                <motion.div key={selected._id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }}>
                  <DetailPanel
                    coll={selected}
                    isDark={isDark}
                    myCrops={myCrops}
                    memberData={memberData}
                    onRequest={handleRequest}
                    requesting={requesting}
                    onCancelRequest={handleCancelRequest}
                    onTerminateDeal={(id) => setDealToTerminate(id)}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Mobile Drawer */}
          <AnimatePresence>
            {mobileDrawerOpen && selected && (
              <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileDrawerOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative z-10 w-full max-h-[85vh] overflow-y-auto rounded-t-3xl shadow-2xl">
                  <DetailPanel
                    coll={selected}
                    isDark={isDark}
                    myCrops={myCrops}
                    memberData={memberData}
                    onRequest={handleRequest}
                    requesting={requesting}
                    onCancelRequest={handleCancelRequest}
                    onTerminateDeal={(id) => setDealToTerminate(id)}
                    onClose={() => setMobileDrawerOpen(false)}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      <ConfirmModal
        isOpen={!!dealToTerminate}
        onClose={() => setDealToTerminate(null)}
        onConfirm={handleTerminateDeal}
        title="Terminate Deal?"
        description="Are you sure you want to terminate this deal with the collective? This action cannot be undone."
        confirmLabel={isTerminating ? "Terminating..." : "Terminate Deal"}
        variant="danger"
        icon="ph:prohibit-bold"
      />
    </div>
  );
};

export default CollectiveBrowse;
