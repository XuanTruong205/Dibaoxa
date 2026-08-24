import { ArrowLeft, CheckCircle2, Clock, ShieldCheck, Sparkles, User, Utensils } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import PaymentQRModal from '../components/booking/PaymentQRModal';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';
import { useNotificationStore } from '../store/useNotificationStore';

export default function BookingPage({ onBack, onSuccess }) {
  const { user, refreshProfile } = useAuthStore();
  const { activeHold, selectedServices, setSelectedServices, clearActiveHold } = useBookingStore();
  const notifyError = useNotificationStore((state) => state.error);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestName, setGuestName] = useState(user?.full_name || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [guestCount, setGuestCount] = useState(1);
  const [formError, setFormError] = useState('');
  const [pendingBookingId, setPendingBookingId] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    const reference = paymentData?.payment?.transaction_ref;
    if (!paymentModalOpen || !reference) return undefined;
    let stopped = false;
    const checkStatus = async () => {
      try {
        const response = await api.get(`/payments/status/${encodeURIComponent(reference)}`);
        if (!stopped && response.data.data?.status === 'completed') {
          clearActiveHold();
          await refreshProfile();
          setPaymentModalOpen(false);
          onSuccess(response.data.data.data);
        }
      } catch {
        // Keep polling: temporary network failures must not alter payment state.
      }
    };
    checkStatus();
    const timer = window.setInterval(checkStatus, 3000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [paymentData?.payment?.transaction_ref, paymentModalOpen, clearActiveHold, refreshProfile, onSuccess]);

  useEffect(() => {
    if (!activeHold?.expires_at) return undefined;
    const remaining = new Date(activeHold.expires_at).getTime() - Date.now();
    if (remaining <= 0) {
      clearActiveHold();
      setPaymentModalOpen(false);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      clearActiveHold();
      setPaymentModalOpen(false);
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [activeHold?.expires_at, clearActiveHold]);

  if (!activeHold) {
    return (
      <div className="transaction-empty">
        <span className="transaction-empty__icon"><Clock /></span>
        <h2 className="text-xl font-bold text-slate-800">Chưa có phiên giữ phòng nào đang hoạt động</h2>
        <p>Phiên giữ phòng 10 phút của bạn đã hết hạn hoặc chưa được tạo.</p>
        <button onClick={onBack} className="btn-primary text-xs">
          Trở về chọn phòng khách sạn
        </button>
      </div>
    );
  }

  const { hotel, room, check_in_date, check_out_date, price_per_night, quantity = 1 } = activeHold;

  // Calculate nights
  const checkIn = new Date(check_in_date);
  const checkOut = new Date(check_out_date);
  const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));

  const roomTotal = price_per_night * nights * quantity;
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const grandTotal = roomTotal + servicesTotal;

  const availableHotelServices = Array.isArray(hotel?.services) ? hotel.services : [];

  const handleToggleService = (srv) => {
    const exists = selectedServices.find((s) => s.id === srv.id);
    if (exists) {
      setSelectedServices(selectedServices.filter((s) => s.id !== srv.id));
    } else {
      setSelectedServices([...selectedServices, { ...srv, quantity: 1 }]);
    }
  };

  const handleConfirmFinalBooking = async (paymentMethod) => {
    setLoading(true);
    try {
      if (!pendingBookingId) {
        const payload = {
          hold_id: activeHold.hold_id,
          room_id: room.id,
          check_in_date,
          check_out_date,
          guest_name: guestName.trim(),
          guest_phone: guestPhone.trim(),
          total_guests: guestCount,
          quantity,
          services: selectedServices.map((s) => ({ service_id: s.id, quantity: s.quantity })),
          payment_method: paymentMethod,
        };
        const pendingResponse = await api.post('/bookings/confirm', payload);
        const pending = pendingResponse.data.data;
        const bookingId = pending?.booking_id;
        if (!bookingId) throw new Error('Máy chủ không trả về mã đơn đang chờ thanh toán.');
        setPendingBookingId(bookingId);
        setPaymentData(pending);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      notifyError('Không thể khởi tạo thanh toán', error.message || 'Vui lòng thử lại.');
    }
  };

  const handleOpenPayment = () => {
    const maxGuests = Math.max(1, (room.max_occupancy || 1) * quantity);
    if (!guestName.trim() || !guestPhone.trim()) {
      setFormError('Vui lòng nhập đầy đủ họ tên và số điện thoại khách nhận phòng.');
      return;
    }
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > maxGuests) {
      setFormError(`Số khách phải từ 1 đến ${maxGuests} người.`);
      return;
    }
    setFormError('');
    setPaymentModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-20">
      
      {/* Back button */}
      <button onClick={onBack} className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-2 font-semibold">
        <ArrowLeft className="w-4 h-4" />
        Trở lại chi tiết khách sạn
      </button>

      {/* 10-minute hold notification banner */}
      <div className="hold-banner" role="status" aria-live="polite">
        <div className="flex items-center gap-3.5">
          <span className="hold-banner__icon"><ShieldCheck /></span>
          <div>
            <span className="text-xs text-blue-700 font-bold block">Phòng đã được giữ tạm thời</span>
            <span className="text-sm font-semibold text-slate-800">Hệ thống đang khóa giữ phòng trên Redis cho bạn</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Customer Info & Additional Services */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Guest Info Form */}
          <div className="glass-card p-6 border border-slate-200/80 bg-white space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Thông Tin Khách Lưu Trú
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="booking-guest-name" className="text-xs font-bold text-slate-700 block mb-1.5">Họ và tên khách nhận phòng</label>
                <input
                  id="booking-guest-name"
                  name="guest_name"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="glass-input font-medium"
                  placeholder="Nhập họ tên"
                  autoComplete="name"
                  required
                />
              </div>
              <div>
                <label htmlFor="booking-guest-phone" className="text-xs font-bold text-slate-700 block mb-1.5">Số điện thoại liên hệ</label>
                <input
                  id="booking-guest-phone"
                  name="guest_phone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="glass-input font-medium"
                  placeholder="Nhập số điện thoại"
                  autoComplete="tel"
                  required
                />
              </div>
              <div>
                <label htmlFor="booking-guest-count" className="text-xs font-bold text-slate-700 block mb-1.5">Số khách lưu trú</label>
                <input
                  id="booking-guest-count"
                  name="total_guests"
                  type="number"
                  min="1"
                  max={(room.max_occupancy || 1) * quantity}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="glass-input font-medium"
                  required
                />
              </div>
            </div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
          </div>

          {/* Hotel Extra Services Selector */}
          <div className="glass-card p-6 border border-slate-200/80 bg-white space-y-4 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Utensils className="w-5 h-5 text-blue-600" />
                Chọn Dịch Vụ Đi Kèm (Tùy chọn)
              </h3>
            </div>

            <div className="space-y-3">
              {availableHotelServices.length === 0 && <p className="text-xs text-slate-500">Khách sạn chưa công bố dịch vụ đi kèm.</p>}
              {availableHotelServices.map((srv) => {
                const isSelected = selectedServices.some((s) => s.id === srv.id);
                return (
                  <button
                    type="button"
                    key={srv.id}
                    onClick={() => handleToggleService(srv)}
                    aria-pressed={isSelected}
                    className={`w-full p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 text-left ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-slate-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-900">{srv.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{srv.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-blue-700 block">
                        +{srv.price.toLocaleString('vi-VN')} đ
                      </span>
                      <span className={`text-[11px] font-semibold inline-flex items-center gap-1 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {isSelected ? 'Đã chọn' : 'Thêm dịch vụ'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Col: Price Summary Card */}
        <div className="space-y-6">
          <div className="glass-card p-6 border border-slate-200/80 bg-white space-y-4 sticky top-28 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 tracking-tight">
              Chi Tiết Đơn Đặt Phòng
            </h3>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-900">{hotel?.name}</div>
              <div className="text-slate-600 font-medium">{room?.name}</div>
              <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
                <span>Nhận phòng:</span>
                <span className="font-bold text-slate-900">{check_in_date}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Trả phòng:</span>
                <span className="font-bold text-slate-900">{check_out_date}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Số đêm nghỉ:</span>
                <span className="font-bold text-slate-900">{nights} đêm</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Giá phòng ({nights} đêm):</span>
                <span>{roomTotal.toLocaleString('vi-VN')} đ</span>
              </div>

              {selectedServices.length > 0 && (
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Dịch vụ cộng thêm ({selectedServices.length}):</span>
                  <span>{servicesTotal.toLocaleString('vi-VN')} đ</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-3 border-t border-slate-100">
                <span>Tổng cộng:</span>
                <span className="text-blue-700 text-lg tracking-tight">{grandTotal.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs font-semibold text-amber-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Tích lũy ngay {Math.floor(grandTotal / 10000)} Xu thưởng VIP</span>
            </div>

            <button
              type="button"
              onClick={handleOpenPayment}
              className="btn-primary w-full py-3.5 text-xs shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              Thanh toán ngay
            </button>
          </div>
        </div>

      </div>

      {/* Payment QR Modal */}
      {paymentModalOpen && (
        <PaymentQRModal
          holdData={activeHold}
          grandTotal={grandTotal}
          selectedServices={selectedServices}
          loading={loading}
          paymentData={paymentData}
          onConfirm={handleConfirmFinalBooking}
          onClose={() => setPaymentModalOpen(false)}
        />
      )}

    </div>
  );
}
