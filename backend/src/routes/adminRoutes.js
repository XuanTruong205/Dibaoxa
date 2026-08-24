import { Router } from 'express';
import { z } from 'zod';
import * as adminController from '../controllers/adminController.js';
import * as cruiseDepartureController from '../controllers/cruiseDepartureController.js';
import * as contactController from '../controllers/contactController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { adminRateLimiter } from '../middlewares/securityMiddleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validateMiddleware.js';

const router = Router();
const adminOnly = authorizeRoles('admin');
const operations = authorizeRoles('admin', 'receptionist');
const entityId = z.string().trim().min(1).max(120);
const uuidParams = z.object({ id: entityId }).strict();
const stringList = z.array(z.string().trim().min(1).max(300)).max(50);
const departureInventory = z.object({
  cabin_name: z.string().trim().min(1).max(120),
  total_units: z.number().int().min(0).max(10_000),
  price_override: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
}).strict();

const roomSchema = z.object({
  id: entityId.optional(),
  name: z.string().trim().min(2).max(120),
  room_type: z.string().trim().min(2).max(60).default('Double'),
  price_per_night: z.number().int().min(0).max(1_000_000_000),
  max_occupancy: z.number().int().min(1).max(50).default(2),
  bed_type: z.string().trim().min(1).max(100),
  area_sqm: z.number().int().min(1).max(10_000),
  view_type: z.string().trim().min(1).max(100).default('City view'),
  images: stringList.default([]),
  room_services: stringList.default([]),
  total_rooms: z.number().int().min(1).max(10_000).default(10),
  is_available: z.boolean().default(true),
}).strict();

const serviceSchema = z.object({
  id: entityId.optional(),
  name: z.string().trim().min(2).max(120),
  price: z.number().int().min(0).max(1_000_000_000),
  description: z.string().trim().min(1).max(1000),
}).strict();

const hotelSchema = z.object({
  name: z.string().trim().min(2).max(160),
  city: z.string().trim().min(2).max(100),
  address: z.string().trim().min(3).max(300),
  star_rating: z.number().int().min(1).max(5),
  description: z.string().trim().min(10).max(10_000),
  cover_image: z.string().trim().min(1).max(1000),
  operator_company: z.string().trim().max(200).optional(),
  amenities: stringList.default([]),
  gallery_images: stringList.default([]),
  highlights: stringList.default([]),
  highlight_bullets: stringList.default([]),
  policies: stringList.default([]),
  faqs: z.array(z.object({
    question: z.string().trim().min(3).max(300),
    answer: z.string().trim().min(3).max(2000),
  }).strict()).max(30).default([]),
  rooms: z.array(roomSchema).min(1).max(200),
  services: z.array(serviceSchema).max(100).default([]),
}).strict();

const cruiseSchema = z.object({
  id: entityId.optional(),
  name: z.string().trim().min(2).max(160),
  operator: z.string().trim().min(2).max(160),
  destination: z.string().trim().min(2).max(100),
  departure_port: z.string().trim().min(2).max(300),
  duration_days: z.number().int().min(1).max(30),
  price: z.number().int().min(0).max(1_000_000_000),
  rating: z.number().min(0).max(10).default(9),
  review_count: z.number().int().min(0).max(10_000_000).default(0),
  ship_class: z.number().int().min(1).max(5).default(5),
  image: z.string().trim().min(1).max(1000),
  gallery_images: stringList.default([]),
  features: stringList.default([]),
  cabins: stringList.min(1).max(100),
  itinerary: stringList.min(1).max(100),
  description: z.string().trim().min(10).max(20_000),
  policies: stringList.default([]),
  faqs: z.array(z.object({
    question: z.string().trim().min(3).max(300),
    answer: z.string().trim().min(3).max(2000),
  }).strict()).max(30).default([]),
  specifications: z.object({
    launchedYear: z.number().int().min(1900).max(2100).nullable().optional(),
    cabinCount: z.number().int().min(1).max(10_000).nullable().optional(),
    hullMaterial: z.string().trim().max(120).optional(),
    route: z.string().trim().max(500).optional(),
  }).strict().default({}),
  status: z.enum(['active', 'inactive']).default('active'),
  launch_schedule: z.object({
    first_departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    departure_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('11:30'),
    departure_count: z.number().int().min(1).max(52).default(4),
    interval_days: z.number().int().min(1).max(90).default(7),
    units_per_cabin: z.number().int().min(1).max(10_000).optional(),
    cabin_inventory: z.array(departureInventory).min(1).max(100).optional(),
  }).strict().refine((value) => value.units_per_cabin || value.cabin_inventory?.length, {
    message: 'Cần số cabin mặc định hoặc cấu hình tồn kho theo từng cabin',
  }).optional(),
}).strict().superRefine((value, context) => {
  const inventory = value.launch_schedule?.cabin_inventory;
  if (!inventory?.length) return;

  const cabinNames = new Set(value.cabins);
  const inventoryNames = inventory.map((item) => item.cabin_name);
  if (new Set(inventoryNames).size !== inventoryNames.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['launch_schedule', 'cabin_inventory'], message: 'Tên cabin mở bán không được trùng nhau' });
  }
  inventoryNames.forEach((name, index) => {
    if (!cabinNames.has(name)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['launch_schedule', 'cabin_inventory', index, 'cabin_name'], message: 'Cabin mở bán phải nằm trong danh sách cabin của du thuyền' });
    }
  });
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.string().trim().max(50).optional(),
}).strict();

const userListQuery = listQuery.extend({
  group: z.enum(['customers', 'staff']).optional(),
  role: z.enum(['customer', 'receptionist', 'admin']).optional(),
});

const createBookingSchema = z.object({
  user_id: entityId.optional(),
  traveler_email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
  room_id: entityId,
  guest_name: z.string().trim().min(2).max(100),
  guest_phone: z.string().trim().regex(/^[+\d][\d\s().-]{7,19}$/),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_guests: z.number().int().min(1).max(100),
  room_quantity: z.number().int().min(1).max(20).default(1),
  payment_method: z.enum(['Demo', 'VietQR', 'VNPAY', 'Momo', 'CreditCard', 'Cash', 'Manual']),
  mark_paid: z.boolean().default(false),
}).strict().refine((value) => value.user_id || value.traveler_email, {
  message: 'Cần user_id hoặc traveler_email',
});

const checkinSchema = z.object({ qr_code: z.string().trim().min(8).max(300) }).strict();
const userSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^[+\d][\d\s().-]{7,19}$/).optional(),
  role: z.enum(['customer', 'receptionist', 'admin']).default('customer'),
  assigned_hotel: entityId.optional(),
}).strict().refine((value) => value.role !== 'receptionist' || value.assigned_hotel, {
  message: 'Lễ tân phải được gán khách sạn',
});

const updateUserSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional(),
  password: z.string().min(8).refine((value) => Buffer.byteLength(value, 'utf8') <= 72).optional(),
  full_name: z.string().trim().min(2).max(100).optional(),
  phone: z.union([z.string().trim().regex(/^[+\d][\d\s().-]{7,19}$/), z.literal('')]).optional(),
  role: z.enum(['customer', 'receptionist', 'admin']).optional(),
  assigned_hotel: entityId.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Cần ít nhất một trường để cập nhật',
}).refine((value) => value.role !== 'receptionist' || value.assigned_hotel, {
  message: 'Lễ tân phải được gán khách sạn',
});

const packageSchema = z.object({
  title: z.string().trim().min(2).max(160), destination: z.string().trim().min(2).max(100),
  duration: z.string().trim().min(1).max(100), price: z.number().int().min(0).max(1_000_000_000),
  included: stringList.default([]), status: z.enum(['active', 'inactive']).default('active'),
}).strict();
const staffSchema = z.object({
  full_name: z.string().trim().min(2).max(100), email: z.string().trim().email().optional(),
  job_title: z.string().trim().min(2).max(100), phone: z.string().trim().min(8).max(30),
  assigned_hotel: z.string().trim().min(1).max(200),
  photo_url: z.string().trim().max(1000).refine((value) => /^(https?:\/\/|\/)/i.test(value), 'Ảnh phải là URL http(s) hoặc đường dẫn bắt đầu bằng /').optional(),
  bio: z.string().trim().max(500).optional(),
  is_public: z.boolean().default(false),
  display_order: z.number().int().min(0).max(10_000).default(0),
  status: z.enum(['active', 'inactive']).default('active'),
}).strict().refine((value) => !value.is_public || Boolean(value.photo_url), {
  path: ['photo_url'],
  message: 'Hồ sơ công khai cần có ảnh chân dung đã được đồng ý sử dụng',
});
const reportQuery = z.object({
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict().refine((value) => (value.check_in && value.check_out) || (!value.check_in && !value.check_out), {
  message: 'Phải truyền đồng thời check_in và check_out',
});
const contactListQuery = listQuery.extend({ status: z.enum(['new', 'in_progress', 'resolved']).optional() });
const contactStatusSchema = z.object({ status: z.enum(['new', 'in_progress', 'resolved']) }).strict();

const departureSchema = z.object({
  cruise_id: entityId,
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departure_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('11:30'),
  status: z.enum(['open', 'closed', 'cancelled']).default('open'),
  inventory: z.array(departureInventory).min(1).max(100),
  notes: z.string().trim().max(2000).optional(),
}).strict();

router.use(authenticate);
router.use(adminRateLimiter);

router.get('/hotels', operations, adminController.getHotels);
router.post('/hotels', adminOnly, validateBody(hotelSchema), adminController.createHotel);
router.put('/hotels/:id', adminOnly, validateParams(uuidParams), validateBody(hotelSchema), adminController.updateHotel);
router.delete('/hotels/:id', adminOnly, validateParams(uuidParams), adminController.deleteHotel);
router.post('/hotels/:id/rooms', adminOnly, validateParams(uuidParams), validateBody(roomSchema.omit({ id: true })), adminController.createRoom);
router.delete('/reviews/:id', adminOnly, validateParams(uuidParams), adminController.deleteReview);

router.get('/cruises', operations, adminController.getCruises);
router.post('/cruises', adminOnly, validateBody(cruiseSchema), adminController.createCruise);
router.put('/cruises/:id', adminOnly, validateParams(uuidParams), validateBody(cruiseSchema), adminController.updateCruise);
router.delete('/cruises/:id', adminOnly, validateParams(uuidParams), adminController.deleteCruise);

router.get('/bookings', operations, validateQuery(listQuery), adminController.getBookings);
router.post('/bookings', operations, validateBody(createBookingSchema), adminController.createBooking);
router.post('/bookings/:id/cancel', operations, validateParams(uuidParams), adminController.cancelBooking);
router.post('/checkin', operations, validateBody(checkinSchema), adminController.checkin);
router.get('/travel-orders', adminOnly, validateQuery(listQuery), adminController.getTravelOrders);
router.post('/travel-orders/:id/confirm', adminOnly, validateParams(uuidParams), adminController.confirmTravelOrder);
router.post('/travel-orders/:id/cancel', adminOnly, validateParams(uuidParams), adminController.cancelTravelOrder);
router.get('/payments', operations, validateQuery(listQuery), adminController.getPayments);
router.get('/contact-inquiries', operations, validateQuery(contactListQuery), contactController.listInquiries);
router.patch('/contact-inquiries/:id/status', operations, validateParams(uuidParams), validateBody(contactStatusSchema), contactController.updateInquiryStatus);

router.get('/users', operations, validateQuery(userListQuery), adminController.getUsers);
router.post('/users', adminOnly, validateBody(userSchema), adminController.createUser);
router.patch('/users/:id', adminOnly, validateParams(uuidParams), validateBody(updateUserSchema), adminController.updateUser);
router.delete('/users/:id', adminOnly, validateParams(uuidParams), adminController.deleteUser);
router.get('/packages', operations, adminController.getPackages);
router.post('/packages', adminOnly, validateBody(packageSchema), adminController.createPackage);
router.put('/packages/:id', adminOnly, validateParams(uuidParams), validateBody(packageSchema), adminController.updatePackage);
router.delete('/packages/:id', adminOnly, validateParams(uuidParams), adminController.deletePackage);
router.get('/staff', operations, adminController.getStaff);
router.post('/staff', adminOnly, validateBody(staffSchema), adminController.createStaff);
router.put('/staff/:id', adminOnly, validateParams(uuidParams), validateBody(staffSchema), adminController.updateStaff);
router.delete('/staff/:id', adminOnly, validateParams(uuidParams), adminController.deleteStaff);
router.get('/reports/occupancy', operations, validateQuery(reportQuery), adminController.getOccupancyReport);

router.get('/cruise-departures', adminOnly, cruiseDepartureController.listDepartures);
router.post('/cruise-departures', adminOnly, validateBody(departureSchema), cruiseDepartureController.createDeparture);
router.put('/cruise-departures/:id', adminOnly, validateParams(uuidParams), validateBody(departureSchema.omit({ cruise_id: true })), cruiseDepartureController.updateDeparture);
router.delete('/cruise-departures/:id', adminOnly, validateParams(uuidParams), cruiseDepartureController.deleteDeparture);

export default router;
