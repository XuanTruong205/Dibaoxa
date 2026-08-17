import { Router } from 'express';
import { z } from 'zod';
import * as paymentController from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams } from '../middlewares/validateMiddleware.js';

const router = Router();

const bookingParams = z.object({ bookingId: z.string().trim().min(1).max(120) }).strict();
const paymentParams = z.object({ transactionRef: z.string().trim().min(8).max(120) }).strict();
const vnpayWebhookSchema = z.object({
  vnp_ResponseCode: z.string().min(1),
  vnp_TxnRef: z.string().min(1).max(128),
  vnp_Amount: z.union([z.string(), z.number()]),
  vnp_SecureHash: z.string().min(1).max(256),
  vnp_TransactionStatus: z.string().optional(),
}).passthrough();
const sepayWebhookSchema = z.object({
  id: z.union([z.number().int().nonnegative(), z.string().trim().min(1).max(120)]),
  gateway: z.string().trim().min(1).max(120),
  transactionDate: z.string().trim().min(1).max(80),
  accountNumber: z.string().trim().min(1).max(80),
  code: z.string().trim().max(120).nullable().optional(),
  content: z.string().trim().max(500).nullable().optional(),
  transferType: z.enum(['in', 'out']),
  description: z.string().trim().max(1000).nullable().optional(),
  transferAmount: z.number().int().positive(),
  referenceCode: z.string().trim().max(200).nullable().optional(),
}).passthrough();

router.post('/demo-confirm/:bookingId', authenticate, validateParams(bookingParams), paymentController.demoConfirm);
router.post('/vnpay-webhook', validateBody(vnpayWebhookSchema), paymentController.vnpayWebhook);
router.post('/sepay-webhook', validateBody(sepayWebhookSchema), paymentController.sepayWebhook);
router.get('/status/:transactionRef', authenticate, validateParams(paymentParams), paymentController.paymentStatus);

export default router;
