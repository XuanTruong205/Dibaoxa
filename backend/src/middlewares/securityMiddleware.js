import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

const rateLimitResponse = {
  success: false,
  code: 'RATE_LIMITED',
  message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
};

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    return email ? `account:${email}` : `ip:${ipKeyGenerator(req.ip)}`;
  },
  message: rateLimitResponse,
});

export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || ipKeyGenerator(req.ip),
  message: rateLimitResponse,
});
