/**
 * Rate Limiter Middleware
 * Limits the number of requests that can be made to the API
 */

/**
 * Rate limiting middleware
 * @param {Object} options - Rate limiting options
 * @param {number} options.windowMs - Time window in milliseconds 
 * @param {number} options.max - Maximum number of requests within windowMs
 * @param {string} options.message - Error message when limit is exceeded
 * @param {boolean} options.standardHeaders - Whether to add standard rate limit headers
 * @param {boolean} options.legacyHeaders - Whether to add legacy X-RateLimit headers
 * @returns {Function} Express middleware function
 */
exports.rateLimit = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes by default
  const max = options.max || 100; // 100 requests per windowMs by default
  const message = options.message || 'Too many requests, please try again later';
  const standardHeaders = options.standardHeaders !== false;
  const legacyHeaders = options.legacyHeaders !== false;

  // Simple in-memory store for rate limiting
  const store = new Map();

  // Clean up old entries periodically
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of store.entries()) {
      if (now - data.start > windowMs) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000); // Clean up every 5 minutes

  // Keep the process running
  interval.unref();

  return (req, res, next) => {
    // Get client IP
    const ip = req.ip || req.connection.remoteAddress;
    
    // Get current time
    const now = Date.now();
    
    // Create key for this client
    const key = ip;
    
    // Get or create store entry for this client
    if (!store.has(key)) {
      store.set(key, {
        start: now,
        count: 0
      });
    }
    
    // Get current store entry
    const current = store.get(key);
    
    // Reset if window has elapsed
    if (now - current.start > windowMs) {
      current.start = now;
      current.count = 0;
    }
    
    // Increment count
    current.count++;
    
    // Calculate remaining
    const remaining = Math.max(0, max - current.count);
    
    // Add headers
    if (standardHeaders) {
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', Math.ceil((current.start + windowMs) / 1000));
    }
    
    if (legacyHeaders) {
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil((current.start + windowMs) / 1000));
    }
    
    // If over limit, send error response
    if (current.count > max) {
      return res.status(429).json({
        success: false,
        error: message
      });
    }
    
    next();
  };
};
