const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

/**
 * YouTube Channel Database Service
 * Handles all database operations for YouTube channel data
 */
class YouTubeDatabase {
  constructor(dbPath = './data/youtube_channels.db') {
    this.dbPath = dbPath;
    this.db = null;
    this.ensureDatabaseDir();
  }

  /**
   * Ensure database directory exists
   */
  ensureDatabaseDir() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Error opening database:', err.message);
          reject(err);
        } else {
          console.log('✅ Connected to YouTube channels database');
          this.createTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  /**
   * Create database tables
   */
  async createTables() {
    const tables = [
      // Main channels table
      `CREATE TABLE IF NOT EXISTS youtube_channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT UNIQUE NOT NULL,
        channel_name TEXT NOT NULL,
        channel_url TEXT NOT NULL,
        subscriber_count INTEGER,
        video_count INTEGER,
        total_views INTEGER,
        description TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        category TEXT DEFAULT 'all',
        priority TEXT DEFAULT 'medium',
        language TEXT DEFAULT 'telugu',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_scraped_at DATETIME,
        scrape_status TEXT DEFAULT 'pending',
        error_count INTEGER DEFAULT 0
      )`,

      // Channel metadata table for flexible data
      `CREATE TABLE IF NOT EXISTS channel_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT NOT NULL,
        metadata_key TEXT NOT NULL,
        metadata_value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES youtube_channels(channel_id),
        UNIQUE(channel_id, metadata_key)
      )`,

      // Scraping logs for monitoring
      `CREATE TABLE IF NOT EXISTS scraping_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT NOT NULL,
        scrape_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN NOT NULL,
        subscriber_count INTEGER,
        video_count INTEGER,
        error_message TEXT,
        response_time_ms INTEGER,
        FOREIGN KEY (channel_id) REFERENCES youtube_channels(channel_id)
      )`
    ];

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_channels_updated_at ON youtube_channels(updated_at)',
      'CREATE INDEX IF NOT EXISTS idx_channels_category ON youtube_channels(category)',
      'CREATE INDEX IF NOT EXISTS idx_channels_priority ON youtube_channels(priority)',
      'CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON scraping_logs(scrape_timestamp)'
    ];

    // Execute table creation
    for (const table of tables) {
      await this.runQuery(table);
    }

    // Execute index creation
    for (const index of indexes) {
      await this.runQuery(index);
    }

    console.log('✅ Database tables and indexes created successfully');
  }

  /**
   * Helper method to run SQL queries
   */
  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Helper method to get data from database
   */
  getAllQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Helper method to get single row
   */
  getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Add or update a YouTube channel
   */
  async upsertChannel(channelData) {
    const {
      channelId,
      channelName,
      channelUrl,
      subscriberCount,
      videoCount,
      totalViews,
      description,
      isVerified,
      category,
      priority,
      language = 'telugu'
    } = channelData;

    const sql = `
      INSERT INTO youtube_channels (
        channel_id, channel_name, channel_url, subscriber_count, video_count,
        total_views, description, is_verified, category, priority, language,
        updated_at, last_scraped_at, scrape_status, error_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'success', 0)
      ON CONFLICT(channel_id) DO UPDATE SET
        channel_name = excluded.channel_name,
        channel_url = excluded.channel_url,
        subscriber_count = excluded.subscriber_count,
        video_count = excluded.video_count,
        total_views = excluded.total_views,
        description = excluded.description,
        is_verified = excluded.is_verified,
        category = excluded.category,
        priority = excluded.priority,
        language = excluded.language,
        updated_at = CURRENT_TIMESTAMP,
        last_scraped_at = CURRENT_TIMESTAMP,
        scrape_status = 'success',
        error_count = 0
    `;

    try {
      const result = await this.runQuery(sql, [
        channelId, channelName, channelUrl, subscriberCount, videoCount,
        totalViews, description, isVerified, category, priority, language
      ]);
      
      console.log(`✅ Upserted channel: ${channelName} (${subscriberCount?.toLocaleString()} subs)`);
      return result;
    } catch (error) {
      console.error(`❌ Error upserting channel ${channelName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all channels with optional filtering
   */
  async getChannels(filters = {}) {
    const { category, priority, language, limit = 50, offset = 0 } = filters;
    
    let sql = 'SELECT * FROM youtube_channels WHERE 1=1';
    const params = [];

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

    sql += ' ORDER BY subscriber_count DESC, updated_at DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      const channels = await this.getAllQuery(sql, params);
      return channels;
    } catch (error) {
      console.error('❌ Error getting channels:', error.message);
      throw error;
    }
  }

  /**
   * Get specific channel by ID
   */
  async getChannelById(channelId) {
    const sql = 'SELECT * FROM youtube_channels WHERE channel_id = ?';
    
    try {
      const channel = await this.getQuery(sql, [channelId]);
      return channel;
    } catch (error) {
      console.error(`❌ Error getting channel ${channelId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get channels that need scraping (old data or failed scrapes)
   */
  async getChannelsForScraping(maxAge = 4 * 60 * 60 * 1000) { // 4 hours default
    const sql = `
      SELECT * FROM youtube_channels 
      WHERE (
        last_scraped_at IS NULL 
        OR last_scraped_at < datetime('now', '-${maxAge / 1000} seconds')
        OR scrape_status = 'failed'
      )
      AND error_count < 5
      ORDER BY priority DESC, last_scraped_at ASC
      LIMIT 20
    `;

    try {
      const channels = await this.getAllQuery(sql);
      return channels;
    } catch (error) {
      console.error('❌ Error getting channels for scraping:', error.message);
      throw error;
    }
  }

  /**
   * Log scraping attempt
   */
  async logScrapingAttempt(channelId, success, data = {}) {
    const {
      subscriberCount,
      videoCount,
      errorMessage,
      responseTime
    } = data;

    const sql = `
      INSERT INTO scraping_logs (
        channel_id, success, subscriber_count, video_count, 
        error_message, response_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
      await this.runQuery(sql, [
        channelId, success, subscriberCount, videoCount,
        errorMessage, responseTime
      ]);

      // Update channel scrape status
      if (success) {
        await this.runQuery(
          'UPDATE youtube_channels SET scrape_status = ?, error_count = 0 WHERE channel_id = ?',
          ['success', channelId]
        );
      } else {
        await this.runQuery(
          'UPDATE youtube_channels SET scrape_status = ?, error_count = error_count + 1 WHERE channel_id = ?',
          ['failed', channelId]
        );
      }
    } catch (error) {
      console.error(`❌ Error logging scraping attempt for ${channelId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const totalChannels = await this.getQuery('SELECT COUNT(*) as count FROM youtube_channels');
      const recentlyUpdated = await this.getQuery(
        "SELECT COUNT(*) as count FROM youtube_channels WHERE last_scraped_at > datetime('now', '-24 hours')"
      );
      const byCategory = await this.getAllQuery(
        'SELECT category, COUNT(*) as count FROM youtube_channels GROUP BY category'
      );
      const byPriority = await this.getAllQuery(
        'SELECT priority, COUNT(*) as count FROM youtube_channels GROUP BY priority'
      );
      const failedChannels = await this.getQuery(
        'SELECT COUNT(*) as count FROM youtube_channels WHERE scrape_status = "failed"'
      );

      return {
        totalChannels: totalChannels.count,
        recentlyUpdated: recentlyUpdated.count,
        byCategory: byCategory.reduce((acc, row) => {
          acc[row.category] = row.count;
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, row) => {
          acc[row.priority] = row.count;
          return acc;
        }, {}),
        failedChannels: failedChannels.count
      };
    } catch (error) {
      console.error('❌ Error getting stats:', error.message);
      throw error;
    }
  }

  /**
   * Seed database with initial Telugu channels
   */
  async seedChannels() {
    const initialChannels = [
      {
        channelId: '@SriBalajiMovies',
        channelName: 'Sri Balaji Movies',
        channelUrl: 'https://www.youtube.com/@SriBalajiMovies',
        category: 'cinema',
        priority: 'high',
        description: 'Telugu movies and entertainment'
      },
      {
        channelId: '@UVCreations',
        channelName: 'UV Creations',
        channelUrl: 'https://www.youtube.com/@UVCreations',
        category: 'cinema',
        priority: 'high',
        description: 'UV Creations Telugu films'
      },
      {
        channelId: '@GeethaartsOfficial',
        channelName: 'Geetha Arts',
        channelUrl: 'https://www.youtube.com/@GeethaartsOfficial',
        category: 'cinema',
        priority: 'high',
        description: 'Geetha Arts Telugu productions'
      },
      {
        channelId: '@TV9Telugu',
        channelName: 'TV9 Telugu',
        channelUrl: 'https://www.youtube.com/@TV9Telugu',
        category: 'politics',
        priority: 'high',
        description: 'Telugu news and current affairs'
      },
      {
        channelId: '@NtvTelugu',
        channelName: 'NTV Telugu',
        channelUrl: 'https://www.youtube.com/@NtvTelugu',
        category: 'politics',
        priority: 'high',
        description: 'Telugu news channel'
      },
      {
        channelId: '@ETVTelangana',
        channelName: 'ETV Telangana',
        channelUrl: 'https://www.youtube.com/@ETVTelangana',
        category: 'politics',
        priority: 'medium',
        description: 'Telangana regional news'
      },
      {
        channelId: '@AdityaMusic',
        channelName: 'Aditya Music',
        channelUrl: 'https://www.youtube.com/@AdityaMusic',
        category: 'cinema',
        priority: 'medium',
        description: 'Telugu music and songs'
      },
      {
        channelId: '@LahariMusic',
        channelName: 'Lahari Music',
        channelUrl: 'https://www.youtube.com/@LahariMusic',
        category: 'cinema',
        priority: 'medium',
        description: 'Telugu music label'
      }
    ];

    console.log('🌱 Seeding database with initial Telugu channels...');
    
    for (const channel of initialChannels) {
      try {
        await this.upsertChannel(channel);
      } catch (error) {
        console.warn(`⚠️ Failed to seed channel ${channel.channelName}:`, error.message);
      }
    }

    console.log('✅ Database seeding completed');
  }

  /**
   * Close database connection
   */
  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err.message);
          } else {
            console.log('✅ Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = YouTubeDatabase;
