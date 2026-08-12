import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Inbox,
  Loader2,
  Plus,
  QrCode,
  Scan,
  Ticket,
  XCircle
} from 'lucide-react';
import React, { useState } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import {
  buildMonthCalendar,
  canCancelBooking,
  getBookingStatusPresentation,
  getPaymentStatusPresentation,
} from '../../../utils/adminPresentation';
import CreateBookingModal from '../modals/CreateBookingModal';

export default function AdminBookingsView() {
  const { bookings, checkinQR, cancelBooking } = useAdminStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [checkinResult, setCheckinResult] = useState(null);
  const [checkinError, setCheckinError] = useState('');
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Checked-In').length;
  const pendingCount = bookings.filter((b) => b.status === 'Pending').length;
  const cancelledCount = bookings.filter((b) => b.status === 'Cancelled').length;
  const calendar = buildMonthCalendar(bookings, calendarMonth);
  const today = new Date();

  const handleScanQRCheckin = async (e) => {
    e.preventDefault();
    setCheckinResult(null);
    setCheckinError('');

    const res = await checkinQR(qrCodeInput.trim());
    if (res.success) {
      setCheckinResult(res.booking);
    } else {
      setCheckinError(res.message);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    setCancellingBookingId(bookingToCancel.id);
    setCheckinError('');
    try {
      await cancelBooking(bookingToCancel.id);
      setBookingToCancel(null);
    } catch (error) {
      setCheckinError(error.message || 'Không thể hủy đơn đặt phòng.');
    } finally {
      setCancellingBookingId(null);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">Đặt Phòng & Quản Lý QR Code</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Tạo mới đơn đặt phòng, quản lý danh sách và quét mã QR Check-in lễ tân.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary py-2.5 px-4 text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" /> Tạo Đơn Đặt Mới
          </button>
        </div>
      </div>

      {/* KPI Cards (Dynamic from store) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">TỔNG ĐƠN ĐẶT</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{totalBookings}</span>
            <Ticket className="w-6 h-6 text-blue-500/30" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">ĐÃ XÁC NHẬN</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-600">{confirmedCount}</span>
            <CheckCircle2 className="w-6 h-6 text-emerald-500/30" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">CHỜ XỬ LÝ</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-600">{pendingCount}</span>
            <Clock className="w-6 h-6 text-amber-500/30" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">ĐÃ HỦY</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-rose-600">{cancelledCount}</span>
            <XCircle className="w-6 h-6 text-rose-500/30" />
          </div>
        </div>
      </div>

      {/* QR Code Scanner Tool Card */}
      <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Trạm Quét Mã QR Check-In Lễ Tân</h3>
            <p className="text-xs text-slate-500 font-medium">Nhập mã đơn hoặc chuỗi QR code để thử nghiệm xác thực check-in phòng</p>
          </div>
        </div>

        <form onSubmit={handleScanQRCheckin} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={qrCodeInput}
              onChange={(e) => setQrCodeInput(e.target.value)}
              placeholder="Nhập mã đơn (vd: MVV-2026-8819) hoặc mã QR..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono font-bold text-slate-800"
              required
            />
          </div>
          <button type="submit" className="btn-primary py-2.5 px-6 text-xs font-semibold shrink-0 cursor-pointer">
            Quét & Check-In
          </button>
        </form>

        {checkinResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs text-slate-800">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Xác Thực Check-In Thành Công!</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 text-xs font-medium">
              <div>Mã đơn: <strong className="font-mono text-indigo-700">{checkinResult.booking_code}</strong></div>
              <div>Khách hàng: <strong>{checkinResult.traveler_name}</strong></div>
              <div>Khách sạn: <strong>{checkinResult.hotel_name}</strong></div>
              <div>Phòng: <strong>{checkinResult.room_name}</strong></div>
            </div>
          </div>
        )}

        {checkinError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Lỗi Check-in: {checkinError}
          </div>
        )}
      </div>

      {/* Main Content: Table & Side Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bookings Management Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Danh Sách Đơn Đặt Phòng</h3>
            <span className="text-xs text-slate-400 font-semibold">{bookings.length} đơn hiển thị</span>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">Chưa có đơn đặt phòng nào</h4>
                <p className="text-xs text-slate-400 mt-0.5">Nhấn nút "+ Tạo Đơn Đặt Mới" để tạo đơn đặt phòng thử nghiệm đầu tiên.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary py-2 px-4 text-xs font-semibold mx-auto inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tạo Đơn Đặt Mới Ngay
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Mã Đơn</th>
                    <th className="py-3 px-2">Khách Hàng</th>
                    <th className="py-3 px-2">Khách Sạn</th>
                    <th className="py-3 px-2">Loại Phòng</th>
                    <th className="py-3 px-2">Tổng Tiền</th>
                    <th className="py-3 px-2">Thanh Toán</th>
                    <th className="py-3 px-2">Trạng Thái</th>
                    <th className="py-3 px-2 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((bk) => {
                    const bookingStatus = getBookingStatusPresentation(bk.status);
                    const paymentStatus = getPaymentStatusPresentation(bk.payment_status);
                    return (
                    <tr key={bk.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-indigo-600">{bk.booking_code}</td>
                      <td className="py-3 px-2">
                        <div>
                          <span className="font-bold text-slate-900 block">{bk.traveler_name}</span>
                          <span className="text-[10px] text-slate-400">{bk.traveler_email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-800 font-medium">{bk.hotel_name}</td>
                      <td className="py-3 px-2 text-slate-600">{bk.room_name}</td>
                      <td className="py-3 px-2 font-bold text-slate-900 font-mono">
                        {bk.total_price?.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${paymentStatus.className}`}>
                          {paymentStatus.label}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${bookingStatus.className}`}>
                          {bookingStatus.label}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {canCancelBooking(bk.status) && (
                          <button
                            type="button"
                            onClick={() => setBookingToCancel(bk)}
                            className="p-1 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded font-semibold"
                          >
                            Hủy đơn
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Side Widgets: Booking Calendar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Lịch nhận phòng</h3>
                <p className="text-[11px] font-medium text-slate-500">Tháng {calendar.month + 1}/{calendar.year}</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setCalendarMonth(new Date(calendar.year, calendar.month - 1, 1))} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Tháng trước">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setCalendarMonth(new Date(calendar.year, calendar.month + 1, 1))} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Tháng sau">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
              <span>CN</span><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span>
              {calendar.days.map((cell, index) => cell ? (
                <div
                  key={`${calendar.year}-${calendar.month}-${cell.day}`}
                  className={`relative min-h-9 p-2 rounded-lg border transition-colors ${
                    cell.bookingCount > 0
                      ? 'bg-teal-50 border-teal-200 text-teal-800 font-extrabold'
                      : 'border-transparent hover:bg-slate-50 text-slate-700'
                  } ${today.getFullYear() === calendar.year && today.getMonth() === calendar.month && today.getDate() === cell.day ? 'ring-2 ring-indigo-400/40' : ''}`}
                  title={cell.bookingCount ? `${cell.bookingCount} lượt nhận phòng` : undefined}
                >
                  {cell.day}
                  {cell.bookingCount > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-teal-600" />}
                </div>
              ) : <div key={`blank-${index}`} className="min-h-9" aria-hidden="true" />)}
            </div>
          </div>
        </div>

      </div>

      {/* Modal Tạo Đơn Đặt Mới */}
      <CreateBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(createdBooking) => {
          setQrCodeInput(createdBooking.booking_code);
          alert(`Đã khởi tạo đơn đặt phòng [${createdBooking.booking_code}] cho khách hàng ${createdBooking.traveler_name}.`);
        }}
      />

      {bookingToCancel && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-booking-title">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600"><AlertCircle className="h-5 w-5" /></div>
              <div>
                <h3 id="cancel-booking-title" className="text-lg font-extrabold text-slate-900">Xác nhận hủy đơn</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">Hủy đơn <strong>{bookingToCancel.booking_code}</strong> của {bookingToCancel.traveler_name}? Giao dịch đã thanh toán sẽ được chuyển sang hoàn tiền theo chính sách.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={Boolean(cancellingBookingId)} onClick={() => setBookingToCancel(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Giữ đơn</button>
              <button type="button" disabled={Boolean(cancellingBookingId)} onClick={handleCancelBooking} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60">
                {cancellingBookingId && <Loader2 className="h-4 w-4 animate-spin" />}
                {cancellingBookingId ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
