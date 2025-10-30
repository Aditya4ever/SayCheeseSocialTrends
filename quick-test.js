const YouTubeChannelAnalyzer = require('./youtube-channel-analyzer');

async function quickTest() {
  const analyzer = new YouTubeChannelAnalyzer();
  
  console.log('🔍 Quick Test: BollywoodHungama Channel Analysis');
  console.log('=' .repeat(60));
  
  const channelUrl = 'https://www.youtube.com/c/BollywoodHungama';
  
  try {
    const stats = await analyzer.getChannelStatsFromHTML(channelUrl);
    
    if (stats) {
      console.log('\n📊 CHANNEL STATISTICS:');
      console.log('─'.repeat(40));
      console.log(`📺 Channel Name: ${stats.channelName || 'N/A'}`);
      console.log(`🆔 Channel ID: ${stats.channelId || 'N/A'}`);
      console.log(`👥 Subscribers: ${stats.subscriberCount ? stats.subscriberCount.toLocaleString() : 'N/A'} (${analyzer.formatCount(stats.subscriberCount)})`);
      console.log(`🎥 Total Videos: ${stats.videoCount ? stats.videoCount.toLocaleString() : 'N/A'}`);
      console.log(`👁️ Total Views: ${stats.viewCount ? stats.viewCount.toLocaleString() : 'N/A'}`);
      console.log(`✅ Verified: ${stats.isVerified ? 'Yes' : 'No'}`);
      console.log(`🎬 Telugu Relevant: ${analyzer.isTeluguChannel(stats) ? 'Yes' : 'No'}`);
      
      if (stats.description) {
        console.log(`📝 Description: ${stats.description.substring(0, 200)}...`);
      }
      
      console.log('\n🎯 SUCCESS: All channel statistics extracted successfully!');
      
    } else {
      console.log('❌ Failed to extract channel statistics');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest().catch(console.error);
