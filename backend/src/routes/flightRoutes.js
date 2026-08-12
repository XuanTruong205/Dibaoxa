import { Router } from 'express';
import { z } from 'zod';
import * as flightController from '../controllers/flightController.js';
import { validateQuery } from '../middlewares/validateMiddleware.js';

const router = Router();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const searchQuery = z.object({
  origin: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  destination: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  departure_date: z.string().regex(datePattern),
  return_date: z.string().regex(datePattern).optional(),
  adults: z.coerce.number().int().min(1).max(9).default(1),
  children: z.coerce.number().int().min(0).max(8).default(0),
  infants: z.coerce.number().int().min(0).max(4).default(0),
  travel_class: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY'),
  non_stop: z.enum(['true', 'false']).transform((value) => value === 'true').default('false'),
  max: z.coerce.number().int().min(1).max(50).default(30),
}).strict()
  .refine((value) => value.origin !== value.destination, { message: 'Điểm đi và điểm đến cần khác nhau', path: ['destination'] })
  .refine((value) => value.infants <= value.adults, { message: 'Mỗi em bé cần đi cùng ít nhất một người lớn', path: ['infants'] })
  .refine((value) => value.adults + value.children + value.infants <= 9, { message: 'Hệ thống hỗ trợ tối đa 9 hành khách trong một lần tìm', path: ['adults'] })
  .refine((value) => !value.return_date || value.return_date > value.departure_date, { message: 'Ngày về phải sau ngày đi', path: ['return_date'] });

router.get('/status', flightController.status);
router.get('/airports', flightController.airports);
router.get('/search', validateQuery(searchQuery), flightController.search);

export default router;
