import * as adminService from '../services/adminService.js';
import * as cruiseService from '../services/cruiseService.js';
import { getIO } from '../sockets/roomSocket.js';

function emitHotelEvent(hotelId, event, payload) {
  const io = getIO();
  if (io && hotelId) io.to(`hotel_${hotelId}`).emit(event, payload);
}

export async function getHotels(req, res, next) {
  try { res.json({ success: true, data: await adminService.listHotels(req.user) }); } catch (error) { next(error); }
}

export async function createHotel(req, res, next) {
  try { res.status(201).json({ success: true, data: await adminService.createHotel(req.body) }); } catch (error) { next(error); }
}

export async function updateHotel(req, res, next) {
  try { res.json({ success: true, data: await adminService.updateHotel(req.params.id, req.body) }); } catch (error) { next(error); }
}

export async function deleteHotel(req, res, next) {
  try { res.json({ success: true, data: await adminService.deleteHotel(req.params.id) }); } catch (error) { next(error); }
}

export async function createRoom(req, res, next) {
  try { res.status(201).json({ success: true, data: await adminService.addRoom(req.params.id, req.body) }); } catch (error) { next(error); }
}

export async function deleteReview(req, res, next) {
  try { res.json({ success: true, data: await adminService.deleteReview(req.params.id) }); } catch (error) { next(error); }
}

export async function getCruises(req, res, next) {
  try { res.json({ success: true, data: await cruiseService.listCruises({ includeInactive: true }) }); } catch (error) { next(error); }
}

export async function createCruise(req, res, next) {
  try { res.status(201).json({ success: true, data: await cruiseService.createCruise(req.body) }); } catch (error) { next(error); }
}

export async function updateCruise(req, res, next) {
  try { res.json({ success: true, data: await cruiseService.updateCruise(req.params.id, req.body) }); } catch (error) { next(error); }
}

export async function deleteCruise(req, res, next) {
  try { res.json({ success: true, data: await cruiseService.deleteCruise(req.params.id) }); } catch (error) { next(error); }
}

export async function getBookings(req, res, next) {
  try {
    const result = await adminService.listBookings(req.user, req.query);
    res.json({ success: true, data: result.bookings, pagination: result.pagination });
  } catch (error) { next(error); }
}

export async function getTravelOrders(req, res, next) {
  try {
    const result = await adminService.listTravelOrders(req.user, req.query);
    res.json({ success: true, data: result.orders, pagination: result.pagination });
  } catch (error) { next(error); }
}

export async function confirmTravelOrder(req, res, next) {
  try { res.json({ success: true, data: await adminService.confirmTravelOrderByAdmin(req.params.id) }); } catch (error) { next(error); }
}

export async function cancelTravelOrder(req, res, next) {
  try { res.json({ success: true, data: await adminService.cancelTravelOrderByAdmin(req.params.id) }); } catch (error) { next(error); }
}

export async function createBooking(req, res, next) {
  try {
    const data = await adminService.createBookingByAdmin(req.user, req.body);
    emitHotelEvent(data.hotel_id, 'admin_booking_created', { booking_id: data.id, room_id: data.room_id });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
}

export async function cancelBooking(req, res, next) {
  try {
    const data = await adminService.cancelBookingByAdmin(req.user, req.params.id);
    emitHotelEvent(data.hotel_id, 'booking_cancelled', { booking_id: data.id, room_id: data.room_id });
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

export async function checkin(req, res, next) {
  try {
    const data = await adminService.checkinWithQR(req.body.qr_code, req.user);
    emitHotelEvent(data.hotel_id, 'booking_checked_in', { booking_id: data.id, room_id: data.room_id });
    res.json({ success: true, message: `Check-in thành công cho ${data.traveler_name}.`, data });
  } catch (error) { next(error); }
}

export async function getPayments(req, res, next) {
  try {
    const result = await adminService.listPayments(req.user, req.query);
    res.json({ success: true, data: result.payments, pagination: result.pagination });
  } catch (error) { next(error); }
}

export async function getUsers(req, res, next) {
  try {
    const result = await adminService.listUsers(req.user, req.query);
    res.json({ success: true, data: result.users, pagination: result.pagination });
  } catch (error) { next(error); }
}

export async function createUser(req, res, next) {
  try { res.status(201).json({ success: true, data: await adminService.createUser(req.body) }); } catch (error) { next(error); }
}

export async function updateUser(req, res, next) {
  try { res.json({ success: true, data: await adminService.updateUser(req.user, req.params.id, req.body) }); } catch (error) { next(error); }
}

export async function deleteUser(req, res, next) {
  try { res.json({ success: true, data: await adminService.deleteUser(req.user, req.params.id) }); } catch (error) { next(error); }
}

export async function getPackages(req, res, next) {
  try { res.json({ success: true, data: await adminService.listPackages() }); } catch (error) { next(error); }
}

export async function createPackage(req, res, next) {
  try { res.status(201).json({ success: true, data: await adminService.createPackage(req.body) }); } catch (error) { next(error); }
}

export async function updatePackage(req, res, next) {
  try { res.json({ success: true, data: await adminService.updatePackage(req.params.id, req.body) }); } catch (error) { next(error); }
}

export async function deletePackage(req, res, next) {
  try { res.json({ success: true, data: await adminService.deletePackage(req.params.id) }); } catch (error) { next(error); }
}

export async function getStaff(req, res, next) {
  try { res.json({ success: true, data: await adminService.listStaff(req.user) }); } catch (error) { next(error); }
}

export async function createStaff(req, res, next) {
  try { res.status(201).json({ success: true, data: await adminService.createStaff(req.body) }); } catch (error) { next(error); }
}

export async function updateStaff(req, res, next) {
  try { res.json({ success: true, data: await adminService.updateStaff(req.params.id, req.body) }); } catch (error) { next(error); }
}

export async function deleteStaff(req, res, next) {
  try { res.json({ success: true, data: await adminService.deleteStaff(req.params.id) }); } catch (error) { next(error); }
}

export async function getOccupancyReport(req, res, next) {
  try {
    const report = await adminService.getOccupancyReport(req.user, req.query.check_in, req.query.check_out);
    res.json({ success: true, data: report });
  } catch (error) { next(error); }
}
