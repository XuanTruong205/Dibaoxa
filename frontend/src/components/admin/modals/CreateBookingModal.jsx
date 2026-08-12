import { Calendar, CheckCircle2, DollarSign, Hotel, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import { useAuthStore } from '../../../store/useAuthStore';

const getLocalDate = (days = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function CreateBookingModal({ isOpen, onClose, onSuccess }) {
  const { hotels, addBooking } = useAdminStore();
  const userRole = useAuthStore((state) => state.user?.role);

  // All input fields leave completely BLANK initially when opened!
  const [travelerName, setTravelerName] = useState('');
  const [travelerEmail, setTravelerEmail] = useState('');
  const [travelerPhone, setTravelerPhone] = useState('');

  const [customHotelName, setCustomHotelName] = useState('');
  const [customDestination, setCustomDestination] = useState('Đà Nẵng');
  const [customRoomName, setCustomRoomName] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');

  const [selectedHotelId, setSelectedHotelId] = useState(hotels[0]?.id || 'custom');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [checkInDate, setCheckInDate] = useState(getLocalDate(7));
  const [checkOutDate, setCheckOutDate] = useState(getLocalDate(9));

  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [markPaid, setMarkPaid] = useState(false);

  const [nights, setNights] = useState(2);
  const [totalPrice, setTotalPrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const selectedHotel = hotels.find((h) => String(h.id) === String(selectedHotelId));
  const selectedRoomData = selectedHotel?.rooms?.find((room) => String(room.id) === String(selectedRoom));

  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const diffTime = end - start;
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      setNights(diffDays);

      const rate = selectedRoomData?.price_per_night || selectedHotel?.min_price || selectedHotel?.price || Number(pricePerNight) || 0;
      setTotalPrice(diffDays * Number(rate));
    }
  }, [checkInDate, checkOutDate, selectedHotelId, selectedRoom, pricePerNight]);

  useEffect(() => {
    setSelectedRoom(selectedHotel?.rooms?.[0]?.id || '');
  }, [selectedHotelId]);

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('VNPAY');
      setMarkPaid(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (checkInDate < getLocalDate() || checkOutDate <= checkInDate) {
      setFormError('Ngày trả phòng phải sau ngày nhận phòng và không được chọn ngày trong quá khứ.');
      return;
    }
    setFormError('');
    if (!selectedRoomData?.id) {
      setFormError('Vui lòng chọn khách sạn và loại phòng đã có trên hệ thống.');
      return;
    }
    setSubmitting(true);

    const hotelName = selectedHotel ? selectedHotel.name : customHotelName;
    const dest = selectedHotel ? selectedHotel.destination : customDestination;
    const roomName = selectedHotel ? (selectedRoomData?.name || '') : customRoomName;
    const shouldMarkPaid = userRole === 'admin' && markPaid;

    try {
      const created = await addBooking({
        traveler_email: travelerEmail,
        room_id: selectedRoomData?.id,
        guest_name: travelerName,
        guest_phone: travelerPhone,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        total_guests: 1,
        room_quantity: 1,
        payment_method: shouldMarkPaid ? 'Manual' : paymentMethod,
        mark_paid: shouldMarkPaid,
      });

    // Reset back to blank
    setTravelerName('');
    setTravelerEmail('');
    setTravelerPhone('');
    setCustomHotelName('');
    setCustomRoomName('');
    setPricePerNight('');
    setPaymentMethod('VNPAY');
    setMarkPaid(false);

      if (onSuccess) onSuccess(created);
      onClose();
    } catch (error) {
      setFormError(error.message || 'Không thể tạo đơn đặt phòng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all font-bold cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
            <Hotel className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Tạo Đơn Đặt Phòng Mới</h2>
            <p className="text-xs text-slate-500 font-medium">Nhập thông tin khách hàng và chi tiết phòng (Để trống hoàn toàn khi chưa nhập gì)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Section 1: Thông tin khách hàng */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">1. Thông Tin Khách Hàng</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Họ và tên khách hàng *</label>
                <input
                  type="text"
                  value={travelerName}
                  onChange={(e) => setTravelerName(e.target.value)}
                  placeholder="Nhập họ và tên..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Số điện thoại *</label>
                <input
                  type="text"
                  value={travelerPhone}
                  onChange={(e) => setTravelerPhone(e.target.value)}
                  placeholder="Nhập số điện thoại..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Email liên hệ *</label>
              <input
                type="email"
                value={travelerEmail}
                onChange={(e) => setTravelerEmail(e.target.value)}
                placeholder="Nhập địa chỉ email..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          {/* Section 2: Thông tin Khách sạn & Phòng */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">2. Chi Tiết Khách Sạn & Loại Phòng</span>

            {hotels.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Chọn Khách Sạn</label>
                  <select
                    value={selectedHotelId}
                    onChange={(e) => setSelectedHotelId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 cursor-pointer"
                  >
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.destination})
                      </option>
                    ))}
                    <option value="custom">+ Nhập tên khách sạn tự do...</option>
                  </select>
                </div>

                {selectedHotel ? (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Loại Phòng</label>
                    <select
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 cursor-pointer"
                    >
                      {(selectedHotel.rooms || []).map((room, i) => (
                        <option key={room.id || i} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
            ) : null}

            {(!selectedHotel || hotels.length === 0) && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Tên Khách Sạn / Resort *</label>
                    <input
                      type="text"
                      value={customHotelName}
                      onChange={(e) => setCustomHotelName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400"
                      placeholder="Nhập tên khách sạn..."
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Điểm Đến / Thành Phố</label>
                    <select
                      value={customDestination}
                      onChange={(e) => setCustomDestination(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 cursor-pointer"
                    >
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Phú Quốc">Phú Quốc</option>
                      <option value="Đà Lạt">Đà Lạt</option>
                      <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Tên Loại Phòng *</label>
                    <input
                      type="text"
                      value={customRoomName}
                      onChange={(e) => setCustomRoomName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400"
                      placeholder="Nhập tên loại phòng..."
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Giá Tiền / Đêm (VNĐ) *</label>
                    <input
                      type="number"
                      value={pricePerNight}
                      onChange={(e) => setPricePerNight(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 font-mono placeholder:text-slate-400"
                      placeholder="Nhập giá tiền VNĐ/đêm..."
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Ngày nhận phòng (Check-in)</label>
                <input
                  type="date"
                  min={getLocalDate()}
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Ngày trả phòng (Check-out)</label>
                <input
                  type="date"
                  min={checkInDate || getLocalDate()}
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 cursor-pointer"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Thanh toán & Tổng tiền */}
          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">3. Thanh Toán & Xác Nhận</span>
              <span className="text-xs font-bold text-slate-600 font-mono">{nights} đêm lưu trú</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Phương thức thanh toán</label>
                <select
                  value={markPaid ? 'Manual' : paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={markPaid}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 cursor-pointer"
                >
                  <option value="VNPAY">VNPAY</option>
                  <option value="VietQR">VietQR</option>
                  <option value="Momo">Ví Điện Tử Momo</option>
                  <option value="CreditCard">Thẻ quốc tế</option>
                  {markPaid && <option value="Manual">Thu tiền trực tiếp</option>}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Trạng thái thanh toán</label>
                {userRole === 'admin' ? (
                  <label className="flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markPaid}
                      onChange={(e) => setMarkPaid(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                    Đã thu tiền trực tiếp tại quầy
                  </label>
                ) : (
                  <div className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
                    Chờ khách thanh toán
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] font-medium text-slate-500">
              Mặc định đơn được tạo ở trạng thái chờ thanh toán. Chỉ quản trị viên mới có thể xác nhận đã thu tiền trực tiếp.
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-indigo-100">
              <span className="text-xs font-bold text-slate-700">Tổng Tiền Đơn Hàng:</span>
              <span className="text-xl font-extrabold text-indigo-700 font-mono">
                {totalPrice.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {formError && <p className="text-xs font-semibold text-rose-600" role="alert">{formError}</p>}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary py-2.5 px-6 text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Đang tạo đơn...' : 'Xác Nhận Tạo Đơn Đặt Phòng'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
