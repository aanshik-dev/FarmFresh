import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

const CropTagInput = ({ selected, onChange, crops, isDark, inputCls }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const suggestions = crops.filter(
    (crop) =>
      !selected.includes(crop.code) &&
      (query.trim() === "" ||
        crop.name.toLowerCase().includes(query.toLowerCase())),
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addCrop = (crop) => {
    if (!selected.includes(crop.code)) onChange([...selected, crop.code]);
    setQuery("");
    setOpen(false);
  };

  const removeCrop = (code) => onChange(selected.filter((c) => c !== code));

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) addCrop(suggestions[0]);
    }
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative space-y-2">
      {/* Selected tags — shows the crop name but the code is stored in state */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((code) => {
            const crop = crops.find((c) => c.code === code);
            return (
              <span
                key={code}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                  isDark
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-emerald-50 border-emerald-300 text-emerald-700"
                }`}
              >
                <Icon icon="ph:plant-fill" className="w-3 h-3" />
                {crop?.name ?? code}
                <button
                  type="button"
                  onClick={() => removeCrop(code)}
                  className="ml-0.5 hover:text-red-400 cursor-pointer transition-colors"
                >
                  <Icon icon="ph:x-bold" className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Icon
          icon="ph:magnifying-glass-fill"
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type to search crops…"
          className={`${inputCls} pl-9`}
        />
      </div>

      {/* Dropdown suggestions — shows crop name, clicking stores the code */}
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 top-full mt-1 w-full rounded-xl border max-h-50 shadow-xl overflow-auto scrollbar-thin ${
              isDark
                ? "bg-slate-900 border-slate-700 shadow-black/40"
                : "bg-white border-slate-200 shadow-slate-200/60"
            }`}
          >
            {suggestions.map((crop, i) => (
              <button
                key={crop.code}
                type="button"
                onMouseDown={() => addCrop(crop)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                  isDark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-700 hover:bg-slate-50"
                } ${i !== 0 ? (isDark ? "border-t border-slate-800" : "border-t border-slate-100") : ""}`}
              >
                <Icon
                  icon="ph:plant-fill"
                  className="w-4 h-4 text-emerald-500 shrink-0"
                />
                <span className="flex-1">{crop.name}</span>
                <span
                  className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}
                >
                  {crop.category}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {selected.length === 0 && (
        <p
          className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}
        >
          No crops added yet. Search and click to add.
        </p>
      )}
    </div>
  );
};

export default CropTagInput;
