import { Router } from 'express';
import { z } from 'zod';
import * as assistantController from '../controllers/assistantController.js';
import { validateBody } from '../middlewares/validateMiddleware.js';

const router = Router();
const buckets = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LIMIT = 20;

const chatBody = z.object({
  message: z.string().trim().min(1).max(500),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(600),
  }).strict()).max(6).default([]),
}).strict();

function assistantRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || 'unknown';
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return next();
  }
  if (current.count >= REQUEST_LIMIT) {
    return res.status(429).json({
      success: false,
      code: 'ASSISTANT_RATE_LIMITED',
      message: 'Bạn đã gửi khá nhiều câu hỏi. Vui lòng thử lại sau ít phút.',
    });
  }
  current.count += 1;
  return next();
}

router.get('/status', assistantController.status);
router.post('/chat', assistantRateLimit, validateBody(chatBody), assistantController.chat);

export default router;
