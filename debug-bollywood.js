const YouTubeChannelAnalyzer = require('./youtube-channel-analyzer');

async function debugBollywoodHungama() {
  const analyzer = new YouTubeChannelAnalyzer();
  
  console.log('🔍 DEBUG: BollywoodHungama Channel Analysis');
  console.log('Expected: 7.77M subscribers, 30K videos');
  console.log('=' .repeat(60));
  
  const channelUrl = 'https://www.youtube.com/@BollywoodHungama';
  
  try {
    console.log(`📡 Fetching: ${channelUrl}`);
    
    const response = await require('axios').get(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000
    });

    const html = response.data;
    
    console.log('🔍 Searching for subscriber patterns...');
    
    // Search for specific patterns that might contain the subscriber count
    const subscriberPatterns = [
      /7\.77M/g,
      /7\.77\s*million/gi,
      /subscribers/gi,
      /•\s*[\d\.,KMB]+\s*subscribers/gi,
      /["']subscriberCountText["'][^}]*["']simpleText["']\s*:\s*["']([^"']+)["']/g,
      /(\d+(?:\.\d+)?[KMB]?)\s*subscribers/gi
    ];
    
    console.log('\n📊 Found subscriber-related patterns:');
    subscriberPatterns.forEach((pattern, index) => {
      const matches = html.match(pattern);
      if (matches) {
        console.log(`Pattern ${index + 1}: ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`);
      }
    });
    
    console.log('\n🔍 Searching for video count patterns...');
    
    const videoPatterns = [
      /30K/g,
      /30,000/g,
      /videos/gi,
      /•\s*[\d\.,KMB]+\s*videos/gi,
      /(\d+(?:\.\d+)?[KMB]?)\s*videos/gi
    ];
    
    console.log('\n📹 Found video-related patterns:');
    videoPatterns.forEach((pattern, index) => {
      const matches = html.match(pattern);
      if (matches) {
        console.log(`Pattern ${index + 1}: ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`);
      }
    });
    
    // Try to find the specific format with bullet points
    console.log('\n🔍 Looking for bullet point format...');
    const bulletMatches = html.match(/•[^•]*?subscribers[^•]*?•[^•]*?videos/gi);
    if (bulletMatches) {
      console.log('Found bullet format:', bulletMatches[0]);
    }
    
    // Now use our analyzer
    console.log('\n🎯 Running our analyzer...');
    const stats = await analyzer.getChannelStatsFromHTML(channelUrl);
    
    console.log('\n📊 Results:');
    if (stats) {
      console.log(`📺 Channel: ${stats.channelName}`);
      console.log(`👥 Subscribers: ${stats.subscriberCount ? stats.subscriberCount.toLocaleString() : 'N/A'} (Expected: 7,770,000)`);
      console.log(`🎥 Videos: ${stats.videoCount ? stats.videoCount.toLocaleString() : 'N/A'} (Expected: 30,000)`);
      console.log(`👁️ Views: ${stats.viewCount ? stats.viewCount.toLocaleString() : 'N/A'}`);
      
      // Check accuracy
      const expectedSubs = 7770000;
      const expectedVideos = 30000;
      
      const subsAccuracy = stats.subscriberCount ? Math.abs(stats.subscriberCount - expectedSubs) / expectedSubs : 1;
      const videosAccuracy = stats.videoCount ? Math.abs(stats.videoCount - expectedVideos) / expectedVideos : 1;
      
      console.log(`\n🎯 Accuracy Check:`);
      console.log(`Subscribers: ${subsAccuracy < 0.1 ? '✅' : '❌'} ${(100 - subsAccuracy * 100).toFixed(1)}% accurate`);
      console.log(`Videos: ${videosAccuracy < 0.1 ? '✅' : '❌'} ${(100 - videosAccuracy * 100).toFixed(1)}% accurate`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugBollywoodHungama().catch(console.error);
