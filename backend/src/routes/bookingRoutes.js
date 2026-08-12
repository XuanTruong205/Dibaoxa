import { Router } from 'express';
import { z } from 'zod';
import * as bookingController from '../controllers/bookingController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams } from '../middlewares/validateMiddleware.js';

const router = Router();
const entityId = z.string().trim().min(1).max(120);

const holdSchema = z.object({
  quantity: z.number().int().min(1).max(20).default(1),
  room_id: entityId,
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày nhận phòng không hợp lệ'),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày trả phòng không hợp lệ'),
}).strict();

const confirmSchema = z.object({
  quantity: z.number().int().min(1).max(20).default(1),
  hold_id: z.string().min(1, 'Hold ID là bắt buộc'),
  room_id: entityId,
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guest_name: z.string().trim().min(2).max(100),
  guest_phone: z.string().trim().regex(/^[+\d][\d\s().-]{7,19}$/, 'Số điện thoại không hợp lệ'),
  total_guests: z.number().int().min(1).max(100),
  services: z.array(z.object({
    service_id: entityId,
    quantity: z.number().int().min(1).max(20),
  }).strict()).max(20).default([]),
  payment_method: z.enum(['Demo', 'VietQR', 'VNPAY', 'Momo', 'CreditCard']),
}).strict();

const bookingIdSchema = z.object({ id: entityId }).strict();
const holdIdSchema = z.object({ holdId: z.string().startsWith('HOLD-').max(80) }).strict();

router.post('/hold', authenticate, validateBody(holdSchema), bookingController.holdRoom);
router.post('/confirm', authenticate, validateBody(confirmSchema), bookingController.confirmBooking);
router.get('/my-bookings', authenticate, bookingController.getMyBookings);
router.delete('/holds/:holdId', authenticate, validateParams(holdIdSchema), bookingController.releaseMyHold);
router.post('/cancel/:id', authenticate, validateParams(bookingIdSchema), bookingController.cancelMyBooking);

export default router;
