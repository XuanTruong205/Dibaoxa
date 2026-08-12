function validateSource(source) {
  return (schema) => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errorMessages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: `Dữ liệu không hợp lệ: ${errorMessages}`,
        errors: result.error.errors,
      });
    }
    req[source] = result.data;
    next();
  };
}

export const validateBody = validateSource('body');
export const validateQuery = validateSource('query');
export const validateParams = validateSource('params');
