import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "../context/ThemeContext";
import PageHeader from "../components/PageHeader";
import FarmerGroupCard from "../components/FarmerGroupCard";
import { farmerGroups } from "../utils/InterfaceData";

const STATUS_FILTERS = ["All", "Ready", "Monitoring"];

const Collection = () => {
  const { isDark } = useTheme();
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredGroups = useMemo(() => {
    return farmerGroups.filter((g) => {
      const matchesStatus = statusFilter === "All" || g.status === statusFilter;
      const matchesSearch =
        !search ||
        g.groupName.toLowerCase().includes(search.toLowerCase()) ||
        g.leadFarmer.toLowerCase().includes(search.toLowerCase()) ||
        g.crops.some((c) => c.toLowerCase().includes(search.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [statusFilter, search]);

  const readyCount = farmerGroups.filter((g) => g.status === "Ready").length;

  return (
    <div
      className={`w-full min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <PageHeader
        eyebrow="Collection Hub"
        icon="ph:basket-fill"
        title="Track every group's collection status"
        description={`${farmerGroups.length} farmer groups across four altitude zones — ${readyCount} currently ready for collection.`}
        isDark={isDark}
      />

      <section className="px-6 sm:px-10 lg:px-20 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10">
            <div className="relative flex-1 max-w-sm">
              <Icon
                icon="ph:magnifying-glass"
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search group, farmer, or crop…"
                className={`w-full rounded-xl border text-sm pl-10 pr-4 py-2.5 outline-none transition-all duration-200
                  focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                  ${
                    isDark
                      ? "bg-slate-900/60 text-slate-100 placeholder:text-slate-500 border-slate-800 hover:border-slate-700"
                      : "bg-white text-slate-900 placeholder:text-slate-400 border-slate-200 hover:border-slate-300"
                  }`}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                    statusFilter === s
                      ? isDark
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-emerald-600 border-emerald-600 text-white"
                      : isDark
                        ? "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {filteredGroups.length > 0 ? (
            <div className="flex flex-wrap gap-8 md:gap-x-[5%] md:gap-y-12 justify-center sm:justify-start">
              {filteredGroups.map((group) => (
                <FarmerGroupCard key={group.id} group={group} isDark={isDark} />
              ))}
            </div>
          ) : (
            <div
              className={`text-center py-20 rounded-2xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
            >
              <Icon
                icon="ph:plant"
                className={`w-10 h-10 mx-auto mb-3 ${isDark ? "text-slate-700" : "text-slate-300"}`}
              />
              <p
                className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                No groups match your search. Try a different name or crop.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Collection;
