import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs shadow-lg ${
        isDark ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"
      }`}
    >
      <p className="font-semibold mb-0.5">{label}</p>
      <p className={isDark ? "text-emerald-400" : "text-emerald-600"}>{payload[0].value.toLocaleString()} kg</p>
    </div>
  );
};

const HarvestTrendChart = ({ data, isDark }) => {
  const gridColor = isDark ? "#1e293b" : "#e2e8f0";
  const axisColor = isDark ? "#64748b" : "#94a3b8";

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="harvestFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="month" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ stroke: "#34d399", strokeWidth: 1, strokeOpacity: 0.3 }} />
          <Area
            type="monotone"
            dataKey="kg"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#harvestFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HarvestTrendChart;
