import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ImageLightboxModal({ images, initialIndex = 0, title, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images]);

  if (!images || images.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 font-sans select-none" role="dialog" aria-modal="true" aria-labelledby="lightbox-title">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-20 text-white shrink-0">
        <div>
          <h3 id="lightbox-title" className="text-base sm:text-lg font-extrabold text-white tracking-tight">{title || 'Thư viện hình ảnh'}</h3>
          <p className="text-xs text-slate-400 font-medium">Hình {currentIndex + 1} / {images.length}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer backdrop-blur-md"
          aria-label="Đóng thư viện hình ảnh"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image Viewer Center Stage */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
        
        {/* Prev Arrow */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:left-6 z-20 p-3.5 rounded-xl bg-white/10 hover:bg-blue-600 text-white transition-all cursor-pointer backdrop-blur-md shadow-xl"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

        {/* Current Main Image */}
        <div className="max-w-5xl max-h-[75vh] w-full h-full flex items-center justify-center p-2">
          <img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`${title || 'Hình ảnh khách sạn'}, ảnh ${currentIndex + 1}`}
            className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>

        {/* Next Arrow */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-6 z-20 p-3.5 rounded-xl bg-white/10 hover:bg-blue-600 text-white transition-all cursor-pointer backdrop-blur-md shadow-xl"
            aria-label="Ảnh tiếp theo"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 shrink-0 z-20 max-w-4xl mx-auto w-full">
          {images.map((img, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                currentIndex === idx
                  ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/30'
                  : 'border-white/20 opacity-50 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Chọn ảnh ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

    </div>,
    document.body
  );
}
