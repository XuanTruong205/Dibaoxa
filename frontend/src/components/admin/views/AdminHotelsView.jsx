import {
  Bed,
  Building2,
  CheckCircle2,
  Copy,
  Edit,
  Inbox,
  MapPin,
  PieChart as PieChartIcon,
  Plus,
  Star,
  Trash2,
  Wallet,
  MessageSquare
} from 'lucide-react';
import React, { useState } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import CreateHotelModal from '../modals/CreateHotelModal';
import EditHotelModal from '../modals/EditHotelModal';
import QuickRoomModal from '../modals/QuickRoomModal';

export default function AdminHotelsView() {
  const { hotels, reports, deleteHotel, deleteReview } = useAdminStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState(null);
  const [quickRoom, setQuickRoom] = useState(null);

  const totalHotels = hotels.length;
  const totalRoomsCount = hotels.reduce((sum, h) => sum + (h.rooms?.length || 0), 0);
  const roomPrices = hotels.flatMap((hotel) => (
    hotel.rooms || []
  )).map((room) => Number(room.price_per_night || 0)).filter((price) => price > 0);
  const avgPrice = roomPrices.length > 0
    ? Math.round(roomPrices.reduce((sum, price) => sum + price, 0) / roomPrices.length)
    : 0;
  const occupancyRate = Number(reports?.summary?.occupancy_rate ?? reports?.occupancy_rate ?? 0);

  const handleDeleteHotel = async (hotelId, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khách sạn "${name}" khỏi hệ thống?`)) {
      try {
        await deleteHotel(hotelId);
      } catch (error) {
        alert(error.message || 'Không thể xóa khách sạn.');
      }
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">Quản Lý Khách Sạn & Resort</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Khởi tạo, chỉnh sửa thông tin phòng và quản lý danh sách đối tác lưu trú trên hệ thống.
          </p>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2" aria-label="Thao tác nhanh">
        <button type="button" onClick={() => setIsCreateModalOpen(true)} className="group flex items-center gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md active:scale-[0.99]">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white"><Building2 className="h-5 w-5" /></span>
          <span><strong className="block text-sm text-slate-900">Thêm khách sạn kèm phòng</strong><small className="mt-1 block text-xs text-slate-600">Tạo khách sạn và nhiều loại phòng trong một lần lưu.</small></span>
          <Plus className="ml-auto h-5 w-5 text-indigo-600 transition group-hover:rotate-90" />
        </button>
        <button type="button" disabled={!hotels.length} onClick={() => setQuickRoom({ hotelId: hotels[0]?.id || '', seed: null })} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-white"><Bed className="h-5 w-5" /></span>
          <span><strong className="block text-sm text-slate-900">Thêm phòng nhanh</strong><small className="mt-1 block text-xs text-slate-500">Chọn mẫu phòng, chỉnh giá và số lượng rồi lưu.</small></span>
          <Plus className="ml-auto h-5 w-5 text-indigo-600 transition group-hover:rotate-90" />
        </button>
      </section>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">TỔNG KHÁCH SẠN</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight block">{totalHotels}</span>
            <span className="text-xs font-semibold text-slate-400 block mt-1">đã đăng ký trên hệ thống</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">LOẠI PHÒNG KHẢ DỤNG</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Bed className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight block">{totalRoomsCount}</span>
            <span className="text-xs font-semibold text-slate-400 block mt-1">loại phòng khả dụng</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">TỶ LỆ LẤP ĐẦY</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight block">
              {occupancyRate.toLocaleString('vi-VN')}%
            </span>
            <span className="text-xs font-semibold text-slate-400 block mt-1">dữ liệu lấp đầy realtime</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">GIÁ TRUNG BÌNH/ĐÊM</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight block">
              {avgPrice.toLocaleString('vi-VN')} đ
            </span>
            <span className="text-xs font-semibold text-slate-400 block mt-1">bảng giá hệ thống</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Hotel Directory Table & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 lg:col-span-2">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Danh Sách Khách Sạn Hệ Thống</h3>
              <span className="text-xs text-slate-400 font-medium">{hotels.length} khách sạn hiển thị</span>
            </div>
          </div>

          {hotels.length === 0 ? (
            <div className="p-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">Chưa có khách sạn nào được thêm</h4>
                <p className="text-xs text-slate-400 mt-0.5">Nhấn "+ Thêm Khách Sạn Mới" để khởi tạo đối tác hoặc cơ sở lưu trú đầu tiên.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary py-2 px-4 text-xs font-semibold mx-auto inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Thêm Khách Sạn Mới
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {hotels.map((hotel) => (
                <div key={hotel.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900">{hotel.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {hotel.star_rating || hotel.starRating || 5} Sao
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" /> {hotel.address || hotel.destination}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuickRoom({ hotelId: hotel.id, seed: null })}
                        className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                      >
                        <Plus className="h-3.5 w-3.5" /> Thêm phòng
                      </button>
                      <button
                        onClick={() => setEditingHotel(hotel)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Edit className="w-3.5 h-3.5" /> Sửa Khách Sạn & Phòng
                      </button>

                      <button
                        onClick={() => handleDeleteHotel(hotel.id, hotel.name)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>
                    </div>
                  </div>

                  {/* Rooms Summary */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500">Các loại phòng ({hotel.rooms?.length || 0} loại):</span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {hotel.rooms?.map((r, i) => (
                        <span key={r.id || i} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                          <span>{r.name || r} - <strong className="text-indigo-600">{r.view_type || 'View đẹp'}</strong> ({r.area_sqm || 40} m², {r.price_per_night?.toLocaleString('vi-VN') || hotel.price?.toLocaleString('vi-VN')} đ)</span>
                          <button type="button" onClick={() => setQuickRoom({ hotelId: hotel.id, seed: r })} className="rounded-md p-1 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-700" aria-label={`Nhân bản ${r.name}`} title="Nhân bản phòng"><Copy className="h-3.5 w-3.5" /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200/70 pt-3">
                    <button type="button" onClick={() => setExpandedReviews((current) => current === hotel.id ? null : hotel.id)} className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                      <MessageSquare className="w-4 h-4" /> Quản lý đánh giá ({hotel.reviews?.length || 0})
                    </button>
                    {expandedReviews === hotel.id && (
                      <div className="mt-3 space-y-2">
                        {hotel.reviews?.map((review) => (
                          <div key={review.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                            <div><div className="flex items-center gap-2"><strong className="text-xs text-slate-800">{review.user?.full_name || 'Khách hàng'}</strong><span className="text-xs font-bold text-amber-600">{review.rating}/5</span></div><p className="mt-1 text-xs leading-relaxed text-slate-600">{review.comment}</p></div>
                            <button type="button" onClick={async () => { if (window.confirm('Xóa đánh giá này?')) await deleteReview(review.id); }} className="shrink-0 rounded-lg p-2 text-rose-600 hover:bg-rose-50" aria-label="Xóa đánh giá"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                        {!hotel.reviews?.length && <p className="rounded-xl bg-white p-3 text-xs text-slate-500">Khách sạn chưa có đánh giá.</p>}
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

        {/* Right Widgets */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Trạng Thái Cơ Sở Lưu Trú</h3>
            <div className="relative w-40 h-40 mx-auto flex items-center justify-center my-2">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="38" stroke={hotels.length > 0 ? "var(--accent)" : "var(--line)"} strokeWidth="14" fill="none" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] text-slate-400 font-medium">Khách sạn</span>
                <span className="text-lg font-extrabold text-slate-900">{hotels.length}</span>
              </div>
            </div>
            <div className="text-center text-xs text-slate-400 font-medium">
              {hotels.length > 0 ? `Có ${hotels.length} đối tác sẵn sàng phục vụ` : 'Chưa có dữ liệu khách sạn'}
            </div>
          </div>
        </div>

      </div>

      {/* Modal Thêm Khách Sạn Mới */}
      <CreateHotelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(created) => {
          alert(`Đã thêm khách sạn [${created.name}] tại ${created.city || created.destination}.`);
        }}
      />

      {/* Modal Sửa Khách Sạn & Phòng */}
      {editingHotel && (
        <EditHotelModal
          isOpen={!!editingHotel}
          hotelToEdit={editingHotel}
          onClose={() => setEditingHotel(null)}
          onSuccess={() => {
            alert(`Đã cập nhật khách sạn [${editingHotel.name}].`);
            setEditingHotel(null);
          }}
        />
      )}

      <QuickRoomModal
        isOpen={Boolean(quickRoom)}
        initialHotelId={quickRoom?.hotelId}
        roomSeed={quickRoom?.seed}
        onClose={() => setQuickRoom(null)}
      />

    </div>
  );
}
