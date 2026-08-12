import { Compass, Maximize2, RotateCw, X } from 'lucide-react';
import React, { useState } from 'react';

export default function Room360Modal({ room, onClose }) {
  const [rotation, setRotation] = useState(0);

  const rotateLeft = () => setRotation((prev) => prev - 45);
  const rotateRight = () => setRotation((prev) => prev + 45);

  return (
    <div className="modal-backdrop">
      <div className="glass-card max-w-4xl w-full p-6 relative overflow-hidden border border-slate-200 shadow-2xl bg-white rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="room-panorama-title">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 id="room-panorama-title" className="text-xl font-bold text-slate-900 tracking-tight">Ảnh không gian: {room?.name}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Dùng nút điều khiển để xem thêm góc không gian trước khi đặt.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all"
            aria-label="Đóng góc nhìn toàn cảnh"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 360 View Area */}
        <div className="relative h-[420px] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group flex items-center justify-center">
          <img
            src={room?.images?.[0] || '/images/dibaoxa-coastal-resort.webp'}
            alt={`Không gian ${room?.name || 'phòng khách sạn'}`}
            className="w-full h-full object-cover transition-transform duration-500 ease-out"
            style={{ transform: `scale(1.1) rotate(${rotation}deg)` }}
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-slate-900/10 pointer-events-none"></div>

          {/* Rotation Controls */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-lg">
            <button
              type="button"
              onClick={rotateLeft}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <RotateCw className="w-4 h-4 transform -scale-x-100" />
              Xoay Trái
            </button>
            <div className="h-5 w-px bg-slate-200"></div>
            <button
              type="button"
              onClick={rotateRight}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <RotateCw className="w-4 h-4" />
              Xoay Phải
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-medium">
          <span className="flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5 text-blue-600" />Diện tích: {room?.area_sqm ? `${room.area_sqm} m²` : 'Đang cập nhật'}</span>
          <span className="flex items-center gap-1"><Compass className="w-3.5 h-3.5 text-blue-600" />Hướng nhìn: {room?.view_type || 'Đang cập nhật'}</span>
          <span>Giường: {room?.bed_type || 'Đang cập nhật'}</span>
          <span>Sức chứa: {room?.max_occupancy ? `Tối đa ${room.max_occupancy} khách` : 'Đang cập nhật'}</span>
          <span className="text-blue-700 font-extrabold text-sm tracking-tight">
            {room?.price_per_night?.toLocaleString('vi-VN')} đ / đêm
          </span>
        </div>

      </div>
    </div>
  );
}
