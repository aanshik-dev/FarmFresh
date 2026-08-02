import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import StatCard from "../../components/common/StatCard";
import { useToast } from "../../components/ui";
import {
  collectiveDashboardAPI,
  collectiveScheduleAPI,
  collectiveCropAPI,
} from "../../services/api";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

/** Formats currency/numbers and separates magnitude units (Thousand, Lakh, Crore) */
const getFormattedNumberParts = (numVal, isCurrency = false) => {
  const num = Number(numVal || 0);
  const prefix = isCurrency ? "₹" : "";
  if (num <= 0) return { number: `${prefix}0`, unit: "" };
  if (num >= 10000000) {
    return {
      number: `${prefix}${(num / 10000000).toFixed(2).replace(/\.00$/, "")}`,
      unit: "Crore",
    };
  }
  if (num >= 100000) {
    return {
      number: `${prefix}${(num / 100000).toFixed(2).replace(/\.00$/, "")}`,
      unit: "Lakh",
    };
  }
  if (num >= 1000) {
    return {
      number: `${prefix}${(num / 1000).toFixed(1).replace(/\.0$/, "")}`,
      unit: "Thousand",
    };
  }
  return { number: `${prefix}${num.toLocaleString("en-IN")}`, unit: "" };
};

const CollectiveDashboard = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [allSchedules, setAllSchedules] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [pieMode, setPieMode] = useState("revenue"); // "revenue" | "quantity"

  const [stats, setStats] = useState({
    totalCrops: 0,
    activeZones: 0,
    activeDrivers: 0,
    upcomingPickups: 0,
    activeMembers: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, schRes, cropRes] = await Promise.all([
        collectiveDashboardAPI.get().catch(() => ({ data: {} })),
        collectiveScheduleAPI.get({ filter: "all" }).catch(() => ({ data: {} })),
        collectiveCropAPI.get().catch(() => ({ data: {} })),
      ]);

      const schedulesList = schRes.data?.schedules || [];
      const inventory = cropRes.data?.data?.inventory || cropRes.data?.inventory || [];

      setStats(res.data?.stats || {});
      setAllSchedules(schedulesList);
      setInventoryList(inventory);
      setUpcomingSchedules(
        schedulesList.filter((s) => s.status === "SCHEDULED" || s.status === "IN_PROGRESS")
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate total managed revenue & total volume
  const totalVolume = useMemo(() => {
    return inventoryList.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  }, [inventoryList]);

  const totalEstRevenue = useMemo(() => {
    return inventoryList.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
  }, [inventoryList]);

  // Compute 6 Months Harvest & Revenue Trend
  const monthlyTrendData = useMemo(() => {
    const monthsMap = new Map();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-IN", { month: "short" });
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthsMap.set(key, { month: label, revenue: 0, quantity: 0 });
    }

    allSchedules.forEach((s) => {
      if (s.status === "COMPLETED" && (s.completedAt || s.pickupDate)) {
        const d = new Date(s.completedAt || s.pickupDate);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthsMap.has(key)) {
          const m = monthsMap.get(key);
          m.revenue += Number(s.totalAmount || 0);
          m.quantity += Number(s.totalQuantity || 0);
        }
      }
    });

    return Array.from(monthsMap.values());
  }, [allSchedules]);

  // Compute Crop Distribution (Revenue vs Quantity mode)
  const cropPieData = useMemo(() => {
    const map = new Map();
    inventoryList.forEach((item) => {
      const name = item.cropName || item.crop?.name || "Crop";
      const val = pieMode === "revenue"
        ? Number(item.quantity || 0) * Number(item.price || 0)
        : Number(item.quantity || 0);
      if (val > 0) map.set(name, (map.get(name) || 0) + val);
    });

    const result = Array.from(map.entries()).map(([name, value]) => ({ name, value }));

    if (result.length > 0) return result;

    return [
      { name: "Rajma", value: pieMode === "revenue" ? 45000 : 350 },
      { name: "Potato", value: pieMode === "revenue" ? 28000 : 500 },
      { name: "Ginger", value: pieMode === "revenue" ? 35000 : 200 },
    ];
  }, [inventoryList, pieMode]);

  const chartTheme = isDark
    ? {
        text: "#94a3b8",
        grid: "#1e293b",
        tooltip: {
          contentStyle: {
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 12,
            color: "#f1f5f9",
          },
        },
      }
    : {
        text: "#64748b",
        grid: "#f1f5f9",
        tooltip: {
          contentStyle: {
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            color: "#1e293b",
          },
        },
      };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-5 ${
          isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-12 h-12 text-emerald-500" />
          <p className="text-sm font-medium text-slate-400">Loading Collective Dashboard...</p>
        </div>
      </div>
    );
  }

  const collectiveName = user?.collectiveName || user?.name || "Collective Hub";

  return (
    <div
      className={`min-h-screen p-5 sm:p-7 space-y-7 transition-colors duration-200 ${
        isDark ? "bg-slate-950 text-white" : "bg-gradient-to-br from-slate-50 via-emerald-50/20 to-amber-50/20 text-slate-900"
      }`}
    >
      {/* Top Banner / Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 p-6 sm:p-8 text-white shadow-2xl shadow-emerald-900/30">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md">
              <Icon icon="ph:buildings-fill" className="w-4 h-4 text-emerald-300" />
              <span>Collective Logistics Operations</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {collectiveName} Dashboard 🚚
            </h1>
            <p className="text-sm text-emerald-100 font-medium">
              Monitor regional farmer group inventory, manage pickup logistics, assign drivers, and track revenue distribution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/dashboard/collective/schedules")}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 text-xs font-bold shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Icon icon="ph:calendar-plus-bold" className="w-4 h-4 text-emerald-600" />
              Schedule Pickup
            </button>
            <button
              onClick={() => navigate("/dashboard/collective/announcements")}
              className="px-4 py-2.5 rounded-xl bg-emerald-950/40 text-white text-xs font-bold border border-white/20 hover:bg-emerald-950/60 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <Icon icon="ph:megaphone-bold" className="w-4 h-4" />
              Make Announcement
            </button>
          </div>
        </div>
      </div>

      {/* Primary Key Performance Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Managed Inventory Volume"
          valueObj={getFormattedNumberParts(totalVolume, false)}
          icon="ph:plant-fill"
          sub="Total kg across active inventory"
          color="emerald"
          onClick={() => navigate("/dashboard/collective/crops")}
        />

        <StatCard
          label="Est. Inventory Revenue"
          valueObj={getFormattedNumberParts(totalEstRevenue, true)}
          icon="ph:currency-inr-bold"
          sub="Valuation at agreed crop prices"
          color="amber"
          onClick={() => navigate("/dashboard/collective/crops")}
        />

        <StatCard
          label="Active Driver Fleet"
          value={stats.activeDrivers || 0}
          icon="ph:truck-bold"
          sub="Logistics drivers assigned"
          color="blue"
          onClick={() => navigate("/dashboard/collective/drivers")}
        />

        <StatCard
          label="Partner Farmer Groups"
          value={stats.activeMembers || stats.farmerGroupsCount || 0}
          icon="ph:users-three-bold"
          sub="Connected farmer groups"
          color="violet"
          onClick={() => navigate("/dashboard/collective/members")}
        />
      </div>

      {/* Visual Analytics Section: 6 Months Trend & Crop Revenue Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Past 6 Months Collection Trend (Line Chart) */}
        <div
          className={`rounded-3xl border p-6 ${
            isDark ? "bg-slate-900/60 border-slate-800" : "bg-white/95 border-slate-200/90 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2
                className={`text-base font-bold flex items-center gap-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <Icon icon="ph:chart-line-up-bold" className="text-emerald-500 w-5 h-5" />
                Collection & Revenue Trend
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Past 6 months completed pickup revenue trajectory
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData}>
                <XAxis
                  dataKey="month"
                  stroke={chartTheme.text}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={chartTheme.text}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
                />
                <Tooltip
                  {...chartTheme.tooltip}
                  formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: isDark ? "#0f172a" : "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crop Distribution Pie Chart */}
        <div
          className={`rounded-3xl border p-6 ${
            isDark ? "bg-slate-900/60 border-slate-800" : "bg-white/95 border-slate-200/90 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2
                className={`text-base font-bold flex items-center gap-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <Icon icon="ph:chart-pie-slice-bold" className="text-amber-500 w-5 h-5" />
                Inventory Crop Distribution
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Breakdown of active stock across crops
              </p>
            </div>

            <div className={`flex gap-1 p-1 rounded-xl border text-[11px] font-bold ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}>
              <button
                onClick={() => setPieMode("revenue")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  pieMode === "revenue"
                    ? "bg-emerald-500 text-white"
                    : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setPieMode("quantity")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  pieMode === "quantity"
                    ? "bg-emerald-500 text-white"
                    : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Qty (kg)
              </button>
            </div>
          </div>

          <div className="h-64 flex">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cropPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {cropPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  {...chartTheme.tooltip}
                  formatter={(val) => [
                    pieMode === "revenue" ? `₹${Number(val).toLocaleString("en-IN")}` : `${val} kg`,
                    pieMode === "revenue" ? "Revenue" : "Quantity",
                  ]}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", color: chartTheme.text }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Pickup Operations & Quick Navigation */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Upcoming Pickup Operations List */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className={`rounded-3xl border p-6 ${
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-white/95 border-slate-200/90 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2
                  className={`text-lg font-bold flex items-center gap-2 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  <Icon icon="ph:truck-bold" className="text-emerald-500 w-5 h-5" />
                  Upcoming Pickup Operations
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Scheduled runs assigned to drivers and zones
                </p>
              </div>
              <button
                onClick={() => navigate("/dashboard/collective/schedules")}
                className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                Manage All <Icon icon="ph:arrow-right-bold" className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingSchedules.length === 0 ? (
              <div
                className={`text-center py-10 border-2 border-dashed rounded-2xl ${
                  isDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"
                }`}
              >
                <Icon icon="ph:truck-bold" className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500" />
                <p className="text-sm font-semibold">No upcoming pickups scheduled.</p>
                <button
                  onClick={() => navigate("/dashboard/collective/schedules")}
                  className="mt-3 text-xs text-emerald-500 font-bold hover:underline cursor-pointer"
                >
                  + Schedule a new pickup run
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {upcomingSchedules.slice(0, 4).map((sch) => (
                  <div
                    key={sch._id}
                    onClick={() => navigate("/dashboard/collective/schedules")}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isDark
                        ? "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-emerald-500/40"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs text-emerald-500">
                        {sch.code || "SCHEDULE"}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          sch.status === "IN_PROGRESS"
                            ? "bg-blue-500/15 text-blue-500 border border-blue-500/30"
                            : "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                        }`}
                      >
                        {sch.status}
                      </span>
                    </div>

                    <p className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                      Driver: {sch.driver?.name || "Unassigned"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Zone: {sch.zone?.name || "General"} · Time: {sch.time || "09:00"}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-slate-800">
                      <span className="text-slate-400">
                        {sch.pickupDate
                          ? new Date(sch.pickupDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })
                          : "—"}
                      </span>
                      <span className="font-bold text-emerald-500">₹{sch.totalAmount || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Management Navigation */}
        <div className="space-y-4">
          <div
            onClick={() => navigate("/dashboard/collective/crops")}
            className={`p-5 rounded-3xl border cursor-pointer transition-all flex items-center gap-4 ${
              isDark
                ? "bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40"
                : "bg-white/95 border-slate-200 shadow-sm hover:shadow-md"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <Icon icon="ph:plant-bold" className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>Crop Inventory</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage stock & demand rates</p>
            </div>
          </div>

          <div
            onClick={() => navigate("/dashboard/collective/zones")}
            className={`p-5 rounded-3xl border cursor-pointer transition-all flex items-center gap-4 ${
              isDark
                ? "bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40"
                : "bg-white/95 border-slate-200 shadow-sm hover:shadow-md"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
              <Icon icon="ph:map-trifold-bold" className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>Zone Management</h3>
              <p className="text-xs text-slate-400 mt-0.5">Configure collection regions</p>
            </div>
          </div>

          <div
            onClick={() => navigate("/dashboard/collective/drivers")}
            className={`p-5 rounded-3xl border cursor-pointer transition-all flex items-center gap-4 ${
              isDark
                ? "bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40"
                : "bg-white/95 border-slate-200 shadow-sm hover:shadow-md"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
              <Icon icon="ph:truck-bold" className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>Driver Fleet</h3>
              <p className="text-xs text-slate-400 mt-0.5">Assign drivers to pickup runs</p>
            </div>
          </div>

          <div
            onClick={() => navigate("/dashboard/collective/members")}
            className={`p-5 rounded-3xl border cursor-pointer transition-all flex items-center gap-4 ${
              isDark
                ? "bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40"
                : "bg-white/95 border-slate-200 shadow-sm hover:shadow-md"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0">
              <Icon icon="ph:users-three-bold" className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>Farmer Groups</h3>
              <p className="text-xs text-slate-400 mt-0.5">Partner memberships & deals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectiveDashboard;
