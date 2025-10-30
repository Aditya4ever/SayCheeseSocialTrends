const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./youtube-data.db');

console.log('=== COMPREHENSIVE YOUTUBE CHANNELS ANALYSIS ===\n');

// Count total channels
db.get('SELECT COUNT(*) as total FROM youtube_channels', (err, row) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    console.log(`📊 Total Channels: ${row.total}`);
});

// Count channels with data vs without
db.all(`
    SELECT 
        CASE 
            WHEN subscriber_count > 0 THEN 'Has Data' 
            ELSE 'No Data' 
        END as status,
        COUNT(*) as count
    FROM youtube_channels 
    GROUP BY status
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('\n📈 Data Status:');
    rows.forEach(row => {
        console.log(`  ${row.status}: ${row.count} channels`);
    });
});

// Show top 10 channels with data
db.all(`
    SELECT channel_name, subscriber_count, category, language 
    FROM youtube_channels 
    WHERE subscriber_count > 0 
    ORDER BY subscriber_count DESC
    LIMIT 10
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('\n🏆 Top 10 Channels With Data:');
    rows.forEach((row, i) => {
        const subscribers = (row.subscriber_count / 1000000).toFixed(1);
        console.log(`  ${i + 1}. ${row.channel_name}: ${subscribers}M subs [${row.category}/${row.language}]`);
    });
});

// Show categories breakdown
db.all(`
    SELECT category, COUNT(*) as count
    FROM youtube_channels 
    GROUP BY category
    ORDER BY count DESC
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('\n📂 Categories:');
    rows.forEach(row => {
        console.log(`  ${row.category}: ${row.count}`);
    });
});

// Show languages breakdown  
db.all(`
    SELECT language, COUNT(*) as count
    FROM youtube_channels 
    GROUP BY language
    ORDER BY count DESC
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('\n🌐 Languages:');
    rows.forEach(row => {
        console.log(`  ${row.language}: ${row.count}`);
    });
    
    db.close();
});
