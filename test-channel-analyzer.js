const YouTubeChannelAnalyzer = require('./youtube-channel-analyzer');

/**
 * Test the YouTube Channel Analyzer with BollywoodHungama
 */
async function testChannelAnalyzer() {
  const analyzer = new YouTubeChannelAnalyzer();
  
  console.log('🎬 Testing YouTube Channel Analyzer');
  console.log('=' .repeat(50));
  
  // Test with the example channel
  const testChannel = 'https://www.youtube.com/c/BollywoodHungama';
  
  console.log(`\n📺 Analyzing: ${testChannel}`);
  
  try {
    // Method 1: HTML scraping (most comprehensive)
    console.log('\n🔍 Method 1: HTML Analysis');
    const htmlStats = await analyzer.getChannelStatsFromHTML(testChannel);
    
    if (htmlStats) {
      console.log('\n📊 Results from HTML Analysis:');
      console.log(`Channel Name: ${htmlStats.channelName || 'N/A'}`);
      console.log(`Channel ID: ${htmlStats.channelId || 'N/A'}`);
      console.log(`Subscribers: ${analyzer.formatCount(htmlStats.subscriberCount)}`);
      console.log(`Videos: ${analyzer.formatCount(htmlStats.videoCount)}`);
      console.log(`Total Views: ${analyzer.formatCount(htmlStats.viewCount)}`);
      console.log(`Verified: ${htmlStats.isVerified ? 'Yes' : 'No'}`);
      console.log(`Description: ${htmlStats.description ? htmlStats.description.substring(0, 100) + '...' : 'N/A'}`);
      
      // Check if it's Telugu relevant
      const isTeluguRelevant = analyzer.isTeluguChannel(htmlStats);
      console.log(`Telugu Relevant: ${isTeluguRelevant ? 'Yes' : 'No'}`);
    }
    
    // Method 2: RSS feed (basic info)
    console.log('\n🔍 Method 2: RSS Analysis');
    const rssStats = await analyzer.getChannelStatsFromRSS(testChannel);
    
    if (rssStats) {
      console.log('\n📡 Results from RSS Analysis:');
      console.log(`Channel Name: ${rssStats.channelName || 'N/A'}`);
      console.log(`Channel ID: ${rssStats.channelId || 'N/A'}`);
      console.log(`Note: ${rssStats.note}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Test completed!');
}

// Test with multiple Telugu channels
async function testTeluguChannels() {
  const analyzer = new YouTubeChannelAnalyzer();
  
  console.log('\n🎭 Testing with Telugu Channels');
  console.log('=' .repeat(50));
  
  const teluguChannels = [
    'https://www.youtube.com/c/BollywoodHungama', // Test channel
    'https://www.youtube.com/c/AdityanMusicLive', // If exists
    'https://www.youtube.com/c/MythriMovieMakers' // If exists
  ];
  
  try {
    const results = await analyzer.analyzeMultipleChannels(teluguChannels);
    
    console.log('\n📊 Batch Analysis Results:');
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.url}`);
      if (result.success) {
        console.log(`   ✅ Success`);
        console.log(`   📺 ${result.channelName || 'Unknown'}`);
        console.log(`   👥 ${analyzer.formatCount(result.subscriberCount)} subscribers`);
        console.log(`   🎥 ${analyzer.formatCount(result.videoCount)} videos`);
        console.log(`   👁️ ${analyzer.formatCount(result.viewCount)} total views`);
        console.log(`   🎬 Telugu: ${analyzer.isTeluguChannel(result) ? 'Yes' : 'No'}`);
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Batch test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testChannelAnalyzer();
  await testTeluguChannels();
}

// Export for use
module.exports = { testChannelAnalyzer, testTeluguChannels, runAllTests };

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
