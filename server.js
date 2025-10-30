const express = require('express');
const cors = require('cors');
const path = require('path');
const { fetchYouTubeTrending } = require('./youtube-trending');
const { fetchTwitterTrending } = require('./twitter-trending');
const CacheService = require('./cache-service');
const { mockYouTubeData, mockTwitterData } = require('./mock-data');
const AlternativeTrendingService = require('./alternative-trending-service');
const TeluguContentService = require('./telugu-content-service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize alternative trending service
const alternativeService = new AlternativeTrendingService();
const teluguService = new TeluguContentService();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/api/trending', async (req, res) => {
  try {
    const { region = 'IN', platforms = 'youtube,twitter' } = req.query;
    const platformList = platforms.split(',');
    
    const results = {};
    const isDevelopmentMode = !process.env.YOUTUBE_API_KEY || !process.env.TWITTER_BEARER_TOKEN;
    
    // Fetch YouTube trending if requested
    if (platformList.includes('youtube')) {
      if (isDevelopmentMode) {
        console.log('🔧 Development mode: Using mock YouTube data (add YOUTUBE_API_KEY to .env for real data)');
        results.youtube = mockYouTubeData;
      } else {
        results.youtube = await CacheService.getOrFetch(
          `youtube-trending-${region}`,
          () => fetchYouTubeTrending(region),
          1800 // 30 minutes cache
        );
      }
    }
    
    // Fetch Twitter trending if requested
    if (platformList.includes('twitter')) {
      if (isDevelopmentMode) {
        console.log('🔧 Development mode: Using mock Twitter data (add TWITTER_BEARER_TOKEN to .env for real data)');
        results.twitter = mockTwitterData;
      } else {
        const woeid = region === 'IN' ? 23424848 : 1; // Default to worldwide
        results.twitter = await CacheService.getOrFetch(
          `twitter-trending-${woeid}`,
          () => fetchTwitterTrending(woeid),
          900 // 15 minutes cache
        );
      }
    }
    
    res.json({
      timestamp: new Date(),
      region,
      developmentMode: isDevelopmentMode,
      data: results
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to fetch trending data' });
  }
});

// Alternative trending endpoint using free sources
app.get('/api/trending/alternative', async (req, res) => {
  try {
    const { region = 'IN', categories = 'all' } = req.query;
    const categoryList = categories.split(',');
    
    console.log('🔄 Fetching alternative trending data (last 7 days only)...');
    
    const data = await CacheService.getOrFetch(
      `alternative-trending-${region}-${categories}-7days`,
      () => alternativeService.getAlternativeTrending(region, categoryList),
      1800 // 30 minutes cache
    );
    
    res.json({
      timestamp: new Date(),
      region,
      categories: categoryList,
      data,
      sources: ['reddit', 'rss', 'google-trends', 'news-apis'],
      dateFilter: 'last-7-days-only',
      note: 'Using alternative free data sources - content filtered to last 7 days only'
    });
  } catch (error) {
    console.error('Alternative trending API error:', error);
    res.status(500).json({ error: 'Failed to fetch alternative trending data' });
  }
});

// Development status endpoint
app.get('/api/status', (req, res) => {
  const hasYouTubeKey = !!process.env.YOUTUBE_API_KEY;
  const hasTwitterToken = !!process.env.TWITTER_BEARER_TOKEN;
  
  res.json({
    status: 'running',
    developmentMode: !hasYouTubeKey || !hasTwitterToken,
    apiKeys: {
      youtube: hasYouTubeKey ? 'configured' : 'missing',
      twitter: hasTwitterToken ? 'configured' : 'missing'
    },
    instructions: {
      setup: hasYouTubeKey && hasTwitterToken ? 'All API keys configured!' : 'Copy .env.example to .env and add your API keys',
      youtube: hasYouTubeKey ? '✅ Ready' : '❌ Add YOUTUBE_API_KEY to .env',
      twitter: hasTwitterToken ? '✅ Ready' : '❌ Add TWITTER_BEARER_TOKEN to .env'
    },
    alternativeSources: {
      available: true,
      endpoint: '/api/trending/alternative',
      description: 'Free data sources available without API keys'
    }
  });
});

// Alternative sources status
app.get('/api/sources', async (req, res) => {
  try {
    const sourcesStatus = await alternativeService.getSourcesStatus();
    res.json({
      status: 'available',
      sources: sourcesStatus,
      endpoints: {
        reddit: 'reddit.com (no auth required)',
        rss: 'RSS feeds from major sites',
        googleTrends: 'Google Trends unofficial API',
        hackernews: 'Hacker News public API',
        newsapis: 'Free news APIs'
      },
      usage: 'Use /api/trending/alternative for free trending data'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sources status' });
  }
});

// Telugu content endpoint
app.get('/api/trending/telugu', async (req, res) => {
  try {
    console.log('🏛️ Fetching Telugu content...');
    
    const data = await CacheService.getOrFetch(
      'telugu-content-all',
      () => teluguService.getTeluguTrendingContent(),
      300 // 5 minutes cache
    );
    
    res.json({
      timestamp: new Date(),
      region: 'Telangana/Andhra Pradesh',
      data,
      categories: ['politics', 'cinema', 'all'],
      sources: ['news', 'youtube', 'twitter'],
      note: 'Telugu/Telangana/Tollywood focused content from multiple sources'
    });
  } catch (error) {
    console.error('Telugu content API error:', error);
    res.status(500).json({ error: 'Failed to fetch Telugu content' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});