import React, { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { driversData } from "../../utils/InterfaceData";
import StatusBadge from "../../components/common/StatusBadge";
import ConfirmModal from "../../components/common/ConfirmModal";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/ui";

const DriverManagement = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [drivers, setDrivers] = useState(driversData);
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    license: "",
    zones: [],
  });

  const ZONES = ["Zone A", "Zone B", "Zone C", "Zone D"];

  const handleSave = () => {
    if (!form.name || !form.phone) {
      toast.error("Name and phone are required");
      return;
    }
    if (editDriver) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === editDriver.id ? { ...d, ...form } : d)),
      );
      toast.success("Driver updated!");
    } else {
      setDrivers((prev) => [
        ...prev,
        {
          ...form,
          id: `drv_${Date.now()}`,
          status: "active",
          activePickups: 0,
          totalDeliveries: 0,
          profilePhoto: null,
          joinedDate: new Date().toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          }),
        },
      ]);
      toast.success("Driver added!");
    }
    setShowModal(false);
    setEditDriver(null);
    setForm({ name: "", phone: "", license: "", zones: [] });
  };

  const openEdit = (d) => {
    setEditDriver(d);
    setForm({
      name: d.name,
      phone: d.phone,
      license: d.license,
      zones: d.zones,
    });
    setShowModal(true);
  };
  const handleDeactivate = (id) => {
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: d.status === "active" ? "inactive" : "active" }
          : d,
      ),
    );
    toast.info("Driver status updated.");
  };
  const handleDelete = () => {
    setDrivers((prev) => prev.filter((d) => d.id !== deleteId));
    toast.info("Driver removed.");
    setDeleteId(null);
  };
  const toggleZone = (z) =>
    setForm((p) => ({
      ...p,
      zones: p.zones.includes(z)
        ? p.zones.filter((x) => x !== z)
        : [...p.zones, z],
    }));

  return (
    <div
      className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1
            className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Drivers
          </h1>
          <p
            className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            {drivers.filter((d) => d.status === "active").length} active ·{" "}
            {drivers.length} total
          </p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setEditDriver(null);
            setForm({ name: "", phone: "", license: "", zones: [] });
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          <Icon icon="ph:plus-bold" className="w-4 h-4" />
          Add Driver
        </button>
      </div>

      {drivers.length === 0 ? (
        <EmptyState
          icon="ph:truck-fill"
          title="No drivers added"
          description="Add drivers to start assigning them to pickup schedules."
          size="md"
          action={
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium cursor-pointer"
            >
              Add First Driver
            </button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {drivers.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {d.profilePhoto ? (
                    <img
                      src={d.profilePhoto}
                      alt={d.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}
                    >
                      {d.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p
                      className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {d.name}
                    </p>
                    <p
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {d.phone}
                    </p>
                  </div>
                </div>
                <StatusBadge status={d.status} size="sm" />
              </div>

              <div className="space-y-2 mb-4">
                <div
                  className={`flex items-center gap-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  <Icon
                    icon="ph:identification-badge-fill"
                    className="w-3.5 h-3.5 shrink-0"
                  />
                  License: {d.license}
                </div>
                <div
                  className={`flex items-center gap-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  <Icon
                    icon="ph:map-trifold-fill"
                    className="w-3.5 h-3.5 shrink-0"
                  />
                  {d.zones.join(", ")}
                </div>
                <div className="flex gap-2 mt-3">
                  <div
                    className={`flex-1 text-center py-2 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                  >
                    <p
                      className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {d.activePickups}
                    </p>
                    <p
                      className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Active
                    </p>
                  </div>
                  <div
                    className={`flex-1 text-center py-2 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                  >
                    <p
                      className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {d.totalDeliveries}
                    </p>
                    <p
                      className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Total
                    </p>
                  </div>
                  <div
                    className={`flex-1 text-center py-2 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                  >
                    <p
                      className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      {d.joinedDate}
                    </p>
                    <p
                      className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Joined
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border cursor-pointer ${isDark ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                >
                  <Icon
                    icon="ph:pencil-fill"
                    className="w-3.5 h-3.5 inline mr-1"
                  />
                  Edit
                </button>
                <button
                  onClick={() => handleDeactivate(d.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border cursor-pointer transition-all ${d.status === "active" ? (isDark ? "border-amber-800/40 text-amber-400 hover:bg-amber-500/10" : "border-amber-200 text-amber-600 hover:bg-amber-50") : isDark ? "border-emerald-800/40 text-emerald-400 hover:bg-emerald-500/10" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}
                >
                  {d.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => setDeleteId(d.id)}
                  className={`p-2 rounded-xl border cursor-pointer ${isDark ? "border-slate-700 text-slate-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-800/40" : "border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500"}`}
                >
                  <Icon icon="ph:trash-fill" className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl z-10 ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <h3
              className={`font-bold text-lg mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {editDriver ? "Edit Driver" : "Add Driver"}
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: "Full Name",
                  key: "name",
                  placeholder: "e.g. Suresh Kumar Thapa",
                },
                {
                  label: "Phone",
                  key: "phone",
                  placeholder: "+91 94500 12345",
                },
                {
                  label: "License Number",
                  key: "license",
                  placeholder: "UK07T1234",
                },
              ].map((f) => (
                <div key={f.key}>
                  <label
                    className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {f.label}
                  </label>
                  <input
                    value={form[f.key]}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [f.key]: e.target.value }))
                    }
                    placeholder={f.placeholder}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`}
                  />
                </div>
              ))}
              <div>
                <label
                  className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Assigned Zones
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ZONES.map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => toggleZone(z)}
                      className={`py-2 rounded-lg text-sm border cursor-pointer ${form.zones.includes(z) ? "bg-emerald-500 border-emerald-500 text-white" : isDark ? "border-slate-700 text-slate-400 hover:border-slate-500" : "border-slate-200 text-slate-500"}`}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm border cursor-pointer ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-linear-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer"
              >
                {editDriver ? "Save" : "Add Driver"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove driver?"
        description="This will remove the driver from your fleet."
        confirmLabel="Remove Driver"
        variant="danger"
        icon="ph:truck-fill"
      />
    </div>
  );
};

export default DriverManagement;
