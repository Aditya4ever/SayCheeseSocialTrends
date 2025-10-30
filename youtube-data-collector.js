const YouTubeChannelAnalyzer = require('./youtube-analyzer-fixed');
const YouTubeDatabase = require('./youtube-database');
const cron = require('node-cron');

/**
 * YouTube Data Collector Service
 * Background service that collects and updates YouTube channel data
 */
class YouTubeDataCollector {
  constructor(config = {}) {
    this.config = {
      enabled: true,
      interval: '0 */4 * * *', // Every 4 hours
      batchSize: 5,
      rateLimitDelay: 2000,
      maxRetries: 3,
      timeoutMs: 10000,
      ...config
    };
    
    this.analyzer = new YouTubeChannelAnalyzer();
    this.database = new YouTubeDatabase();
    this.isRunning = false;
    this.stats = {
      totalRuns: 0,
      successfulChannels: 0,
      failedChannels: 0,
      lastRun: null,
      lastError: null
    };
  }

  /**
   * Initialize the collector service
   */
  async initialize() {
    try {
      await this.database.initialize();
      
      // Seed database if empty
      const stats = await this.database.getStats();
      if (stats.totalChannels === 0) {
        console.log('📊 Database is empty, seeding with initial channels...');
        await this.database.seedChannels();
      }
      
      console.log('✅ YouTube Data Collector initialized');
      console.log(`📊 Current database stats:`, stats);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize YouTube Data Collector:', error);
      throw error;
    }
  }

  /**
   * Start the collection service with scheduled runs
   */
  start() {
    if (!this.config.enabled) {
      console.log('⏸️ YouTube Data Collector is disabled by configuration');
      return;
    }

    console.log(`🚀 Starting YouTube Data Collector...`);
    console.log(`⏰ Schedule: ${this.config.interval}`);
    
    // Schedule periodic collection
    cron.schedule(this.config.interval, async () => {
      await this.collectData();
    });

    // Run initial collection
    this.collectData();
    
    console.log('✅ YouTube Data Collector started successfully');
  }

  /**
   * Stop the collection service
   */
  async stop() {
    console.log('⏹️ Stopping YouTube Data Collector...');
    this.isRunning = false;
    await this.database.close();
    console.log('✅ YouTube Data Collector stopped');
  }

  /**
   * Main data collection method
   */
  async collectData() {
    if (this.isRunning) {
      console.log('⚠️ Collection already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    this.stats.totalRuns++;
    this.stats.lastRun = new Date();

    console.log('🔄 Starting YouTube channel data collection...');
    
    try {
      // Get channels that need updating
      const channelsToUpdate = await this.database.getChannelsForScraping();
      
      if (channelsToUpdate.length === 0) {
        console.log('✅ All channels are up to date');
        this.isRunning = false;
        return;
      }

      console.log(`📊 Found ${channelsToUpdate.length} channels to update`);

      // Process channels in batches to avoid rate limiting
      const batches = this.createBatches(channelsToUpdate, this.config.batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} channels)`);
        
        await this.processBatch(batch);
        
        // Delay between batches if not the last batch
        if (i < batches.length - 1) {
          console.log(`⏱️ Waiting ${this.config.rateLimitDelay}ms before next batch...`);
          await this.delay(this.config.rateLimitDelay);
        }
      }

      // Log completion stats
      const updatedStats = await this.database.getStats();
      console.log('✅ Data collection completed');
      console.log(`📊 Updated database stats:`, updatedStats);

    } catch (error) {
      console.error('❌ Error during data collection:', error);
      this.stats.lastError = error.message;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a batch of channels
   */
  async processBatch(channels) {
    const promises = channels.map(channel => this.processChannel(channel));
    const results = await Promise.allSettled(promises);
    
    // Log batch results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`📊 Batch completed: ${successful} successful, ${failed} failed`);
    
    this.stats.successfulChannels += successful;
    this.stats.failedChannels += failed;
  }

  /**
   * Process individual channel
   */
  async processChannel(channel) {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Analyzing channel: ${channel.channel_name} (${channel.channel_url})`);
      
      const channelData = await this.analyzer.analyzeChannel(channel.channel_url);
      const responseTime = Date.now() - startTime;
      
      if (channelData && channelData.subscriberCount !== undefined) {
        // Update database with new data
        await this.database.upsertChannel({
          channelId: channel.channel_id,
          channelName: channelData.channelName || channel.channel_name,
          channelUrl: channel.channel_url,
          subscriberCount: channelData.subscriberCount,
          videoCount: channelData.videoCount,
          totalViews: channelData.totalViews,
          description: channelData.description,
          isVerified: channelData.isVerified || false,
          category: channel.category,
          priority: channel.priority,
          language: channel.language
        });

        // Log successful scraping
        await this.database.logScrapingAttempt(channel.channel_id, true, {
          subscriberCount: channelData.subscriberCount,
          videoCount: channelData.videoCount,
          responseTime
        });

        console.log(`✅ Updated ${channel.channel_name}: ${channelData.subscriberCount?.toLocaleString()} subs, ${channelData.videoCount?.toLocaleString()} videos (${responseTime}ms)`);
        
        return channelData;
      } else {
        throw new Error('No valid channel data received');
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error(`❌ Failed to update ${channel.channel_name}: ${error.message}`);
      
      // Log failed scraping
      await this.database.logScrapingAttempt(channel.channel_id, false, {
        errorMessage: error.message,
        responseTime
      });
      
      throw error;
    }
  }

  /**
   * Create batches from array
   */
  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Force update specific channel
   */
  async forceUpdateChannel(channelId) {
    console.log(`🔄 Force updating channel: ${channelId}`);
    
    try {
      const channel = await this.database.getChannelById(channelId);
      if (!channel) {
        throw new Error(`Channel ${channelId} not found in database`);
      }

      const result = await this.processChannel(channel);
      console.log(`✅ Force update completed for ${channel.channel_name}`);
      return result;
    } catch (error) {
      console.error(`❌ Force update failed for ${channelId}:`, error.message);
      throw error;
    }
  }

  /**
   * Add new channel to tracking
   */
  async addChannel(channelData) {
    console.log(`➕ Adding new channel: ${channelData.channelUrl}`);
    
    try {
      // First, try to analyze the channel to get current data
      const analyzedData = await this.analyzer.analyzeChannel(channelData.channelUrl);
      
      if (analyzedData && analyzedData.subscriberCount !== undefined) {
        // Extract channel ID from URL or use provided one
        const channelId = channelData.channelId || this.extractChannelIdFromUrl(channelData.channelUrl);
        
        const fullChannelData = {
          channelId,
          channelName: analyzedData.channelName || channelData.channelName,
          channelUrl: channelData.channelUrl,
          subscriberCount: analyzedData.subscriberCount,
          videoCount: analyzedData.videoCount,
          totalViews: analyzedData.totalViews,
          description: analyzedData.description || channelData.description,
          isVerified: analyzedData.isVerified || false,
          category: channelData.category || 'all',
          priority: channelData.priority || 'medium',
          language: channelData.language || 'telugu'
        };

        await this.database.upsertChannel(fullChannelData);
        
        console.log(`✅ Added channel: ${fullChannelData.channelName} (${fullChannelData.subscriberCount?.toLocaleString()} subs)`);
        return fullChannelData;
      } else {
        throw new Error('Unable to analyze channel - may be invalid URL');
      }
    } catch (error) {
      console.error(`❌ Failed to add channel ${channelData.channelUrl}:`, error.message);
      throw error;
    }
  }

  /**
   * Extract channel ID from YouTube URL
   */
  extractChannelIdFromUrl(url) {
    // Handle different YouTube URL formats
    if (url.includes('/@')) {
      return url.split('/@')[1].split('/')[0];
    } else if (url.includes('/channel/')) {
      return url.split('/channel/')[1].split('/')[0];
    } else if (url.includes('/c/')) {
      return url.split('/c/')[1].split('/')[0];
    } else if (url.includes('/user/')) {
      return url.split('/user/')[1].split('/')[0];
    }
    
    // Fallback: use entire URL as ID
    return url;
  }

  /**
   * Get collector statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      config: this.config
    };
  }

  /**
   * Manual trigger for immediate collection
   */
  async triggerCollection() {
    console.log('🔄 Manual collection triggered');
    await this.collectData();
  }
}

module.exports = YouTubeDataCollector;
