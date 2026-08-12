import { CheckCircle2, Clock, CreditCard, QrCode, ShieldCheck, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export default function PaymentQRModal({ holdData, grandTotal, selectedServices, onConfirm, onClose, loading }) {
  const [method, setMethod] = useState('Demo');
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!holdData?.expires_at) return 600;
    const expiry = typeof holdData.expires_at === 'number' ? holdData.expires_at : new Date(holdData.expires_at).getTime();
    return Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const bookingCodeRef = holdData?.hold_id ? `MVV-${holdData.hold_id.slice(-6)}` : 'MVV-2026';

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="glass-card max-w-xl w-full p-6 relative border border-slate-200 shadow-2xl bg-white rounded-2xl overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="payment-title">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 id="payment-title" className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Xác nhận thanh toán demo &amp; xuất mã QR
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Đây là môi trường mô phỏng; không phát sinh giao dịch ngân hàng thật.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold" aria-label="Đóng thanh toán">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 10-Minute Room Lock Banner */}
        <div className="mt-4 bg-blue-50 p-3.5 rounded-xl border border-blue-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs text-blue-700 font-semibold block">Thời gian giữ phòng Redis</span>
              <span className="text-sm font-bold text-slate-900">Phòng đang được khóa an toàn</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-mono font-extrabold text-blue-700 bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-sm">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="mt-5">
          <p className="text-xs font-bold text-slate-700 block mb-2">
            Chọn cổng thanh toán:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'Demo', label: 'Mô phỏng thanh toán an toàn', icon: ShieldCheck, color: 'text-blue-600' },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500 text-slate-900 shadow-sm font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${m.color}`} />
                  <span className="text-xs font-semibold">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Demo payment notice */}
        {method === 'Demo' && (
          <div className="payment-qr-panel">
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 shrink-0 text-blue-600">
              <QrCode className="w-20 h-20" aria-hidden="true" />
            </div>
            <div className="payment-details">
              <div>
                <span className="text-slate-500">Môi trường:</span>
                <span className="font-bold text-slate-900">Demo nội bộ Dibaoxa</span>
              </div>
              <div>
                <span className="text-slate-500">Giao dịch thật:</span>
                <span className="font-bold text-blue-700">Không phát sinh</span>
              </div>
              <div>
                <span className="text-slate-500">Mã tham chiếu:</span>
                <span className="font-bold text-amber-800 font-mono">{bookingCodeRef}</span>
              </div>
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        <div className="mt-5 p-3.5 bg-slate-50 rounded-xl space-y-1.5 text-xs border border-slate-200">
          <div className="flex justify-between text-slate-600 font-medium">
            <span>Tiền phòng lưu trú:</span>
            <span>{(grandTotal - (selectedServices?.reduce((sum, s) => sum + s.price * s.quantity, 0) || 0)).toLocaleString('vi-VN')} đ</span>
          </div>
          {selectedServices?.length > 0 && (
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Dịch vụ đi kèm ({selectedServices.length}):</span>
              <span>{(selectedServices.reduce((sum, s) => sum + s.price * s.quantity, 0)).toLocaleString('vi-VN')} đ</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
            <span>Tổng thanh toán:</span>
            <span className="text-blue-700 text-base tracking-tight">{grandTotal.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary text-xs py-2.5">
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => onConfirm(method)}
            disabled={loading || timeLeft === 0}
            className="btn-primary text-xs py-2.5 px-6"
          >
            {loading ? (
              <span>Đang xử lý giao dịch...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Xác nhận thanh toán demo
              </>
            )}
          </button>
        </div>

        {timeLeft === 0 && <p className="form-error text-right" role="alert">Phiên giữ phòng đã hết hạn. Hãy chọn lại phòng trước khi thanh toán.</p>}

      </div>
    </div>
  );
}
