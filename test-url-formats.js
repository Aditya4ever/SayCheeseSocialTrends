const YouTubeChannelAnalyzer = require('./youtube-channel-analyzer');

async function testBothURLFormats() {
  const analyzer = new YouTubeChannelAnalyzer();
  
  console.log('🔍 Testing Different YouTube URL Formats');
  console.log('=' .repeat(60));
  
  const urlFormats = [
    {
      name: 'Original /c/ format',
      url: 'https://www.youtube.com/c/BollywoodHungama'
    },
    {
      name: 'Direct channel format',
      url: 'https://www.youtube.com/BollywoodHungama'
    },
    {
      name: 'Handle format (@)',
      url: 'https://www.youtube.com/@BollywoodHungama'
    }
  ];
  
  for (const format of urlFormats) {
    console.log(`\n🎬 Testing: ${format.name}`);
    console.log(`🔗 URL: ${format.url}`);
    console.log('─'.repeat(40));
    
    try {
      const stats = await analyzer.getChannelStatsFromHTML(format.url);
      
      if (stats) {
        console.log('✅ SUCCESS - Data extracted:');
        console.log(`   📺 Channel Name: ${stats.channelName || 'N/A'}`);
        console.log(`   🆔 Channel ID: ${stats.channelId || 'N/A'}`);
        console.log(`   👥 Subscribers: ${stats.subscriberCount ? stats.subscriberCount.toLocaleString() : 'N/A'} (${analyzer.formatCount(stats.subscriberCount)})`);
        console.log(`   🎥 Videos: ${stats.videoCount ? stats.videoCount.toLocaleString() : 'N/A'}`);
        console.log(`   👁️ Total Views: ${stats.viewCount ? stats.viewCount.toLocaleString() : 'N/A'}`);
        console.log(`   ✅ Verified: ${stats.isVerified ? 'Yes' : 'No'}`);
        
        if (stats.description) {
          console.log(`   📝 Description: ${stats.description.substring(0, 100)}...`);
        }
        
        // Rate the result quality
        let qualityScore = 0;
        if (stats.channelName) qualityScore++;
        if (stats.channelId) qualityScore++;
        if (stats.subscriberCount) qualityScore++;
        if (stats.videoCount) qualityScore++;
        if (stats.viewCount) qualityScore++;
        
        console.log(`   🎯 Data Quality Score: ${qualityScore}/5`);
        
      } else {
        console.log('❌ FAILED - No data extracted');
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Test Summary: Check which format gave the best results above');
}

// Test a few more popular Telugu channels with different formats
async function testTeluguChannelsWithFormats() {
  const analyzer = new YouTubeChannelAnalyzer();
  
  console.log('\n🎭 Testing Telugu Channels with Best Format');
  console.log('=' .repeat(60));
  
  const teluguChannels = [
    'https://www.youtube.com/@AdityaMusic',
    'https://www.youtube.com/@MythriMovieMakers',
    'https://www.youtube.com/@SonyMusicSouth',
    'https://www.youtube.com/@TV9Telugu'
  ];
  
  for (const channelUrl of teluguChannels) {
    console.log(`\n📺 Testing: ${channelUrl}`);
    console.log('─'.repeat(40));
    
    try {
      const stats = await analyzer.getChannelStatsFromHTML(channelUrl);
      
      if (stats) {
        console.log('✅ SUCCESS:');
        console.log(`   📺 ${stats.channelName || 'N/A'}`);
        console.log(`   👥 ${analyzer.formatCount(stats.subscriberCount)} subscribers`);
        console.log(`   🎥 ${analyzer.formatCount(stats.videoCount)} videos`);
        console.log(`   🎬 Telugu Relevant: ${analyzer.isTeluguChannel(stats) ? 'YES' : 'No'}`);
      } else {
        console.log('❌ No data extracted');
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function runAllTests() {
  await testBothURLFormats();
  await testTeluguChannelsWithFormats();
}

runAllTests().catch(console.error);
