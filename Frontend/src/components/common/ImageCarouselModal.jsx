import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

const ImageCarouselModal = ({ isOpen, onClose, images = [], initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || !images || images.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Content Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-between"
        >
          {/* Header Bar */}
          <div className="w-full flex items-center justify-between px-2 py-3 text-white mb-2">
            <span className="text-xs sm:text-sm font-semibold tracking-wider px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 backdrop-blur">
              {currentIndex + 1} / {images.length}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Icon icon="ph:x-bold" className="w-5 h-5" />
            </button>
          </div>

          {/* Main Image Display */}
          <div className="relative w-full flex-1 flex items-center justify-center min-h-[300px] sm:min-h-[450px]">
            {/* Left Navigation Arrow */}
            {images.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-slate-900/70 hover:bg-emerald-600 text-white border border-slate-700 transition-all cursor-pointer shadow-lg hover:scale-110"
              >
                <Icon icon="ph:caret-left-bold" className="w-6 h-6" />
              </button>
            )}

            {/* Active Image */}
            <motion.img
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              src={images[currentIndex]}
              alt={`Crop Photo ${currentIndex + 1}`}
              className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-slate-800/80"
            />

            {/* Right Navigation Arrow */}
            {images.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-slate-900/70 hover:bg-emerald-600 text-white border border-slate-700 transition-all cursor-pointer shadow-lg hover:scale-110"
              >
                <Icon icon="ph:caret-right-bold" className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Navigation Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto max-w-full py-2 px-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    idx === currentIndex
                      ? "border-emerald-500 scale-105 ring-2 ring-emerald-500/30"
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ImageCarouselModal;
