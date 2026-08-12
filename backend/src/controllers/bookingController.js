import * as bookingService from '../services/bookingService.js';
import { getIO } from '../sockets/roomSocket.js';

export async function holdRoom(req, res, next) {
  try {
    const { room_id, check_in_date, check_out_date, quantity } = req.body;
    const userId = req.user.userId;

    const result = await bookingService.holdRoom({
      room_id,
      check_in_date,
      check_out_date,
      userId,
      quantity,
    });

    // Broadcast room hold event via WebSockets
    const io = getIO();
    if (io) {
      io.to(`hotel_${result.hotel_id}`).emit('room_held', {
        room_id,
        check_in_date,
        check_out_date,
        quantity: result.quantity,
        expires_at: result.expires_at,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Khóa giữ phòng thành công trong 10 phút!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function confirmBooking(req, res, next) {
  try {
    const userId = req.user.userId; // Secure extraction from Auth Token
    const {
      hold_id, room_id, check_in_date, check_out_date, guest_name, guest_phone,
      total_guests, quantity, services, payment_method,
    } = req.body;

    const result = await bookingService.confirmBooking({
      userId,
      room_id,
      check_in_date,
      check_out_date,
      guest_name,
      guest_phone,
      total_guests,
      quantity,
      services,
      payment_method,
      hold_id,
    });

    res.status(201).json({
      success: true,
      message: 'Đơn đã được tạo và đang chờ xác nhận thanh toán.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyBookings(req, res, next) {
  try {
    const userId = req.user.userId;
    const bookings = await bookingService.getUserBookings(userId);
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelMyBooking(req, res, next) {
  try {
    const userId = req.user.userId;
    const bookingId = req.params.id;
    const result = await bookingService.cancelBooking(bookingId, userId);
    const io = getIO();
    if (io) {
      io.to(`hotel_${result.hotel_id}`).emit('booking_cancelled', {
        booking_id: result.id,
        room_id: result.room_id,
        check_in_date: result.check_in_date,
        check_out_date: result.check_out_date,
      });
    }
    res.status(200).json({
      success: true,
      message: 'Đã hủy đơn đặt phòng thành công.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function releaseMyHold(req, res, next) {
  try {
    const result = await bookingService.releaseHold(req.params.holdId, req.user.userId);
    const io = getIO();
    if (io) {
      io.to(`hotel_${result.hotel_id}`).emit('room_hold_released', {
        hold_id: result.hold_id,
        room_id: result.room_id,
      });
    }
    res.status(200).json({ success: true, message: 'Đã giải phóng phòng đang giữ.', data: result });
  } catch (error) {
    next(error);
  }
}
