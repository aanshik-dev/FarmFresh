import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui';
import EmptyState from '../../components/common/EmptyState';
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

        {/* Top 3-4 Crop badges */}
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

  // Filter out inactive crops from myCrops
  const activeMyCrops = (myCrops || []).filter(fc => fc && fc.status === 'ACTIVE');

  // Determine which crops the collective handles (by crop code)
  const collCropCodes = new Set((coll.crops || []).map(c => c.code));
  // Crop price map by code
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
      {/* Hero (Solid Gradient Header, No Blur BG Image) */}
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
              <span className="text-[10px] font-semibold text-white/90 bg-white/15 px-2.5 py-0.5 rounded-full">
                {coll.zonesCount || 0} Zones
              </span>
              {coll.distance != null && (
                <span className="text-[10px] font-semibold text-white/90 bg-white/15 px-2.5 py-0.5 rounded-full">
                  {fmtDist(coll.distance)} away
                </span>
              )}
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

          {/* ─── Overview ─── */}
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
                  {coll.email && (
                    <a href={`mailto:${coll.email}`} className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-500/15' : 'bg-blue-50'}`}>
                        <Icon icon="ph:envelope-simple-fill" className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{coll.email}</p>
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

              {/* About */}
              {coll.desc && (
                <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>About</p>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{coll.desc}</p>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: 'ph:users-three-fill', label: 'Partners', value: coll.farmerGroupsCount || 0, iconColor: 'text-emerald-500' },
                  { icon: 'ph:map-trifold-fill', label: 'Zones', value: coll.zonesCount || 0, iconColor: 'text-blue-500' },
                  { icon: 'ph:hard-hat-fill', label: 'Workers', value: coll.workers || 0, iconColor: 'text-amber-500' },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl p-3 border text-center ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                    <Icon icon={s.icon} className={`w-5 h-5 mx-auto mb-1 ${s.iconColor}`} />
                    <p className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Handled Crops with prices (Compact Capsule Flexbox View) */}
              <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Crops Handled ({coll.crops?.length || 0})
                </p>
                {coll.crops?.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 max-h-52 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {coll.crops.map(cr => (
                      <div
                        key={cr._id || cr.code || cr.name}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                          isDark
                            ? 'bg-slate-900/80 border-slate-700/80 text-slate-200 hover:border-emerald-500/50'
                            : 'bg-white border-slate-200 text-slate-800 shadow-sm hover:border-emerald-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                          <Icon icon="ph:leaf-fill" className="w-3 h-3" />
                        </div>
                        <span className="truncate max-w-[120px]">{cr.name}</span>
                        <span className={`font-extrabold ml-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {cr.price > 0 ? `₹${cr.price}/kg` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No crops listed</p>
                )}
              </div>

              {/* CTA */}
              <button onClick={() => setTab('request')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 transition-all">
                <Icon icon="ph:handshake-fill" className="w-4 h-4" />Send Membership Request
              </button>
            </motion.div>
          )}

          {/* ─── Request ─── */}
          {tab === 'request' && (
            <motion.div key="request" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className={`rounded-xl p-3 border flex items-start gap-2 ${isDark ? 'bg-blue-950/30 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                <Icon icon="ph:info-fill" className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Select the crops you want to supply and set your demanded price. Only crops the collective deals in can be selected.</p>
              </div>

              {/* Crop list */}
              <div className="space-y-2">
                <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Select Crops *</p>
                {activeMyCrops.length === 0 ? (
                  <p className="text-xs text-red-500">You haven't added any active crops yet. Add crops in "My Crops" first.</p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 relative" style={{ scrollbarWidth: 'thin' }}>
                    {activeMyCrops.map(fc => {
                      const cropCode = fc.crop?.code;
                      const isHandled = collCropCodes.has(cropCode);
                      const isAlreadyDeal = activeDealCropIds.has(fc._id?.toString());
                      const disabled = !isHandled || isAlreadyDeal;
                      const checked = !!selectedCrops[fc._id];
                      const collPrice = collCropPriceByCode[cropCode] || 0;

                      const disabledReason = !isHandled
                        ? "This collective does not procure this crop."
                        : "An active deal or request already exists for this crop with this collective.";

                      return (
                        <div key={fc._id} className={`relative flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all ${
                          disabled
                            ? isDark ? 'bg-slate-900/40 border-slate-800/80 opacity-60' : 'bg-slate-100/70 border-slate-200/80 opacity-75'
                            : checked
                              ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                              : isDark ? 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}>
                          <input type="checkbox" checked={checked} disabled={disabled}
                            onChange={() => toggleCrop(fc._id)}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed" />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{fc.crop?.name || 'Unknown'}</p>

                              {/* Hover Info (i) Button with Non-Transparent Solid Tooltip */}
                              {disabled && (
                                <div className="relative group/info inline-block">
                                  <button type="button" tabIndex={0} className={`p-0.5 rounded-full border transition-colors ${
                                    isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-900'
                                  }`}>
                                    <Icon icon="ph:info-bold" className="w-3 h-3" />
                                  </button>
                                  <div className="absolute left-0 top-full mt-1.5 hidden group-hover/info:block group-focus-within/info:block z-50 w-56 p-2.5 rounded-xl text-[11px] font-semibold leading-snug shadow-2xl opacity-100 bg-slate-900 text-white border border-slate-700">
                                    {disabledReason}
                                  </div>
                                </div>
                              )}
                            </div>

                            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              Yield: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{fc.yield ?? fc.yld ?? '—'} kg</strong>
                              {collPrice > 0 && <span> · Listed: <strong className="text-emerald-500">₹{collPrice}/kg</strong></span>}
                            </p>
                          </div>

                          {checked && !disabled && (
                            <div className="shrink-0 w-24">
                              <input type="number" placeholder="₹/kg" value={prices[fc._id] || ''}
                                onChange={(e) => setPrices(p => ({ ...p, [fc._id]: e.target.value }))}
                                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border outline-none ${
                                  isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-200 focus:border-emerald-500'
                                }`} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Note (optional)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="E.g., I have 50 acres of ready-to-harvest produce..."
                  rows={2}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none resize-none transition-all ${isDark ? 'bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`} />
              </div>

              {/* Submit */}
              <button onClick={handleSubmit} disabled={requesting || selectedCount === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                {requesting ? <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-5 h-5" /> : <Icon icon="ph:paper-plane-right-fill" className="w-4 h-4" />}
                Send Request ({selectedCount} crop{selectedCount !== 1 ? 's' : ''})
              </button>
            </motion.div>
          )}

          {/* ─── My Deals ─── */}
          {tab === 'deals' && (
            <motion.div key="deals" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2.5">
              {myDeals.length === 0 ? (
                <p className={`text-center py-8 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No deals with this collective</p>
              ) : myDeals.map(deal => {
                const statusColor = {
                  REQUESTED: 'text-amber-500 bg-amber-500/15 border-amber-500/30',
                  APPROVED: 'text-emerald-500 bg-emerald-500/15 border-emerald-500/30',
                  REJECTED: 'text-red-500 bg-red-500/15 border-red-500/30',
                  CANCELLED: 'text-slate-400 bg-slate-500/15 border-slate-500/30',
                  F_TERMINATE: 'text-red-500 bg-red-500/15 border-red-500/30',
                  C_TERMINATE: 'text-red-500 bg-red-500/15 border-red-500/30',
                  ABANDONED: 'text-slate-400 bg-slate-500/15 border-slate-500/30',
                };
                const colorClass = statusColor[deal.status] || 'text-slate-400 bg-slate-500/15 border-slate-500/30';
                const isRequested = deal.status === 'REQUESTED';
                const isApproved = deal.status === 'APPROVED';

                return (
                  <div key={deal._id} className={`rounded-xl p-3.5 border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {deal.crop?.crop?.name || deal.crop?.name || '—'}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
                        {deal.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                      {deal.demandedPrice > 0 && (
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Demanded: <span className="font-bold">₹{deal.demandedPrice}/kg</span></p>
                      )}
                      {deal.agreedPrice > 0 && (
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Agreed: <span className="font-bold text-emerald-500">₹{deal.agreedPrice}/kg</span></p>
                      )}
                    </div>

                    {/* Action Buttons: Cancel Request for REQUESTED & Terminate Deal for APPROVED */}
                    {(isRequested || isApproved) && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end">
                        {isRequested && (
                          <button
                            onClick={() => onCancelRequest(deal._id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30 cursor-pointer transition-all"
                          >
                            <Icon icon="ph:x-circle-bold" className="w-3.5 h-3.5" />
                            Cancel Request
                          </button>
                        )}
                        {isApproved && (
                          <button
                            onClick={() => onTerminateDeal(deal._id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 cursor-pointer transition-all"
                          >
                            <Icon icon="ph:prohibit-bold" className="w-3.5 h-3.5" />
                            Terminate Deal
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

// ── Sort options ──────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { key: 'distance', label: 'Distance', icon: 'ph:map-pin-fill' },
  { key: 'rating', label: 'Rating', icon: 'ph:star-fill' },
  { key: 'name', label: 'Name', icon: 'ph:sort-ascending-fill' },
  { key: 'crops', label: 'Crop Count', icon: 'ph:leaf-fill' },
];

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

  // Filters
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('distance');
  const [maxDistance, setMaxDistance] = useState(200);
  const [minRating, setMinRating] = useState(0);
  const [cropFilter, setCropFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
      const cropData = cropRes.data?.data?.cropData ?? cropRes.data?.cropData ?? cropRes.data?.crops ?? cropRes.data?.crop ?? [];
      setMyCrops(Array.isArray(cropData) ? cropData : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load data');
    } finally { setLoading(false); }
  }, [farmerLat, farmerLng, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Get partner status for a collective
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

  // All unique crop names across collectives (for filter)
  const allCropNames = useMemo(() => {
    const set = new Set();
    collectives.forEach(c => (c.crops || []).forEach(cr => { if (cr.name) set.add(cr.name); }));
    return [...set].sort();
  }, [collectives]);

  // Filter & sort
  const filtered = useMemo(() => {
    let list = [...collectives];
    // Search
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c =>
        (c.name || '').toLowerCase().includes(s) ||
        formatAddress(c.address).toLowerCase().includes(s) ||
        (c.crops || []).some(cr => cr.name?.toLowerCase().includes(s))
      );
    }
    // Distance filter
    if (farmerLat && farmerLng && maxDistance < 200) {
      list = list.filter(c => c.distance == null || c.distance <= maxDistance);
    }
    // Rating filter
    if (minRating > 0) { list = list.filter(c => (Number(c.ratingAvg) || 0) >= minRating); }
    // Crop filter
    if (cropFilter) { list = list.filter(c => (c.crops || []).some(cr => cr.name === cropFilter)); }
    // Status filter
    if (statusFilter === 'partner') { list = list.filter(c => getPartnerStatus(c._id) === 'ACTIVE'); }
    else if (statusFilter === 'pending') { list = list.filter(c => getPartnerStatus(c._id) === 'PENDING'); }
    else if (statusFilter === 'available') { list = list.filter(c => !getPartnerStatus(c._id)); }
    // Sort
    list.sort((a, b) => {
      if (sortBy === 'distance') { return (a.distance ?? 9999) - (b.distance ?? 9999); }
      if (sortBy === 'rating') { return (Number(b.ratingAvg) || 0) - (Number(a.ratingAvg) || 0); }
      if (sortBy === 'name') { return (a.name || '').localeCompare(b.name || ''); }
      if (sortBy === 'crops') { return (b.crops?.length || 0) - (a.crops?.length || 0); }
      return 0;
    });
    return list;
  }, [collectives, search, maxDistance, minRating, cropFilter, statusFilter, sortBy, farmerLat, farmerLng, getPartnerStatus]);

  // Auto-select first
  useEffect(() => {
    if (filtered.length > 0) {
      if (!selected || !filtered.some(c => c._id === selected._id)) {
        setSelected(filtered[0]);
      }
    } else {
      setSelected(null);
    }
  }, [filtered, selected]);

  // Keep selected fresh after data reload
  useEffect(() => {
    if (selected) {
      const updated = collectives.find(c => c._id === selected._id);
      if (updated) setSelected(updated);
    }
  }, [collectives]);

  // Stats
  const partnerCount = useMemo(() => {
    return Array.isArray(memberData?.approved) ? memberData.approved.length : 0;
  }, [memberData]);

  const pendingCount = useMemo(() => {
    return Array.isArray(memberData?.requests) ? memberData.requests.length : 0;
  }, [memberData]);

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

  const handleTerminateDeal = async (dealId) => {
    if (!dealId) return;
    if (!window.confirm('Are you sure you want to terminate this deal?')) return;
    try {
      const res = await farmerMemberAPI.terminate({ dealId, reason: 'Terminated by farmer' });
      toast.success(res.data?.message || 'Deal terminated successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to terminate deal');
    }
  };

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            Collective Marketplace
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Browse collectives and build partnerships for your crops</p>
        </div>
        <div className="flex items-center gap-2.5">
          {[
            { label: 'Total', value: collectives.length, icon: 'ph:buildings-fill', color: 'text-emerald-500' },
            { label: 'Partners', value: partnerCount, icon: 'ph:handshake-fill', color: 'text-blue-500' },
            { label: 'Pending', value: pendingCount, icon: 'ph:clock-fill', color: 'text-amber-500' },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <Icon icon={s.icon} className={`w-4 h-4 ${s.color}`} />
              <div>
                <p className={`text-sm font-extrabold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Icon icon="ph:magnifying-glass-fill" className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input type="text" placeholder="Search by name, location, or crop…" value={search} onChange={e => setSearch(e.target.value)}
            className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
            showFilters
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}>
          <Icon icon="ph:faders-horizontal-bold" className="w-4 h-4" />Filters
        </button>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
            <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sort */}
                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Sort By</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SORT_OPTIONS.map(s => (
                      <button key={s.key} onClick={() => setSortBy(s.key)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border cursor-pointer transition-all ${
                          sortBy === s.key ? 'bg-emerald-500 border-emerald-500 text-white' : isDark ? 'border-slate-700 text-slate-400 hover:border-slate-500' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}>
                        <Icon icon={s.icon} className="w-3 h-3" />{s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance */}
                {farmerLat && farmerLng && (
                  <div>
                    <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Max Distance: {maxDistance >= 200 ? 'Any' : `${maxDistance} km`}</label>
                    <input type="range" min="5" max="200" step="5" value={maxDistance} onChange={e => setMaxDistance(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-emerald-500" />
                  </div>
                )}

                {/* Crop filter */}
                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Crop</label>
                  <select value={cropFilter} onChange={e => setCropFilter(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <option value="">All Crops</option>
                    {allCropNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Min Rating: {minRating > 0 ? `${minRating}+` : 'Any'}</label>
                  <input type="range" min="0" max="5" step="0.5" value={minRating} onChange={e => setMinRating(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-amber-500" />
                </div>
              </div>

              {/* Status tabs */}
              <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: isDark ? '#1e293b' : '#e2e8f0' }}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'available', label: 'Available' },
                  { key: 'partner', label: 'My Partners' },
                  { key: 'pending', label: 'Pending' },
                ].map(s => (
                  <button key={s.key} onClick={() => setStatusFilter(s.key)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                      statusFilter === s.key ? 'bg-emerald-500 text-white' : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'
                    }`}>{s.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-10 h-10 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="ph:buildings-fill" title="No collectives found" description="Try adjusting your filters or search term." />
      ) : (
        <div className="relative flex justify-end min-h-[calc(100vh-120px)] w-full">
          {/* Left — Scrollable list */}
          <div className="w-full lg:w-auto lg:absolute lg:top-0 lg:left-0 lg:bottom-0 lg:right-[calc(42%+1.25rem)] lg:overflow-y-auto lg:pr-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: isDark ? '#334155 transparent' : '#cbd5e1 transparent' }}>
            <div className="space-y-2 pb-4">
              {filtered.map((coll) => (
                <CollRow key={coll._id} coll={coll} isDark={isDark}
                  isSelected={selected?._id === coll._id}
                  onClick={() => {
                    setSelected(coll);
                    setMobileDrawerOpen(true);
                  }}
                  partnerStatus={getPartnerStatus(coll._id)} />
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
                    onTerminateDeal={handleTerminateDeal}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Mobile Drawer (Mobile < lg) */}
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
                    onTerminateDeal={handleTerminateDeal}
                    onClose={() => setMobileDrawerOpen(false)}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CollectiveBrowse;
