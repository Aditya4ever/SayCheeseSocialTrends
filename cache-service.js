const NodeCache = require('node-cache');

// Cache with TTL in seconds
const trendingCache = new NodeCache({ stdTTL: 3600 }); // 1 hour default TTL

/**
 * Cache service for storing API responses
 */
class CacheService {
  /**
   * Get data from cache or fetch it using the provided function
   * 
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to call if cache miss
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>} - Cached or freshly fetched data
   */
  static async getOrFetch(key, fetchFn, ttl = 3600) {
    const cachedData = trendingCache.get(key);
    
    if (cachedData) {
      console.log(`Cache hit for ${key}`);
      return cachedData;
    }
    
    console.log(`Cache miss for ${key}, fetching fresh data`);
    const freshData = await fetchFn();
    trendingCache.set(key, freshData, ttl);
    return freshData;
  }
  
  /**
   * Manually set cache data
   * 
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in seconds
   */
  static set(key, data, ttl = 3600) {
    return trendingCache.set(key, data, ttl);
  }
  
  /**
   * Clear specific cache key or all cache
   * 
   * @param {string} [key] - Optional key to clear
   */
  static clear(key) {
    if (key) {
      trendingCache.del(key);
    } else {
      trendingCache.flushAll();
    }
  }
}

module.exports = CacheService;