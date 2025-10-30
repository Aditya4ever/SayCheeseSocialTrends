const YouTubeChannelAnalyzer = require('./youtube-analyzer-fixed');

async function testTeluguChannels() {
  const analyzer = new YouTubeChannelAnalyzer();
  
  const teluguChannels = [
    'https://www.youtube.com/@aajtak',
    'https://www.youtube.com/@SumanTv',
    'https://www.youtube.com/@TolivelluTollywood'
  ];

  for (const url of teluguChannels) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔍 Testing Telugu Channel: ${url}`);
      console.log('='.repeat(60));
      
      const result = await analyzer.analyzeChannel(url);
      
      console.log('\n📊 Channel Statistics:');
      console.log(`📺 Name: ${result.channelName}`);
      console.log(`👥 Subscribers: ${result.subscriberCount?.toLocaleString() || 'Not found'}`);
      console.log(`🎥 Videos: ${result.videoCount?.toLocaleString() || 'Not found'}`);
      console.log(`✅ Verified: ${result.isVerified}`);
      console.log(`🆔 Channel ID: ${result.channelId || 'Not found'}`);
      console.log(`📝 Description: ${result.description || 'Not found'}`);
      
    } catch (error) {
      console.error(`❌ Failed to analyze ${url}:`, error.message);
    }
    
    // Add delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testTeluguChannels();
