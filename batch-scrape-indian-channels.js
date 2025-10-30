const YouTubeChannelAnalyzer = require('./youtube-analyzer-fixed');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * 🔄 BATCH SCRAPER FOR INDIAN CHANNELS
 * 
 * This script scrapes a sample of the Indian channels we just added
 * to populate them with real subscriber/video data
 */

class BatchChannelScraper {
  constructor() {
    this.analyzer = new YouTubeChannelAnalyzer();
    this.dbPath = path.join(__dirname, 'data', 'youtube_channels.db');
    this.db = null;
    this.delayBetweenRequests = 3000; // 3 seconds to be respectful
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Database connection failed:', err.message);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  async getChannelsToScrape(limit = 20) {
    return new Promise((resolve, reject) => {
      // Get channels that haven't been scraped yet, prioritizing high-priority ones
      const sql = `
        SELECT id, channel_name, channel_url, category, language, priority
        FROM youtube_channels 
        WHERE subscriber_count IS NULL 
        ORDER BY 
          CASE priority 
            WHEN 'ultra_high' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            ELSE 4 
          END,
          RANDOM()
        LIMIT ?
      `;
      
      this.db.all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async updateChannelData(channelId, stats) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE youtube_channels 
        SET 
          subscriber_count = ?,
          video_count = ?,
          total_views = ?,
          description = ?,
          is_verified = ?,
          last_scraped_at = CURRENT_TIMESTAMP,
          scrape_status = 'completed',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const values = [
        stats.subscriberCount || null,
        stats.videoCount || null,
        stats.viewCount || null,
        stats.description ? stats.description.substring(0, 500) : null,
        stats.isVerified || false,
        channelId
      ];

      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  async markChannelFailed(channelId, error) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE youtube_channels 
        SET 
          scrape_status = 'failed',
          error_count = error_count + 1,
          last_scraped_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.run(sql, [channelId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  formatCount(num) {
    if (!num) return 'N/A';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  async scrapeChannels() {
    console.log('🔄 BATCH SCRAPING INDIAN CHANNELS');
    console.log('=' .repeat(50));

    try {
      await this.initDatabase();
      const channels = await this.getChannelsToScrape(5); // Start with just 5 channels for testing

      if (channels.length === 0) {
        console.log('ℹ️  No channels to scrape (all already processed)');
        this.db.close();
        return;
      }

      console.log(`🎯 Found ${channels.length} channels to scrape`);
      console.log('⏱️  Estimated time: ~${channels.length * 3} seconds\n');

      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < channels.length; i++) {
        const channel = channels[i];
        console.log(`[${i + 1}/${channels.length}] 🔍 ${channel.channel_name}`);
        console.log(`  🌐 ${channel.language} | 📂 ${channel.category} | ⭐ ${channel.priority}`);
        
        try {
          // Use the correct method name from youtube-analyzer-fixed.js
          const stats = await this.analyzer.analyzeChannel(channel.channel_url);
          
          if (stats && stats.subscriberCount) {
            await this.updateChannelData(channel.id, stats);
            console.log(`  ✅ ${stats.channelName || channel.channel_name}`);
            console.log(`     👥 ${this.formatCount(stats.subscriberCount)} subscribers`);
            console.log(`     🎥 ${this.formatCount(stats.videoCount)} videos`);
            console.log(`     👁️ ${this.formatCount(stats.viewCount)} total views`);
            console.log(`     ${stats.isVerified ? '✅ Verified' : '⚪ Not Verified'}`);
            successCount++;
          } else {
            throw new Error('No valid stats extracted');
          }
          
        } catch (error) {
          console.log(`  ❌ Failed: ${error.message}`);
          await this.markChannelFailed(channel.id, error.message);
          failedCount++;
        }

        // Rate limiting - be respectful to YouTube
        if (i < channels.length - 1) {
          console.log(`  ⏳ Waiting ${this.delayBetweenRequests/1000}s...\n`);
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
        }
      }

      console.log('\n' + '=' .repeat(50));
      console.log('📊 BATCH SCRAPING SUMMARY:');
      console.log(`✅ Successful: ${successCount}`);
      console.log(`❌ Failed: ${failedCount}`);
      console.log(`📈 Success Rate: ${((successCount / channels.length) * 100).toFixed(1)}%`);

      this.db.close();
      console.log('\n🚀 Batch scraping completed!');

    } catch (error) {
      console.error('❌ Batch scraping failed:', error.message);
      if (this.db) this.db.close();
      throw error;
    }
  }

  async showTopChannels() {
    console.log('\n🏆 TOP INDIAN CHANNELS BY SUBSCRIBERS:');
    console.log('=' .repeat(60));

    try {
      await this.initDatabase();
      
      const sql = `
        SELECT 
          channel_name, 
          subscriber_count, 
          category, 
          language,
          is_verified
        FROM youtube_channels 
        WHERE subscriber_count IS NOT NULL 
        ORDER BY subscriber_count DESC 
        LIMIT 20
      `;
      
      const channels = await new Promise((resolve, reject) => {
        this.db.all(sql, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      channels.forEach((channel, index) => {
        const rank = (index + 1).toString().padStart(2, ' ');
        const verified = channel.is_verified ? '✅' : '⚪';
        console.log(`${rank}. ${verified} ${channel.channel_name}`);
        console.log(`     👥 ${this.formatCount(channel.subscriber_count)} subscribers`);
        console.log(`     🌐 ${channel.language} | 📂 ${channel.category}\n`);
      });

      this.db.close();

    } catch (error) {
      console.error('❌ Error showing top channels:', error.message);
      if (this.db) this.db.close();
    }
  }
}

// Export for use in other modules
module.exports = BatchChannelScraper;

// Run if called directly
if (require.main === module) {
  const scraper = new BatchChannelScraper();
  
  async function runScraping() {
    try {
      // 1. Scrape a batch of channels
      await scraper.scrapeChannels();
      
      // 2. Show top channels by subscribers
      await scraper.showTopChannels();
      
      console.log('🎉 BATCH SCRAPING COMPLETE!');
      console.log('💡 Run again to scrape more channels or check results.');
      
    } catch (error) {
      console.error('❌ Scraping process failed:', error.message);
    }
  }
  
  runScraping();
}
