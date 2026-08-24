import { Router } from 'express';
import { z } from 'zod';
import * as hotelController from '../controllers/hotelController.js';
import { validateParams, validateQuery } from '../middlewares/validateMiddleware.js';

const router = Router();

const hotelIdParams = z.object({ id: z.string().trim().min(1).max(120) }).strict();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const searchQuery = z.object({
  city: z.string().trim().max(100).optional(),
  min_price: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  stars: z.coerce.number().int().min(1).max(5).optional(),
  stay_type: z.enum(['resort', 'villa', 'boutique', 'family', 'nature', 'beach']).optional(),
  search: z.string().trim().max(120).optional(),
  check_in: z.string().regex(datePattern).optional(),
  check_out: z.string().regex(datePattern).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict().refine((value) => (value.check_in && value.check_out) || (!value.check_in && !value.check_out), {
  message: 'Phải truyền đồng thời check_in và check_out',
});

const roomQuery = z.object({
  check_in: z.string().regex(datePattern).optional(),
  check_out: z.string().regex(datePattern).optional(),
}).strict().refine((value) => (value.check_in && value.check_out) || (!value.check_in && !value.check_out), {
  message: 'Phải truyền đồng thời check_in và check_out',
});
const featuredReviewQuery = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(9),
}).strict();

router.get('/', validateQuery(searchQuery), hotelController.getHotels);
router.get('/featured-reviews', validateQuery(featuredReviewQuery), hotelController.getFeaturedReviews);
router.get('/:id', validateParams(hotelIdParams), hotelController.getHotelById);
router.get('/:id/rooms', validateParams(hotelIdParams), validateQuery(roomQuery), hotelController.getHotelRooms);

export default router;
