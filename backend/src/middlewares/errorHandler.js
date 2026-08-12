export function errorHandler(err, req, res, next) {
  console.error('💥 [Global Error Handler]:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message;
  let code = err.code;

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Nội dung JSON không hợp lệ.';
  } else if (err.code === 'P2002') {
    statusCode = 409;
    code = 'RESOURCE_CONFLICT';
    message = 'Dữ liệu đã tồn tại hoặc bị trùng với bản ghi khác.';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    code = 'RESOURCE_NOT_FOUND';
    message = 'Không tìm thấy dữ liệu cần thao tác.';
  } else if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    code = 'INVALID_DATABASE_INPUT';
    message = 'Dữ liệu gửi lên không hợp lệ.';
  } else if (statusCode >= 500 && err.name !== 'HttpError') {
    code = 'INTERNAL_SERVER_ERROR';
    message = 'Hệ thống gặp sự cố ngoài dự kiến. Vui lòng thử lại sau.';
  }

  return res.status(statusCode).json({
    success: false,
    message: message || 'Yêu cầu không thể xử lý.',
    ...(code && { code }),
    ...(err.details && { details: err.details }),
  });
}
