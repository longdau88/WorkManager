import { ZodError } from 'zod';

/**
 * Validation Middleware using Zod Schema
 * Checks req.body, req.query, or req.params
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return res.status(400).json({
          status: 'error',
          message: 'Dữ liệu không hợp lệ',
          errors
        });
      }
      next(err);
    }
  };
}
