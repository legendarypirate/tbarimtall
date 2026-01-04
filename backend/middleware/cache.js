// Simple in-memory cache middleware
const cache = new Map();

// Cache duration in milliseconds (5 minutes default)
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Middleware to cache responses for GET requests
 * @param {number} duration - Cache duration in milliseconds
 */
const cacheMiddleware = (duration = DEFAULT_CACHE_DURATION) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cached = cache.get(key);

    if (cached && Date.now() < cached.expires) {
      // Return cached response
      return res.json(cached.data);
    }

    // Store original json function
    const originalJson = res.json.bind(res);

    // Override json to cache the response
    res.json = function (data) {
      // Cache the response
      cache.set(key, {
        data,
        expires: Date.now() + duration
      });

      // Call original json function
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear cache for a specific key or all cache
 * @param {string} key - Optional key to clear, if not provided clears all
 */
const clearCache = (key = null) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

/**
 * Clear cache by pattern (e.g., all routes starting with /categories)
 * @param {string} pattern - Pattern to match against cache keys
 */
const clearCacheByPattern = (pattern) => {
  const regex = new RegExp(pattern);
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
};

module.exports = {
  cacheMiddleware,
  clearCache,
  clearCacheByPattern
};

