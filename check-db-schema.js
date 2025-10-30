const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./youtube-data.db');

console.log('=== Database Schema Analysis ===\n');

// Check what tables exist
db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('Available tables:');
    rows.forEach(row => {
        console.log(`• ${row.name}`);
    });
    
    if (rows.length === 0) {
        console.log('No tables found in database!');
        db.close();
        return;
    }
    
    // Get schema for first table
    const tableName = rows[0].name;
    console.log(`\nSchema for table '${tableName}':`);
    
    db.all(`PRAGMA table_info(${tableName})`, (err, schema) => {
        if (err) {
            console.error('Error getting schema:', err);
            db.close();
            return;
        }
        
        schema.forEach(col => {
            console.log(`  ${col.name}: ${col.type}`);
        });
        
        // Sample data
        console.log(`\nSample data from '${tableName}' (first 5 rows):`);
        db.all(`SELECT * FROM ${tableName} LIMIT 5`, (err, data) => {
            if (err) {
                console.error('Error getting data:', err);
            } else {
                data.forEach((row, i) => {
                    console.log(`Row ${i + 1}:`, row);
                });
            }
            db.close();
        });
    });
});
