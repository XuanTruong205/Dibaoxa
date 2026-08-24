import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import * as contactController from '../controllers/contactController.js';
import { validateBody } from '../middlewares/validateMiddleware.js';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    code: 'CONTACT_RATE_LIMITED',
    message: 'Bạn đã gửi nhiều yêu cầu liên tiếp. Vui lòng thử lại sau.',
  },
});

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().regex(/^[+\d][\d\s().-]{7,19}$/),
  service: z.enum(['cruise', 'hotel', 'flight', 'corporate', 'other']),
  message: z.string().trim().min(10).max(3000),
}).strict();

router.post('/', contactLimiter, validateBody(inquirySchema), contactController.createInquiry);

export default router;
