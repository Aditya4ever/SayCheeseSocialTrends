/**
 * Directly update database with scraped data using our working scraper
 */
const YouTubeChannelAnalyzer = require('./youtube-analyzer-fixed');
const YouTubeDatabase = require('./youtube-database');

async function forceUpdateAllChannels() {
  try {
    console.log('🚀 Starting forced update of all channels...');
    
    const db = new YouTubeDatabase();
    await db.initialize();
    
    const analyzer = new YouTubeChannelAnalyzer();
    
    // Get all channels from database
    const channels = db.db.prepare("SELECT * FROM youtube_channels").all();
    console.log(`📊 Found ${channels.length} channels to update`);
    
    for (const channel of channels) {
      try {
        console.log(`\n🔄 Scraping ${channel.channel_name}...`);
        
        // Use our working scraper
        const result = await analyzer.analyzeChannel(channel.channel_url);
        
        if (result.success) {
          console.log(`✅ Scraped ${channel.channel_name}: ${result.data.subscriberCount?.toLocaleString()} subs, ${result.data.videoCount?.toLocaleString()} videos`);
          
          // Update database directly
          const updateResult = db.db.prepare(`
            UPDATE youtube_channels 
            SET 
              subscriber_count = ?,
              video_count = ?,
              total_views = ?,
              is_verified = ?,
              last_scraped_at = datetime('now'),
              scrape_count = scrape_count + 1,
              scrape_status = 'success',
              error_count = 0
            WHERE channel_id = ?
          `).run(
            result.data.subscriberCount,
            result.data.videoCount,
            result.data.totalViews || null,
            result.data.isVerified ? 1 : 0,
            channel.channel_id
          );
          
          console.log(`💾 Database updated for ${channel.channel_name}`);
          
        } else {
          console.log(`❌ Failed to scrape ${channel.channel_name}: ${result.error}`);
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing ${channel.channel_name}:`, error.message);
      }
    }
    
    console.log('\n✅ Forced update completed!');
    
  } catch (error) {
    console.error('❌ Error during forced update:', error);
  }
}

forceUpdateAllChannels();
