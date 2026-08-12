import { Router } from 'express';
import { z } from 'zod';
import * as paymentController from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams } from '../middlewares/validateMiddleware.js';

const router = Router();

const bookingParams = z.object({ bookingId: z.string().trim().min(1).max(120) }).strict();
const vnpayWebhookSchema = z.object({
  vnp_ResponseCode: z.string().min(1),
  vnp_TxnRef: z.string().min(1).max(128),
  vnp_Amount: z.union([z.string(), z.number()]),
  vnp_SecureHash: z.string().min(1).max(256),
  vnp_TransactionStatus: z.string().optional(),
}).passthrough();

router.post('/demo-confirm/:bookingId', authenticate, validateParams(bookingParams), paymentController.demoConfirm);
router.post('/vnpay-webhook', validateBody(vnpayWebhookSchema), paymentController.vnpayWebhook);

export default router;
