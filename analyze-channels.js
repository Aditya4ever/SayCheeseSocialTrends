const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./youtube-data.db');

console.log('=== YouTube Channels Analysis ===\n');

// Count channels with and without data
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
    
    console.log('Channel Data Status:');
    rows.forEach(row => {
        console.log(`${row.status}: ${row.count} channels`);
    });
    console.log('');
});

// Show channels with data (working ones)
db.all(`
    SELECT channel_name, subscriber_count, category, language 
    FROM youtube_channels 
    WHERE subscriber_count > 0 
    ORDER BY subscriber_count DESC
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('Channels WITH data (working):');
    rows.forEach(row => {
        console.log(`• ${row.channel_name}: ${row.subscriber_count.toLocaleString()} subs [${row.category}/${row.language}]`);
    });
    console.log('');
});

// Show sample of channels without data
db.all(`
    SELECT channel_name, category, language, channel_id
    FROM youtube_channels 
    WHERE subscriber_count = 0 
    LIMIT 10
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('Sample channels WITHOUT data:');
    rows.forEach(row => {
        console.log(`• ${row.channel_name} [${row.category}/${row.language}] - ID: ${row.channel_id}`);
    });
    
    db.close();
});
