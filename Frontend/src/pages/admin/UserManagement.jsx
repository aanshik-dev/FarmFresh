import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { adminAPI } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";
import { useToast, Loader, Input } from "../../components/ui";

const ROLES = ["All", "FARMER_GROUP", "COLLECTIVE", "ADMIN"];

const ROLE_COLORS = {
  FARMER_GROUP: {
    dark: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    light: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  COLLECTIVE: {
    dark: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    light: "bg-blue-50 text-blue-700 border-blue-200",
  },
  ADMIN: {
    dark: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    light: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

const UserManagement = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await adminAPI.getUsers();
        setUsers(res.data.users);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    setTogglingId(id);
    try {
      await adminAPI.updateUserStatus(id, { isActive: !currentStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: !currentStatus } : u))
      );
      toast.success(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user status");
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    const matchSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.uid?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <Loader size="lg" />
        <p className={`mt-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading Users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-600"}`}>
        <Icon icon="ph:warning-circle-fill" className="w-12 h-12 text-red-500 mb-2" />
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600">Retry</button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>User Management</h1>
        <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{users.length} users on the platform</p>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-5">
        <div className="w-full sm:flex-1 sm:min-w-64">
          <Input
            icon="ph:magnifying-glass"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={`flex flex-wrap gap-1 p-1 rounded-xl w-full sm:w-auto ${isDark ? "bg-slate-800/70" : "bg-slate-100"}`}>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex-1 sm:flex-none ${
                roleFilter === r
                  ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {r === "All" ? "All" : r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[768px] text-sm">
            <thead className={isDark ? "bg-slate-800/50" : "bg-slate-50"}>
              <tr>
                {["User", "Role", "Email & Contact", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className={`text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-100"}`}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <Icon icon="ph:users-three-duotone" className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
                    <p className={isDark ? "text-slate-500" : "text-slate-400"}>No users found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className={`transition-colors ${isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50/50"}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                          {u.profile ? (
                            <img src={u.profile} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <Icon icon={u.role === "FARMER_GROUP" ? "ph:plant-fill" : u.role === "COLLECTIVE" ? "ph:buildings-fill" : "ph:shield-star-fill"} className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{u.name}</p>
                          <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{u.sub}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${ROLE_COLORS[u.role]?.[isDark ? "dark" : "light"]}`}>
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>{u.email}</p>
                      {u.phone && <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{u.phone}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={u.isActive ? "active" : "inactive"} size="sm" />
                    </td>
                    <td className="px-5 py-4">
                      {u.role !== "ADMIN" && (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.isActive)}
                          disabled={togglingId === u.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5
                            ${u.isActive
                              ? isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100"
                              : isDark ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            }`}
                        >
                          {togglingId === u.id ? (
                            <Icon icon="ph:spinner-gap" className="animate-spin w-4 h-4" />
                          ) : (
                            <Icon icon={u.isActive ? "ph:x-circle-bold" : "ph:check-circle-bold"} className="w-4 h-4" />
                          )}
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
