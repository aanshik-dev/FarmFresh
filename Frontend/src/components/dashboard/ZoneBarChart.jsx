import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const ZONE_COLORS = ["#34d399", "#fbbf24", "#22d3ee", "#a78bfa"];

const CustomTooltip = ({ active, payload, isDark }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs shadow-lg space-y-0.5 ${
        isDark ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"
      }`}
    >
      <p className="font-semibold">{d.zone}</p>
      <p className={isDark ? "text-slate-400" : "text-slate-500"}>{d.altitude}</p>
      <p className={isDark ? "text-emerald-400" : "text-emerald-600"}>{d.kg.toLocaleString()} kg · {d.groups} groups</p>
    </div>
  );
};

const ZoneBarChart = ({ data, isDark }) => {
  const gridColor = isDark ? "#1e293b" : "#e2e8f0";
  const axisColor = isDark ? "#64748b" : "#94a3b8";

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="zone" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: isDark ? "#ffffff08" : "#00000006" }} />
          <Bar dataKey="kg" radius={[8, 8, 0, 0]} maxBarSize={56}>
            {data.map((entry, i) => (
              <Cell key={entry.zone} fill={ZONE_COLORS[i % ZONE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ZoneBarChart;
