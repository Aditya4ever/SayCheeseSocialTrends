const axios = require('axios');

class YouTubeChannelAnalyzer {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Extract subscriber count using targeted patterns for the main metadata section
   */
  extractSubscriberCount(html) {
    console.log('🔍 Extracting subscriber count...');
    
    // Highly specific patterns targeting the main channel metadata
    const patterns = [
      // Primary: metadataParts section (most reliable)
      /"metadataParts":\[.*?"text":\{"content":"([0-9.]+[KMB]?)\s+subscribers"\}/i,
      // Secondary: accessibilityLabel format
      /"accessibilityLabel":"([0-9.]+\.?[0-9]*)\s+million\s+subscribers"/i,
      /"accessibilityLabel":"([0-9.]+[KMB]?)\s+subscribers"/i,
      // Tertiary: contentMetadataViewModel format  
      /"contentMetadataViewModel".*?"metadataParts".*?"content":"([0-9.]+[KMB]?)\s+subscribers"/i,
      // Fallback patterns
      /"content":"([0-9.]+[KMB]?)\s+subscribers".*?"content":"[0-9.]+[KMB]?\s+videos"/i
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = html.match(pattern);
      if (match && match[1]) {
        console.log(`✅ Found subscriber count with pattern ${i + 1}: ${match[1]}`);
        return this.parseCount(match[1] + ' subscribers');
      }
    }

    console.log('❌ No subscriber count found');
    return null;
  }

  /**
   * Extract video count using targeted patterns for the main metadata section
   */
  extractVideoCount(html) {
    console.log('🔍 Extracting video count...');
    
    // Target the same metadataParts section where subscriber count appears
    const patterns = [
      // Primary: metadataParts section right after subscribers
      /"metadataParts":\[.*?"content":"[0-9.]+[KMB]?\s+subscribers".*?"content":"([0-9.]+[KMB]?)\s+videos"/i,
      // Alternative: separate metadataParts entry
      /"metadataParts":\[.*?"text":\{"content":"([0-9.]+[KMB]?)\s+videos"\}/i,
      // Fallback: any video count in metadata context
      /"contentMetadataViewModel".*?"content":"([0-9.]+[KMB]?)\s+videos"/i,
      // Last resort: any video count
      /"content":"([0-9.]+[KMB]?)\s+videos"/i
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = html.match(pattern);
      if (match && match[1]) {
        console.log(`✅ Found video count with pattern ${i + 1}: ${match[1]}`);
        return this.parseCount(match[1] + ' videos');
      }
    }

    console.log('❌ No video count found');
    return null;
  }

  /**
   * Parse count strings like "7.77M", "30K", "1.2B" into numbers
   */
  parseCount(countString) {
    console.log(`🔍 Parsing count string: "${countString}"`);
    
    // Extract number and unit
    const match = countString.match(/([0-9.]+)\s*([KMB]?)/i);
    if (!match) {
      console.log(`❌ Could not parse count: ${countString}`);
      return null;
    }

    const number = parseFloat(match[1]);
    const unit = match[2] ? match[2].toUpperCase() : '';

    let multiplier = 1;
    switch (unit) {
      case 'K':
        multiplier = 1000;
        break;
      case 'M':
        multiplier = 1000000;
        break;
      case 'B':
        multiplier = 1000000000;
        break;
    }

    const result = Math.round(number * multiplier);
    console.log(`🔢 Parsed "${countString}" as ${result.toLocaleString()}`);
    return result;
  }

  /**
   * Extract channel name from the page
   */
  extractChannelName(html) {
    const patterns = [
      /"title":\{"dynamicTextViewModel":\{"text":\{"content":"([^"]+)"/,
      /"pageTitle":"([^"]+)"/,
      /"title":"([^"]+)".*"subscriberCount/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Extract channel ID
   */
  extractChannelId(html) {
    const patterns = [
      /"browseId":"([^"]+)"/,
      /"channelId":"([^"]+)"/,
      /channel\/([A-Za-z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].startsWith('UC')) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Check if channel is verified
   */
  isVerified(html) {
    const verificationPatterns = [
      /"isVerified":true/i,
      /CHECK_CIRCLE_FILLED/i,
      /"verified":true/i
    ];

    return verificationPatterns.some(pattern => pattern.test(html));
  }

  /**
   * Extract channel description
   */
  extractDescription(html) {
    const patterns = [
      /"description":"([^"]+)"/,
      /"content":"([^"]+)"[^}]*"maxLines":2/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].length > 20) {
        return match[1].substring(0, 100) + '...';
      }
    }
    return null;
  }

  /**
   * Normalize different YouTube URL formats to a standard format
   */
  normalizeUrl(url) {
    // Handle different YouTube URL formats
    if (url.includes('/c/')) {
      const channelName = url.split('/c/')[1].split('/')[0];
      return `https://www.youtube.com/c/${channelName}`;
    } else if (url.includes('/@')) {
      const handle = url.split('/@')[1].split('/')[0];
      return `https://www.youtube.com/@${handle}`;
    } else if (url.includes('/channel/')) {
      const channelId = url.split('/channel/')[1].split('/')[0];
      return `https://www.youtube.com/channel/${channelId}`;
    } else if (url.includes('/user/')) {
      const username = url.split('/user/')[1].split('/')[0];
      return `https://www.youtube.com/user/${username}`;
    }
    
    return url;
  }

  /**
   * Main method to analyze a YouTube channel
   */
  async analyzeChannel(url) {
    try {
      console.log(`🔍 Analyzing channel: ${url}`);
      
      const normalizedUrl = this.normalizeUrl(url);
      console.log(`📡 Fetching: ${normalizedUrl}`);

      const response = await axios.get(normalizedUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        timeout: 30000
      });

      const html = response.data;
      
      // Extract all data
      const subscriberCount = this.extractSubscriberCount(html);
      const videoCount = this.extractVideoCount(html);
      const channelName = this.extractChannelName(html);
      const channelId = this.extractChannelId(html);
      const isVerified = this.isVerified(html);
      const description = this.extractDescription(html);

      const result = {
        subscriberCount,
        videoCount,
        channelName,
        channelId,
        isVerified,
        description,
        url: normalizedUrl
      };

      console.log('📊 Final Results:', result);
      return result;

    } catch (error) {
      console.error('❌ Error analyzing channel:', error.message);
      throw error;
    }
  }
}

// Export for use in other files
module.exports = YouTubeChannelAnalyzer;

// Test the analyzer if run directly
if (require.main === module) {
  const analyzer = new YouTubeChannelAnalyzer();
  
  const testUrls = [
    'https://www.youtube.com/@BollywoodHungama',
    'https://www.youtube.com/c/BollywoodHungama',
    'https://www.youtube.com/BollywoodHungama'
  ];

  async function testChannels() {
    for (const url of testUrls) {
      try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Testing: ${url}`);
        console.log('='.repeat(60));
        
        const result = await analyzer.analyzeChannel(url);
        
        console.log('\n📊 Channel Statistics:');
        console.log(`📺 Name: ${result.channelName}`);
        console.log(`👥 Subscribers: ${result.subscriberCount?.toLocaleString() || 'Not found'}`);
        console.log(`🎥 Videos: ${result.videoCount?.toLocaleString() || 'Not found'}`);
        console.log(`✅ Verified: ${result.isVerified}`);
        console.log(`🆔 Channel ID: ${result.channelId || 'Not found'}`);
        
        // Expected values for BollywoodHungama
        if (result.subscriberCount) {
          const expectedSubs = 7770000;
          const accuracy = ((result.subscriberCount / expectedSubs) * 100).toFixed(1);
          console.log(`🎯 Subscriber Accuracy: ${accuracy}%`);
        }
        
        if (result.videoCount) {
          const expectedVideos = 30000;
          const accuracy = ((result.videoCount / expectedVideos) * 100).toFixed(1);
          console.log(`🎯 Video Count Accuracy: ${accuracy}%`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to analyze ${url}:`, error.message);
      }
    }
  }

  testChannels();
}
