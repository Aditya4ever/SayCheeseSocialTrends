const YouTubeChannelAnalyzer = require('./youtube-analyzer-fixed');

async function testTeluguChannels() {
  const analyzer = new YouTubeChannelAnalyzer();
  
  console.log('🎬 Testing Telugu Channels with Working Analyzer');
  console.log('=' .repeat(60));
  
  // Test the Telugu channels that are in our database
  const teluguChannels = [
    'https://www.youtube.com/@SriBalajiMovies',
    'https://www.youtube.com/@UVCreations', 
    'https://www.youtube.com/@GeethaartsOfficial',
    'https://www.youtube.com/@TV9Telugu',
    'https://www.youtube.com/@NtvTelugu',
    'https://www.youtube.com/@ETVTelangana',
    'https://www.youtube.com/@AdityaMusic',
    'https://www.youtube.com/@LahariMusic'
  ];
  
  for (const channelUrl of teluguChannels) {
    try {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Testing: ${channelUrl}`);
      console.log('='.repeat(50));
      
      const result = await analyzer.analyzeChannel(channelUrl);
      
      console.log('\n📊 Channel Results:');
      console.log(`📺 Name: ${result.channelName || 'N/A'}`);
      console.log(`👥 Subscribers: ${result.subscriberCount ? result.subscriberCount.toLocaleString() : 'N/A'}`);
      console.log(`🎥 Videos: ${result.videoCount ? result.videoCount.toLocaleString() : 'N/A'}`);
      console.log(`🆔 Channel ID: ${result.channelId || 'N/A'}`);
      console.log(`✅ Verified: ${result.isVerified}`);
      console.log(`📝 Description: ${result.description ? result.description.substring(0, 100) + '...' : 'N/A'}`);
      
      // Add a small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to analyze ${channelUrl}:`, error.message);
    }
  }
}

testTeluguChannels().catch(console.error);
