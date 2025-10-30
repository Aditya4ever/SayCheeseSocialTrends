/**
 * Use the existing database methods to force update channels
 */
const YouTubeChannelAnalyzer = require('./youtube-analyzer-fixed');
const YouTubeDatabase = require('./youtube-database');

async function forceUpdateWithDatabaseMethods() {
  try {
    console.log('🚀 Starting forced update using database methods...');
    
    const db = new YouTubeDatabase();
    await db.initialize();
    
    // Get channels using the existing method
    const channels = await db.getChannels();
    console.log(`📊 Found ${channels.length} channels`);
    
    if (channels.length === 0) {
      console.log('❗ No channels found in database');
      return;
    }
    
    const analyzer = new YouTubeChannelAnalyzer();
    
    for (const channel of channels) {
      try {
        console.log(`\n🔄 Scraping ${channel.channel_name}...`);
        console.log(`📋 Channel data:`, channel);
        
        // Use our working scraper
        const result = await analyzer.analyzeChannel(channel.channel_url);
        
        console.log(`📊 Scraper result:`, result);
        
        if (result && result.subscriberCount !== null) {
          console.log(`✅ Scraped ${channel.channel_name}: ${result.subscriberCount?.toLocaleString()} subs, ${result.videoCount?.toLocaleString()} videos`);
          
          // Use direct database update instead of upsert
          try {
            const updateResult = db.db.prepare(`
              UPDATE youtube_channels 
              SET 
                subscriber_count = ?,
                video_count = ?,
                total_views = ?,
                is_verified = ?,
                last_scraped_at = datetime('now'),
                scrape_status = 'success',
                error_count = 0,
                updated_at = datetime('now')
              WHERE id = ?
            `).run(
              result.subscriberCount,
              result.videoCount,
              result.totalViews || null,
              result.isVerified ? 1 : 0,
              channel.id
            );
            
            console.log(`💾 Database updated for ${channel.channel_name} (${updateResult.changes} rows affected)`);
          } catch (dbError) {
            console.error(`❌ Database update error for ${channel.channel_name}:`, dbError.message);
          }
          
        } else {
          console.log(`❌ Failed to scrape ${channel.channel_name}: No valid data extracted`);
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing ${channel.channel_name}:`, error.message);
      }
    }
    
    console.log('\n✅ Forced update completed!');
    
    // Check final results
    const stats = await db.getStats();
    console.log('\n📊 Final database stats:', stats);
    
  } catch (error) {
    console.error('❌ Error during forced update:', error);
  }
}

forceUpdateWithDatabaseMethods();
