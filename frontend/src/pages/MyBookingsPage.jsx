import { Calendar, CheckCircle2, ChevronDown, Coins, CreditCard, Hotel, MapPin, Plane, Printer, QrCode, ReceiptText, Ship, Ticket, Trash2, X, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';

const paymentStatusLabel = {
  completed: 'Đã thanh toán',
  pending: 'Chờ thanh toán',
  refunded: 'Đã hoàn tiền',
  failed: 'Thanh toán lỗi',
  cancelled: 'Đã hủy',
};

function BookingPaymentDetails({ booking }) {
  const payment = booking.payments?.[0];
  if (!payment) return <p className="booking-payment-empty">Đơn này chưa phát sinh giao dịch thanh toán.</p>;

  return (
    <div className="booking-payment-details">
      <div><span>Trạng thái</span><strong data-status={payment.status}>{paymentStatusLabel[payment.status] || payment.status}</strong></div>
      <div><span>Phương thức</span><strong>{payment.payment_method || 'Chưa xác định'}</strong></div>
      <div><span>Mã giao dịch</span><strong className="font-mono">{payment.transaction_ref || 'Chưa có'}</strong></div>
      <div><span>Số tiền</span><strong>{Number(payment.amount || 0).toLocaleString('vi-VN')} đ</strong></div>
      <div><span>Khởi tạo lúc</span><strong>{payment.created_at ? new Date(payment.created_at).toLocaleString('vi-VN') : 'Chưa có'}</strong></div>
      {payment.refunded_at && <div><span>Hoàn tiền lúc</span><strong>{new Date(payment.refunded_at).toLocaleString('vi-VN')}</strong></div>}
    </div>
  );
}

function TravelOrders({ orders, onCancel }) {
  if (orders.length === 0) return null;

  const statusLabel = {
    pending_payment: 'Chờ thanh toán',
    confirmed: 'Đã xác nhận',
    cancelled: 'Đã hủy',
    expired: 'Đã hết hạn',
  };

  return (
    <section className="saved-travel-plans" aria-labelledby="travel-orders-title">
      <div className="saved-travel-plans__heading"><div><h2 id="travel-orders-title">Vé máy bay và du thuyền</h2><p>Các đơn đã tạo và trạng thái giao dịch tương ứng.</p></div><span>{orders.length} đơn</span></div>
      <div className="saved-travel-plans__grid">
        {orders.map((order) => (
          <article key={order.id}>
            <span className="saved-travel-plans__icon">{order.product_type === 'flight' ? <Plane /> : <Ship />}</span>
            <div>
              <small>{order.product_type === 'flight' ? 'Chuyến bay' : 'Du thuyền'} · {order.order_code}</small>
              <h3>{order.title}</h3>
              <p>{order.summary}</p>
              <div className="travel-order-history__meta"><strong>{Number(order.total_price || 0).toLocaleString('vi-VN')} đ</strong><span data-status={order.status}>{statusLabel[order.status] || order.status}</span>{order.payments?.[0] && <span>{paymentStatusLabel[order.payments[0].status] || order.payments[0].status}</span>}</div>
            </div>
            <div className="saved-travel-plans__actions">
              {['pending_payment', 'confirmed'].includes(order.status) && <button type="button" className="btn-secondary" onClick={() => onCancel(order)}>Hủy đơn</button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function MyBookingsPage({ onExplore, onLogin, onNavigate }) {
  const { isAuthenticated } = useAuthStore();
  const notifySuccess = useNotificationStore((state) => state.success);
  const notifyError = useNotificationStore((state) => state.error);
  const [bookings, setBookings] = useState([]);
  const [travelOrders, setTravelOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQRBooking, setSelectedQRBooking] = useState(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);
  const [loadError, setLoadError] = useState('');

  const fetchBookings = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const [bookingResponse, travelOrderResponse] = await Promise.all([
        api.get('/bookings/my-bookings'),
        api.get('/travel-orders/my-orders'),
      ]);
      setBookings(bookingResponse.data.data);
      setTravelOrders(travelOrderResponse.data.data);
    } catch (error) {
      console.error('Error fetching my bookings:', error);
      setLoadError(error.message || 'Không thể tải danh sách đặt phòng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [isAuthenticated]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn đặt phòng này?')) return;
    try {
      await api.post(`/bookings/cancel/${bookingId}`);
      notifySuccess('Đã hủy đơn đặt phòng', 'Trạng thái đơn và thanh toán đã được cập nhật.');
      fetchBookings();
    } catch (error) {
      notifyError('Không thể hủy đơn', error.message || 'Vui lòng thử lại sau.');
    }
  };

  const handleCancelTravelOrder = async (order) => {
    if (!window.confirm(`Bạn có chắc muốn hủy đơn ${order.order_code}?`)) return;
    try {
      await api.post(`/travel-orders/${order.id}/cancel`);
      notifySuccess('Đã hủy đơn dịch vụ', `Đơn ${order.order_code} đã được cập nhật.`);
      fetchBookings();
    } catch (error) {
      notifyError('Không thể hủy đơn dịch vụ', error.message || 'Vui lòng thử lại sau.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'checked_in':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Đã Check-in Lễ Tân</span>;
      case 'confirmed':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã Xác Nhận</span>;
      case 'cancelled':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-rose-600" /> Đã Hủy</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">Đang Giữ Phòng</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-20">
      
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Ticket className="w-8 h-8 text-blue-600" />
            Đơn và Hành Trình Của Tôi
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Quản lý phòng đã đặt, hành trình đã lưu và mã QR check-in
          </p>
        </div>
        <button type="button" onClick={onExplore} className="btn-primary text-xs py-2.5 px-4">
          <Hotel className="w-4 h-4" /> Đặt thêm phòng
        </button>
      </div>

      <TravelOrders orders={travelOrders} onCancel={handleCancelTravelOrder} />

      {!isAuthenticated ? (
        <div className="transaction-empty">
          <span className="transaction-empty__icon"><Ticket /></span>
          <h2 className="text-xl font-bold text-slate-800">Đăng nhập để xem đơn khách sạn</h2>
          <p>Đăng nhập để xem đơn khách sạn, vé máy bay, du thuyền và lịch sử thanh toán.</p>
          <button type="button" onClick={onLogin} className="btn-primary">Đăng nhập để xem đơn</button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card h-40 animate-pulse bg-slate-100"></div>
          ))}
        </div>
      ) : loadError ? (
        <div className="glass-card p-10 text-center max-w-lg mx-auto space-y-4 bg-white border border-rose-200 shadow-sm" role="alert">
          <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Chưa tải được đơn đặt phòng</h3>
          <p className="text-xs text-slate-500">{loadError}</p>
          <button type="button" onClick={fetchBookings} className="btn-secondary text-xs">Thử lại</button>
        </div>
      ) : bookings.length === 0 && travelOrders.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-lg mx-auto space-y-4 bg-white border border-slate-200/80 shadow-sm">
          <Hotel className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Chưa có đơn đặt phòng nào</h3>
          <p className="text-xs text-slate-500 font-medium">Bạn chưa có lịch sử đặt phòng. Hãy khám phá các khách sạn nổi bật tại Đà Nẵng, Hà Nội, Phú Quốc!</p>
          <button type="button" onClick={onExplore} className="btn-primary text-xs">
            Khám phá khách sạn ngay
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="glass-card p-6 border border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              {/* Hotel & Booking Info */}
              <div className="space-y-3 flex-grow">
                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(booking.status)}
                  <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                    Mã đơn: {booking.booking_code}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{booking.hotel?.name}</h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {booking.hotel?.address}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-1">
                  <span className="flex items-center gap-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Nhận phòng: {booking.check_in_date}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Trả phòng: {booking.check_out_date}
                  </span>
                  <span>Loại phòng: <strong className="text-slate-900">{booking.room?.name}</strong></span>
                </div>

                <div className="booking-reward-row">
                  {booking.earned_points > 0 && <span><Coins /> +{Number(booking.earned_points).toLocaleString('vi-VN')} Xu đã tích lũy</span>}
                  <button
                    type="button"
                    onClick={() => setExpandedPaymentId((current) => current === booking.id ? null : booking.id)}
                    aria-expanded={expandedPaymentId === booking.id}
                  >
                    <ReceiptText /> Chi tiết giao dịch
                    <ChevronDown className={expandedPaymentId === booking.id ? 'is-open' : ''} />
                  </button>
                </div>

                {expandedPaymentId === booking.id && <BookingPaymentDetails booking={booking} />}
              </div>

              {/* QR Code & Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full lg:w-auto border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-500 font-medium block">Tổng thanh toán</span>
                  <span className="text-xl font-extrabold text-blue-700 tracking-tight">
                    {booking.total_price?.toLocaleString('vi-VN')} đ
                  </span>
                  {booking.payments?.[0] && (
                    <span className="booking-payment-summary"><CreditCard /> {paymentStatusLabel[booking.payments[0].status] || booking.payments[0].status}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {(booking.status === 'confirmed' || booking.status === 'checked_in') && (
                    <button
                      onClick={() => setSelectedQRBooking(booking)}
                      className="btn-primary text-xs py-2.5 px-4 flex-1 sm:flex-initial"
                    >
                      <QrCode className="w-4 h-4 text-cyan-200" />
                      Mã QR Check-in
                    </button>
                  )}

                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="btn-secondary text-xs py-2.5 px-3 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border-rose-200 font-semibold"
                    >
                      Hủy đơn
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* QR Check-in Modal */}
      {selectedQRBooking && (
        <div className="modal-backdrop" role="presentation">
          <div className="glass-card max-w-md w-full p-6 text-center space-y-4 border border-slate-200 shadow-2xl relative bg-white rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="checkin-qr-title">
            <button
              type="button"
              onClick={() => setSelectedQRBooking(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold"
              aria-label="Đóng mã QR"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex p-3 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              <QrCode className="w-8 h-8" />
            </div>

            <h3 id="checkin-qr-title" className="text-xl font-bold text-slate-900 tracking-tight">Mã QR Check-in Lễ Tân</h3>
            <p className="text-xs text-slate-500 font-medium">
              Xuất trình mã QR này cho nhân viên lễ tân khách sạn để quét nhận phòng tức thì
            </p>

            <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 w-48 h-48 mx-auto flex items-center justify-center">
              <img
                src={selectedQRBooking.qr_data_url}
                alt={`Mã QR check-in cho đơn ${selectedQRBooking.booking_code}`}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-xs space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã đơn đặt:</span>
                <span className="font-mono font-bold text-amber-800">{selectedQRBooking.booking_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khách sạn:</span>
                <span className="font-bold text-slate-900">{selectedQRBooking.hotel?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Loại phòng:</span>
                <span className="font-bold text-slate-900">{selectedQRBooking.room?.name}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary text-xs py-2 px-4"
              >
                <Printer className="w-4 h-4" />
                In voucher
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
