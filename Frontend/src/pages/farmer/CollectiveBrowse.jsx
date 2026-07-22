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
  if (!addr || typeof addr === 'string') return addr || '—';
  return [addr.town, addr.district].filter(Boolean).join(', ') || formatAddress(addr);
};
const fmtDist = (d) => d == null ? null : d < 1 ? `${Math.round(d * 1000)} m` : `${Math.round(d)} km`;
const starArr = (rating) => {
  const full = Math.floor(rating); const half = rating - full >= 0.5 ? 1 : 0;
  return [...Array(full).fill('full'), ...(half ? ['half'] : []), ...Array(5 - full - half).fill('empty')];
};

// ── Collective List Row ───────────────────────────────────────────────────────
const CollRow = ({ coll, isDark, isSelected, onClick, partnerStatus }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
    onClick={onClick}
    className={`group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
      isSelected
        ? isDark ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : 'bg-emerald-50 ring-1 ring-emerald-400/25'
        : isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
    }`}
  >
    {/* Avatar */}
    <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600">
      {coll.profile
        ? <img src={coll.profile} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        : <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">{(coll.name || '?').charAt(0)}</div>
      }
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
      <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{coll.name || 'Unknown'}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <Icon icon="ph:map-pin-fill" className="w-3 h-3 inline mr-0.5" />{shortAddr(coll.address)}
        </span>
      </div>
    </div>

    {/* Right meta */}
    <div className="shrink-0 flex flex-col items-end gap-1">
      {coll.ratingAvg > 0 && (
        <div className="flex items-center gap-0.5">
          <Icon icon="ph:star-fill" className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-bold text-amber-500">{coll.ratingAvg.toFixed(1)}</span>
        </div>
      )}
      {coll.distance != null && (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
          {fmtDist(coll.distance)}
        </span>
      )}
      {coll.crops?.length > 0 && (
        <span className={`text-[10px] font-bold ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>{coll.crops.length} crops</span>
      )}
    </div>
  </motion.div>
);

// ── Detail Panel ──────────────────────────────────────────────────────────────
const DetailPanel = ({ coll, isDark, myCrops, memberData, onRequest, requesting }) => {
  const [tab, setTab] = useState('overview');
  const [selectedCrops, setSelectedCrops] = useState({});
  const [prices, setPrices] = useState({});
  const [note, setNote] = useState('');

  useEffect(() => { setTab('overview'); setSelectedCrops({}); setPrices({}); setNote(''); }, [coll?._id]);

  if (!coll) return null;

  // Determine which crops the collective handles (by crop code)
  const collCropCodes = new Set((coll.crops || []).map(c => c.code));
  // Crop price map by code
  const collCropPriceByCode = {};
  for (const c of (coll.crops || [])) { collCropPriceByCode[c.code] = c.price || 0; }

  // Farmer's deals with this collective
  const myDeals = [];
  for (const cat of ['requests', 'approved', 'rejected', 'cancelled', 'terminated']) {
    const list = memberData?.[cat] || [];
    for (const entry of list) {
      if (entry._id === coll._id) {
        myDeals.push(...(entry.deals || []));
      }
    }
  }
  // Active/requested deal crop IDs (farmerCrop._id)
  const activeDealCropIds = new Set(
    myDeals.filter(d => d.status === 'REQUESTED' || d.status === 'APPROVED').map(d => d.crop?._id?.toString())
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
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700" style={{ minHeight: '130px' }}>
        {coll.profile && (
          <div className="absolute inset-0">
            <img src={coll.profile} alt="" className="w-full h-full object-cover scale-110" />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          </div>
        )}
        {!coll.profile && <div className="absolute inset-0 bg-black/20" />}
        <div className="relative z-10 p-5 pb-4">
          <div className="flex items-end gap-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-white/20 ring-2 ring-white/30">
              {coll.profile
                ? <img src={coll.profile} alt={coll.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">{(coll.name || '?').charAt(0)}</div>
              }
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h2 className="text-xl font-bold text-white leading-tight truncate">{coll.name || 'Unknown'}</h2>
              <p className="text-xs text-white/70 mt-0.5 truncate">Managed by {coll.manager || '—'}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {coll.ratingAvg > 0 && (
                  <span className="text-[10px] font-semibold text-white/90 bg-white/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Icon icon="ph:star-fill" className="w-3 h-3 text-amber-300" />{coll.ratingAvg.toFixed(1)}
                  </span>
                )}
                <span className="text-[10px] font-semibold text-white/80 bg-white/15 px-2 py-0.5 rounded-full">
                  {coll.farmerGroupsCount || 0} Partners
                </span>
                <span className="text-[10px] font-semibold text-white/80 bg-white/15 px-2 py-0.5 rounded-full">
                  {coll.zonesCount || 0} Zones
                </span>
                {coll.distance != null && (
                  <span className="text-[10px] font-semibold text-white/80 bg-white/15 px-2 py-0.5 rounded-full">
                    {fmtDist(coll.distance)} away
                  </span>
                )}
              </div>
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
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Contact Information</p>
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
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>About</p>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{coll.desc}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: 'ph:users-three-fill', label: 'Partners', value: coll.farmerGroupsCount || 0, color: 'emerald' },
                  { icon: 'ph:map-trifold-fill', label: 'Zones', value: coll.zonesCount || 0, color: 'blue' },
                  { icon: 'ph:hard-hat-fill', label: 'Workers', value: coll.workers || 0, color: 'amber' },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl p-3 border text-center ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                    <Icon icon={s.icon} className={`w-5 h-5 mx-auto mb-1 text-${s.color}-500`} />
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Rating */}
              {coll.ratingAvg > 0 && (
                <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-amber-950/20 border-amber-500/15' : 'bg-amber-50 border-amber-200/60'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-amber-500/70' : 'text-amber-600'}`}>Rating</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-amber-500">{coll.ratingAvg.toFixed(1)}</span>
                    <div className="flex gap-0.5">
                      {starArr(coll.ratingAvg).map((s, i) => (
                        <Icon key={i} icon={s === 'full' ? 'ph:star-fill' : s === 'half' ? 'ph:star-half-fill' : 'ph:star'} className={`w-4 h-4 ${s === 'empty' ? (isDark ? 'text-slate-600' : 'text-slate-300') : 'text-amber-400'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Handled Crops with prices */}
              <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Crops & Pricing</p>
                {(coll.crops?.length > 0) ? (
                  <div className="space-y-1.5">
                    {coll.crops.map(cr => (
                      <div key={cr._id || cr.code} className={`flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? 'bg-slate-900/60' : 'bg-white border border-slate-100'}`}>
                        <div className="flex items-center gap-2">
                          <Icon icon="ph:leaf-fill" className="w-3.5 h-3.5 text-emerald-500" />
                          <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{cr.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{cr.category}</span>
                        </div>
                        <span className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {cr.price > 0 ? `₹${cr.price}/kg` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No crops listed</p>}
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
                {myCrops.length === 0 ? (
                  <p className="text-xs text-red-500">You haven't added any crops yet. Add crops in "My Crops" first.</p>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {myCrops.map(fc => {
                      const cropCode = fc.crop?.code;
                      const isHandled = collCropCodes.has(cropCode);
                      const isAlreadyDeal = activeDealCropIds.has(fc._id?.toString());
                      const disabled = !isHandled || isAlreadyDeal || fc.status !== 'ACTIVE';
                      const checked = !!selectedCrops[fc._id];
                      const collPrice = collCropPriceByCode[cropCode] || 0;

                      return (
                        <div key={fc._id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                          disabled
                            ? isDark ? 'bg-slate-900/30 border-slate-800 opacity-50' : 'bg-slate-50 border-slate-100 opacity-50'
                            : checked
                              ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                              : isDark ? 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}>
                          <input type="checkbox" checked={checked} disabled={disabled}
                            onChange={() => toggleCrop(fc._id)}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed" />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{fc.crop?.name || 'Unknown'}</p>
                            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {!isHandled ? 'Not handled by this collective'
                                : isAlreadyDeal ? 'Already requested/active deal'
                                : fc.status !== 'ACTIVE' ? 'Crop is inactive'
                                : `Yield: ${fc.yield ?? '—'} kg${collPrice > 0 ? ` · Listed: ₹${collPrice}/kg` : ''}`}
                            </p>
                          </div>
                          {checked && !disabled && (
                            <div className="shrink-0 w-24">
                              <input type="number" placeholder="₹/kg" value={prices[fc._id] || ''}
                                onChange={(e) => setPrices(p => ({ ...p, [fc._id]: e.target.value }))}
                                className={`w-full px-2 py-1.5 rounded-lg text-xs border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'}`} />
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
            <motion.div key="deals" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
              {myDeals.length === 0 ? (
                <p className={`text-center py-8 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No deals with this collective</p>
              ) : myDeals.map(deal => {
                const statusColor = {
                  REQUESTED: 'amber', APPROVED: 'emerald', REJECTED: 'red', CANCELLED: 'slate',
                  F_TERMINATE: 'red', C_TERMINATE: 'red', ABANDONED: 'slate',
                };
                const color = statusColor[deal.status] || 'slate';
                return (
                  <div key={deal._id} className={`rounded-xl p-3 border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{deal.crop?.crop?.name || '—'}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-${color}-500/15 text-${color}-500`}>{deal.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      {deal.demandedPrice > 0 && (
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Demanded: <span className="font-bold">₹{deal.demandedPrice}/kg</span></p>
                      )}
                      {deal.agreedPrice > 0 && (
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Agreed: <span className="font-bold text-emerald-500">₹{deal.agreedPrice}/kg</span></p>
                      )}
                    </div>
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
      const cropData = cropRes.data?.data?.cropData ?? cropRes.data?.crops ?? [];
      setMyCrops(cropData);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load data');
    } finally { setLoading(false); }
  }, [farmerLat, farmerLng]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Get partner status for a collective
  const getPartnerStatus = useCallback((collId) => {
    const id = collId?.toString();
    for (const entry of (memberData?.approved || [])) { if (entry._id === id) return 'ACTIVE'; }
    for (const entry of (memberData?.requests || [])) { if (entry._id === id) return 'PENDING'; }
    return null;
  }, [memberData]);

  // All unique crop names across collectives (for filter)
  const allCropNames = useMemo(() => {
    const set = new Set();
    collectives.forEach(c => (c.crops || []).forEach(cr => set.add(cr.name)));
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
    if (minRating > 0) { list = list.filter(c => (c.ratingAvg || 0) >= minRating); }
    // Crop filter
    if (cropFilter) { list = list.filter(c => (c.crops || []).some(cr => cr.name === cropFilter)); }
    // Status filter
    if (statusFilter === 'partner') { list = list.filter(c => getPartnerStatus(c._id) === 'ACTIVE'); }
    else if (statusFilter === 'pending') { list = list.filter(c => getPartnerStatus(c._id) === 'PENDING'); }
    else if (statusFilter === 'available') { list = list.filter(c => !getPartnerStatus(c._id)); }
    // Sort
    list.sort((a, b) => {
      if (sortBy === 'distance') { return (a.distance ?? 9999) - (b.distance ?? 9999); }
      if (sortBy === 'rating') { return (b.ratingAvg || 0) - (a.ratingAvg || 0); }
      if (sortBy === 'name') { return (a.name || '').localeCompare(b.name || ''); }
      if (sortBy === 'crops') { return (b.crops?.length || 0) - (a.crops?.length || 0); }
      return 0;
    });
    return list;
  }, [collectives, search, maxDistance, minRating, cropFilter, statusFilter, sortBy, farmerLat, farmerLng, getPartnerStatus]);

  // Auto-select first
  useEffect(() => {
    if (filtered.length > 0 && (!selected || !filtered.find(c => c._id === selected._id))) {
      setSelected(filtered[0]);
    } else if (filtered.length === 0) { setSelected(null); }
  }, [filtered]);

  // Keep selected fresh after data reload
  useEffect(() => {
    if (selected) {
      const updated = collectives.find(c => c._id === selected._id);
      if (updated) setSelected(updated);
    }
  }, [collectives]);

  // Stats
  const partnerCount = useMemo(() => (memberData?.approved || []).length, [memberData]);
  const pendingCount = useMemo(() => (memberData?.requests || []).length, [memberData]);

  const handleRequest = async (coll, crops, note) => {
    setRequesting(true);
    try {
      await farmerMemberAPI.sendRequest({ collectiveId: coll._id, crops });
      toast.success(`Membership request sent to ${coll.name}!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally { setRequesting(false); }
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
            { label: 'Total', value: collectives.length, icon: 'ph:buildings-fill', color: 'emerald' },
            { label: 'Partners', value: partnerCount, icon: 'ph:handshake-fill', color: 'blue' },
            { label: 'Pending', value: pendingCount, icon: 'ph:clock-fill', color: 'amber' },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
              <Icon icon={s.icon} className={`w-4 h-4 text-${s.color}-500`} />
              <div>
                <p className="text-sm font-bold leading-none">{s.value}</p>
                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
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
          <div className="absolute top-0 left-0 bottom-0 right-[calc(42%+1.25rem)] overflow-y-auto pr-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: isDark ? '#334155 transparent' : '#cbd5e1 transparent' }}>
            <div className="space-y-1 pb-4">
              {filtered.map((coll) => (
                <CollRow key={coll._id} coll={coll} isDark={isDark}
                  isSelected={selected?._id === coll._id}
                  onClick={() => setSelected(coll)}
                  partnerStatus={getPartnerStatus(coll._id)} />
              ))}
            </div>
          </div>

          {/* Right — Detail panel */}
          {selected && (
            <div className="w-[42%] shrink-0">
              <AnimatePresence mode="wait">
                <motion.div key={selected._id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }}>
                  <DetailPanel coll={selected} isDark={isDark} myCrops={myCrops} memberData={memberData} onRequest={handleRequest} requesting={requesting} />
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectiveBrowse;
