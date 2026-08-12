import { CheckCircle2, Clock3, Eye, Filter, Inbox, Plane, Search, Ship, X, XCircle } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;
const statusLabel = {
  pending_payment: 'Chờ thanh toán',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  expired: 'Đã hết hạn',
};
const statusClass = {
  pending_payment: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  expired: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AdminTravelOrdersView() {
  const { travelOrders, confirmTravelOrder, cancelTravelOrder, loading, error } = useAdminStore();
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [actionId, setActionId] = useState('');
  const [actionError, setActionError] = useState('');

  const filtered = useMemo(() => travelOrders.filter((order) => (
    (type === 'all' || order.product_type === type)
    && (status === 'all' || order.status === status)
    && (!query.trim() || `${order.order_code} ${order.title} ${order.customer?.full_name} ${order.customer?.email}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')))
  )), [travelOrders, type, status, query]);

  const counts = {
    total: travelOrders.length,
    confirmed: travelOrders.filter((order) => order.status === 'confirmed').length,
    pending: travelOrders.filter((order) => order.status === 'pending_payment').length,
    cancelled: travelOrders.filter((order) => ['cancelled', 'expired'].includes(order.status)).length,
  };

  const handleConfirm = async (order) => {
    if (!window.confirm(`Xác nhận thanh toán Demo cho đơn ${order.order_code}?`)) return;
    setActionId(order.id);
    setActionError('');
    try {
      const updated = await confirmTravelOrder(order.id);
      if (selected?.id === order.id) setSelected(updated);
    } catch (actionFailure) {
      setActionError(actionFailure.message || 'Không thể xác nhận đơn.');
    } finally {
      setActionId('');
    }
  };

  const handleCancel = async (order) => {
    if (!window.confirm(`Hủy đơn ${order.order_code}? Giao dịch đã thanh toán sẽ chuyển sang hoàn tiền.`)) return;
    setActionId(order.id);
    setActionError('');
    try {
      const updated = await cancelTravelOrder(order.id);
      if (selected?.id === order.id) setSelected(updated);
    } catch (actionFailure) {
      setActionError(actionFailure.message || 'Không thể hủy đơn.');
    } finally {
      setActionId('');
    }
  };

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">Đơn Vé Máy Bay &amp; Du Thuyền</h1><p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Quản lý toàn bộ đơn dịch vụ, khách đặt, giá, thanh toán và trạng thái vận hành.</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          ['TỔNG ĐƠN', counts.total, Plane, 'text-indigo-600 bg-indigo-50'],
          ['ĐÃ XÁC NHẬN', counts.confirmed, CheckCircle2, 'text-emerald-600 bg-emerald-50'],
          ['CHỜ THANH TOÁN', counts.pending, Clock3, 'text-amber-600 bg-amber-50'],
          ['HỦY / HẾT HẠN', counts.cancelled, XCircle, 'text-rose-600 bg-rose-50'],
        ].map(([label, value, Icon, color]) => <div key={label} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm"><div className="flex items-center justify-between"><span className="text-[11px] font-bold tracking-wider text-slate-400">{label}</span><span className={`w-10 h-10 rounded-2xl grid place-items-center ${color}`}><Icon className="w-5 h-5" /></span></div><strong className="mt-3 text-3xl text-slate-900 block">{value}</strong></div>)}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Danh Sách Đơn Dịch Vụ</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="relative"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mã đơn, khách hàng..." className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs" /></label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><Filter className="w-4 h-4 text-slate-400" /><select value={type} onChange={(event) => setType(event.target.value)} className="bg-transparent py-2 text-xs font-semibold outline-none"><option value="all">Mọi dịch vụ</option><option value="flight">Vé máy bay</option><option value="cruise">Du thuyền</option></select></label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"><option value="all">Mọi trạng thái</option>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
        </div>
        {(error || actionError) && <p className="text-xs font-semibold text-rose-600" role="alert">{actionError || error}</p>}
        {loading ? <p className="text-xs text-slate-500">Đang tải đơn...</p> : filtered.length === 0 ? <div className="p-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200"><Inbox className="w-10 h-10 text-slate-300 mx-auto" /><h3 className="mt-2 text-sm font-bold text-slate-800">Không có đơn phù hợp</h3></div> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider"><th className="py-3 px-2">Mã đơn</th><th className="py-3 px-2">Dịch vụ</th><th className="py-3 px-2">Khách hàng</th><th className="py-3 px-2">Tổng tiền</th><th className="py-3 px-2">Thanh toán</th><th className="py-3 px-2">Trạng thái</th><th className="py-3 px-2 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((order) => {
            const Icon = order.product_type === 'flight' ? Plane : Ship;
            return <tr key={order.id} className="hover:bg-slate-50"><td className="py-3 px-2 font-mono font-bold text-indigo-600">{order.order_code}</td><td className="py-3 px-2"><span className="flex items-center gap-2 font-bold text-slate-900"><Icon className="w-4 h-4 text-indigo-500" />{order.product_type === 'flight' ? 'Vé máy bay' : 'Du thuyền'}</span><small className="block max-w-xs truncate text-slate-500">{order.title}</small></td><td className="py-3 px-2"><strong className="block text-slate-900">{order.customer?.full_name || order.traveler?.full_name}</strong><small className="text-slate-400">{order.customer?.email || order.traveler?.email}</small></td><td className="py-3 px-2 font-bold">{money(order.total_price)}</td><td className="py-3 px-2">{order.payments?.[0]?.status || 'Chưa có'}</td><td className="py-3 px-2"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass[order.status] || statusClass.expired}`}>{statusLabel[order.status] || order.status}</span></td><td className="py-3 px-2"><div className="flex justify-end gap-1"><button type="button" onClick={() => setSelected(order)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Xem chi tiết"><Eye className="w-4 h-4" /></button>{order.status === 'pending_payment' && <button type="button" disabled={actionId === order.id} onClick={() => handleConfirm(order)} className="px-2 py-1 rounded-lg text-emerald-700 hover:bg-emerald-50 font-bold">Xác nhận</button>}{['pending_payment', 'confirmed'].includes(order.status) && <button type="button" disabled={actionId === order.id} onClick={() => handleCancel(order)} className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold">Hủy</button>}</div></td></tr>;
          })}</tbody></table></div>
        )}
      </div>

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="admin-order-detail-title"><div className="flex items-start justify-between gap-4"><div><span className="text-xs font-bold text-indigo-600">{selected.order_code}</span><h2 id="admin-order-detail-title" className="mt-1 text-xl font-extrabold text-slate-900">{selected.title}</h2><p className="mt-1 text-xs text-slate-500">{selected.summary}</p></div><button type="button" onClick={() => setSelected(null)} className="p-2 rounded-xl bg-slate-100" aria-label="Đóng"><X className="w-4 h-4" /></button></div><div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">{[
        ['Loại dịch vụ', selected.product_type === 'flight' ? 'Vé máy bay' : 'Du thuyền'], ['Khách hàng', selected.traveler?.full_name], ['Email', selected.traveler?.email], ['Điện thoại', selected.traveler?.phone], ['Số lượng tính giá', selected.quantity], ['Đơn giá', money(selected.unit_price)], ['Tổng tiền', money(selected.total_price)], ['Trạng thái', statusLabel[selected.status] || selected.status], ['Giao dịch', selected.payments?.[0]?.transaction_ref], ['Thanh toán', selected.payments?.[0]?.status],
      ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="block text-slate-400">{label}</span><strong className="mt-1 block break-words text-slate-900">{value || 'Chưa có'}</strong></div>)}</div>{selected.traveler?.note && <div className="mt-3 rounded-xl border border-slate-200 p-3 text-xs"><span className="text-slate-400">Ghi chú</span><p className="mt-1 text-slate-700">{selected.traveler.note}</p></div>}</section></div>}
    </div>
  );
}
