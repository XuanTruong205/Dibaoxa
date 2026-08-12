import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

export default function RoomCardPhotoSlider({ images, roomName, onOpenLightbox }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!images || images.length === 0) return null;

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full lg:w-80 shrink-0 space-y-2 group/slider">
      {/* Main Large Image Container */}
      <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-md group">
        <button type="button" onClick={() => onOpenLightbox(images, activeIdx, roomName)} className="absolute inset-0 w-full h-full" aria-label={`Phóng to ảnh ${activeIdx + 1} của ${roomName}`}>
          <img
            key={activeIdx}
            src={images[activeIdx]}
            alt={`${roomName}, ảnh ${activeIdx + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </button>

        {/* Previous Arrow Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md opacity-0 group-hover/slider:opacity-100 focus:opacity-100 transition-opacity duration-200 cursor-pointer"
            aria-label="Ảnh phòng trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Next Arrow Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md opacity-0 group-hover/slider:opacity-100 focus:opacity-100 transition-opacity duration-200 cursor-pointer"
            aria-label="Ảnh phòng tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

      </div>

      {/* Thumbnails Row below for easy switching */}
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`w-14 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                activeIdx === i ? 'border-blue-600 scale-105 shadow-sm' : 'border-slate-200 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Chọn ảnh ${i + 1} của ${roomName}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
