import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/ui';
import EmptyState from '../../components/common/EmptyState';
import CropSelect from '../../components/common/CropSelect';
import ConfirmModal from '../../components/common/ConfirmModal';
import { farmerCropAPI, commonAPI, farmerDealAPI, farmerMemberAPI } from '../../services/api';

const CATEGORY_ICON = {
  Grain: 'ph:basket-fill', Vegetable: 'ph:leaf-fill', Fruit: 'ph:tree-fill',
  Pulse: 'ph:circle-dashed-fill', Spice: 'ph:star-fill', Oilseed: 'ph:drop-fill',
};
const SEASON_META = {
  Kharif:    { gradient: 'from-amber-400 to-orange-500',  chip: 'bg-amber-400/15 text-amber-500',   icon: 'bg-amber-400/20'   },
  Rabi:      { gradient: 'from-sky-400 to-blue-500',      chip: 'bg-sky-400/15 text-sky-500',       icon: 'bg-sky-400/20'     },
  Zaid:      { gradient: 'from-rose-400 to-pink-500',     chip: 'bg-rose-400/15 text-rose-500',     icon: 'bg-rose-400/20'    },
  Perennial: { gradient: 'from-violet-400 to-purple-500', chip: 'bg-violet-400/15 text-violet-500', icon: 'bg-violet-400/20'  },
};
const DEFAULT_META = { gradient: 'from-emerald-400 to-teal-500', chip: 'bg-emerald-400/15 text-emerald-500', icon: 'bg-emerald-400/20' };
const STAGE_LABEL  = { SOWING: 'Sowing', GROWTH: 'Growth', FLOWERING: 'Flowering', HARVEST_READY: 'Harvest Ready', HARVESTED: 'Harvested', OTHER: 'Other' };
const getSeasonMeta  = (s) => SEASON_META[s] || DEFAULT_META;
const getCategoryIcon = (c) => CATEGORY_ICON[c] || 'ph:plant-fill';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';
const fmtDT   = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

// ── Shared image block ────────────────────────────────────────────────────────
const CropImg = ({ image, category, season, cls = 'w-14 h-14 rounded-xl', iconCls = 'w-6 h-6' }) => {
  const [failed, setFailed] = useState(false);
  const meta = getSeasonMeta(season);
  return (
    <div className={`relative overflow-hidden shrink-0 ${cls} ${meta.icon}`}>
      {image && !failed
        ? <img src={image} alt="" className="w-full h-full object-cover" onError={() => setFailed(true)} />
        : <div className="absolute inset-0 flex items-center justify-center text-white opacity-80">
            <Icon icon={getCategoryIcon(category)} className={iconCls} />
          </div>
      }
    </div>
  );
};

// ── CropCard ──────────────────────────────────────────────────────────────────
const CropCard = ({ crop, isDark, onEdit, onDelete, onSelect, isSelected, index }) => {
  const deal = crop.dealCrop;
  const collective = deal?.membership?.collective ?? deal?.collective ?? null;
  const isLinked = !!deal;
  const meta = getSeasonMeta(crop.crop?.season);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      onClick={() => onSelect(crop)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border cursor-pointer transition-all duration-200 ${
        isSelected
          ? isDark ? 'bg-emerald-500/10 border-slate-700/60 shadow-lg ring-1 ring-emerald-500/30'
                   : 'bg-emerald-50/80 border-slate-200 shadow-lg ring-1 ring-emerald-400/25'
          : isDark ? 'bg-slate-900/50 border-slate-800/60 hover:border-slate-700 hover:bg-slate-800/40'
                   : 'bg-white/90 border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* gradient stripe */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${meta.gradient}`} />

      <div className="p-4 flex flex-col flex-1">
        {/* Identity */}
        <div className="flex items-center gap-3 mb-3">
          <CropImg image={crop.crop?.image} category={crop.crop?.category} season={crop.crop?.season}
            cls="w-14 h-14 rounded-2xl" iconCls="w-7 h-7" />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm leading-snug truncate">{crop.crop?.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>{crop.crop?.code}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>{crop.crop?.category}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.chip}`}>{crop.crop?.season}</span>
            </div>
          </div>
          <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${crop.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-slate-500/15 text-slate-400'}`}>
            {crop.status}
          </span>
        </div>

        {/* Compact stats */}
        <div className={`flex items-center gap-3 px-3 py-2 rounded-xl mb-3 text-xs ${isDark ? 'bg-slate-950/50' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-1.5">
            <Icon icon="ph:scales-fill" className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Yield:</span>
            <span className="font-bold">{crop.yield ?? '—'} kg</span>
          </div>
          <div className={`w-px h-3 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
          <div className="flex items-center gap-1.5">
            <Icon icon="ph:calendar-blank-fill" className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Planted:</span>
            <span className="font-bold">{fmtDate(crop.plantedDate)}</span>
          </div>
        </div>

        {/* Collective */}
        <div className="flex-1 mb-3">
          {isLinked && collective ? (
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border h-full ${isDark ? 'bg-emerald-950/30 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200/70'}`}>
              <div className={`relative w-10 h-10 rounded-xl overflow-hidden shrink-0 ${isDark ? 'bg-emerald-900/40' : 'bg-emerald-100'}`}>
                {collective.profile
                  ? <img src={collective.profile} alt={collective.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  : <div className="absolute inset-0 flex items-center justify-center"><Icon icon="ph:buildings-fill" className="w-5 h-5 text-emerald-500" /></div>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 leading-none mb-0.5">Linked Collective</p>
                <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{collective.name}</p>
              </div>
              <Icon icon="ph:link-bold" className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            </div>
          ) : (
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border h-full ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <Icon icon="ph:link-break" className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
              </div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Not linked to any collective</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onEdit(crop)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}>
            <Icon icon="ph:pencil-fill" className="w-3.5 h-3.5" />Edit
          </button>
          <button onClick={() => onDelete(crop)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${isDark ? 'border-red-900/30 text-red-400 hover:bg-red-900/30' : 'border-red-100 text-red-500 hover:bg-red-50'}`}>
            <Icon icon="ph:trash-fill" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── DetailPanel ───────────────────────────────────────────────────────────────
const DetailPanel = ({ crop, isDark, onEdit, onDelete, onRefresh }) => {
  const { toast } = useToast();
  const deal = crop?.dealCrop;
  const collective = deal?.membership?.collective ?? deal?.collective ?? null;
  const isLinked = !!deal;
  const meta = getSeasonMeta(crop?.crop?.season);
  const [panelTab, setPanelTab] = useState('overview');
  const [statusHistory, setStatusHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [updateForm, setUpdateForm] = useState({ stage: 'OTHER', note: '', imgUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinkChecked, setUnlinkChecked] = useState(false);

  useEffect(() => { setPanelTab('overview'); }, [crop?._id]);

  const loadHistory = useCallback(async () => {
    if (!deal?._id) return;
    setHistoryLoading(true);
    try { const res = await farmerDealAPI.getHistory(deal._id); setStatusHistory(res.data?.history || res.data?.data || []); }
    catch { setStatusHistory([]); } finally { setHistoryLoading(false); }
  }, [deal?._id]);

  useEffect(() => { if (panelTab === 'history') loadHistory(); }, [panelTab, loadHistory]);

  const handleUpdateStatus = async () => {
    if (!deal?._id) return;
    setSubmitting(true);
    try {
      await farmerDealAPI.updateStatus(deal._id, { stage: updateForm.stage, note: updateForm.note || undefined, imgUrl: updateForm.imgUrl || undefined });
      toast.success('Status update sent!');
      setUpdateForm({ stage: 'OTHER', note: '', imgUrl: '' });
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send update'); }
    finally { setSubmitting(false); }
  };

  const handleUnlink = () => {
    if (!deal?._id) return;
    setUnlinkChecked(false);
    setShowUnlinkModal(true);
  };

  const confirmUnlink = async () => {
    if (!deal?._id) return;
    setUnlinking(true);
    try { await farmerMemberAPI.terminate({ dealId: deal._id }); toast.success('Deal terminated'); onRefresh(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to terminate'); }
    finally { setUnlinking(false); setShowUnlinkModal(false); }
  };

  const PANEL_TABS = [
    { key: 'overview', label: 'Overview', icon: 'ph:info-bold' },
    ...(isLinked ? [
      { key: 'update',  label: 'Send Update', icon: 'ph:paper-plane-tilt-bold' },
      { key: 'history', label: 'History',     icon: 'ph:clock-counter-clockwise-bold' },
    ] : []),
  ];

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/40' : 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50'}`}>

      {/* Hero header — gradient + blurred bg image */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${meta.gradient}`} style={{ minHeight: '120px' }}>
        {/* Blurred background image */}
        {crop?.crop?.image && (
          <div className="absolute inset-0">
            <img src={crop.crop.image} alt="" className="w-full h-full object-cover scale-110" />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          </div>
        )}
        {!crop?.crop?.image && <div className="absolute inset-0 bg-black/20" />}
        <div className="relative z-10 p-5 pb-4">
          <div className="flex items-end gap-4">
            {/* Large image */}
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-white/20 ring-2 ring-white/30">
              {crop?.crop?.image
                ? <img src={crop.crop.image} alt={crop?.crop?.name} className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
                : null
              }
              <div className={`absolute inset-0 flex items-center justify-center text-white ${crop?.crop?.image ? 'hidden' : 'flex'}`}>
                <Icon icon={getCategoryIcon(crop?.crop?.category)} className="w-10 h-10 opacity-90" />
              </div>
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">{crop?.crop?.code}</p>
              <h2 className="text-xl font-bold text-white leading-tight truncate">{crop?.crop?.name}</h2>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-[10px] font-semibold text-white/80 bg-white/15 px-2 py-0.5 rounded-full">{crop?.crop?.category}</span>
                <span className="text-[10px] font-semibold text-white/80 bg-white/15 px-2 py-0.5 rounded-full">{crop?.crop?.season}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${crop?.status === 'ACTIVE' ? 'bg-emerald-400/40 text-white' : 'bg-white/15 text-white/70'}`}>{crop?.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className={`flex border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        {PANEL_TABS.map((t) => (
          <button key={t.key} onClick={() => setPanelTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold cursor-pointer transition-all border-b-2 ${
              panelTab === t.key ? 'border-emerald-500 text-emerald-500' : `border-transparent ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'}`
            }`}>
            <Icon icon={t.icon} className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* Body — no internal scroll, full height content */}
      <div className="p-4">
        <AnimatePresence mode="wait">

          {panelTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Crop stats */}
              <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Crop Details</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Est. Yield', value: `${crop.yield ?? '—'} kg` },
                    { label: 'Planted',    value: fmtDate(crop.plantedDate)  },
                    { label: 'Status',     value: crop.status                },
                    { label: 'Season',     value: crop.crop?.season ?? '—'  },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className={`text-[10px] font-semibold mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
                      <p className="text-sm font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {isLinked && deal ? (<>
                {collective && (
                  <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-emerald-950/30 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200/70'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-2.5">Linked Collective</p>
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-emerald-500/20 ring-1 ring-emerald-400/30">
                        {collective.profile
                          ? <img src={collective.profile} alt={collective.name} className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          : null
                        }
                        <div className={`absolute inset-0 flex items-center justify-center ${collective.profile ? 'hidden' : 'flex'}`}>
                          <Icon icon="ph:buildings-fill" className="w-6 h-6 text-emerald-500" />
                        </div>
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{collective.name}</p>
                        {collective.manager && <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{collective.manager}</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Deal Details</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: 'Agreed Price', value: deal.agreedPrice ? `₹${deal.agreedPrice}/kg` : '—' },
                      { label: 'Deal Status',  value: deal.status ?? '—'                                  },
                      { label: 'Stage',        value: STAGE_LABEL[deal.stage] ?? deal.stage ?? '—'        },
                      { label: 'Query',        value: deal.queryStatus ?? '—'                              },
                      { label: 'Approved',     value: fmtDate(deal.approvalDate)                           },
                      { label: 'Exp. Qty',     value: deal.expectedQuantity ? `${deal.expectedQuantity} kg` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className={`text-[10px] font-semibold mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
                        <p className="text-sm font-bold">{value}</p>
                      </div>
                    ))}
                  </div>
                  {deal.message && (
                    <div className={`mt-3 p-3 rounded-lg text-xs ${isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-white border border-slate-200 text-slate-600'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Message from Collective</p>
                      {deal.message}
                    </div>
                  )}
                </div>

                {(deal.status === 'APPROVED' || deal.status === 'REQUESTED') && (
                  <button onClick={handleUnlink} disabled={unlinking}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50">
                    {unlinking ? <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-4 h-4" /> : <Icon icon="ph:link-break-bold" className="w-4 h-4" />}
                    Terminate Deal with Collective
                  </button>
                )}
              </>) : (
                <div className={`rounded-xl p-4 border text-center ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
                  <Icon icon="ph:link-break" className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Not linked to any collective</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Browse Collectives to send a membership request.</p>
                </div>
              )}

              <div className={`flex gap-2 pt-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button onClick={() => onEdit(crop)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <Icon icon="ph:pencil-fill" className="w-4 h-4" />Edit Crop
                </button>
                <button onClick={() => onDelete(crop)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all ${isDark ? 'border-red-900/30 text-red-400 hover:bg-red-900/30' : 'border-red-100 text-red-500 hover:bg-red-50'}`}>
                  <Icon icon="ph:trash-fill" className="w-4 h-4" />Delete Crop
                </button>
              </div>
            </motion.div>
          )}

          {panelTab === 'update' && (
            <motion.div key="update" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3.5">
              <div className={`rounded-xl p-3 border flex items-start gap-2 ${isDark ? 'bg-blue-950/30 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                <Icon icon="ph:info-fill" className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Sending an update notifies the collective about your crop growth stage.</p>
              </div>
              <div>
                <label className={`text-xs font-semibold block mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Growth Stage *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STAGE_LABEL).map(([key, label]) => (
                    <button key={key} onClick={() => setUpdateForm(p => ({ ...p, stage: key }))}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer transition-all text-left ${
                        updateForm.stage === key ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>{label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Note (optional)</label>
                <textarea value={updateForm.note} onChange={(e) => setUpdateForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="e.g. Crop is growing well..." rows={3}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all resize-none ${isDark ? 'bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`} />
              </div>
              <div>
                <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Image URL (optional)</label>
                <div className="relative">
                  <Icon icon="ph:image-fill" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input type="url" value={updateForm.imgUrl} onChange={(e) => setUpdateForm(p => ({ ...p, imgUrl: e.target.value }))}
                    placeholder="https://..."
                    className={`w-full pl-10 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${isDark ? 'bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`} />
                </div>
              </div>
              <button onClick={handleUpdateStatus} disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0">
                {submitting ? <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-5 h-5" /> : <Icon icon="ph:paper-plane-tilt-fill" className="w-4 h-4" />}
                Send Update to Collective
              </button>
            </motion.div>
          )}

          {panelTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {historyLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-8 h-8 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                </div>
              ) : statusHistory.length === 0 ? (
                <div className="text-center py-10">
                  <Icon icon="ph:clock-counter-clockwise" className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                  <p className={`text-sm font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No history yet</p>
                </div>
              ) : (
                <div className="relative">
                  <div className={`absolute left-4 top-0 bottom-0 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  <div className="space-y-4 pl-10">
                    {statusHistory.map((h, i) => (
                      <div key={i} className="relative">
                        <div className={`absolute -left-[26px] w-4 h-4 rounded-full border-2 flex items-center justify-center ${isDark ? 'bg-slate-900 border-emerald-500' : 'bg-white border-emerald-400'}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <div className={`rounded-xl p-3 border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{STAGE_LABEL[h.stage] ?? h.stage}</span>
                            <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{fmtDT(h.updatedAt ?? h.createdAt)}</span>
                          </div>
                          {h.note && <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{h.note}</p>}
                          {h.imgUrl && <img src={h.imgUrl} alt="update" className="mt-2 w-full rounded-lg object-cover max-h-32" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmModal 
        isOpen={showUnlinkModal}
        onClose={() => setShowUnlinkModal(false)}
        onConfirm={confirmUnlink}
        title="Terminate Deal?"
        description="Are you sure you want to terminate this deal with the collective? This action cannot be undone."
        confirmLabel={unlinking ? "Terminating..." : "Terminate Deal"}
        variant="danger"
        icon="ph:link-break-bold"
        disableConfirm={!unlinkChecked}
      >
        <label className="flex items-center gap-2 mt-2 cursor-pointer p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <input 
            type="checkbox" 
            checked={unlinkChecked} 
            onChange={(e) => setUnlinkChecked(e.target.checked)} 
            className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-500"
          />
          <span className={`text-xs font-semibold ${isDark ? 'text-red-300' : 'text-red-700'}`}>
            Terminate deal with {collective?.name || 'the collective'}
          </span>
        </label>
      </ConfirmModal>
    </div>
  );
};

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTER_TABS = [
  { key: 'all',      label: 'All',      icon: 'ph:list-bullets-bold' },
  { key: 'linked',   label: 'Linked',   icon: 'ph:link-bold'         },
  { key: 'unlinked', label: 'Unlinked', icon: 'ph:link-break-bold'   },
  { key: 'inactive', label: 'Inactive', icon: 'ph:archive-bold'      },
];

// ── Main page ─────────────────────────────────────────────────────────────────
const CropManagement = () => {
  const { isDark } = useTheme();
  const { toast }  = useToast();
  const [crops, setCrops]           = useState([]);
  const [masterCrops, setMasterCrops] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('all');
  const [view, setView]             = useState('list');
  const [editingId, setEditingId]   = useState(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({ code: '', yld: '', plantedDate: '' });
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [cropToDelete, setCropToDelete] = useState(null);
  const [isDeleting, setIsDeleting]     = useState(false);
  const [deleteChecked, setDeleteChecked] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cropsRes, masterRes] = await Promise.all([farmerCropAPI.get(), commonAPI.getCrops()]);
      const cropData = cropsRes.data?.data?.cropData ?? cropsRes.data?.crops ?? [];
      setCrops(cropData);
      setMasterCrops(masterRes.data.crops || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load crops'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Keep selectedCrop fresh after data reload
  useEffect(() => {
    if (selectedCrop) {
      const updated = crops.find(c => c._id === selectedCrop._id);
      if (updated) setSelectedCrop(updated);
    }
  }, [crops]);

  const activeCrops   = crops.filter(c => c.status === 'ACTIVE');
  const linkedCrops   = activeCrops.filter(c => !!c.dealCrop);
  const unlinkedCrops = activeCrops.filter(c => !c.dealCrop);
  const inactiveCrops = crops.filter(c => c.status !== 'ACTIVE');
  const totalYield    = activeCrops.reduce((s, c) => s + (c.yield || 0), 0);
  const totalValue    = linkedCrops.reduce((s, c) => s + (c.yield || 0) * (c.dealCrop?.agreedPrice ?? 0), 0);

  const tabCrops  = { all: activeCrops, linked: linkedCrops, unlinked: unlinkedCrops, inactive: inactiveCrops };
  const tabCounts = { all: activeCrops.length, linked: linkedCrops.length, unlinked: unlinkedCrops.length, inactive: inactiveCrops.length };
  const displayedCrops = tabCrops[activeTab] || [];

  // Auto-select first crop when tab or crop list changes
  useEffect(() => {
    const list = tabCrops[activeTab] || [];
    if (list.length === 0) { setSelectedCrop(null); return; }
    const stillThere = list.find(c => c._id === selectedCrop?._id);
    if (!stillThere) setSelectedCrop(list[0]);
  }, [activeTab, crops]);

  const openAdd  = () => { setEditingId(null); setForm({ code: '', yld: '', plantedDate: '' }); setView('form'); };
  const openEdit = (crop) => {
    setEditingId(crop._id);
    const pd = crop.plantedDate ? new Date(crop.plantedDate).toISOString().split('T')[0] : '';
    setForm({ code: crop.crop?.code || '', yld: crop.yield || '', plantedDate: pd });
    setView('form');
  };
  const handleSave = async () => {
    if (!form.code || !form.yld) { toast.error('Crop and estimated yield are required'); return; }
    setSaving(true);
    try {
      if (editingId) { await farmerCropAPI.edit({ id: editingId, yld: Number(form.yld), plantedDate: form.plantedDate || undefined }); toast.success('Crop updated!'); }
      else           { await farmerCropAPI.add({ code: form.code, yld: Number(form.yld), plantedDate: form.plantedDate || undefined }); toast.success('Crop added!'); }
      setView('list'); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };
  const handleDelete = (crop) => {
    setCropToDelete(crop);
    setDeleteChecked(false);
  };

  const confirmDelete = async () => {
    if (!cropToDelete) return;
    setIsDeleting(true);
    try { 
      await farmerCropAPI.delete({ cropId: cropToDelete._id }); 
      toast.success('Crop removed'); 
      if (selectedCrop?._id === cropToDelete._id) setSelectedCrop(null);
      fetchData(); 
    }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to remove'); }
    finally { setIsDeleting(false); setCropToDelete(null); }
  };

  const lV = { initial: { x: -40, opacity: 0 }, enter: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } }, exit: { x: -40, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } } };
  const fV = { initial: { x:  40, opacity: 0 }, enter: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } }, exit: { x:  40, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } } };

  const STAT_CARDS = [
    { label: 'Active Crops', value: activeCrops.length,                                              icon: 'ph:plant-fill'         },
    { label: 'Total Yield',  value: `${totalYield} kg`,                                              icon: 'ph:scales-fill'        },
    { label: 'Est. Value',   value: totalValue > 0 ? `₹${(totalValue / 1000).toFixed(1)}k` : '₹0', icon: 'ph:currency-inr-fill' },
  ];

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div key="list" variants={lV} initial="initial" animate="enter" exit="exit">

            {/* ── Header: title + stat cards in one row ── */}
            <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">My Crops</h1>
                <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage your crops and track collective linkages</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {STAT_CARDS.map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className={`relative overflow-hidden flex items-center gap-3 rounded-2xl border px-4 py-3 ${isDark ? 'bg-slate-900/60 border-slate-800/60' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
                    <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-emerald-500 ${isDark ? 'bg-slate-800' : 'bg-emerald-50'}`}>
                      <Icon icon={s.icon} className="w-4 h-4" />
                    </div>
                    <div className="relative">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                      <p className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{s.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── Toolbar: filter tabs + Add Crop ── */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-slate-900/60 border border-slate-800' : 'bg-white border border-slate-200'}`}>
                {FILTER_TABS.map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${
                      activeTab === tab.key ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                        : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}>
                    <Icon icon={tab.icon} className="w-3.5 h-3.5" />
                    {tab.label}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key ? 'bg-white/25 text-white' : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                    }`}>{tabCounts[tab.key]}</span>
                  </button>
                ))}
              </div>
              <button onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold cursor-pointer shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300">
                <Icon icon="ph:plus-bold" className="w-4 h-4" />Add Crop
              </button>
            </div>

            {/* ── Content ── */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Icon icon="svg-spinners:12-dots-scale-rotate" className={`w-10 h-10 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
              </div>
            ) : displayedCrops.length === 0 ? (
              <EmptyState icon="ph:plant-fill"
                title={activeTab === 'all' ? 'No crops yet' : activeTab === 'linked' ? 'No linked crops' : activeTab === 'unlinked' ? 'All crops are linked!' : 'No inactive crops'}
                description={activeTab === 'all' ? 'Add a crop to let collectives know what you are growing.' : activeTab === 'linked' ? 'Browse collectives and send a membership request.' : activeTab === 'unlinked' ? 'All your crops are already linked.' : 'No crops have been deactivated yet.'}
                action={activeTab === 'all' ? (<button onClick={openAdd} className="px-4 py-2 mt-4 rounded-xl bg-emerald-500 text-white text-sm font-semibold cursor-pointer">Add First Crop</button>) : null}
              />
            ) : (
              /* 
                 Container height is dictated automatically by the Right panel (min viewport height).
                 Left panel is absolutely positioned to match this exact height, so it only scrolls internally 
                 if it exceeds the Right panel's height. 
              */
              <div className="relative flex justify-end min-h-[calc(100vh-120px)] w-full">
                {/* Left — absolute bounds match the container height automatically */}
                <div className="absolute top-0 left-0 bottom-0 right-[calc(38%+1.25rem)] overflow-y-auto pr-1"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: isDark ? '#334155 transparent' : '#cbd5e1 transparent' }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                      {displayedCrops.map((crop, i) => (
                        <CropCard key={crop._id} crop={crop} isDark={isDark} index={i} onEdit={openEdit} onDelete={handleDelete}
                          onSelect={(c) => setSelectedCrop(c)}
                          isSelected={selectedCrop?._id === crop._id} />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Right — static block, dictates the height of the parent relative container */}
                {selectedCrop && (
                  <div className="w-[38%] shrink-0">
                    <AnimatePresence mode="wait">
                      <motion.div key={selectedCrop._id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }}>
                        <DetailPanel crop={selectedCrop} isDark={isDark} onEdit={openEdit} onDelete={handleDelete} onRefresh={fetchData} />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="form" variants={fV} initial="initial" animate="enter" exit="exit" className="max-w-3xl mx-auto">
            <button onClick={() => setView('list')} className={`mb-6 flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors ${isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-500 hover:text-emerald-600'}`}>
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />Back to Crops
            </button>
            <div className={`rounded-2xl border p-6 sm:p-8 ${isDark ? 'bg-slate-900/50 border-slate-800/60 shadow-2xl shadow-black/20' : 'bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50'}`}>
              <h2 className="text-2xl font-bold mb-2">{editingId ? 'Edit Crop Details' : 'Register New Crop'}</h2>
              <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{editingId ? 'Update your estimated yield and planting date.' : 'Tell collectives what you plan to grow.'}</p>
              <div className="space-y-5">
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Crop (Master List) *</label>
                  <CropSelect crops={masterCrops} value={form.code} onChange={(code) => setForm(p => ({ ...p, code }))} disabled={!!editingId} placeholder="Select a crop from directory..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Estimated Yield (kg) *</label>
                    <div className="relative">
                      <Icon icon="ph:scales-fill" className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      <input type="number" value={form.yld} onChange={(e) => setForm(p => ({ ...p, yld: e.target.value }))} placeholder="e.g. 500"
                        className={`w-full pl-10 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${isDark ? 'bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'}`} />
                    </div>
                  </div>
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Planted Date</label>
                    <input type="date" value={form.plantedDate} onChange={(e) => setForm(p => ({ ...p, plantedDate: e.target.value }))}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${isDark ? 'bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'}`} />
                  </div>
                </div>
                <div className={`flex gap-4 pt-5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <button onClick={() => setView('list')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-colors ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer flex items-center justify-center gap-2 hover:from-emerald-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0">
                    {saving ? <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-5 h-5" /> : <Icon icon="ph:check-bold" className="w-4 h-4" />}
                    {editingId ? 'Save Changes' : 'Save Crop'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!cropToDelete}
        onClose={() => setCropToDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete ${cropToDelete?.crop?.name}?`}
        description={
          cropToDelete?.dealCrop 
            ? `This crop is currently linked to ${cropToDelete.dealCrop.collective?.name || 'a collective'}. Deleting it will permanently terminate your membership deal. This action cannot be undone.`
            : "Are you sure you want to delete this crop? This action cannot be undone."
        }
        confirmLabel={isDeleting ? "Deleting..." : "Delete Crop"}
        variant="danger"
        icon="ph:trash-fill"
        disableConfirm={!!cropToDelete?.dealCrop && !deleteChecked}
      >
        {cropToDelete?.dealCrop && (
          <label className="flex items-center gap-2 mt-2 cursor-pointer p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <input 
              type="checkbox" 
              checked={deleteChecked} 
              onChange={(e) => setDeleteChecked(e.target.checked)} 
              className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-500"
            />
            <span className={`text-xs font-semibold ${isDark ? 'text-red-300' : 'text-red-700'}`}>
              Terminate deal with {cropToDelete.dealCrop.collective?.name || 'the collective'}
            </span>
          </label>
        )}
      </ConfirmModal>
    </div>
  );
};

export default CropManagement;