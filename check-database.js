/**
 * Check current database contents to see actual channel data
 */
const YouTubeDatabase = require('./youtube-database');

async function checkDatabase() {
  try {
    const db = new YouTubeDatabase();
    await db.initialize();
    
    console.log('📊 Database Channel Status Check:');
    console.log('==================================');
    
    // Get all channels with their current data
    const stmt = db.db.prepare(`
      SELECT 
        id,
        channel_name,
        channel_url,
        category,
        priority,
        subscriber_count,
        video_count,
        total_views,
        is_verified,
        last_updated,
        last_scraped,
        scrape_count
      FROM youtube_channels 
      ORDER BY priority DESC, category, channel_name
    `);
    
    const channels = stmt.all();
    
    channels.forEach((channel, index) => {
      console.log(`\n${index + 1}. ${channel.channel_name}`);
      console.log(`   URL: ${channel.channel_url}`);
      console.log(`   Category: ${channel.category} | Priority: ${channel.priority}`);
      console.log(`   Subscribers: ${channel.subscriber_count || 'N/A'}`);
      console.log(`   Videos: ${channel.video_count || 'N/A'}`);
      console.log(`   Views: ${channel.total_views || 'N/A'}`);
      console.log(`   Verified: ${channel.is_verified || 'N/A'}`);
      console.log(`   Last Scraped: ${channel.last_scraped || 'Never'}`);
      console.log(`   Scrape Count: ${channel.scrape_count || 0}`);
      console.log(`   Last Updated: ${channel.last_updated}`);
    });
    
    console.log(`\n📈 Total channels: ${channels.length}`);
    
    // Check how many have null statistics
    const withStats = channels.filter(c => c.subscriber_count !== null);
    const withoutStats = channels.filter(c => c.subscriber_count === null);
    
    console.log(`📊 Channels with statistics: ${withStats.length}`);
    console.log(`❗ Channels without statistics: ${withoutStats.length}`);
    
    if (withoutStats.length > 0) {
      console.log('\n❗ Channels missing statistics:');
      withoutStats.forEach(channel => {
        console.log(`   - ${channel.channel_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkDatabase();
