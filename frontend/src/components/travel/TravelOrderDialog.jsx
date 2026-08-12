import { ArrowRight, CheckCircle2, Clock3, CreditCard, Mail, Phone, ShieldCheck, UserRound, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

function createRequestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function buildOrderPayload(selection, traveler, requestId) {
  const common = {
    client_request_id: requestId,
    product_type: selection.type,
    traveler: {
      full_name: traveler.fullName.trim(),
      email: traveler.email.trim(),
      phone: traveler.phone.trim(),
      note: traveler.note.trim(),
    },
    payment_method: 'Demo',
  };
  if (selection.type === 'flight') {
    if (!selection.item?.quoteToken) throw new Error('Báo giá chuyến bay chưa sẵn sàng. Vui lòng tìm lại chuyến bay.');
    return { ...common, quote_token: selection.item.quoteToken };
  }

  const roomQuantities = selection.item?.roomQuantities || {};
  const cabinCount = selection.search?.roomCount
    || Object.values(roomQuantities).reduce((sum, quantity) => sum + Number(quantity || 0), 0)
    || 1;
  const selectedCabins = selection.item?.selectedCabins?.length
    ? selection.item.selectedCabins
    : [selection.item?.selectedCabin || selection.item?.cabins?.[0]].filter(Boolean);
  return {
    ...common,
    product_id: selection.item.id,
    depart_date: selection.search.departDate,
    guests: Number(selection.search.guests || 1),
    cabin_count: cabinCount,
    selected_cabins: selectedCabins,
    cabin_quantities: Object.fromEntries(Object.entries(roomQuantities).filter(([, quantity]) => Number(quantity) > 0).map(([cabin, quantity]) => [cabin, Number(quantity)])),
  };
}

export default function TravelOrderDialog({ selection, onClose, onViewPlans, onLogin }) {
  const reduceMotion = useReducedMotion();
  const { isAuthenticated, user, refreshProfile } = useAuthStore();
  const [stage, setStage] = useState('details');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', note: '' });
  const [errors, setErrors] = useState({});
  const [requestId, setRequestId] = useState(createRequestId);
  const [order, setOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const stageIndex = useMemo(() => ({ details: 1, payment: 2, success: 3 }[stage]), [stage]);

  useEffect(() => {
    if (!selection) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => { if (event.key === 'Escape' && !submitting) onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selection, onClose, submitting]);

  useEffect(() => {
    if (!selection) return;
    setStage('details');
    setErrors({});
    setMessage('');
    setOrder(null);
    setRequestId(createRequestId());
    setForm({
      fullName: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      note: '',
    });
  }, [selection, user?.id]);

  useEffect(() => {
    if (stage !== 'payment' || !order?.payment_expires_at) return undefined;
    const update = () => setTimeLeft(Math.max(0, Math.ceil((new Date(order.payment_expires_at).getTime() - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [stage, order?.payment_expires_at]);

  if (!selection) return null;

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const createOrder = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (form.fullName.trim().length < 2) nextErrors.fullName = 'Vui lòng nhập họ tên người liên hệ.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Email chưa đúng định dạng.';
    if (!/^[+\d][\d\s().-]{7,19}$/.test(form.phone)) nextErrors.phone = 'Số điện thoại chưa đúng định dạng.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (!isAuthenticated) {
      setMessage('Bạn cần đăng nhập để tạo đơn và thanh toán.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const payload = buildOrderPayload(selection, form, requestId);
      const response = await api.post('/travel-orders', payload);
      setOrder(response.data.data);
      setStage('payment');
    } catch (error) {
      setMessage(error.message || 'Không thể tạo đơn. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmPayment = async () => {
    if (!order || timeLeft <= 0) return;
    setSubmitting(true);
    setMessage('');
    try {
      const response = await api.post(`/travel-orders/${order.id}/demo-confirm`);
      setOrder(response.data.data);
      await refreshProfile();
      setStage('success');
    } catch (error) {
      setMessage(error.message || 'Thanh toán chưa hoàn tất. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="travel-dialog-backdrop" role="presentation" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
        <motion.section className="travel-dialog travel-order-dialog" role="dialog" aria-modal="true" aria-labelledby="travel-order-title" initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }}>
          <button type="button" className="travel-dialog__close" onClick={onClose} disabled={submitting} aria-label="Đóng"><X /></button>
          <div className="travel-order-progress" aria-label={`Bước ${stageIndex} trên 3`}>
            {['Thông tin', 'Thanh toán', 'Hoàn tất'].map((label, index) => <span key={label} className={stageIndex >= index + 1 ? 'is-active' : ''}><b>{index + 1}</b>{label}</span>)}
          </div>

          {stage === 'details' && (
            <>
              <div className="travel-dialog__heading">
                <span>{selection.type === 'flight' ? 'Đặt vé máy bay' : 'Đặt du thuyền'}</span>
                <h2 id="travel-order-title">{selection.title}</h2>
                <p>{selection.summary}</p>
              </div>
              <div className="travel-dialog__price"><span>Tổng dự kiến</span><strong>{money(selection.totalPrice)}</strong></div>
              {!isAuthenticated ? (
                <div className="travel-order-login-gate">
                  <ShieldCheck /><h3>Đăng nhập để tiếp tục</h3><p>Đơn hàng và giao dịch sẽ được gắn với tài khoản của bạn.</p>
                  {message && <p className="form-error" role="alert">{message}</p>}
                  <button type="button" className="btn-primary" onClick={onLogin}>Đăng nhập <ArrowRight /></button>
                </div>
              ) : (
                <form onSubmit={createOrder} noValidate>
                  <label className="field-group"><span><UserRound /> Họ và tên</span><input className="glass-input" value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} autoComplete="name" autoFocus />{errors.fullName && <small className="form-error">{errors.fullName}</small>}</label>
                  <label className="field-group"><span><Mail /> Email</span><input className="glass-input" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} autoComplete="email" />{errors.email && <small className="form-error">{errors.email}</small>}</label>
                  <label className="field-group"><span><Phone /> Điện thoại</span><input className="glass-input" inputMode="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} autoComplete="tel" />{errors.phone && <small className="form-error">{errors.phone}</small>}</label>
                  <label className="field-group travel-dialog__note"><span>Ghi chú cho đơn vị vận hành</span><textarea value={form.note} onChange={(event) => updateField('note', event.target.value)} placeholder="Nhu cầu đặc biệt, hành lý hoặc ăn uống" /></label>
                  {message && <p className="form-error" role="alert">{message}</p>}
                  <p className="travel-dialog__disclaimer">Giá cuối cùng được máy chủ xác minh lại trước khi tạo giao dịch.</p>
                  <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Đang kiểm tra giá...' : <>Tiếp tục thanh toán <ArrowRight /></>}</button>
                </form>
              )}
            </>
          )}

          {stage === 'payment' && order && (
            <div className="travel-order-payment">
              <div className="travel-dialog__heading"><span>Đơn chờ thanh toán</span><h2 id="travel-order-title">Kiểm tra và thanh toán</h2><p>Mã đơn {order.order_code}</p></div>
              <div className="travel-order-payment__timer" data-expired={timeLeft <= 0}><Clock3 /><span>Thời gian còn lại</span><strong>{formatTime(timeLeft)}</strong></div>
              <div className="travel-order-receipt"><div><span>Dịch vụ</span><strong>{order.title}</strong></div><div><span>Số lượng tính giá</span><strong>{order.quantity}</strong></div><div><span>Đơn giá</span><strong>{money(order.unit_price)}</strong></div><div className="is-total"><span>Tổng thanh toán</span><strong>{money(order.total_price)}</strong></div></div>
              <button type="button" className="travel-order-method is-selected"><ShieldCheck /><span><strong>Thanh toán Demo</strong><small>Không phát sinh giao dịch ngân hàng thật</small></span><CheckCircle2 /></button>
              {message && <p className="form-error" role="alert">{message}</p>}
              {timeLeft <= 0 && <p className="form-error" role="alert">Phiên thanh toán đã hết hạn. Hãy đóng và tạo lại đơn.</p>}
              <div className="travel-order-actions"><button type="button" className="btn-secondary" onClick={() => setStage('details')} disabled={submitting}>Quay lại</button><button type="button" className="btn-primary" onClick={confirmPayment} disabled={submitting || timeLeft <= 0}><CreditCard /> {submitting ? 'Đang xử lý...' : `Thanh toán ${money(order.total_price)}`}</button></div>
            </div>
          )}

          {stage === 'success' && order && (
            <div className="travel-dialog__success">
              <span><CheckCircle2 /></span><h2 id="travel-order-title">Thanh toán thành công</h2><p>Đơn <strong>{order.order_code}</strong> đã được xác nhận và lưu vào tài khoản.</p>
              <div className="travel-order-success-summary"><span>Tổng thanh toán <strong>{money(order.total_price)}</strong></span><span>Xu tích lũy <strong>+{Number(order.earned_points || 0).toLocaleString('vi-VN')}</strong></span></div>
              <div><button type="button" className="btn-primary" onClick={onViewPlans}>Xem đơn của tôi <ArrowRight /></button><button type="button" className="btn-secondary" onClick={onClose}>Đóng</button></div>
            </div>
          )}
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
