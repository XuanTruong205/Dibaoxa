import { Router } from 'express';
import { z } from 'zod';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { loginRateLimiter } from '../middlewares/securityMiddleware.js';
import { validateBody } from '../middlewares/validateMiddleware.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().trim().email('Email không đúng định dạng').max(254).transform((value) => value.toLowerCase()),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Za-z]/, 'Mật khẩu phải có ít nhất một chữ cái')
    .regex(/\d/, 'Mật khẩu phải có ít nhất một chữ số')
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Mật khẩu không được vượt quá 72 byte'),
  full_name: z.string().trim().min(2, 'Họ tên không được để trống').max(100),
  phone: z.string().trim().regex(/^[+\d][\d\s().-]{7,19}$/, 'Số điện thoại không hợp lệ').optional(),
}).strict();

const loginSchema = z.object({
  email: z.string().trim().email('Email không đúng định dạng').max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu').refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'Mật khẩu không hợp lệ'
  ),
}).strict();

const updateProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100).optional(),
  phone: z.union([
    z.string().trim().regex(/^[+\d][\d\s().-]{7,19}$/, 'Số điện thoại không hợp lệ'),
    z.literal(''),
  ]).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Cần cung cấp ít nhất một thông tin để cập nhật',
});

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', loginRateLimiter, validateBody(loginSchema), authController.login);
router.get('/me', authenticate, authController.getProfile);
router.patch('/me', authenticate, validateBody(updateProfileSchema), authController.updateProfile);

export default router;
