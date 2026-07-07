import React, { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { collectivesList } from "../../utils/InterfaceData";
import { useToast } from "../../components/ui";
import ConfirmModal from "../../components/common/ConfirmModal";
import StatusBadge from "../../components/common/StatusBadge";

const CropInventory = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [crops, setCrops] = useState(
    collectivesList[0].crops.map((c, i) => ({
      ...c,
      id: `c_${i}`,
      lowStockThreshold: 100,
    })),
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: "", pricePerKg: "", stock: "" });

  const handleSave = () => {
    if (!form.name || !form.pricePerKg) {
      toast.error("Name and price are required");
      return;
    }
    if (editingId) {
      setCrops((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                ...form,
                pricePerKg: Number(form.pricePerKg),
                stock: Number(form.stock),
              }
            : c,
        ),
      );
      toast.success("Crop updated!");
      setEditingId(null);
    } else {
      setCrops((prev) => [
        ...prev,
        {
          ...form,
          id: `c_${Date.now()}`,
          pricePerKg: Number(form.pricePerKg),
          stock: Number(form.stock),
          lowStockThreshold: 100,
        },
      ]);
      toast.success("Crop added!");
      setShowAddModal(false);
    }
    setForm({ name: "", pricePerKg: "", stock: "" });
  };

  const handleEdit = (crop) => {
    setEditingId(crop.id);
    setForm({
      name: crop.name,
      pricePerKg: String(crop.pricePerKg),
      stock: String(crop.stock),
    });
    setShowAddModal(true);
  };

  const handleDelete = () => {
    setCrops((prev) => prev.filter((c) => c.id !== deleteId));
    toast.info("Crop removed from inventory.");
    setDeleteId(null);
  };

  const totalStock = crops.reduce((s, c) => s + c.stock, 0);
  const totalValue = crops.reduce((s, c) => s + c.stock * c.pricePerKg, 0);

  return (
    <div
      className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1
            className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Crop Inventory
          </h1>
          <p
            className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Manage your procurement crops, prices, and stock
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setEditingId(null);
            setForm({ name: "", pricePerKg: "", stock: "" });
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          <Icon icon="ph:plus-bold" className="w-4 h-4" />
          Add Crop
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total Crops",
            value: crops.length,
            icon: "ph:leaf-fill",
            color: "text-emerald-400 bg-emerald-500/10",
          },
          {
            label: "Total Stock",
            value: `${totalStock} kg`,
            icon: "ph:package-fill",
            color: "text-blue-400 bg-blue-500/10",
          },
          {
            label: "Est. Value",
            value: `₹${(totalValue / 1000).toFixed(1)}k`,
            icon: "ph:currency-inr-fill",
            color: "text-amber-400 bg-amber-500/10",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border p-4 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}
            >
              <Icon icon={s.icon} className="w-5 h-5" />
            </div>
            <p
              className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {s.value}
            </p>
            <p
              className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Crop table */}
      <div
        className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <table className="w-full text-sm">
          <thead className={isDark ? "bg-slate-800/50" : "bg-slate-50"}>
            <tr>
              {[
                "Crop Name",
                "Price/kg",
                "Current Stock",
                "Est. Value",
                "Status",
                "Actions",
              ].map((h) => (
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
            {crops.map((crop, i) => (
              <motion.tr
                key={crop.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={
                  isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"
                }
              >
                <td
                  className={`px-5 py-4 font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {crop.name}
                  </div>
                </td>
                <td
                  className={`px-5 py-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  ₹{crop.pricePerKg}/kg
                </td>
                <td
                  className={`px-5 py-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {crop.stock} kg
                </td>
                <td
                  className={`px-5 py-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  ₹{(crop.stock * crop.pricePerKg).toLocaleString("en-IN")}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge
                    status={
                      crop.stock <= crop.lowStockThreshold
                        ? "low_stock"
                        : "in_stock"
                    }
                    size="sm"
                  />
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(crop)}
                      className={`p-1.5 rounded-lg cursor-pointer ${isDark ? "hover:bg-slate-700 text-slate-400 hover:text-slate-200" : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"}`}
                    >
                      <Icon icon="ph:pencil-fill" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(crop.id)}
                      className={`p-1.5 rounded-lg cursor-pointer ${isDark ? "hover:bg-red-500/10 text-slate-400 hover:text-red-400" : "hover:bg-red-50 text-slate-400 hover:text-red-500"}`}
                    >
                      <Icon icon="ph:trash-fill" className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl z-10 ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <h3
              className={`font-bold text-lg mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {editingId ? "Edit Crop" : "Add Crop"}
            </h3>
            <div className="space-y-3">
              <div>
                <label
                  className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Crop Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Rajma"
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Price (₹/kg) *
                  </label>
                  <input
                    type="number"
                    value={form.pricePerKg}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, pricePerKg: e.target.value }))
                    }
                    placeholder="120"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label
                    className={`text-sm font-medium mb-1.5 block ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Current Stock (kg)
                  </label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, stock: e.target.value }))
                    }
                    placeholder="0"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowAddModal(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm border cursor-pointer ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-linear-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer"
              >
                {editingId ? "Save Changes" : "Add Crop"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove crop?"
        description="This will remove the crop from your inventory. This cannot be undone."
        confirmLabel="Remove"
        variant="danger"
        icon="ph:trash-fill"
      />
    </div>
  );
};

export default CropInventory;
