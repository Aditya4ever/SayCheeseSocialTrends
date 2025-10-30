/**
 * Script to manually trigger data collection for all channels
 */
const YouTubeDataCollector = require('./youtube-data-collector');

async function runCollection() {
  try {
    console.log('🚀 Starting manual data collection...');
    
    // Create a collector instance
    const collector = new YouTubeDataCollector();
    
    // Initialize the collector
    await collector.initialize();
    
    console.log('✅ Collector initialized successfully');
    
    // Trigger the collection
    await collector.triggerCollection();
    
    console.log('✅ Data collection completed!');
    
    // Get and display stats
    const stats = collector.getStats();
    console.log('\n📊 Collection Statistics:');
    console.log('Total runs:', stats.totalRuns);
    console.log('Successful channels:', stats.successfulChannels);
    console.log('Failed channels:', stats.failedChannels);
    console.log('Last run:', stats.lastRun);
    
    if (stats.lastError) {
      console.log('❌ Last error:', stats.lastError);
    }
    
  } catch (error) {
    console.error('❌ Error during data collection:', error.message);
    console.error(error.stack);
  }
}

// Run the collection
runCollection();
