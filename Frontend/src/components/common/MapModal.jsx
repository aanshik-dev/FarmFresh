import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Map click handler component
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

const MapModal = ({
  isDark,
  open,
  onClose,
  onConfirm,
  initialPos,
  initialCenter,
}) => {
  const [tempPos, setTempPos] = useState(initialPos);
  const [center] = useState(initialCenter || [30.7333, 79.0667]);

  useEffect(() => {
    setTempPos(initialPos);
  }, [initialPos, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className={`relative z-10 w-full max-w-2xl rounded-2xl border overflow-hidden shadow-2xl ${
          isDark
            ? "bg-slate-900 border-slate-700 shadow-black/60"
            : "bg-white border-slate-200"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-slate-700/80" : "border-slate-200"}`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 rounded-lg ${isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}
            >
              <Icon icon="ph:map-trifold-fill" className="w-4 h-4" />
            </div>
            <div>
              <p
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Choose Location on Map
              </p>
              <p
                className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                Click anywhere to pin your location
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${isDark ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-100"}`}
          >
            <Icon icon="ph:x-bold" className="w-4 h-4" />
          </button>
        </div>

        {/* Map */}
        <div className="h-80 relative">
          <MapContainer
            center={tempPos ? [tempPos.lat, tempPos.lng] : center}
            zoom={tempPos ? 13 : 8}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={(latlng) => setTempPos(latlng)} />
            {tempPos && <Marker position={[tempPos.lat, tempPos.lng]} />}
          </MapContainer>

          {!tempPos && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[999]">
              <div
                className={`rounded-xl px-5 py-3 text-center border backdrop-blur-sm ${isDark ? "bg-slate-900/85 border-slate-700" : "bg-white/85 border-slate-200"}`}
              >
                <Icon
                  icon="ph:map-pin-fill"
                  className="w-7 h-7 text-emerald-400 mx-auto mb-1"
                />
                <p
                  className={`text-xs font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}
                >
                  Click the map to pin location
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-t gap-3 ${isDark ? "border-slate-700/80 bg-slate-900/60" : "border-slate-200 bg-slate-50"}`}
        >
          <span
            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            {tempPos ? (
              <>
                Pinned:{" "}
                <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                  {tempPos.lat.toFixed(5)}, {tempPos.lng.toFixed(5)}
                </span>
              </>
            ) : (
              "No location selected"
            )}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm font-medium border cursor-pointer transition-colors ${isDark ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"}`}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!tempPos}
              onClick={() => {
                onConfirm(tempPos);
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MapModal;
