import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';

export function authenticate(req, res, next) {
  try {
    let token = null;

    // Check Header Authorization: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.',
      });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded; // { userId, role, email }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Xác thực không hợp lệ. Vui lòng đăng nhập lại.',
    });
  }
}

export function authorizeRoles(...allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ.' });
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, email: true, role: true, assigned_hotel: true },
      });
      if (!currentUser) {
        return res.status(401).json({ success: false, message: 'Tài khoản không còn tồn tại.' });
      }

      req.user = {
        ...req.user,
        role: currentUser.role,
        email: currentUser.email,
        assigned_hotel: currentUser.assigned_hotel,
      };
      if (!allowedRoles.includes(currentUser.role)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền thực hiện thao tác này.',
        });
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
