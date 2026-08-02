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

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

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
        collectiveDashboardAPI.get(),
        collectiveScheduleAPI.get({ filter: "all" }),
        collectiveCropAPI.get(),
      ]);

      const schedulesList = schRes.data?.schedules || [];
      const inventory =
        cropRes.data?.data?.inventory || cropRes.data?.inventory || [];

      setStats(res.data.stats || {});
      setAllSchedules(schedulesList);
      setInventoryList(inventory);
      setUpcomingSchedules(
        schedulesList.filter(
          (s) => s.status === "SCHEDULED" || s.status === "IN_PROGRESS",
        ),
      );
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

  // ── 1. Real Past 6 Months Collection Trend ──────────────────────────────
  const monthlyHarvestData = useMemo(() => {
    const monthsMap = new Map();
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-IN", { month: "short" });
      monthsMap.set(key, { month: key, amount: 0, weight: 0 });
    }

    (allSchedules || []).forEach((s) => {
      if (s.pickupDate) {
        const d = new Date(s.pickupDate);
        const key = d.toLocaleDateString("en-IN", { month: "short" });
        if (monthsMap.has(key)) {
          const item = monthsMap.get(key);
          item.amount += Number(s.totalAmount || 0);
          item.weight += Number(s.totalQuantity || 0);
        }
      }
    });

    return Array.from(monthsMap.values());
  }, [allSchedules]);

  // ── 2. Real Inventory Quantity Share (by Crop) ───────────────────────────
  const inventoryQuantityShareData = useMemo(() => {
    const map = new Map();

    (inventoryList || []).forEach((item) => {
      const name = item.name || item.code || "Crop";
      map.set(name, (map.get(name) || 0) + Number(item.quantity || 0));
    });

    return Array.from(map.entries())
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({ name, value }));
  }, [inventoryList]);

  // ── 3. Real Revenue Distributed Share (by Crop) ──────────────────────────
  const revenueDistributedShareData = useMemo(() => {
    const map = new Map();

    (allSchedules || []).forEach((s) => {
      if (Array.isArray(s.items)) {
        s.items.forEach((item) => {
          const name = item.cropName || item.cropCode || "Crop";
          map.set(name, (map.get(name) || 0) + Number(item.totalAmount || 0));
        });
      }
    });

    return Array.from(map.entries())
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({ name, value }));
  }, [allSchedules]);

  // ── 4. Farmer Groups with Pending Payout Dues ──────────────────────────────
  const pendingDuesList = useMemo(() => {
    const map = new Map();

    (allSchedules || []).forEach((s) => {
      if (Array.isArray(s.items)) {
        s.items.forEach((item) => {
          if (item.status === "COLLECTED" && item.paymentStatus === "PENDING") {
            const fg = item.farmerGroup;
            const name =
              fg?.groupName ||
              fg?.leadFarmer ||
              item.farmerName ||
              "Farmer Group";
            const id = fg?._id?.toString() || fg?.toString() || name;

            if (!map.has(id)) {
              map.set(id, {
                id,
                name,
                phone: fg?.phone || "",
                profile: fg?.profile || "",
                totalPending: 0,
                itemCount: 0,
              });
            }
            const entry = map.get(id);
            entry.totalPending += Number(item.totalAmount || 0);
            entry.itemCount += 1;
          }
        });
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => b.totalPending - a.totalPending,
    );
  }, [allSchedules]);

  // Active Pie Chart Data based on Toggle Mode
  const activePieData =
    pieMode === "revenue"
      ? revenueDistributedShareData
      : inventoryQuantityShareData;

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
            Loading Collective Dashboard...
          </p>
        </div>
      </div>
    );
  }

  const collectiveTitle =
    user?.collectiveName || user?.name || "Garima Collective";

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
        className={`relative overflow-hidden rounded-3xl bg-linear-to-r ${isDark ? "from-teal-700 via-emerald-700 to-green-800" : "from-teal-500 via-emerald-500 to-emerald-600/70"} p-6 sm:p-8 text-white shadow-2xl shadow-emerald-950/40`}
      >
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md">
              <Icon
                icon="ph:buildings-fill"
                className="w-4 h-4 text-emerald-300"
              />
              <span>Collective Logistics & Operations Hub</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {collectiveTitle} 🏔️
            </h1>
            <p className="text-sm text-emerald-100 font-medium">
              Coordinate pickup schedules across zones, manage member farmer
              groups, and monitor crop logistics in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/dashboard/collective/schedules")}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 text-xs font-bold shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Icon
                icon="ph:calendar-plus-bold"
                className="w-4 h-4 text-emerald-700"
              />
              Schedule Pickup
            </button>
            <button
              onClick={() => navigate("/dashboard/collective/announcements")}
              className="px-4 py-2.5 rounded-xl bg-emerald-950/40 text-white text-xs font-bold border border-white/20 hover:bg-emerald-950/60 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <Icon icon="ph:megaphone-bold" className="w-4 h-4" />
              Broadcast Notice
            </button>
          </div>
        </div>
      </div>

      {/* Primary Key Performance Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Farmer Groups"
          valueObj={getFormattedNumberParts(stats.activeMembers || 0)}
          icon="ph:users-three-fill"
          sub="Active network members"
          color="emerald"
          onClick={() => navigate("/dashboard/collective/farmers")}
        />
        <StatCard
          label="Managed Crops"
          valueObj={getFormattedNumberParts(
            stats.totalCrops || inventoryList.length || 0,
          )}
          icon="ph:plant-fill"
          sub="Listed in inventory"
          color="blue"
          onClick={() => navigate("/dashboard/collective/inventory")}
        />
        <StatCard
          label="Active Zones"
          valueObj={getFormattedNumberParts(stats.activeZones || 0)}
          icon="ph:map-trifold-fill"
          sub="Altitude collection zones"
          color="amber"
          onClick={() => navigate("/dashboard/collective/zones")}
        />
        <StatCard
          label="Live Pickups"
          valueObj={getFormattedNumberParts(
            stats.upcomingPickups || upcomingSchedules.length || 0,
          )}
          icon="ph:truck-fill"
          sub="Active collection runs"
          color="violet"
          onClick={() => navigate("/dashboard/collective/schedules")}
        />
      </div>

      {/* Management Action Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => navigate("/dashboard/collective/inventory")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
            isDark
              ? "bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40"
              : "bg-white border-slate-200 hover:shadow-md"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Icon icon="ph:package-bold" className="w-5 h-5" />
          </div>
          <div>
            <p
              className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Crop Inventory
            </p>
            <p className="text-[10px] text-slate-400">
              Set prices & view pools
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate("/dashboard/collective/drivers")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
            isDark
              ? "bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40"
              : "bg-white border-slate-200 hover:shadow-md"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Icon icon="ph:steering-wheel-bold" className="w-5 h-5" />
          </div>
          <div>
            <p
              className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Driver Fleet
            </p>
            <p className="text-[10px] text-slate-400">
              Assign & manage drivers
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate("/dashboard/collective/history")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
            isDark
              ? "bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40"
              : "bg-white border-slate-200 hover:shadow-md"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Icon icon="ph:receipt-bold" className="w-5 h-5" />
          </div>
          <div>
            <p
              className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Payout History
            </p>
            <p className="text-[10px] text-slate-400">
              Farmer payments & receipts
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate("/dashboard/collective/zones")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
            isDark
              ? "bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40"
              : "bg-white border-slate-200 hover:shadow-md"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Icon icon="ph:map-pin-line-bold" className="w-5 h-5" />
          </div>
          <div>
            <p
              className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Zone Logistics
            </p>
            <p className="text-[10px] text-slate-400">
              Configure altitude zones
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Split Section: Live Dispatch Center (Half) & Pending Payout Dues (Half) */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: Live Dispatch Center */}
        <div
          className={`rounded-3xl border p-6 flex flex-col justify-between ${
            isDark
              ? "bg-slate-900/60 border-slate-800"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h2
                className={`font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Live Dispatch Center
              </h2>
            </div>
            <button
              onClick={() => navigate("/dashboard/collective/schedules")}
              className="text-xs font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer flex items-center gap-1"
            >
              All Runs →
            </button>
          </div>

          {upcomingSchedules.length === 0 ? (
            <div
              className={`text-center py-10 border-2 border-dashed rounded-2xl ${
                isDark
                  ? "border-slate-800 text-slate-500"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              <Icon
                icon="ph:truck-fill"
                className="w-9 h-9 mx-auto mb-2 opacity-30 text-emerald-500"
              />
              <p className="text-sm font-semibold">
                No active pickup runs pending.
              </p>
              <button
                onClick={() => navigate("/dashboard/collective/schedules")}
                className="mt-3 text-xs text-emerald-500 font-bold hover:underline cursor-pointer"
              >
                + Schedule pickup run
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSchedules.slice(0, 3).map((sch) => (
                <div
                  key={sch._id}
                  onClick={() => navigate("/dashboard/collective/schedules")}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isDark
                      ? "bg-slate-800/40 border-slate-700/60 hover:border-emerald-500/40"
                      : "bg-slate-50 border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <Icon
                        icon="ph:calendar-blank-bold"
                        className="w-3.5 h-3.5"
                      />
                      {new Date(sch.pickupDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        sch.status === "IN_PROGRESS"
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {sch.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 my-1.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isDark
                          ? "bg-slate-700 text-slate-300"
                          : "bg-white text-slate-700 shadow-sm"
                      }`}
                    >
                      <Icon
                        icon="ph:steering-wheel-bold"
                        className="w-4 h-4 text-emerald-400"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        Driver: {sch.driver?.name || "Unassigned"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        Zone: {sch.zone?.name || "—"} · Time:{" "}
                        {sch.time || "09:00"}
                      </p>
                    </div>
                  </div>

                  {sch.totalAmount > 0 && (
                    <div className="flex justify-between items-center pt-2 mt-1.5 border-t border-slate-700/40 text-xs">
                      <span className="text-slate-400">Est. Total Value:</span>
                      <span className="font-bold text-emerald-400">
                        ₹{sch.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pending Payout Dues */}
        <div
          className={`rounded-3xl border p-6 flex flex-col justify-between ${
            isDark
              ? "bg-slate-900/60 border-slate-800"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon icon="ph:wallet-bold" className="w-5 h-5 text-amber-400" />
              <h2
                className={`font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Pending Farmer Dues
              </h2>
            </div>
            <button
              onClick={() => navigate("/dashboard/collective/history")}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1"
            >
              Settle Payouts →
            </button>
          </div>

          {pendingDuesList.length === 0 ? (
            <div
              className={`text-center py-10 border-2 border-dashed rounded-2xl ${
                isDark
                  ? "border-slate-800 text-slate-500"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              <Icon
                icon="ph:check-circle-fill"
                className="w-9 h-9 mx-auto mb-2 opacity-40 text-emerald-400"
              />
              <p className="text-sm font-semibold text-emerald-400">
                All farmer payouts settled!
              </p>
              <p className="text-xs text-slate-400 mt-1">
                No outstanding dues pending across farmer groups.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDuesList.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isDark
                      ? "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isDark
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <Icon icon="ph:user-bold" className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        Ph: {item.phone || "—"} · {item.itemCount} Crop Item(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-black text-amber-400">
                        ₹{item.totalPending.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Pending
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/dashboard/collective/history")}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      Pay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Real Data Visual Analytics Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Toggleable Pie Chart Widget for Crop Share Breakdown */}
        <div
          className={`rounded-3xl border p-6 ${
            isDark
              ? "bg-slate-900/60 border-slate-800"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2
                className={`text-base font-bold flex items-center gap-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <Icon
                  icon={
                    pieMode === "revenue"
                      ? "ph:currency-inr-bold"
                      : "ph:package-fill"
                  }
                  className="text-emerald-500 w-5 h-5"
                />
                Crop Share Breakdown
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {pieMode === "revenue"
                  ? "Settled revenue distribution (₹) across completed schedule crops"
                  : "Total available crop weight (kg) in collective inventory"}
              </p>
            </div>

            {/* Toggle Switch */}
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 ${
                isDark
                  ? "bg-slate-800 border-slate-700/60"
                  : "bg-slate-100 border-slate-200"
              }`}
            >
              <button
                onClick={() => setPieMode("revenue")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pieMode === "revenue"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : isDark
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Revenue (₹)
              </button>
              <button
                onClick={() => setPieMode("quantity")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pieMode === "quantity"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : isDark
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Quantity (kg)
              </button>
            </div>
          </div>

          <div className="h-64 flex">
            {activePieData.length === 0 ? (
              <div className="flex items-center justify-center w-full text-xs text-slate-500 italic">
                No crop data available to calculate share.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {activePieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    {...chartTheme.tooltip}
                    formatter={(val) => [
                      pieMode === "revenue"
                        ? `₹${Number(val).toLocaleString("en-IN")}`
                        : `${Number(val).toLocaleString("en-IN")} kg`,
                      pieMode === "revenue"
                        ? "Settled Revenue"
                        : "Inventory Quantity",
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

        {/* Real Past 6 Months Collection Trend */}
        <div
          className={`rounded-3xl border p-6 ${
            isDark
              ? "bg-slate-900/60 border-slate-800"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="mb-4">
            <h2
              className={`font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Past 6 Months Payout & Collection Trend
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Actual collection valuation over past 6 months
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyHarvestData}>
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
                    "Collection Value",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{
                    r: 6,
                    stroke: "#10b981",
                    strokeWidth: 2,
                    fill: isDark ? "#0f172a" : "#fff",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectiveDashboard;
