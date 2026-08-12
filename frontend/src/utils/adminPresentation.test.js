import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMonthCalendar,
  buildMonthlyOrderCounts,
  buildServiceBreakdown,
  canCancelBooking,
  getBookingStatusPresentation,
  getPaymentStatusPresentation,
} from './adminPresentation.js';

test('maps every booking status without treating pending or checked-out as cancelled', () => {
  assert.equal(getBookingStatusPresentation('Pending').label, 'Chờ xử lý');
  assert.equal(getBookingStatusPresentation('Confirmed').label, 'Đã xác nhận');
  assert.equal(getBookingStatusPresentation('Checked-In').label, 'Đã Check-in');
  assert.equal(getBookingStatusPresentation('Checked-Out').label, 'Đã Check-out');
  assert.equal(getBookingStatusPresentation('Cancelled').label, 'Đã hủy');
});

test('uses distinct tones for successful, pending, failed and refunded payments', () => {
  const tones = [
    getPaymentStatusPresentation('Đã thanh toán').tone,
    getPaymentStatusPresentation('Đang chờ').tone,
    getPaymentStatusPresentation('Thất bại').tone,
    getPaymentStatusPresentation('Đã hoàn tiền').tone,
  ];
  assert.deepEqual(new Set(tones).size, 4);
});

test('only cancellable booking states expose the cancel action', () => {
  assert.equal(canCancelBooking('Pending'), true);
  assert.equal(canCancelBooking('Confirmed'), true);
  assert.equal(canCancelBooking('Checked-In'), false);
  assert.equal(canCancelBooking('Checked-Out'), false);
  assert.equal(canCancelBooking('Cancelled'), false);
});

test('builds a real Gregorian month grid and marks booking arrival dates', () => {
  const grid = buildMonthCalendar([{ id: 'booking-1', check_in_date: '2028-02-29' }], new Date(2028, 1, 1));
  assert.equal(grid.days.filter(Boolean).length, 29);
  assert.equal(grid.days[0], null);
  assert.equal(grid.days.find((day) => day?.day === 29).bookingCount, 1);
});

test('derives monthly trend and service distribution from actual orders', () => {
  const hotelBookings = [
    { created_at: '2026-01-05T00:00:00.000Z' },
    { created_at: '2026-01-20T00:00:00.000Z' },
  ];
  const travelOrders = [
    { created_at: '2026-02-10T00:00:00.000Z', product_type: 'cruise' },
    { created_at: '2026-02-12T00:00:00.000Z', product_type: 'flight' },
  ];

  assert.deepEqual(buildMonthlyOrderCounts(hotelBookings, travelOrders, 2026).slice(0, 3), [2, 2, 0]);
  assert.deepEqual(buildServiceBreakdown(hotelBookings, travelOrders).map((item) => item.count), [2, 1, 1]);
});
