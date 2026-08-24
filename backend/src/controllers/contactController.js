import * as contactService from '../services/contactService.js';

export async function createInquiry(req, res, next) {
  try {
    const inquiry = await contactService.createInquiry(req.body);
    res.status(201).json({
      success: true,
      message: 'Yêu cầu của bạn đã được tiếp nhận.',
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
}

export async function listInquiries(req, res, next) {
  try {
    const result = await contactService.listInquiries(req.query);
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}

export async function updateInquiryStatus(req, res, next) {
  try {
    const inquiry = await contactService.updateInquiryStatus(req.params.id, req.body.status);
    res.json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
}
