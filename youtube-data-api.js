const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const NodeCache = require('node-cache');
const YouTubeDatabase = require('./youtube-database');

/**
 * YouTube Data API Service
 * Fast REST API for serving YouTube channel data from database
 */
class YouTubeDataAPI {
  constructor(config = {}) {
    this.config = {
      port: 3001,
      cache: {
        enabled: true,
        ttl: 300 // 5 minutes
      },
      cors: {
        enabled: true,
        origins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003']
      },
      ...config
    };

    this.app = express();
    this.database = new YouTubeDatabase();
    this.cache = new NodeCache({ 
      stdTTL: this.config.cache.ttl,
      checkperiod: 60 
    });
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security and performance middleware
    this.app.use(helmet());
    this.app.use(compression());
    
    // CORS setup
    if (this.config.cors.enabled) {
      this.app.use(cors({
        origin: this.config.cors.origins,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }));
    }

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/api/youtube/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        cache: {
          keys: this.cache.keys().length,
          stats: this.cache.getStats()
        }
      });
    });

    // Get all channels with filtering
    this.app.get('/api/youtube/channels', async (req, res) => {
      try {
        const filters = {
          category: req.query.category,
          priority: req.query.priority,
          language: req.query.language, // No default filter - show all languages
          limit: parseInt(req.query.limit) || 50,
          offset: parseInt(req.query.offset) || 0
        };

        // Create cache key
        const cacheKey = `channels_${JSON.stringify(filters)}`;
        
        // Check cache first
        if (this.config.cache.enabled) {
          const cached = this.cache.get(cacheKey);
          if (cached) {
            return res.json({
              success: true,
              data: cached,
              cached: true,
              timestamp: new Date().toISOString()
            });
          }
        }

        // Get from database
        const channels = await this.database.getChannels(filters);
        
        // Cache the result
        if (this.config.cache.enabled) {
          this.cache.set(cacheKey, channels);
        }

        res.json({
          success: true,
          data: channels,
          cached: false,
          count: channels.length,
          filters,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error getting channels:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Get specific channel by ID
    this.app.get('/api/youtube/channels/:channelId', async (req, res) => {
      try {
        const { channelId } = req.params;
        const cacheKey = `channel_${channelId}`;

        // Check cache first
        if (this.config.cache.enabled) {
          const cached = this.cache.get(cacheKey);
          if (cached) {
            return res.json({
              success: true,
              data: cached,
              cached: true,
              timestamp: new Date().toISOString()
            });
          }
        }

        const channel = await this.database.getChannelById(channelId);
        
        if (!channel) {
          return res.status(404).json({
            success: false,
            error: 'Channel not found',
            channelId,
            timestamp: new Date().toISOString()
          });
        }

        // Cache the result
        if (this.config.cache.enabled) {
          this.cache.set(cacheKey, channel);
        }

        res.json({
          success: true,
          data: channel,
          cached: false,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error getting channel:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Get database and service statistics
    this.app.get('/api/youtube/stats', async (req, res) => {
      try {
        const cacheKey = 'stats';

        // Check cache first (shorter TTL for stats)
        if (this.config.cache.enabled) {
          const cached = this.cache.get(cacheKey);
          if (cached) {
            return res.json({
              success: true,
              data: cached,
              cached: true,
              timestamp: new Date().toISOString()
            });
          }
        }

        const dbStats = await this.database.getStats();
        const serviceStats = {
          database: dbStats,
          api: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cache: {
              enabled: this.config.cache.enabled,
              keys: this.cache.keys().length,
              stats: this.cache.getStats()
            }
          }
        };

        // Cache with shorter TTL
        if (this.config.cache.enabled) {
          this.cache.set(cacheKey, serviceStats, 60); // 1 minute TTL for stats
        }

        res.json({
          success: true,
          data: serviceStats,
          cached: false,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error getting stats:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Clear cache endpoint
    this.app.post('/api/youtube/cache/clear', (req, res) => {
      try {
        const keys = this.cache.keys();
        this.cache.flushAll();
        
        res.json({
          success: true,
          message: 'Cache cleared successfully',
          clearedKeys: keys.length,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error clearing cache:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Add new channel
    this.app.post('/api/youtube/channels', async (req, res) => {
      try {
        const { channelUrl, channelName, category, priority, language } = req.body;

        if (!channelUrl) {
          return res.status(400).json({
            success: false,
            error: 'channelUrl is required',
            timestamp: new Date().toISOString()
          });
        }

        // Basic validation
        if (!channelUrl.includes('youtube.com')) {
          return res.status(400).json({
            success: false,
            error: 'Invalid YouTube URL',
            timestamp: new Date().toISOString()
          });
        }

        // Extract channel ID and prepare data
        const channelId = this.extractChannelIdFromUrl(channelUrl);
        const channelData = {
          channelId,
          channelName: channelName || channelId,
          channelUrl,
          category: category || 'all',
          priority: priority || 'medium',
          language: language || 'telugu'
        };

        await this.database.upsertChannel(channelData);

        // Clear relevant cache entries
        this.clearChannelCache();

        res.status(201).json({
          success: true,
          data: channelData,
          message: 'Channel added successfully',
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error adding channel:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Update channel
    this.app.put('/api/youtube/channels/:channelId', async (req, res) => {
      try {
        const { channelId } = req.params;
        const updateData = req.body;

        // Get existing channel
        const existingChannel = await this.database.getChannelById(channelId);
        if (!existingChannel) {
          return res.status(404).json({
            success: false,
            error: 'Channel not found',
            timestamp: new Date().toISOString()
          });
        }

        // Merge with existing data
        const channelData = {
          ...existingChannel,
          ...updateData,
          channelId // Ensure ID doesn't change
        };

        await this.database.upsertChannel(channelData);

        // Clear cache
        this.clearChannelCache(channelId);

        res.json({
          success: true,
          data: channelData,
          message: 'Channel updated successfully',
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error updating channel:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });

    // Error handler
    this.app.use((error, req, res, next) => {
      console.error('❌ Unhandled error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Clear channel-related cache entries
   */
  clearChannelCache(channelId = null) {
    const keys = this.cache.keys();
    const keysToDelete = keys.filter(key => {
      if (channelId && key === `channel_${channelId}`) {
        return true;
      }
      return key.startsWith('channels_') || key === 'stats';
    });

    keysToDelete.forEach(key => this.cache.del(key));
    console.log(`🗑️ Cleared ${keysToDelete.length} cache entries`);
  }

  /**
   * Extract channel ID from YouTube URL
   */
  extractChannelIdFromUrl(url) {
    if (url.includes('/@')) {
      return url.split('/@')[1].split('/')[0];
    } else if (url.includes('/channel/')) {
      return url.split('/channel/')[1].split('/')[0];
    } else if (url.includes('/c/')) {
      return url.split('/c/')[1].split('/')[0];
    } else if (url.includes('/user/')) {
      return url.split('/user/')[1].split('/')[0];
    }
    return url;
  }

  /**
   * Initialize and start the API server
   */
  async start() {
    try {
      // Initialize database
      await this.database.initialize();
      
      // Start server
      this.server = this.app.listen(this.config.port, () => {
        console.log(`🚀 YouTube Data API started on port ${this.config.port}`);
        console.log(`📋 Available endpoints:`);
        console.log(`   GET  /api/youtube/health - Health check`);
        console.log(`   GET  /api/youtube/channels - Get all channels`);
        console.log(`   GET  /api/youtube/channels/:id - Get specific channel`);
        console.log(`   GET  /api/youtube/stats - Get statistics`);
        console.log(`   POST /api/youtube/channels - Add new channel`);
        console.log(`   PUT  /api/youtube/channels/:id - Update channel`);
        console.log(`   POST /api/youtube/cache/clear - Clear cache`);
      });

      return this.server;
    } catch (error) {
      console.error('❌ Failed to start YouTube Data API:', error);
      throw error;
    }
  }

  /**
   * Stop the API server
   */
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(async () => {
          await this.database.close();
          console.log('✅ YouTube Data API stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Auto-start server when file is run directly
if (require.main === module) {
  const api = new YouTubeDataAPI();
  api.start().catch(console.error);
}

module.exports = YouTubeDataAPI;
