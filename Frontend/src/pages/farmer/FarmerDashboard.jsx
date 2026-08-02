import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import StatusBadge from "../../components/common/StatusBadge";
import StatCard from "../../components/common/StatCard";
import { useToast } from "../../components/ui";
import {
  farmerDashboardAPI,
  farmerCropAPI,
  farmerPickupAPI,
  farmerNotifAPI,
} from "../../services/api";

const CHART_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

/** Formats currency and separates the magnitude unit (Thousand, Lakh, Crore) */
const getFormattedCurrencyParts = (amount) => {
  const num = Number(amount || 0);
  if (num <= 0) return { number: "₹0", unit: "" };
  if (num >= 10000000) {
    return {
      number: `₹${(num / 10000000).toFixed(2).replace(/\.00$/, "")}`,
      unit: "Crore",
    };
  }
  if (num >= 100000) {
    return {
      number: `₹${(num / 100000).toFixed(2).replace(/\.00$/, "")}`,
      unit: "Lakh",
    };
  }
  if (num >= 1000) {
    return {
      number: `₹${(num / 1000).toFixed(1).replace(/\.0$/, "")}`,
      unit: "Thousand",
    };
  }
  return { number: `₹${num.toLocaleString("en-IN")}`, unit: "" };
};

const FarmerDashboard = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeCrops: 0,
    activeDeals: 0,
    outstandingBalance: 0,
    upcomingPickups: 0,
  });
  const [balanceData, setBalanceData] = useState({
    totalBalance: 0,
    totalEarnings: 0,
    completedPickupsCount: 0,
  });
  const [crops, setCrops] = useState([]);
  const [allPickups, setAllPickups] = useState([]);
  const [pendingPickups, setPendingPickups] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, cropRes, pickRes, notifRes, balRes] = await Promise.all([
        farmerDashboardAPI.get().catch(() => ({ data: {} })),
        farmerCropAPI.get().catch(() => ({ data: {} })),
        farmerPickupAPI.getPickups().catch(() => ({ data: {} })),
        farmerNotifAPI.get().catch(() => ({ data: {} })),
        farmerPickupAPI.getBalance().catch(() => ({ data: {} })),
      ]);

      const pickupList =
        pickRes?.data?.pickups || pickRes?.data?.data?.pickups || [];
      const completedCount = pickupList.filter(
        (p) => p.status === "COMPLETED",
      ).length;
      const earnings = balRes?.data?.totalEarnings || 0;

      setStats(dashRes?.data?.stats || {});
      setBalanceData({
        totalBalance:
          balRes?.data?.totalBalance ||
          dashRes?.data?.stats?.outstandingBalance ||
          0,
        totalEarnings: earnings,
        completedPickupsCount: completedCount,
      });
      setCrops(cropRes?.data?.crops || cropRes?.data?.data?.cropData || []);
      setAllPickups(pickupList);
      setPendingPickups(
        pickupList.filter((p) =>
          ["SCHEDULED", "IN_PROGRESS"].includes(p.status),
        ),
      );
      setNotifications(notifRes?.data?.notifications || []);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load dashboard data",
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute 6 Months Payout Trend
  const monthlyTrendData = useMemo(() => {
    const monthsMap = new Map();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-IN", { month: "short" });
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthsMap.set(key, { month: label, earnings: 0 });
    }

    allPickups.forEach((p) => {
      if (p.status === "COMPLETED" && p.completedAt) {
        const d = new Date(p.completedAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthsMap.has(key)) {
          monthsMap.get(key).earnings += Number(p.totalAmount || 0);
        }
      }
    });

    return Array.from(monthsMap.values());
  }, [allPickups]);

  // Compute Pie Chart Data (Earnings Share by Crop or Active Crops Quantity)
  const pieChartData = useMemo(() => {
    const map = new Map();

    // 1. First attempt: Aggregate earnings from completed pickups
    allPickups.forEach((p) => {
      if (p.status === "COMPLETED" || p.completedAt) {
        if (Array.isArray(p.items) && p.items.length > 0) {
          p.items.forEach((item) => {
            const name =
              item.cropName ||
              item.cropCode ||
              item.cropDeal?.crop?.crop?.name ||
              "Crop";
            const val = Number(item.totalAmount || 0);
            if (val > 0) map.set(name, (map.get(name) || 0) + val);
          });
        } else {
          const name = p.cropName || p.cropDeal?.crop?.crop?.name || "Crop";
          const val = Number(p.totalAmount || 0);
          if (val > 0) map.set(name, (map.get(name) || 0) + val);
        }
      }
    });

    const earningsResult = Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
      unit: "currency",
    }));

    if (earningsResult.length > 0) return earningsResult;

    // 2. Second attempt: Plot active crops yield/quantity breakdown if no completed earnings yet
    const cropYieldMap = new Map();
    crops.forEach((c) => {
      const name = c.crop?.name || c.cropName || c.name || "Crop";
      const yieldVal = Number(
        c.availableQuantity ||
          c.yield ||
          (c.plantedArea ? c.plantedArea * 10 : 0) ||
          10,
      );
      cropYieldMap.set(name, (cropYieldMap.get(name) || 0) + yieldVal);
    });

    const cropResult = Array.from(cropYieldMap.entries()).map(
      ([name, value]) => ({
        name,
        value,
        unit: "quantity",
      }),
    );

    if (cropResult.length > 0) return cropResult;

    // 3. Fallback if no crops added yet
    return [];
  }, [allPickups, crops]);

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
          <Icon
            icon="svg-spinners:12-dots-scale-rotate"
            className="w-12 h-12 text-emerald-500"
          />
          <p className="text-sm font-medium text-slate-400">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  const farmerName = user?.name || user?.groupName || "Farmer";
  const firstName = farmerName.split(" ")[0];
  const linkedDealsCount = crops.filter((c) => c.dealCrop).length;

  return (
    <div
      className={`min-h-screen p-5 sm:p-7 space-y-7 transition-colors duration-200 ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-gradient-to-br from-slate-50 via-emerald-50/20 to-amber-50/20 text-slate-900"
      }`}
    >
      {/* Top Banner / Welcome Header */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${isDark ? "from-teal-700 via-emerald-700 to-green-800" : "from-teal-500 via-emerald-500 to-emerald-600/70"} p-6 sm:p-8 text-white shadow-2xl shadow-emerald-950/40`}
      >
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md">
              <Icon
                icon="ph:cloud-sun-fill"
                className="w-4 h-4 text-amber-300"
              />
              <span>Optimal Farming Conditions · Kedarnath Valley</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Good day, {firstName}! 🌾
            </h1>
            <p className="text-sm text-emerald-100 font-medium">
              Manage your active crop listings, monitor pickup schedules, and
              track collective deals all in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/dashboard/farmer/crops")}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 text-xs font-bold shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Icon icon="ph:plus-bold" className="w-4 h-4 text-emerald-600" />
              Add Crop
            </button>
            <button
              onClick={() => navigate("/dashboard/farmer/schedules")}
              className="px-4 py-2.5 rounded-xl bg-emerald-950/40 text-white text-xs font-bold border border-white/20 hover:bg-emerald-950/60 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <Icon icon="ph:truck-bold" className="w-4 h-4" />
              My Pickups
            </button>
          </div>
        </div>
      </div>

      {/* Primary Key Performance Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Crops"
          value={crops.length || stats.activeCrops || 0}
          icon="ph:plant-fill"
          sub="Listings live in pool"
          color="emerald"
          onClick={() => navigate("/dashboard/farmer/crops")}
        />

        <StatCard
          label="Total Lifetime Earnings"
          valueObj={getFormattedCurrencyParts(balanceData.totalEarnings)}
          icon="ph:currency-inr-bold"
          sub={`${balanceData.completedPickupsCount} Completed Pickups`}
          color="amber"
          onClick={() => navigate("/dashboard/farmer/schedules")}
        />

        <StatCard
          label="Pending Balance"
          valueObj={getFormattedCurrencyParts(
            balanceData.totalBalance || stats.outstandingBalance,
          )}
          icon="ph:wallet-fill"
          sub="Awaiting pickup & payout"
          color="blue"
          onClick={() => navigate("/dashboard/farmer/schedules")}
        />

        <StatCard
          label="Total Deals"
          value={stats.activeDeals || linkedDealsCount || 0}
          icon="ph:handshake-bold"
          sub="Linked with Collectives"
          color="violet"
          onClick={() => navigate("/dashboard/farmer/crops")}
        />
      </div>

      {/* Visual Analytics Section: Crop Earnings Pie Chart & Real Past 6 Months Trend */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Earnings Share by Crop (Pie Chart) */}
        <div
          className={`rounded-3xl border p-6 ${
            isDark
              ? "bg-slate-900/60 border-slate-800"
              : "bg-white/95 border-slate-200/90 shadow-sm"
          }`}
        >
          <div className="mb-4">
            <h2
              className={`text-base font-bold flex items-center gap-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              <Icon
                icon="ph:chart-pie-slice-fill"
                className="text-emerald-500 w-5 h-5"
              />
              Earnings Share by Crop
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Proportion of revenue generated per crop variety
            </p>
          </div>
          <div className="h-64 flex">
            {pieChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full h-full text-slate-400">
                <Icon
                  icon="ph:chart-pie-slice-duotone"
                  className="w-10 h-10 mb-2 opacity-50"
                />
                <p className="text-xs font-semibold">No crop data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    {...chartTheme.tooltip}
                    formatter={(val, name, item) => [
                      item?.payload?.unit === "currency"
                        ? `₹${Number(val).toLocaleString("en-IN")}`
                        : `${Number(val).toLocaleString("en-IN")} kg`,
                      item?.payload?.unit === "currency"
                        ? "Earnings"
                        : "Quantity",
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
            )}
          </div>
        </div>

        {/* Real 6 Months Payout & Harvest Trend (Bar Chart) */}
        <div
          className={`rounded-3xl border p-6 ${
            isDark
              ? "bg-slate-900/60 border-slate-800"
              : "bg-white/95 border-slate-200/90 shadow-sm"
          }`}
        >
          <div className="mb-4">
            <h2
              className={`text-base font-bold flex items-center gap-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              <Icon
                icon="ph:chart-bar-fill"
                className="text-blue-400 w-5 h-5"
              />
              Past 6 Months Payout Trend
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Actual monthly collection earnings from past 6 months
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData}>
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
                  formatter={(val) => [
                    `₹${Number(val).toLocaleString("en-IN")}`,
                    "Earnings",
                  ]}
                />
                <Bar
                  dataKey="earnings"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Grid: Crop Management & Side Panel */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Active Crops Overview & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Crops Summary */}
          <div
            className={`rounded-3xl border p-6 ${
              isDark
                ? "bg-slate-900/60 border-slate-800"
                : "bg-white/95 border-slate-200/90 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2
                  className={`text-lg font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  My Active Crops
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track crop growth stages and collective affiliations
                </p>
              </div>
              <button
                onClick={() => navigate("/dashboard/farmer/crops")}
                className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                Manage All{" "}
                <Icon icon="ph:arrow-right-bold" className="w-3.5 h-3.5" />
              </button>
            </div>

            {crops.length === 0 ? (
              <div
                className={`text-center py-10 border-2 border-dashed rounded-2xl ${
                  isDark
                    ? "border-slate-800 text-slate-500"
                    : "border-slate-200 text-slate-400"
                }`}
              >
                <Icon
                  icon="ph:plant-fill"
                  className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500"
                />
                <p className="text-sm font-semibold">
                  No active crops listed yet.
                </p>
                <button
                  onClick={() => navigate("/dashboard/farmer/crops")}
                  className="mt-3 text-xs text-emerald-500 font-bold hover:underline cursor-pointer"
                >
                  + Add your first crop
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {crops.slice(0, 4).map((crop) => {
                  const deal = crop.dealCrop;
                  const isScheduled = !!deal?.schedule?.activeSchedule;

                  return (
                    <div
                      key={crop._id}
                      onClick={() => navigate("/dashboard/farmer/crops")}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isDark
                          ? "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-emerald-500/40"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            isDark
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          <Icon icon="ph:plant-fill" className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3
                              className={`font-bold text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}
                            >
                              {crop.crop?.name || crop.name || "Crop"}
                            </h3>
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                              {crop.crop?.code || crop.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Est. Yield:{" "}
                            <span className="font-bold text-slate-700 dark:text-white">
                              {crop.yield || crop.availableQuantity || 0} kg
                            </span>{" "}
                            · Farmland: {crop.farmland || crop.plantedArea || 0}{" "}
                            ac
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isScheduled ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Icon
                              icon="ph:truck-bold"
                              className="w-3.5 h-3.5"
                            />{" "}
                            Scheduled
                          </span>
                        ) : (
                          <StatusBadge
                            status={crop.status || "ACTIVE"}
                            size="sm"
                          />
                        )}
                        <Icon
                          icon="ph:caret-right-bold"
                          className="w-4 h-4 text-slate-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div
              onClick={() => navigate("/dashboard/farmer/collectives")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                isDark
                  ? "bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40"
                  : "bg-white/95 border-slate-200 hover:shadow-md"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Icon icon="ph:buildings-bold" className="w-5 h-5" />
              </div>
              <div>
                <p
                  className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Collectives
                </p>
                <p className="text-[10px] text-slate-400">Browse & join</p>
              </div>
            </div>

            <div
              onClick={() => navigate("/dashboard/farmer/schedules")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                isDark
                  ? "bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40"
                  : "bg-white/95 border-slate-200 hover:shadow-md"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Icon icon="ph:calendar-check-bold" className="w-5 h-5" />
              </div>
              <div>
                <p
                  className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Pickup Schedules
                </p>
                <p className="text-[10px] text-slate-400">
                  View dates & status
                </p>
              </div>
            </div>

            <div
              onClick={() => navigate("/dashboard/farmer/announcements")}
              className={`col-span-2 sm:col-span-1 p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                isDark
                  ? "bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40"
                  : "bg-white/95 border-slate-200 hover:shadow-md"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <Icon icon="ph:megaphone-bold" className="w-5 h-5" />
              </div>
              <div>
                <p
                  className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Announcements
                </p>
                <p className="text-[10px] text-slate-400">Collective news</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Pickups & Notification Stream */}
        <div className="space-y-6">
          {/* Upcoming Pickup List */}
          <div
            className={`rounded-3xl border p-6 ${
              isDark
                ? "bg-slate-900/60 border-slate-800"
                : "bg-white/95 border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`text-base font-bold flex items-center gap-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <Icon
                  icon="ph:truck-bold"
                  className="text-emerald-500 w-5 h-5"
                />
                Upcoming Pickups
              </h2>
              <button
                onClick={() => navigate("/dashboard/farmer/schedules")}
                className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 cursor-pointer"
              >
                View all →
              </button>
            </div>

            {pendingPickups.length === 0 ? (
              <div
                className={`text-center py-6 text-xs ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                <Icon
                  icon="ph:calendar-blank-bold"
                  className="w-7 h-7 mx-auto mb-2 opacity-30"
                />
                No active pickup schedules pending.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPickups.slice(0, 3).map((p) => (
                  <div
                    key={p._id}
                    onClick={() => navigate("/dashboard/farmer/schedules")}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isDark
                        ? "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-xs text-emerald-500">
                        {p.code || p.schedule?.code || "SCHEDULE"}
                      </span>
                      <StatusBadge
                        status={p.status || p.schedule?.status || "SCHEDULED"}
                        size="sm"
                      />
                    </div>
                    <p
                      className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {p.collective?.name ||
                        p.cropDeal?.collective?.name ||
                        "Collective Pickup"}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>
                        {p.pickupDate || p.schedule?.pickupDate
                          ? new Date(
                              p.pickupDate || p.schedule?.pickupDate,
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })
                          : "—"}{" "}
                        ({p.time || p.schedule?.time || "09:00"})
                      </span>
                      <span className="font-bold text-emerald-500">
                        ₹{p.totalAmount || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Alerts Feed */}
          <div
            className={`rounded-3xl border p-6 ${
              isDark
                ? "bg-slate-900/60 border-slate-800"
                : "bg-white/95 border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`text-base font-bold flex items-center gap-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <Icon icon="ph:bell-bold" className="text-violet-400 w-5 h-5" />
                Alerts & Updates
              </h2>
              <button
                onClick={() => navigate("/dashboard/farmer/notifications")}
                className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 cursor-pointer"
              >
                View all →
              </button>
            </div>

            {notifications.length === 0 ? (
              <div
                className={`text-center py-6 text-xs ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                <Icon
                  icon="ph:bell-slash-bold"
                  className="w-7 h-7 mx-auto mb-2 opacity-30"
                />
                No recent notifications.
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.slice(0, 3).map((n) => (
                  <div
                    key={n._id}
                    onClick={() => navigate("/dashboard/farmer/notifications")}
                    className={`p-3 rounded-xl cursor-pointer transition-all text-xs flex items-start gap-3 ${
                      !n.isRead
                        ? isDark
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : "bg-emerald-50 border border-emerald-200"
                        : isDark
                          ? "bg-slate-800/30 border border-slate-800"
                          : "bg-slate-50 border border-slate-100"
                    }`}
                  >
                    <Icon
                      icon={
                        n.type === "PAYMENT"
                          ? "ph:currency-inr-bold"
                          : n.type === "PICKUP"
                            ? "ph:truck-bold"
                            : "ph:bell-bold"
                      }
                      className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {n.title}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {n.body || n.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
