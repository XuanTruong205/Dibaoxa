import { Router } from 'express';
import { z } from 'zod';
import * as travelOrderController from '../controllers/travelOrderController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams } from '../middlewares/validateMiddleware.js';

const router = Router();
const entityId = z.string().trim().min(1).max(200);
const travelerSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().regex(/^[+\d][\d\s().-]{7,19}$/, 'Số điện thoại không hợp lệ'),
  note: z.string().trim().max(1000).default(''),
}).strict();
const common = {
  client_request_id: z.string().uuid(),
  traveler: travelerSchema,
  payment_method: z.enum(['Demo', 'VietQR']),
};
const createSchema = z.discriminatedUnion('product_type', [
  z.object({
    ...common,
    product_type: z.literal('flight'),
    quote_token: z.string().trim().min(40).max(10_000),
  }).strict(),
  z.object({
    ...common,
    product_type: z.literal('cruise'),
    product_id: entityId,
    depart_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    guests: z.number().int().min(1).max(20),
    cabin_count: z.number().int().min(1).max(10),
    selected_cabins: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
    cabin_quantities: z.record(z.string().trim().min(1).max(120), z.number().int().min(1).max(10)).optional(),
  }).strict(),
]);
const idParams = z.object({ id: entityId }).strict();

router.use(authenticate);
router.post('/', validateBody(createSchema), travelOrderController.create);
router.get('/my-orders', travelOrderController.listMine);
router.post('/:id/demo-confirm', validateParams(idParams), travelOrderController.confirmDemo);
router.post('/:id/cancel', validateParams(idParams), travelOrderController.cancel);

export default router;
