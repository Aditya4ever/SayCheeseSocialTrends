const axios = require('axios');

/**
 * URL validation service to check if links are accessible
 * Filters out broken or inaccessible URLs before displaying content
 */
class URLValidator {
  constructor() {
    this.cache = new Map(); // Cache validation results to avoid repeated checks
    this.timeout = 5000; // 5 seconds timeout for URL checks
    this.maxCacheAge = 30 * 60 * 1000; // Cache results for 30 minutes
  }

  async validateURL(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Check cache first
    const cached = this.cache.get(url);
    if (cached && (Date.now() - cached.timestamp) < this.maxCacheAge) {
      return cached.isValid;
    }

    try {
      // Skip validation for certain domains that are known to be problematic
      const problematicDomains = ['reddit.com', 'redd.it'];
      const urlObj = new URL(url);
      
      if (problematicDomains.some(domain => urlObj.hostname.includes(domain))) {
        // For Reddit links, assume they're valid since Reddit is reliable
        this.cacheResult(url, true);
        return true;
      }

      // For YouTube videos, use a HEAD request to check availability
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        return await this.validateYouTubeURL(url);
      }

      // For other URLs, do a quick HEAD request
      const response = await axios.head(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'SayCheese-URLValidator/1.0'
        },
        validateStatus: (status) => status < 400 // Accept 2xx and 3xx status codes
      });

      const isValid = response.status < 400;
      this.cacheResult(url, isValid);
      return isValid;

    } catch (error) {
      // If HEAD fails, try GET with minimal data
      try {
        const response = await axios.get(url, {
          timeout: this.timeout,
          headers: {
            'User-Agent': 'SayCheese-URLValidator/1.0',
            'Range': 'bytes=0-1023' // Only download first 1KB
          },
          validateStatus: (status) => status < 400
        });

        const isValid = response.status < 400;
        this.cacheResult(url, isValid);
        return isValid;
      } catch (secondError) {
        console.warn(`⚠️  URL validation failed for ${url}: ${error.message}`);
        this.cacheResult(url, false);
        return false;
      }
    }
  }

  async validateYouTubeURL(url) {
    try {
      // Extract video ID from YouTube URL
      const videoId = this.extractYouTubeVideoId(url);
      if (!videoId) return false;

      // Use YouTube oEmbed endpoint to check if video exists
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      
      const response = await axios.get(oembedUrl, {
        timeout: this.timeout,
        validateStatus: (status) => status < 400
      });

      const isValid = response.status === 200 && response.data.title;
      this.cacheResult(url, isValid);
      return isValid;

    } catch (error) {
      console.warn(`⚠️  YouTube URL validation failed for ${url}: ${error.message}`);
      this.cacheResult(url, false);
      return false;
    }
  }

  extractYouTubeVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  cacheResult(url, isValid) {
    this.cache.set(url, {
      isValid,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  cleanupCache() {
    const now = Date.now();
    for (const [url, data] of this.cache.entries()) {
      if (now - data.timestamp > this.maxCacheAge) {
        this.cache.delete(url);
      }
    }
  }

  async validateBatch(urls, concurrency = 5) {
    // Validate multiple URLs with limited concurrency
    const results = [];
    
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const promises = batch.map(async (url) => {
        const isValid = await this.validateURL(url);
        return { url, isValid };
      });
      
      const batchResults = await Promise.allSettled(promises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { url: batch[i], isValid: false }
      ));
    }
    
    return results;
  }

  getStats() {
    const now = Date.now();
    const validCount = Array.from(this.cache.values()).filter(data => 
      data.isValid && (now - data.timestamp) < this.maxCacheAge
    ).length;
    
    return {
      totalCached: this.cache.size,
      validUrls: validCount,
      invalidUrls: this.cache.size - validCount
    };
  }
}

module.exports = URLValidator;
