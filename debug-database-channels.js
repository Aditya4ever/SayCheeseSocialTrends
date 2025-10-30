const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function debugDatabaseChannels() {
  console.log('🔍 Debugging Database Channel Count Issue');
  console.log('=' .repeat(50));

  const dbPath = path.join(__dirname, 'data', 'youtube_channels.db');
  const db = new sqlite3.Database(dbPath);

  // Test 1: Total channels
  console.log('\n1. TOTAL CHANNELS IN DATABASE:');
  await new Promise((resolve) => {
    db.get('SELECT COUNT(*) as count FROM youtube_channels', (err, row) => {
      if (err) console.error(err);
      else console.log(`   Total: ${row.count} channels`);
      resolve();
    });
  });

  // Test 2: Group by scrape_status
  console.log('\n2. CHANNELS BY STATUS:');
  await new Promise((resolve) => {
    db.all('SELECT scrape_status, COUNT(*) as count FROM youtube_channels GROUP BY scrape_status', (err, rows) => {
      if (err) console.error(err);
      else {
        rows.forEach(row => console.log(`   ${row.scrape_status}: ${row.count}`));
      }
      resolve();
    });
  });

  // Test 3: Channels with subscriber data
  console.log('\n3. CHANNELS WITH SUBSCRIBER DATA:');
  await new Promise((resolve) => {
    db.get('SELECT COUNT(*) as count FROM youtube_channels WHERE subscriber_count IS NOT NULL', (err, row) => {
      if (err) console.error(err);
      else console.log(`   With data: ${row.count} channels`);
      resolve();
    });
  });

  // Test 4: Check for T-Series specifically
  console.log('\n4. T-SERIES SEARCH:');
  await new Promise((resolve) => {
    db.all("SELECT channel_name, subscriber_count, scrape_status FROM youtube_channels WHERE channel_name LIKE '%T-Series%' OR channel_url LIKE '%TSeries%'", (err, rows) => {
      if (err) console.error(err);
      else {
        if (rows.length > 0) {
          rows.forEach(row => console.log(`   Found: ${row.channel_name} - ${row.subscriber_count} - ${row.scrape_status}`));
        } else {
          console.log('   ❌ T-Series not found in database');
        }
      }
      resolve();
    });
  });

  // Test 5: Sample of all channels
  console.log('\n5. SAMPLE CHANNELS (First 10):');
  await new Promise((resolve) => {
    db.all('SELECT channel_name, subscriber_count, scrape_status FROM youtube_channels LIMIT 10', (err, rows) => {
      if (err) console.error(err);
      else {
        rows.forEach((row, i) => console.log(`   ${i+1}. ${row.channel_name} - ${row.subscriber_count ? row.subscriber_count.toLocaleString() : 'No data'} - ${row.scrape_status}`));
      }
      resolve();
    });
  });

  // Test 6: Test the same query the API should be using
  console.log('\n6. API QUERY SIMULATION:');
  await new Promise((resolve) => {
    const filters = {};
    const { category, priority, language, limit = 50, offset = 0 } = filters;
    
    let sql = 'SELECT * FROM youtube_channels WHERE 1=1';
    let params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (priority) {
      sql += ' AND priority = ?';
      params.push(priority);
    }
    if (language) {
      sql += ' AND language = ?';
      params.push(language);
    }

    sql += ' ORDER BY subscriber_count DESC NULLS LAST';
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    console.log(`   Query: ${sql}`);
    console.log(`   Params: [${params.join(', ')}]`);

    db.all(sql, params, (err, rows) => {
      if (err) console.error('   Error:', err);
      else {
        console.log(`   Results: ${rows.length} channels`);
        if (rows.length > 0) {
          console.log(`   First: ${rows[0].channel_name}`);
          console.log(`   Has T-Series: ${rows.some(r => r.channel_name && r.channel_name.includes('T-Series'))}`);
        }
      }
      resolve();
    });
  });

  db.close();
  console.log('\n✅ Database debugging complete');
}

debugDatabaseChannels().catch(console.error);
