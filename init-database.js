const YouTubeDatabase = require('./youtube-database.js');

async function initializeDatabase() {
    console.log('Initializing YouTube Database...');
    
    const db = new YouTubeDatabase('./youtube-data.db');
    
    try {
        await db.initialize();
        console.log('✅ Database connected and tables created successfully!');
        
        // Seed the database with Indian channels
        console.log('🌱 Seeding database with Indian channels...');
        await db.seedChannels();
        console.log('✅ Database seeded with channels!');
        
        // Check statistics
        const stats = await db.getStats();
        console.log('📊 Current database stats:', stats);
        
        await db.close();
        console.log('✅ Database initialization complete!');
        
    } catch (error) {
        console.error('❌ Error initializing database:', error);
    }
}

initializeDatabase();
