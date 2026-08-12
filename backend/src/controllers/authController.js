import * as authService from '../services/authService.js';

export async function register(req, res, next) {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Tặng ngay 100 điểm thưởng.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const profile = await authService.getUserProfile(req.user.userId);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const profile = await authService.updateUserProfile(req.user.userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ thành công.',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}
