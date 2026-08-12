import {
  Bed,
  Check,
  CheckCircle2,
  Eye,
  Lock,
  Maximize2,
  Minus,
  Plus,
  Users,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export default function RoomDetailModal({ room, hotel, checkIn, checkOut, onClose, onConfirmBooking }) {
  const [selectedImg, setSelectedImg] = useState(
    room.images && room.images.length > 0 ? room.images[0] : hotel.cover_image
  );
  const [quantity, setQuantity] = useState(1);

  if (!room) return null;

  const roomServices = room.room_services && room.room_services.length > 0
    ? room.room_services
    : [];

  const handleIncrement = () => setQuantity((q) => Math.min(q + 1, room.available_count || 1));
  const handleDecrement = () => setQuantity((q) => Math.max(q - 1, 1));

  const handleConfirm = () => {
    onConfirmBooking(room, quantity);
  };

  return createPortal(
    <div className="modal-backdrop">
      <div className="bg-white max-w-4xl w-full rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden flex flex-col md:flex-row max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="room-detail-title">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100/90 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all font-bold cursor-pointer"
          aria-label="Đóng chi tiết phòng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Large Main Image + Gallery Carousel */}
        <div className="md:w-1/2 bg-slate-100 p-6 flex flex-col justify-between space-y-4">
          <div className="relative h-72 md:h-80 w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            <img
              src={selectedImg}
              alt={room.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails Row */}
          {room.images && room.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {room.images.map((imgUrl, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setSelectedImg(imgUrl)}
                  className={`w-16 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedImg === imgUrl ? 'border-cyan-500 scale-105 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`${room.name}, ảnh ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Specs, Services & Quantity Counter */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          
          <div className="space-y-5">
            {/* Title */}
            <h2 id="room-detail-title" className="text-2xl font-extrabold text-slate-900 leading-tight">
              {room.name || 'Superior City View'}
            </h2>

            {/* Room Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-cyan-600" />
                <span>{room.area_sqm || 32} m²</span>
              </div>

              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-cyan-600" />
                <span>{room.bed_type || 'Twin/Queen'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-600" />
                <span>{room.view_type || 'Đang cập nhật'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-600" />
                <span>Tối đa: {room.max_occupancy || 2} khách</span>
              </div>
            </div>

            {/* In-Room Services 2-Column Checklist */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-slate-500">
                Dịch vụ & Tiện nghi có sẵn ở phòng:
              </h4>

              <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                {roomServices.slice(0, 5).map((service, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-800">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 font-extrabold" />
                    <span>{service}</span>
                  </div>
                ))}
                {roomServices.length === 0 && <span className="col-span-2 text-xs text-slate-500">Tiện nghi đang được cập nhật.</span>}
              </div>
            </div>
          </div>

          {/* Bottom Controls: Quantity Counter & Selection Button */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold block">Giá / 1 phòng / đêm</span>
                <span className="text-xl font-extrabold text-blue-700 font-mono">
                  {room.price_per_night?.toLocaleString('vi-VN')} đ
                </span>
              </div>

              {/* Quantity Counter [ - 1 + ] Widget */}
              <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-base transition-all cursor-pointer shadow-sm"
                  aria-label="Giảm số phòng"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                
                <span className="w-6 text-center text-sm font-extrabold text-slate-900 font-mono">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-base transition-all cursor-pointer shadow-sm"
                  aria-label="Tăng số phòng"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Button: Cyan Pill Button */}
            <button
              type="button"
              onClick={handleConfirm}
              className="btn-primary w-full"
            >
              <CheckCircle2 className="w-4 h-4" />
              Chọn {quantity} phòng
            </button>

          </div>

        </div>

      </div>
    </div>,
    document.body
  );
}
