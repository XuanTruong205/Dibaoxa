import { CheckCircle2, Clock, Copy, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export default function PaymentQRModal({ holdData, grandTotal, selectedServices, paymentData, onConfirm, onClose, loading }) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, Math.ceil((new Date(holdData?.expires_at).getTime() - Date.now()) / 1000)));
  const qr = paymentData?.payment_qr;

  useEffect(() => {
    const timer = window.setInterval(() => setTimeLeft(Math.max(0, Math.ceil((new Date(holdData?.expires_at).getTime() - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [holdData?.expires_at]);

  const copy = (value) => navigator.clipboard?.writeText(String(value || ''));
  const servicesTotal = selectedServices?.reduce((sum, service) => sum + service.price * service.quantity, 0) || 0;
  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="glass-card max-w-xl w-full p-6 relative border border-slate-200 shadow-2xl bg-white rounded-2xl overflow-auto max-h-[92vh]" role="dialog" aria-modal="true" aria-labelledby="payment-title">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 id="payment-title" className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" />Thanh toán chuyển khoản VietQR</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Mã QR chứa đúng số tiền và nội dung của riêng đơn này.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Đóng"><X className="w-5 h-5" /></button>
        </div>

        <div className="mt-4 bg-blue-50 p-3.5 rounded-xl border border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-blue-700" /><div><span className="text-xs text-blue-700 font-semibold block">Thời gian thanh toán</span><strong className="text-sm text-slate-900">Phòng đang được giữ cho bạn</strong></div></div>
          <span className="text-xl font-mono font-extrabold text-blue-700 bg-white px-3 py-1 rounded-lg border border-blue-200">{formatTime(timeLeft)}</span>
        </div>

        {qr ? (
          <div className="mt-5 text-center">
            <img src={qr.qr_image_url} alt="Mã VietQR thanh toán đơn phòng" className="w-64 max-w-full mx-auto rounded-2xl border border-slate-200 shadow-sm" />
            <div className="mt-4 grid gap-2 text-left text-sm">
              {[['Ngân hàng', qr.bank_name], ['Số tài khoản', qr.account_number], ['Chủ tài khoản', qr.account_name], ['Số tiền', `${Number(qr.amount).toLocaleString('vi-VN')} đ`], ['Nội dung', qr.transfer_content]].map(([label, value]) => (
                <button key={label} type="button" onClick={() => copy(value)} className="flex justify-between items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left"><span className="text-slate-500">{label}</span><strong className="text-slate-900 break-all">{value}</strong><Copy className="w-4 h-4 text-teal-700 shrink-0" /></button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm font-semibold text-emerald-800"><LoaderCircle className="w-4 h-4 animate-spin" />Đang chờ ngân hàng xác nhận tự động…</div>
            {!qr.auto_confirmation && <p className="form-error mt-3" role="alert">Webhook SePay chưa có khóa bí mật nên chưa thể xác nhận tự động.</p>}
          </div>
        ) : (
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
            <div className="flex justify-between"><span>Tiền phòng</span><strong>{(grandTotal - servicesTotal).toLocaleString('vi-VN')} đ</strong></div>
            {servicesTotal > 0 && <div className="flex justify-between mt-2"><span>Dịch vụ</span><strong>{servicesTotal.toLocaleString('vi-VN')} đ</strong></div>}
            <div className="flex justify-between mt-3 pt-3 border-t border-slate-200 text-base"><strong>Tổng thanh toán</strong><strong className="text-teal-700">{grandTotal.toLocaleString('vi-VN')} đ</strong></div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary text-xs py-2.5">Đóng</button>
          {!qr && <button type="button" onClick={() => onConfirm('VietQR')} disabled={loading || timeLeft === 0} className="btn-primary text-xs py-2.5 px-6">{loading ? <><LoaderCircle className="w-4 h-4 animate-spin" />Đang tạo mã…</> : <><CheckCircle2 className="w-4 h-4" />Tạo mã QR thanh toán</>}</button>}
        </div>
        {timeLeft === 0 && <p className="form-error text-right" role="alert">Phiên thanh toán đã hết hạn.</p>}
      </div>
    </div>
  );
}
