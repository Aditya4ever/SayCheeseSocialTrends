/**
 * Simple check to see if database was actually updated
 */
const YouTubeDatabase = require('./youtube-database');

async function quickCheck() {
  try {
    const db = new YouTubeDatabase();
    await db.initialize();
    
    // Use a raw SQL query to see current data
    const channels = db.db.prepare("SELECT channel_name, subscriber_count, video_count FROM youtube_channels").all();
    
    console.log('📊 Current database contents:');
    channels.forEach(channel => {
      console.log(`${channel.channel_name}: ${channel.subscriber_count?.toLocaleString() || 'null'} subs, ${channel.video_count?.toLocaleString() || 'null'} videos`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

quickCheck();
