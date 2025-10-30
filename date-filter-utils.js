/**
 * Date utility functions for filtering recent content
 * Includes validation to filter out invalid/ancient timestamps
 */
class DateFilterUtils {
  static isValidDate(dateString) {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return false;
    
    // Check if date is not too far in the past (before 2020)
    const minimumDate = new Date('2020-01-01');
    if (date < minimumDate) {
      console.warn(`⚠️  Invalid timestamp detected: ${dateString} (${date.getFullYear()}) - skipping`);
      return false;
    }
    
    // Check if date is not in the future (beyond tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date > tomorrow) {
      console.warn(`⚠️  Future timestamp detected: ${dateString} - skipping`);
      return false;
    }
    
    return true;
  }

  static isWithinDays(dateString, days = 7) {
    if (!this.isValidDate(dateString)) return false;
    
    const contentDate = new Date(dateString);
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return contentDate >= cutoffDate;
  }

  static isWithinWeek(dateString) {
    return this.isWithinDays(dateString, 7);
  }

  static parseRedditTime(timestamp) {
    // Reddit timestamps are in seconds, convert to milliseconds
    try {
      // Validate timestamp is reasonable (not negative, not too old, not too new)
      if (!timestamp || timestamp < 0) return null;
      
      // Check if timestamp is in seconds (typical for Reddit) or milliseconds
      const date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
      
      if (!this.isValidDate(date.toISOString())) return null;
      
      return date.toISOString();
    } catch (error) {
      console.warn(`⚠️  Invalid Reddit timestamp: ${timestamp}`);
      return null;
    }
  }

  static parseRSSDate(dateString) {
    // Handle various RSS date formats
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      const isoString = date.toISOString();
      
      return this.isValidDate(isoString) ? isoString : null;
    } catch (error) {
      console.warn('Failed to parse RSS date:', dateString);
      return null;
    }
  }

  static getSevenDaysAgo() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return sevenDaysAgo;
  }

  static formatTimeAgo(dateString) {
    if (!this.isValidDate(dateString)) return 'Invalid date';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return '1 day ago';
    } else {
      return `${diffDays} days ago`;
    }
  }

  static isRecent(dateString, maxDays = 7) {
    if (!this.isValidDate(dateString)) return false;
    
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
    
    return diffDays <= maxDays;
  }
}

module.exports = DateFilterUtils;
