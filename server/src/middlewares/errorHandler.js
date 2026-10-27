/**
 * Global Error Handling Middleware
 * Luôn trả về chuẩn JSON response: { status: 'error', message, errors }
 */
export function errorHandler(err, req, res, next) {
  console.error('[Error Handler]:', err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Lỗi máy chủ nội bộ',
    errors: err.errors || null,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    status: 'error',
    message: `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`,
    errors: null
  });
}
