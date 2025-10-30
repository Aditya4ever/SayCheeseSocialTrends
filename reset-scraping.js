/**
 * Force collection of ALL channels by setting their last_scraped_at to NULL
 */
const YouTubeDatabase = require('./youtube-database');

async function resetScrapingStatus() {
  try {
    const db = new YouTubeDatabase();
    await db.initialize();
    
    console.log('🔄 Resetting all channel scraping status...');
    
    // First check current database structure
    const tableInfo = db.db.prepare("PRAGMA table_info(youtube_channels)").all();
    console.log('\n📋 Table columns:');
    tableInfo.forEach(column => {
      console.log(`   ${column.name} (${column.type})`);
    });
    
    // Get current channels
    const channels = db.db.prepare("SELECT channel_id, channel_name, last_scraped_at, subscriber_count FROM youtube_channels").all();
    console.log('\n📊 Current channels:');
    channels.forEach(channel => {
      console.log(`   ${channel.channel_name}: subs=${channel.subscriber_count}, last_scraped=${channel.last_scraped_at}`);
    });
    
    // Reset all scraping timestamps to force re-scraping
    const resetResult = db.db.prepare("UPDATE youtube_channels SET last_scraped_at = NULL, scrape_status = NULL, error_count = 0").run();
    console.log(`\n✅ Reset ${resetResult.changes} channels for re-scraping`);
    
    // Now try to get channels for scraping
    const channelsToScrape = await db.getChannelsForScraping();
    console.log(`\n📊 Channels ready for scraping: ${channelsToScrape.length}`);
    
    if (channelsToScrape.length > 0) {
      console.log('Channels to scrape:');
      channelsToScrape.forEach(channel => {
        console.log(`   - ${channel.channel_name} (${channel.channel_url})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

resetScrapingStatus();
