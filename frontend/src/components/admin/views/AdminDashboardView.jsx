import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Inbox,
  Plus,
  Users
} from 'lucide-react';
import React, { useState } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { buildMonthlyOrderCounts, buildServiceBreakdown } from '../../../utils/adminPresentation';
import CreateBookingModal from '../modals/CreateBookingModal';

export default function AdminDashboardView({ onNavigate }) {
  const { user } = useAuthStore();
  const { bookings, travelOrders, payments, customers } = useAdminStore();
  const notifySuccess = useNotificationStore((state) => state.success);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartYear, setChartYear] = useState(() => new Date().getFullYear());

  const adminName = user?.full_name || 'Trần Thị Thu Hà';

  const allOrders = [
    ...bookings.map((booking) => ({ ...booking, service_type: 'Khách sạn', order_code: booking.booking_code, customer_name: booking.traveler_name, product_name: booking.hotel_name, start_date: booking.check_in_date })),
    ...travelOrders.map((order) => ({ ...order, service_type: order.product_type === 'flight' ? 'Vé máy bay' : 'Du thuyền', order_code: order.order_code, customer_name: order.customer?.full_name || order.traveler?.full_name, product_name: order.title, start_date: order.product_snapshot?.departureDate })),
  ].sort((left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0));
  const totalBookingsCount = allOrders.length;
  const activeBookingsCount = bookings.filter((booking) => ['Confirmed', 'Checked-In'].includes(booking.status)).length + travelOrders.filter((order) => order.status === 'confirmed').length;
  const totalRevenue = payments.filter((payment) => payment.status === 'completed').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pendingCount = bookings.filter((booking) => booking.status === 'Pending').length + travelOrders.filter((order) => order.status === 'pending_payment').length;
  const monthlyCounts = buildMonthlyOrderCounts(bookings, travelOrders, chartYear);
  const maxMonthlyCount = Math.max(...monthlyCounts, 0);
  const chartPoints = monthlyCounts.map((count, index) => ({
    count,
    x: Number(((index * 500) / 11).toFixed(2)),
    y: maxMonthlyCount ? Number((178 - (count / maxMonthlyCount) * 138).toFixed(2)) : 178,
  }));
  const linePath = chartPoints.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const areaPoints = `${chartPoints.map((point) => `${point.x},${point.y}`).join(' ')} 500,190 0,190`;
  const availableYears = [...new Set([
    new Date().getFullYear(),
    ...allOrders.map((order) => new Date(order.created_at)).filter((date) => !Number.isNaN(date.getTime())).map((date) => date.getFullYear()),
  ])].sort((left, right) => right - left);
  const serviceBreakdown = buildServiceBreakdown(bookings, travelOrders);
  const serviceTotal = serviceBreakdown.reduce((sum, item) => sum + item.count, 0);
  const circumference = 2 * Math.PI * 38;
  let segmentOffset = 0;
  const serviceSegments = serviceBreakdown.map((item) => {
    const length = serviceTotal ? (item.count / serviceTotal) * circumference : 0;
    const segment = { ...item, length, offset: segmentOffset };
    segmentOffset += length;
    return segment;
  });

  const kpiData = [
    {
      title: 'TỔNG KHÁCH DU LỊCH',
      value: customers.length.toString(),
      period: 'dữ liệu mới nhất từ máy chủ',
      icon: Users,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-100',
    },
    {
      title: 'ĐƠN ĐANG ĐẶT & GIỮ',
      value: activeBookingsCount.toString(),
      period: 'dữ liệu mới nhất từ máy chủ',
      icon: Calendar,
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-100',
    },
    {
      title: 'DOANH THU HỆ THỐNG',
      value: totalRevenue.toLocaleString('vi-VN') + ' đ',
      period: 'dữ liệu mới nhất từ máy chủ',
      icon: DollarSign,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-100',
    },
    {
      title: 'YÊU CẦU CHỜ XỬ LÝ',
      value: pendingCount.toString(),
      period: 'dữ liệu mới nhất từ máy chủ',
      icon: Clock,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-100',
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">Tổng Quan Hệ Thống</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Xin chào, {adminName}! Đây là tổng quan tình hình hoạt động kinh doanh lưu trú thời gian thực.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary py-2.5 px-4 text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" /> Tạo Đơn Đặt Mới
        </button>
      </div>

      {/* KPI Cards Row (Dynamic from store) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiData.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">{kpi.title}</span>
                <div className={`w-10 h-10 rounded-2xl ${kpi.bgColor} ${kpi.textColor} border ${kpi.borderColor} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <span className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight block">{kpi.value}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-slate-400 font-normal">{kpi.period}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Row: Charts & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Bookings Overview Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Tổng Quan Đơn Đặt Theo Tháng</h3>
            <select value={chartYear} onChange={(event) => setChartYear(Number(event.target.value))} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600">
              {availableYears.map((year) => <option key={year} value={year}>Năm {year}</option>)}
            </select>
          </div>

          {maxMonthlyCount === 0 ? (
            <div className="relative h-64 w-full flex items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center p-6">
              <div>
                <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Chưa có dữ liệu biến động đơn đặt</p>
                <p className="text-[11px] text-slate-400 mt-1">Nhấn "+ Tạo Đơn Đặt Mới" để tạo đơn đầu tiên.</p>
              </div>
            </div>
          ) : (
            <div className="relative h-64 w-full pt-4">
              <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="140" x2="500" y2="140" stroke="var(--line)" strokeDasharray="4 4" />
                <polygon points={areaPoints} fill="url(#chartGlow)" />
                <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                {chartPoints.map((point, index) => (
                  <g key={index}>
                    <circle cx={point.x} cy={point.y} r="4" fill="var(--accent)" stroke="var(--surface-elevated)" strokeWidth="2" />
                    {point.count > 0 && <text x={point.x} y={point.y - 10} textAnchor="middle" className="fill-slate-500 text-[10px] font-bold">{point.count}</text>}
                  </g>
                ))}
              </svg>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-2">
                <span>Thg 1</span><span>Thg 2</span><span>Thg 3</span><span>Thg 4</span><span>Thg 5</span><span>Thg 6</span><span>Thg 7</span><span>Thg 8</span><span>Thg 9</span><span>Thg 10</span><span>Thg 11</span><span>Thg 12</span>
              </div>
            </div>
          )}
        </div>

        {/* Package Categories Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Cơ cấu đơn theo dịch vụ</h3>
          
          <div className="relative w-44 h-44 mx-auto my-4 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="38" stroke="var(--line)" strokeWidth="14" fill="none" />
              {serviceSegments.map((segment) => segment.length > 0 && (
                <circle
                  key={segment.type}
                  cx="50"
                  cy="50"
                  r="38"
                  stroke={segment.color}
                  strokeWidth="14"
                  fill="none"
                  strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                  strokeDashoffset={-segment.offset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] text-slate-400 font-medium">Tổng đơn</span>
              <span className="text-lg font-extrabold text-slate-900">{serviceTotal}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs font-medium">
            {serviceBreakdown.map((item) => (
              <div key={item.type} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                <span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>
                <strong className="text-slate-900">{item.count}</strong>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Row: Dynamic Trips Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Chuyến Đi Sắp Tới</h3>
            <button onClick={() => onNavigate('bookings')} className="text-xs font-bold text-indigo-600 hover:underline">Quản Lý Đơn Đặt ›</button>
          </div>

          {allOrders.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-slate-200/60 space-y-2">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Chưa có chuyến đi nào sắp tới</p>
              <p className="text-[11px] text-slate-400">Nhấn nút "+ Tạo Đơn Đặt Mới" ở trên để khởi tạo đơn phòng đầu tiên.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Mã Đơn</th>
                    <th className="py-3 px-2">Khách Hàng</th>
                    <th className="py-3 px-2">Loại Dịch Vụ</th>
                    <th className="py-3 px-2">Sản Phẩm</th>
                    <th className="py-3 px-2">Ngày Bắt Đầu</th>
                    <th className="py-3 px-2">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allOrders.slice(0, 8).map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-indigo-600">{trip.order_code}</td>
                      <td className="py-3 px-2 font-bold text-slate-900">{trip.customer_name}</td>
                      <td className="py-3 px-2 text-slate-700 font-medium">{trip.service_type}</td>
                      <td className="py-3 px-2 text-slate-600 max-w-52 truncate">{trip.product_name}</td>
                      <td className="py-3 px-2 text-slate-600 font-medium">{trip.start_date || 'Chưa xác định'}</td>
                      <td className="py-3 px-2">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {trip.status === 'Checked-In' ? 'Đã Check-in' : trip.status === 'confirmed' || trip.status === 'Confirmed' ? 'Đã xác nhận' : trip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Hoạt Động Gần Đây</h3>
          </div>

          {allOrders.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-slate-200/60 space-y-2">
              <p className="text-xs font-medium text-slate-400">Chưa có hoạt động mới trong hệ thống</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allOrders.slice(0, 4).map((order) => (
                <div key={`${order.service_type}-${order.id}`} className="flex items-start gap-2.5 text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900">Đơn {order.order_code} · {order.service_type}</h4>
                    <p className="text-[11px] text-slate-500">{order.customer_name} · {order.product_name}</p>
                    <span className="text-[10px] text-slate-400">{order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : 'Chưa có thời gian'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal Tạo Đơn Đặt Mới */}
      <CreateBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(created) => {
          notifySuccess('Đã tạo đơn đặt phòng', `Đơn ${created.booking_code} cho ${created.traveler_name} đã được khởi tạo.`);
        }}
      />

    </div>
  );
}
