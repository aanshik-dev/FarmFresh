import React, { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { pickupSchedules, farmerNotifications } from "../../utils/InterfaceData";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";

const FarmerSchedules = () => {
  const { isDark } = useTheme();
  const [view, setView] = useState("list"); // list | upcoming
  
  const mySchedules = pickupSchedules.filter(s => s.farmerGroupId === "fg_001");
  const upcoming = mySchedules.filter(s => ["scheduled", "in_progress"].includes(s.status));
  const past = mySchedules.filter(s => ["completed", "cancelled"].includes(s.status));

  const ScheduleCard = ({ s }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-2xl border p-5 transition-all ${isDark ? "bg-slate-900/60 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:shadow-md"}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{s.crop}</h3>
            <StatusBadge status={s.status} />
          </div>
          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.collective}</p>
        </div>
        <div className={`text-right shrink-0 px-3 py-2 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
          <p className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{new Date(s.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.time}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: "ph:scales-fill", label: "Quantity", value: `${s.quantity} kg` },
          { icon: "ph:truck-fill", label: "Driver", value: s.driver.split(" ")[0] },
          { icon: "ph:map-trifold-fill", label: "Zone", value: s.zone },
        ].map(d => (
          <div key={d.label} className={`flex flex-col items-center text-center p-2 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
            <Icon icon={d.icon} className={`w-4 h-4 mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
            <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{d.label}</p>
            <p className={`text-xs font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{d.value}</p>
          </div>
        ))}
      </div>

      {s.notes && (
        <div className={`mt-3 p-2.5 rounded-lg text-xs ${isDark ? "bg-slate-800/40 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
          <Icon icon="ph:note-fill" className="w-3 h-3 inline mr-1" />
          {s.notes}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Pickup Schedules</h1>
          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{mySchedules.length} total pickups</p>
        </div>
        <div className={`flex gap-1 p-1 rounded-xl ${isDark ? "bg-slate-800/70" : "bg-slate-100"}`}>
          {[{ id: "list", label: "All" }, { id: "upcoming", label: "Upcoming" }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${view === v.id ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow" : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}>{v.label}</button>
          ))}
        </div>
      </div>

      {view === "upcoming" ? (
        upcoming.length === 0 ? (
          <EmptyState icon="ph:calendar-fill" title="No upcoming pickups" description="Pickups will appear here once scheduled by your collective." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {upcoming.map(s => <ScheduleCard key={s.id} s={s} />)}
          </div>
        )
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-8">
              <h2 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Upcoming</h2>
              <div className="grid sm:grid-cols-2 gap-5">{upcoming.map(s => <ScheduleCard key={s.id} s={s} />)}</div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Past</h2>
              <div className="grid sm:grid-cols-2 gap-5 opacity-70">{past.map(s => <ScheduleCard key={s.id} s={s} />)}</div>
            </div>
          )}
          {mySchedules.length === 0 && <EmptyState icon="ph:calendar-fill" title="No schedules yet" description="Your pickups will appear here once a collective schedules them." />}
        </>
      )}
    </div>
  );
};

export default FarmerSchedules;
