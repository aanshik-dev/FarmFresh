import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CROP_COLORS = ["#10b981", "#fbbf24", "#34d399", "#f59e0b", "#22d3ee", "#94a3b8"];

const CustomTooltip = ({ active, payload, isDark }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs shadow-lg ${
        isDark ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"
      }`}
    >
      <p className="font-semibold">{d.name}</p>
      <p style={{ color: d.payload.fill }}>{d.value}% of total yield</p>
    </div>
  );
};

const renderLegend = (props, isDark) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-3 text-xs">
      {payload.map((entry) => (
        <li key={entry.value} className={`flex items-center gap-1.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </li>
      ))}
    </ul>
  );
};

const CropDonutChart = ({ data, isDark }) => {
  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={CROP_COLORS[i % CROP_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip isDark={isDark} />} />
          <Legend content={(props) => renderLegend(props, isDark)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CropDonutChart;
