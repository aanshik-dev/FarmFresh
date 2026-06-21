import React from "react";
import {
  LineChart,
  Line,
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
      <p className="text-amber-400">{payload[0].value}% decay</p>
    </div>
  );
};

const DecayLineChart = ({ data, isDark }) => {
  const gridColor = isDark ? "#1e293b" : "#e2e8f0";
  const axisColor = isDark ? "#64748b" : "#94a3b8";

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="month" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} width={40} unit="%" />
          <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ stroke: "#fbbf24", strokeWidth: 1, strokeOpacity: 0.3 }} />
          <Line
            type="monotone"
            dataKey="decay"
            stroke="#fbbf24"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#fbbf24", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DecayLineChart;
