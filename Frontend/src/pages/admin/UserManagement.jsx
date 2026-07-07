import React, { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import StatusBadge from "../../components/common/StatusBadge";
import { useToast } from "../../components/ui";

const ROLES = ["All", "FARMER_GROUP", "COLLECTIVE", "ADMIN"];

const UserManagement = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users", {
          // If using auth, keep credentials or add token header
          // credentials: "include",
        });
        const data = await response.json();
        console.log("👥 UserManagement — /api/users response:", data);
        setAllUsers(data);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = allUsers.filter(
    (u) =>
      (roleFilter === "All" || u.role === roleFilter) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())),
  );

  const ROLE_COLORS = {
    FARMER_GROUP: isDark
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
      : "bg-emerald-50 text-emerald-700 border-emerald-200",
    COLLECTIVE: isDark
      ? "bg-blue-500/15 text-blue-400 border-blue-500/25"
      : "bg-blue-50 text-blue-700 border-blue-200",
    ADMIN: isDark
      ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
      : "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div
      className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <div className="mb-6">
        <h1
          className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
        >
          User Management
        </h1>
        <p
          className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          {allUsers.length} users on the platform
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Icon
            icon="ph:magnifying-glass-fill"
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          />
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none ${isDark ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`}
          />
        </div>
        <div
          className={`flex gap-1 p-1 rounded-xl ${isDark ? "bg-slate-800/70" : "bg-slate-100"}`}
        >
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${roleFilter === r ? "bg-linear-to-r from-violet-500 to-purple-600 text-white shadow" : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}
            >
              {r === "All" ? "All" : r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <table className="w-full text-sm">
          <thead className={isDark ? "bg-slate-800/50" : "bg-slate-50"}>
            <tr>
              {["User", "Role", "Email", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className={`text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-100"}`}
          >
            {filtered.map((u, i) => (
              <motion.tr
                key={u.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className={
                  isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"
                }
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {u.photo ? (
                      <img
                        src={u.photo}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}
                      >
                        {u.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p
                        className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {u.name.length > 22
                          ? u.name.substring(0, 22) + "…"
                          : u.name}
                      </p>
                      <p
                        className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {u.subName}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${ROLE_COLORS[u.role]}`}
                  >
                    {u.role.replace("_", " ")}
                  </span>
                </td>
                <td
                  className={`px-5 py-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  {u.email}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={u.status} size="sm" />
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-1">
                    <button
                      className={`p-1.5 rounded-lg cursor-pointer text-xs ${isDark ? "hover:bg-slate-700 text-slate-400 hover:text-slate-200" : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"}`}
                      title="View details"
                    >
                      <Icon icon="ph:eye-fill" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toast.info(`${u.name} status updated.`)}
                      className={`p-1.5 rounded-lg cursor-pointer ${isDark ? "hover:bg-amber-500/10 text-slate-400 hover:text-amber-400" : "hover:bg-amber-50 text-slate-400 hover:text-amber-500"}`}
                      title="Suspend user"
                    >
                      <Icon icon="ph:pause-circle-fill" className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div
            className={`text-center py-10 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            No users match this filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
