import { CheckCircle2, Clock, CreditCard, Inbox, Wallet, XCircle } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';

const isCompleted = (status) => ['completed', 'Completed', 'Đã thanh toán'].includes(status);
const isPending = (status) => ['pending', 'Pending', 'Chờ thanh toán'].includes(status);
const paymentStatusLabel = (status) => ({
  completed: 'Đã thanh toán',
  pending: 'Chờ thanh toán',
  refunded: 'Đã hoàn tiền',
  cancelled: 'Đã hủy',
  failed: 'Thất bại',
}[status] || status);
const paymentStatusClass = (status) => {
  if (isCompleted(status)) return 'text-emerald-700';
  if (isPending(status)) return 'text-amber-700';
  if (status === 'refunded') return 'text-indigo-700';
  if (status === 'cancelled') return 'text-slate-600';
  return 'text-rose-700';
};

export default function AdminPaymentsView() {
  const { payments, loading, error } = useAdminStore();
  const [source, setSource] = useState('all');
  const [status, setStatus] = useState('all');
  const filteredPayments = useMemo(() => payments.filter((payment) => (
    (source === 'all' || payment.source_type === source)
    && (status === 'all' || payment.status === status)
  )), [payments, source, status]);
  const completed = payments.filter((payment) => isCompleted(payment.status));
  const pending = payments.filter((payment) => isPending(payment.status));
  const failed = payments.filter((payment) => !isCompleted(payment.status) && !isPending(payment.status));
  const totalRevenue = completed.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const cards = [
    { label: 'TỔNG DOANH THU', value: `${totalRevenue.toLocaleString('vi-VN')} đ`, detail: `${completed.length} giao dịch hoàn tất`, icon: Wallet, color: 'text-blue-600 bg-blue-50' },
    { label: 'GIAO DỊCH', value: payments.length, detail: 'dữ liệu từ máy chủ', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'CHỜ XỬ LÝ', value: pending.length, detail: `${pending.reduce((sum, payment) => sum + Number(payment.amount || 0), 0).toLocaleString('vi-VN')} đ`, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'HOÀN / HỦY / THẤT BẠI', value: failed.length, detail: 'giao dịch cần theo dõi', icon: XCircle, color: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">Thanh Toán &amp; Giao Dịch</h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Theo dõi trạng thái thanh toán và dữ liệu đối soát từ hệ thống.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(({ label, value, detail, icon: Icon, color }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">{label}</span>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 block">{value}</span>
            <span className="text-xs font-semibold text-slate-400 block">{detail}</span>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><h3 className="text-base font-bold text-slate-900">Danh Sách Giao Dịch</h3><div className="flex gap-2"><select value={source} onChange={(event) => setSource(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"><option value="all">Mọi dịch vụ</option><option value="hotel">Khách sạn</option><option value="cruise">Du thuyền</option><option value="flight">Vé máy bay</option></select><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"><option value="all">Mọi trạng thái</option><option value="completed">Đã thanh toán</option><option value="pending">Chờ thanh toán</option><option value="refunded">Đã hoàn tiền</option><option value="cancelled">Đã hủy</option><option value="failed">Thất bại</option></select></div></div>
        {error && <p className="text-xs font-semibold text-rose-600" role="alert">{error}</p>}
        {loading ? (
          <p className="text-xs text-slate-500">Đang tải giao dịch...</p>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">Chưa có giao dịch thanh toán nào</h4>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead><tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-2">Mã giao dịch</th><th className="py-3 px-2">Mã đơn</th><th className="py-3 px-2">Dịch vụ</th><th className="py-3 px-2">Khách hàng</th><th className="py-3 px-2">Phương thức</th><th className="py-3 px-2">Số tiền</th><th className="py-3 px-2">Trạng thái</th><th className="py-3 px-2">Thời gian</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id || payment.transaction_ref}>
                    <td className="py-3 px-2 font-mono font-bold text-indigo-600">{payment.transaction_ref || payment.id}</td>
                    <td className="py-3 px-2 font-mono">{payment.booking_code || payment.booking?.booking_code || 'Chưa có'}</td>
                    <td className="py-3 px-2"><strong className="block text-slate-900">{{ hotel: 'Khách sạn', cruise: 'Du thuyền', flight: 'Vé máy bay' }[payment.source_type] || 'Dịch vụ'}</strong><small className="block max-w-48 truncate text-slate-400">{payment.product_title}</small></td>
                    <td className="py-3 px-2"><strong className="block text-slate-800">{payment.user?.full_name || 'Chưa có'}</strong><small className="text-slate-400">{payment.user?.email}</small></td>
                    <td className="py-3 px-2">{payment.payment_method || 'Chưa có'}</td>
                    <td className="py-3 px-2 font-bold">{Number(payment.amount || 0).toLocaleString('vi-VN')} đ</td>
                    <td className="py-3 px-2"><span className={`inline-flex items-center gap-1 font-bold ${paymentStatusClass(payment.status)}`}>{isCompleted(payment.status) && <CheckCircle2 className="w-3.5 h-3.5" />}{paymentStatusLabel(payment.status)}</span></td>
                    <td className="py-3 px-2 text-slate-500">{payment.created_at ? new Date(payment.created_at).toLocaleString('vi-VN') : 'Chưa có'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
