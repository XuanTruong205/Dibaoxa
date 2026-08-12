const BOOKING_STATUS = {
  Pending: { label: 'Chờ xử lý', tone: 'amber', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  Confirmed: { label: 'Đã xác nhận', tone: 'emerald', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  'Checked-In': { label: 'Đã Check-in', tone: 'blue', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  'Checked-Out': { label: 'Đã Check-out', tone: 'slate', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
  Cancelled: { label: 'Đã hủy', tone: 'rose', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
};

const PAYMENT_STATUS = {
  completed: { label: 'Đã thanh toán', tone: 'emerald', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  'đã thanh toán': { label: 'Đã thanh toán', tone: 'emerald', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  pending: { label: 'Đang chờ', tone: 'amber', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  'đang chờ': { label: 'Đang chờ', tone: 'amber', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  failed: { label: 'Thất bại', tone: 'rose', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
  'thất bại': { label: 'Thất bại', tone: 'rose', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
  cancelled: { label: 'Đã hủy', tone: 'slate', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
  'đã hủy': { label: 'Đã hủy', tone: 'slate', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
  refunded: { label: 'Đã hoàn tiền', tone: 'violet', className: 'bg-violet-50 text-violet-700 border border-violet-200' },
  'đã hoàn tiền': { label: 'Đã hoàn tiền', tone: 'violet', className: 'bg-violet-50 text-violet-700 border border-violet-200' },
};

const FALLBACK_STATUS = { label: 'Chưa xác định', tone: 'slate', className: 'bg-slate-100 text-slate-700 border border-slate-200' };

export function getBookingStatusPresentation(status) {
  return BOOKING_STATUS[status] || { ...FALLBACK_STATUS, label: status || FALLBACK_STATUS.label };
}

export function getPaymentStatusPresentation(status) {
  const normalized = String(status || '').trim().toLocaleLowerCase('vi');
  return PAYMENT_STATUS[normalized] || { ...FALLBACK_STATUS, label: status || FALLBACK_STATUS.label };
}

export function canCancelBooking(status) {
  return status === 'Pending' || status === 'Confirmed';
}

export function buildMonthCalendar(bookings, monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const counts = new Map();

  for (const booking of bookings) {
    const date = String(booking.check_in_date || '');
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match || Number(match[1]) !== year || Number(match[2]) !== month + 1) continue;
    const day = Number(match[3]);
    counts.set(day, (counts.get(day) || 0) + 1);
  }

  const cells = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, bookingCount: counts.get(day) || 0 });
  }
  const targetCellCount = cells.length > 35 ? 42 : 35;
  while (cells.length < targetCellCount) cells.push(null);

  return { year, month, days: cells };
}

export function buildMonthlyOrderCounts(bookings, travelOrders, year) {
  const counts = Array.from({ length: 12 }, () => 0);
  for (const order of [...bookings, ...travelOrders]) {
    const date = new Date(order.created_at);
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) continue;
    counts[date.getMonth()] += 1;
  }
  return counts;
}

export function buildServiceBreakdown(bookings, travelOrders) {
  return [
    { type: 'hotel', label: 'Khách sạn', count: bookings.length, color: '#0F766E' },
    { type: 'cruise', label: 'Du thuyền', count: travelOrders.filter((order) => order.product_type === 'cruise').length, color: '#0EA5E9' },
    { type: 'flight', label: 'Vé máy bay', count: travelOrders.filter((order) => order.product_type === 'flight').length, color: '#8B5CF6' },
  ];
}
