import * as paymentService from '../services/paymentService.js';
import { getIO } from '../sockets/roomSocket.js';

function emitBooked(result) {
  const io = getIO();
  if (!io || !result) return;
  io.to(`hotel_${result.hotel_id || ''}`).emit('room_booked', {
    booking_id: result.booking_id,
    room_id: result.room_id,
    check_in_date: result.check_in_date,
    check_out_date: result.check_out_date,
  });
}

export async function demoConfirm(req, res, next) {
  try {
    const result = await paymentService.confirmDemoPayment(req.params.bookingId, req.user.userId);
    emitBooked(result);
    res.status(200).json({ success: true, message: 'Thanh toán mô phỏng đã hoàn tất.', data: result });
  } catch (error) {
    next(error);
  }
}

export async function vnpayWebhook(req, res, next) {
  try {
    const result = await paymentService.processVnpayWebhook(req.body);
    if (result.status === 'SUCCESS') emitBooked(result.data);
    res.status(200).json({ success: result.status === 'SUCCESS', ...result });
  } catch (error) {
    next(error);
  }
}
