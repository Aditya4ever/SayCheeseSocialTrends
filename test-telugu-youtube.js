const TeluguContentService = require('./telugu-content-service');

async function testTeluguYouTubeIntegration() {
  try {
    console.log('🎬 Testing Telugu YouTube Integration...');
    console.log('='.repeat(50));
    
    const service = new TeluguContentService();
    
    // Test just the YouTube tier to see our analyzer in action
    console.log('🎥 Testing Tier 1: YouTube content analysis...');
    const youtubeContent = await service.getTier1YouTubeContent();
    
    console.log('\n📊 YouTube Analysis Results:');
    console.log(`Found ${youtubeContent.length} YouTube channels`);
    
    youtubeContent.forEach((channel, index) => {
      if (channel && channel.source) {
        console.log(`\n${index + 1}. ${channel.source}`);
        console.log(`   📺 Title: ${channel.title}`);
        console.log(`   🏷️  Category: ${channel.category}`);
        console.log(`   👥 Subscribers: ${channel.subscriberCount?.toLocaleString() || 'N/A'}`);
        console.log(`   🎥 Videos: ${channel.videoCount?.toLocaleString() || 'N/A'}`);
        console.log(`   ✅ Verified: ${channel.isVerified}`);
        console.log(`   🔗 Link: ${channel.link}`);
        console.log(`   ⭐ Priority: ${channel.priority}`);
      }
    });

  } catch (error) {
    console.error('❌ Error testing Telugu YouTube integration:', error);
  }
}

testTeluguYouTubeIntegration();
