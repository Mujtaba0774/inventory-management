export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  let statusCode = err.statusCode ?? 500;
  let message = statusCode === 500 ? 'Internal Server Error' : err.message;

  // Handle PostgreSQL specific errors
  if (err.code === '23505') {
    // Unique constraint violation
    statusCode = 400;
    if (err.constraint === 'vendors_email_key') {
      message = 'This email is already registered for another vendor';
    } else if (err.constraint === 'vendors_name_key') {
      message = 'A vendor with this name already exists';
    } else if (err.constraint === 'products_sku_key') {
      message = 'This SKU already exists';
    } else {
      message = `A record with this ${err.constraint?.replace(/_key$/, '').replace(/_/g, ' ')} already exists`;
    }
  } else if (err.code === '23503') {
    // Foreign key constraint violation
    statusCode = 400;
    message = 'Cannot perform this operation due to related records';
  } else if (err.code === '22P02') {
    // Invalid text representation of UUID
    statusCode = 400;
    message = 'Invalid ID format';
  }

  console.error(`[${statusCode}]`, err);

  res.status(statusCode).json({
    message,
  });
};