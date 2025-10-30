const axios = require('axios');

/**
 * YouTube Channel Statistics Analyzer
 * Multiple approaches to extract channel data without API
 */
class YouTubeChannelAnalyzer {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Method 1: Extract from channel page HTML (Most reliable)
   */
  async getChannelStatsFromHTML(channelUrl) {
    try {
      console.log(`🔍 Analyzing channel: ${channelUrl}`);
      
      const response = await axios.get(channelUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 15000
      });

      const html = response.data;
      
      // Extract channel statistics using multiple patterns
      const stats = {
        subscriberCount: this.extractSubscriberCount(html),
        videoCount: this.extractVideoCount(html),
        viewCount: this.extractViewCount(html),
        channelName: this.extractChannelName(html),
        channelId: this.extractChannelId(html),
        isVerified: this.checkIfVerified(html),
        description: this.extractDescription(html)
      };

      console.log('📊 Channel Statistics:', stats);
      return stats;

    } catch (error) {
      console.error('❌ Error analyzing channel:', error.message);
      return null;
    }
  }

  /**
   * Extract subscriber count from various HTML patterns
   */
  extractSubscriberCount(html) {
    const patterns = [
      // Pattern 1: Modern YouTube subscriber count in JSON
      /"subscriberCountText":\s*\{"accessibility":\s*\{"accessibilityData":\s*\{"label":\s*"([^"]*subscribers?[^"]*)"/i,
      /"subscriberCountText":\s*\{"simpleText":\s*"([^"]+)"/,
      /"subscriberCountText":\s*\{"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/,
      
      // Pattern 2: Header subscriber count (modern format)
      /"header":[^}]*"subscriberCountText":\s*\{"simpleText":\s*"([^"]+)"/,
      
      // Pattern 3: Channel metadata patterns
      /"metadataRowContainer":[^}]*"(\d+(?:\.\d+)?[KMB]?\s*subscribers?)"/i,
      
      // Pattern 4: Video owner subscriber count
      /"videoOwnerRenderer":[^}]*"subscriberCountText":\s*\{"simpleText":\s*"([^"]+)"/,
      
      // Pattern 5: About page subscriber count
      /"aboutChannelRenderer":[^}]*"subscriberCountText":\s*\{"simpleText":\s*"([^"]+)"/,
      
      // Pattern 6: Accessibility labels
      /"accessibilityData":\s*\{\s*"label":\s*"([^"]*subscriber[^"]*)/i,
      
      // Pattern 7: Meta description
      /<meta\s+name="description"\s+content="[^"]*?(\d+(?:\.\d+)?[KMB]?\s*subscriber)/i,
      /<meta\s+property="og:description"\s+content="[^"]*?(\d+(?:\.\d+)?[KMB]?\s*subscriber)/i,
      
      // Pattern 8: Direct text in page
      /•\s*(\d+(?:\.\d+)?[KMB]?\s*subscribers?)/i,
      
      // Pattern 9: Broader subscriber text search
      /(\d+(?:\.\d+)?[KMB]?)\s*subscribers?/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const subscriberText = match[1];
        console.log(`✅ Found subscriber count: ${subscriberText}`);
        return this.parseCount(subscriberText);
      }
    }

    console.warn('⚠️ Could not extract subscriber count');
    return null;
  }

  /**
   * Extract video count
   */
  extractVideoCount(html) {
    const patterns = [
      // Pattern 1: Modern videos count in channel header
      /"videosCountText":\s*\{"accessibility":\s*\{"accessibilityData":\s*\{"label":\s*"([^"]*videos?[^"]*)"/i,
      /"videosCountText":\s*\{"simpleText":\s*"([^"]+)"/,
      
      // Pattern 2: Videos tab text
      /"text":\s*"(\d+(?:,\d{3})*(?:\.\d+)?[KMB]?)\s*videos?"/i,
      
      // Pattern 3: Channel stats in metadata
      /"stats":[^}]*"(\d+(?:,\d{3})*(?:\.\d+)?[KMB]?)\s*videos?"/i,
      
      // Pattern 4: About page video count
      /"aboutChannelRenderer":[^}]*"videosCountText":\s*\{"simpleText":\s*"([^"]+)"/,
      
      // Pattern 5: Header stats
      /"header":[^}]*"videosCountText":\s*\{"simpleText":\s*"([^"]+)"/,
      
      // Pattern 6: Channel stats container
      /"channelStatsRenderer":[^}]*"(\d+(?:,\d{3})*(?:\.\d+)?[KMB]?)\s*videos?"/i,
      
      // Pattern 7: Direct text with bullet point (YouTube's modern format)
      /•\s*(\d+(?:,\d{3})*(?:\.\d+)?[KMB]?)\s*videos?/i,
      
      // Pattern 8: Accessibility labels
      /"accessibilityData":\s*\{\s*"label":\s*"([^"]*video[^"]*)/i,
      
      // Pattern 9: Broader video count search
      /(\d+(?:,\d{3})*(?:\.\d+)?[KMB]?)\s*videos?/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const videoText = match[1];
        console.log(`✅ Found video count: ${videoText}`);
        return this.parseCount(videoText);
      }
    }

    console.warn('⚠️ Could not extract video count');
    return null;
  }

  /**
   * Extract total view count
   */
  extractViewCount(html) {
    const patterns = [
      // Pattern 1: Channel about page
      /"viewCountText":\s*\{"simpleText":\s*"([^"]+)"/,
      
      // Pattern 2: Stats in JSON
      /"stats":\s*\[[^]]*?"runs":\s*\[[^]]*?"text":\s*"([^"]*view[^"]*)/i,
      
      // Pattern 3: Meta description
      /<meta\s+property="og:description"\s+content="[^"]*?(\d+(?:\.\d+)?[KMB]?\s*view)/i,
      
      // Pattern 4: Direct view patterns
      /(\d+(?:,\d{3})*(?:\.\d+)?[KMB]?)\s*views?/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const viewText = match[1];
        console.log(`✅ Found view count: ${viewText}`);
        return this.parseCount(viewText);
      }
    }

    console.warn('⚠️ Could not extract view count');
    return null;
  }

  /**
   * Extract channel name
   */
  extractChannelName(html) {
    const patterns = [
      // Pattern 1: Page title
      /<title>([^<]+)/,
      
      // Pattern 2: Channel metadata
      /"title":\s*"([^"]+)"/,
      
      // Pattern 3: Open Graph
      /<meta\s+property="og:title"\s+content="([^"]+)"/,
      
      // Pattern 4: JSON-LD
      /"name":\s*"([^"]+)"/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        let channelName = match[1].replace(' - YouTube', '').trim();
        console.log(`✅ Found channel name: ${channelName}`);
        return channelName;
      }
    }

    return null;
  }

  /**
   * Extract channel ID
   */
  extractChannelId(html) {
    const patterns = [
      // Pattern 1: Channel ID in meta
      /"channelId":\s*"([^"]+)"/,
      
      // Pattern 2: External ID
      /"externalId":\s*"([^"]+)"/,
      
      // Pattern 3: URL pattern
      /channel\/([UC][a-zA-Z0-9_-]{22})/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        console.log(`✅ Found channel ID: ${match[1]}`);
        return match[1];
      }
    }

    return null;
  }

  /**
   * Check if channel is verified
   */
  checkIfVerified(html) {
    const verificationPatterns = [
      /"isVerified":\s*true/i,
      /"badges":[^]]*?"iconType":\s*"CHECK"/,
      /verified.*channel/i
    ];

    return verificationPatterns.some(pattern => pattern.test(html));
  }

  /**
   * Extract channel description
   */
  extractDescription(html) {
    const patterns = [
      // Pattern 1: Meta description
      /<meta\s+name="description"\s+content="([^"]+)"/,
      
      // Pattern 2: Open Graph description
      /<meta\s+property="og:description"\s+content="([^"]+)"/,
      
      // Pattern 3: JSON description
      /"description":\s*\{"simpleText":\s*"([^"]+)"/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Parse count strings (e.g., "7.77M", "30K", "1,234") to numbers
   */
  parseCount(countStr) {
    if (!countStr) return null;
    
    const originalStr = countStr.toString().toLowerCase();
    console.log(`🔍 Parsing count string: "${countStr}"`);
    
    // Handle word-based counts (thousand, million, billion)
    if (originalStr.includes('thousand')) {
      const numMatch = originalStr.match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const result = Math.round(parseFloat(numMatch[1]) * 1000);
        console.log(`🔢 Parsed "${countStr}" as ${result.toLocaleString()}`);
        return result;
      }
    }
    
    if (originalStr.includes('million')) {
      const numMatch = originalStr.match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const result = Math.round(parseFloat(numMatch[1]) * 1000000);
        console.log(`🔢 Parsed "${countStr}" as ${result.toLocaleString()}`);
        return result;
      }
    }
    
    if (originalStr.includes('billion')) {
      const numMatch = originalStr.match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const result = Math.round(parseFloat(numMatch[1]) * 1000000000);
        console.log(`🔢 Parsed "${countStr}" as ${result.toLocaleString()}`);
        return result;
      }
    }
    
    // Extract just the number part with decimal support
    const numMatch = originalStr.match(/(\d+(?:\.\d+)?)/);
    if (!numMatch) {
      console.warn(`⚠️ No numeric value found in "${countStr}"`);
      return null;
    }
    
    const baseNum = parseFloat(numMatch[1]);
    let multiplier = 1;
    
    // Check for K, M, B suffixes (case insensitive)
    if (/k(?![a-z])/i.test(originalStr)) {
      multiplier = 1000;
    } else if (/m(?![a-z])/i.test(originalStr)) {
      multiplier = 1000000;
    } else if (/b(?![a-z])/i.test(originalStr)) {
      multiplier = 1000000000;
    }
    
    const result = Math.round(baseNum * multiplier);
    console.log(`🔢 Parsed "${countStr}" as ${result.toLocaleString()}`);
    return result;
  }

  /**
   * Method 2: Get channel info from RSS feed (Limited data)
   */
  async getChannelStatsFromRSS(channelUrl) {
    try {
      // Extract channel ID from URL
      const channelId = this.extractChannelIdFromUrl(channelUrl);
      if (!channelId) {
        throw new Error('Could not extract channel ID from URL');
      }

      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      
      const response = await axios.get(rssUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000
      });

      // Parse RSS for basic channel info
      const channelNameMatch = response.data.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/);
      const channelName = channelNameMatch ? channelNameMatch[1] : null;

      console.log(`📺 RSS Channel Name: ${channelName}`);
      
      return {
        channelName,
        channelId,
        method: 'rss',
        note: 'RSS provides limited data - only channel name and recent videos'
      };

    } catch (error) {
      console.error('❌ RSS method failed:', error.message);
      return null;
    }
  }

  /**
   * Extract channel ID from various YouTube URL formats
   */
  extractChannelIdFromUrl(url) {
    const patterns = [
      // UC channel ID format
      /channel\/([UC][a-zA-Z0-9_-]{22})/,
      // Custom URL - would need additional lookup
      /\/c\/([^\/\?]+)/,
      /\/user\/([^\/\?]+)/,
      /\/@([^\/\?]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Method 3: Batch analyze multiple channels
   */
  async analyzeMultipleChannels(channelUrls) {
    console.log(`🔍 Analyzing ${channelUrls.length} channels...`);
    
    const results = [];
    
    for (const url of channelUrls) {
      try {
        console.log(`\n📺 Processing: ${url}`);
        const stats = await this.getChannelStatsFromHTML(url);
        
        if (stats) {
          results.push({
            url,
            ...stats,
            success: true
          });
        } else {
          results.push({
            url,
            success: false,
            error: 'Could not extract channel data'
          });
        }
        
        // Delay between requests to be respectful
        await this.delay(2000);
        
      } catch (error) {
        console.error(`❌ Failed to analyze ${url}:`, error.message);
        results.push({
          url,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Method 4: Check if channel is Telugu-relevant
   */
  isTeluguChannel(channelStats) {
    if (!channelStats) return false;
    
    const teluguKeywords = [
      'telugu', 'tollywood', 'hyderabad', 'andhra', 'telangana',
      'prabhas', 'mahesh babu', 'allu arjun', 'ram charan', 'jr ntr',
      'chiranjeevi', 'pawan kalyan', 'nani', 'vijay deverakonda'
    ];

    const searchText = `${channelStats.channelName || ''} ${channelStats.description || ''}`.toLowerCase();
    
    const isRelevant = teluguKeywords.some(keyword => searchText.includes(keyword));
    
    if (isRelevant) {
      console.log(`🎬 Telugu channel detected: ${channelStats.channelName}`);
    }
    
    return isRelevant;
  }

  /**
   * Utility: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format numbers for display
   */
  formatCount(count) {
    if (!count) return 'N/A';
    
    if (count >= 1000000000) {
      return (count / 1000000000).toFixed(1) + 'B';
    } else if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    } else {
      return count.toLocaleString();
    }
  }
}

module.exports = YouTubeChannelAnalyzer;
