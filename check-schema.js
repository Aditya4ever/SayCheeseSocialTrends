/**
 * Check the actual database schema to see what columns exist
 */
const YouTubeDatabase = require('./youtube-database');

async function checkSchema() {
  try {
    const db = new YouTubeDatabase();
    await db.initialize();
    
    console.log('📊 Database Schema Check:');
    console.log('========================');
    
    // Get table info
    const tableInfo = db.db.prepare("PRAGMA table_info(youtube_channels)").all();
    
    console.log('\n📋 youtube_channels table columns:');
    tableInfo.forEach(column => {
      console.log(`   ${column.name} (${column.type})`);
    });
    
    // Get sample data
    const sampleData = db.db.prepare("SELECT * FROM youtube_channels LIMIT 3").all();
    
    console.log('\n📊 Sample data:');
    console.log(JSON.stringify(sampleData, null, 2));
    
    // Count channels
    const count = db.db.prepare("SELECT COUNT(*) as count FROM youtube_channels").get();
    console.log(`\n📈 Total channels: ${count.count}`);
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  }
}

checkSchema();
