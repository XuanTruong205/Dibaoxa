import { FileCheck, Inbox, PieChart as PieChartIcon, TrendingUp, Wallet } from 'lucide-react';
import React from 'react';
import { useAdminStore } from '../../../store/useAdminStore';

export default function AdminReportsView() {
  const { reports, bookings, travelOrders, payments } = useAdminStore();
  const summary = reports?.summary || reports || {};
  const totalRevenue = Number(summary.total_revenue_vnd || 0);
  const totalBookings = Number(summary.total_bookings ?? bookings.length);
  const completedPayments = payments.filter((payment) => ['completed', 'Completed', 'Đã thanh toán'].includes(payment.status));
  const averageOrder = completedPayments.length > 0 ? Math.round(totalRevenue / completedPayments.length) : 0;
  const cityBreakdown = Array.isArray(reports?.city_breakdown) ? reports.city_breakdown : [];
  const serviceBreakdown = Array.isArray(reports?.service_breakdown) ? reports.service_breakdown : [];
  const cancelledCount = bookings.filter((booking) => ['cancelled', 'Cancelled'].includes(booking.status)).length
    + travelOrders.filter((order) => ['cancelled', 'expired'].includes(order.status)).length;
  const cancellationRate = totalBookings > 0 ? ((cancelledCount / totalBookings) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">Báo Cáo & Phân Tích</h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
          Phân tích chi tiết lượng đơn đặt, doanh thu, xu hướng khách du lịch và hiệu suất kinh doanh.
        </p>
      </div>

      {/* KPI Cards (Reset to 0) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">TỔNG DOANH THU</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight block">{totalRevenue.toLocaleString('vi-VN')} đ</span>
            <span className="text-xs font-semibold text-slate-400 block mt-1">từ {completedPayments.length} giao dịch của mọi dịch vụ</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">TỔNG ĐƠN ĐẶT</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight block">{totalBookings}</span>
            <span className="text-xs font-semibold text-slate-400 block mt-1">đơn trên hệ thống</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">GIÁ TRỊ TRUNG BÌNH/ĐƠN</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight block">{averageOrder.toLocaleString('vi-VN')} đ</span>
            <span className="text-xs font-semibold text-slate-400 block mt-1">trung bình theo doanh thu</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">TỶ LỆ HỦY ĐƠN</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight block">{cancellationRate}%</span>
            <span className="text-xs font-semibold text-slate-400 block mt-1">{cancelledCount} đơn đã hủy</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Doanh Thu Theo Dịch Vụ</h3>
            <p className="mt-1 text-xs text-slate-500">Khách sạn, du thuyền và vé máy bay được đối soát trong cùng một báo cáo.</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">{serviceBreakdown.reduce((sum, item) => sum + Number(item.order_count || 0), 0)} đơn trong kỳ</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {serviceBreakdown.map((item) => {
            const share = totalRevenue > 0 ? Math.round((Number(item.revenue || 0) / totalRevenue) * 100) : 0;
            return (
              <article key={item.type} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-slate-900">{item.label}</strong>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-indigo-700">{item.order_count} đơn</span>
                </div>
                <strong className="mt-5 block text-xl text-slate-900">{Number(item.revenue || 0).toLocaleString('vi-VN')} đ</strong>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-indigo-600" style={{ width: `${share}%` }} /></div>
                <span className="mt-2 block text-[11px] font-semibold text-slate-500">{share}% tổng doanh thu</span>
              </article>
            );
          })}
        </div>
      </div>

      {/* Live destination breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Hiệu Suất Theo Điểm Đến</h3>
          <span className="text-xs text-slate-400 font-medium">{reports?.period?.check_in} đến {reports?.period?.check_out}</span>
        </div>

        {cityBreakdown.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">Chưa có dữ liệu theo điểm đến</h4>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Điểm đến</th>
                  <th className="py-3 px-2">Khách sạn</th>
                  <th className="py-3 px-2">Đơn trong kỳ</th>
                  <th className="py-3 px-2">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cityBreakdown.map((item) => (
                  <tr key={item.city}>
                    <td className="py-3 px-2 font-bold text-slate-900">{item.city}</td>
                    <td className="py-3 px-2 text-slate-600">{item.hotel_count}</td>
                    <td className="py-3 px-2 text-slate-600">{item.booking_count}</td>
                    <td className="py-3 px-2 font-bold text-indigo-700">{Number(item.revenue || 0).toLocaleString('vi-VN')} đ</td>
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
