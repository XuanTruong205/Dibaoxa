import * as travelOrderService from '../services/travelOrderService.js';

export async function create(req, res, next) {
  try {
    const result = await travelOrderService.createTravelOrder(req.user.userId, req.body);
    res.status(result.already_created ? 200 : 201).json({ success: true, data: result.order, already_created: result.already_created });
  } catch (error) {
    next(error);
  }
}

export async function confirmDemo(req, res, next) {
  try {
    const data = await travelOrderService.confirmDemoTravelOrder(req.params.id, req.user.userId);
    res.status(200).json({ success: true, message: 'Thanh toán mô phỏng đã hoàn tất.', data });
  } catch (error) {
    next(error);
  }
}

export async function listMine(req, res, next) {
  try {
    const data = await travelOrderService.getUserTravelOrders(req.user.userId);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
}

export async function cancel(req, res, next) {
  try {
    const data = await travelOrderService.cancelTravelOrder(req.params.id, req.user.userId);
    res.status(200).json({ success: true, message: 'Đã hủy đơn dịch vụ.', data });
  } catch (error) {
    next(error);
  }
}
