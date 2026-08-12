import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';

export async function registerUser({ email, password, full_name, phone }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    const error = new Error('Email này đã được đăng ký tài khoản.');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: full_name.trim(),
      phone: phone || null,
      reward_points: 100, // Bonus points on registration
      vip_tier: 'silver',
      role: 'customer',
    },
  });

  const token = jwt.sign(
    { userId: newUser.id, role: newUser.role, email: newUser.email },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN }
  );

  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      phone: newUser.phone,
      reward_points: newUser.reward_points,
      vip_tier: newUser.vip_tier,
      role: newUser.role,
    },
    token,
  };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    const error = new Error('Tài khoản hoặc mật khẩu không chính xác.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Tài khoản hoặc mật khẩu không chính xác.');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      reward_points: user.reward_points,
      vip_tier: user.vip_tier,
      role: user.role,
    },
    token,
  };
}

export async function getUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      full_name: true,
      phone: true,
      reward_points: true,
      vip_tier: true,
      role: true,
      created_at: true,
    },
  });
  if (!user) {
    const error = new Error('Không tìm thấy người dùng.');
    error.statusCode = 404;
    throw error;
  }
  return user;
}

export async function updateUserProfile(userId, input) {
  const existingUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!existingUser) {
    const error = new Error('Không tìm thấy người dùng.');
    error.statusCode = 404;
    throw error;
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.full_name !== undefined && { full_name: input.full_name.trim() }),
      ...(input.phone !== undefined && { phone: input.phone.trim() || null }),
    },
    select: {
      id: true,
      email: true,
      full_name: true,
      phone: true,
      reward_points: true,
      vip_tier: true,
      role: true,
      created_at: true,
    },
  });
}
