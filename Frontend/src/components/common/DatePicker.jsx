import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const parseISO = (v) => {
  if (!v) return null;
  const d = new Date(`${v}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
};

const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const fmtDisplay = (v) => {
  const d = parseISO(v);
  if (!d) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const DatePicker = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date",
  className = "",
  id,
}) => {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => startOfDay(parseISO(value) || new Date()));
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open) {
      setViewDate(startOfDay(parseISO(value) || new Date()));
    }
    setOpen((p) => !p);
  };

  const selected = parseISO(value);
  const today = startOfDay(new Date());
  const min = parseISO(minDate);
  const max = parseISO(maxDate);

  const y = viewDate.getFullYear();
  const m = viewDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pick = (day) => {
    const d = new Date(y, m, day);
    if (min && d < min) return;
    if (max && d > max) return;
    onChange(toISO(d));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-2 text-left cursor-pointer ${className}`}
      >
        <span className={value ? "" : "opacity-60"}>
          {value ? fmtDisplay(value) : placeholder}
        </span>
        <Icon
          icon={open ? "ph:calendar-blank-bold" : "ph:calendar-blank"}
          className="w-4 h-4 shrink-0 opacity-70"
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl border shadow-2xl backdrop-blur-xl ${
            isDark
              ? "bg-slate-900 border-slate-700/80"
              : "bg-white border-slate-200 shadow-slate-200/60"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <button
              type="button"
              onClick={() => setViewDate(new Date(y, m - 1, 1))}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-300 hover:bg-slate-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              aria-label="Previous month"
            >
              <Icon icon="ph:caret-left-bold" className="w-4 h-4" />
            </button>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
              {MONTHS[m]} {y}
            </p>
            <button
              type="button"
              onClick={() => setViewDate(new Date(y, m + 1, 1))}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-300 hover:bg-slate-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              aria-label="Next month"
            >
              <Icon icon="ph:caret-right-bold" className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 px-3">
            {WEEKDAYS.map((w) => (
              <span
                key={w}
                className={`text-[10px] font-bold text-center py-1 uppercase ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1 p-3">
            {cells.map((day, i) => {
              if (day === null) return <span key={`e${i}`} />;
              const d = new Date(y, m, day);
              const disabled = (min && d < min) || (max && d > max);
              const isToday = d.getTime() === today.getTime();
              const isSelected = selected && d.getTime() === selected.getTime();
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(day)}
                  className={`h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
                    isSelected
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30"
                      : isToday
                        ? isDark
                          ? "text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/10"
                          : "text-emerald-600 border border-emerald-400/50 hover:bg-emerald-50"
                        : isDark
                          ? "text-slate-300 hover:bg-slate-800"
                          : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
