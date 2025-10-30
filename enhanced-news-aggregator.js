const axios = require('axios');
const Parser = require('rss-parser');
const NodeCache = require('node-cache');

class EnhancedNewsAggregator {
    constructor() {
        this.cache = new NodeCache({ stdTTL: 1800 }); // 30-minute cache
        this.parser = new Parser({
            customFields: {
                feed: ['language', 'country'],
                item: ['category', 'source', 'region']
            }
        });
        
        // Weighted scoring system
        this.sourceWeights = {
            'timesofindia': 0.9,
            'thehindu': 0.95,
            'hindustantimes': 0.8,
            'ndtv': 0.85,
            'indiatoday': 0.8,
            'indianexpress': 0.85,
            'livemint': 0.75,
            'moneycontrol': 0.7
        };
        
        this.categoryBoosts = {
            'cricket': 1.5,
            'bollywood': 1.4,
            'politics': 1.3,
            'technology': 1.2,
            'business': 1.1
        };
    }

    // Tier 1: NewsAPI Integration
    async fetchNewsAPI(country = 'in', category = null) {
        const cacheKey = `newsapi_${country}_${category}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        try {
            const apiKey = process.env.NEWSAPI_KEY;
            if (!apiKey) {
                console.warn('NewsAPI key not configured');
                return [];
            }

            const params = {
                country: country,
                pageSize: 50,
                apiKey: apiKey
            };
            
            if (category) params.category = category;

            const response = await axios.get('https://newsapi.org/v2/top-headlines', { params });
            
            const enrichedArticles = response.data.articles.map(article => ({
                ...article,
                source: article.source.name,
                sourceWeight: this.getSourceWeight(article.source.name),
                trending_score: this.calculateTrendingScore(article),
                platform: 'newsapi',
                region: country.toUpperCase()
            }));

            this.cache.set(cacheKey, enrichedArticles);
            return enrichedArticles;
        } catch (error) {
            console.error('NewsAPI fetch error:', error.message);
            return [];
        }
    }

    // Tier 2: Premium RSS Feeds
    async fetchPremiumRSSFeeds() {
        const feeds = [
            {
                url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
                source: 'timesofindia',
                category: 'general'
            },
            {
                url: 'https://www.thehindu.com/feeder/default.rss',
                source: 'thehindu',
                category: 'general'
            },
            {
                url: 'https://www.hindustantimes.com/rss/topnews/rssfeed.xml',
                source: 'hindustantimes',
                category: 'general'
            },
            {
                url: 'http://feeds.feedburner.com/ndtvnews-top-stories',
                source: 'ndtv',
                category: 'general'
            },
            {
                url: 'https://www.indiatoday.in/rss/home',
                source: 'indiatoday',
                category: 'general'
            },
            {
                url: 'http://feeds.feedburner.com/MoneycontrolLatestNews',
                source: 'moneycontrol',
                category: 'business'
            },
            {
                url: 'http://feeds.livemint.com/LiveMint',
                source: 'livemint',
                category: 'business'
            },
            {
                url: 'http://indianexpress.com/feed/',
                source: 'indianexpress',
                category: 'general'
            }
        ];

        const cacheKey = 'premium_rss_feeds';
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const allArticles = [];

        for (const feedConfig of feeds) {
            try {
                const feed = await this.parser.parseURL(feedConfig.url);
                
                const articles = feed.items.slice(0, 20).map(item => ({
                    title: item.title,
                    description: item.contentSnippet || item.summary,
                    url: item.link,
                    publishedAt: item.pubDate || item.isoDate,
                    source: feedConfig.source,
                    sourceWeight: this.sourceWeights[feedConfig.source] || 0.5,
                    category: this.detectCategory(item.title, item.contentSnippet),
                    trending_score: this.calculateTrendingScore(item, feedConfig.source),
                    platform: 'rss',
                    region: 'IN'
                }));

                allArticles.push(...articles);
            } catch (error) {
                console.error(`RSS feed error for ${feedConfig.source}:`, error.message);
            }
        }

        // Sort by trending score
        allArticles.sort((a, b) => b.trending_score - a.trending_score);
        
        this.cache.set(cacheKey, allArticles.slice(0, 100));
        return allArticles.slice(0, 100);
    }

    // YouTube API for video trends
    async fetchYouTubeTrendsIndia() {
        const cacheKey = 'youtube_trends_india';
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        try {
            const apiKey = process.env.YOUTUBE_API_KEY;
            if (!apiKey) {
                console.warn('YouTube API key not configured');
                return [];
            }

            const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    part: 'snippet,statistics',
                    chart: 'mostPopular',
                    regionCode: 'IN',
                    maxResults: 50,
                    key: apiKey
                }
            });

            const videos = response.data.items.map(video => ({
                id: video.id,
                title: video.snippet.title,
                description: video.snippet.description,
                thumbnail: video.snippet.thumbnails.medium.url,
                channelTitle: video.snippet.channelTitle,
                publishedAt: video.snippet.publishedAt,
                viewCount: parseInt(video.statistics.viewCount),
                likeCount: parseInt(video.statistics.likeCount || 0),
                trending_score: this.calculateVideoTrendingScore(video),
                category: this.detectCategory(video.snippet.title, video.snippet.description),
                platform: 'youtube',
                region: 'IN',
                url: `https://www.youtube.com/watch?v=${video.id}`
            }));

            videos.sort((a, b) => b.trending_score - a.trending_score);
            this.cache.set(cacheKey, videos);
            return videos;
        } catch (error) {
            console.error('YouTube API error:', error.message);
            return [];
        }
    }

    // Advanced trending score calculation
    calculateTrendingScore(item, source = null) {
        let score = 0;
        
        // Base source weight
        const sourceWeight = source ? this.sourceWeights[source] || 0.5 : 0.5;
        score += sourceWeight * 100;
        
        // Category boost
        const category = this.detectCategory(item.title, item.description || item.contentSnippet);
        const categoryBoost = this.categoryBoosts[category] || 1.0;
        score *= categoryBoost;
        
        // Time decay (newer is better)
        const publishedDate = new Date(item.publishedAt || item.pubDate);
        const hoursAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);
        const timeDecay = Math.max(0.1, 1 - (hoursAgo / 24)); // Decay over 24 hours
        score *= timeDecay;
        
        // Keyword relevance boost
        const keywords = ['ipl', 'cricket', 'bollywood', 'modi', 'mumbai', 'delhi', 'bangalore'];
        const titleLower = (item.title || '').toLowerCase();
        const keywordMatches = keywords.filter(keyword => titleLower.includes(keyword)).length;
        score += keywordMatches * 20;
        
        return Math.round(score);
    }

    calculateVideoTrendingScore(video) {
        let score = 0;
        
        // View velocity (views per hour since published)
        const publishedDate = new Date(video.snippet.publishedAt);
        const hoursAgo = Math.max(1, (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60));
        const viewVelocity = video.statistics.viewCount / hoursAgo;
        score += Math.log10(viewVelocity) * 50;
        
        // Like ratio
        const likeRatio = video.statistics.likeCount / Math.max(1, video.statistics.viewCount);
        score += likeRatio * 1000;
        
        // Category boost
        const category = this.detectCategory(video.snippet.title, video.snippet.description);
        const categoryBoost = this.categoryBoosts[category] || 1.0;
        score *= categoryBoost;
        
        return Math.round(score);
    }

    detectCategory(title, description = '') {
        const text = `${title} ${description}`.toLowerCase();
        
        if (text.match(/cricket|ipl|bcci|stadium|match|wicket|batting/)) return 'cricket';
        if (text.match(/bollywood|movie|film|actor|actress|cinema|trailer/)) return 'bollywood';
        if (text.match(/politics|election|minister|parliament|govt|government/)) return 'politics';
        if (text.match(/tech|technology|ai|startup|app|software|digital/)) return 'technology';
        if (text.match(/business|economy|stock|market|finance|rupee/)) return 'business';
        if (text.match(/health|covid|vaccine|medical|doctor|hospital/)) return 'health';
        
        return 'general';
    }

    getSourceWeight(sourceName) {
        const sourceKey = sourceName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '');
        return this.sourceWeights[sourceKey] || 0.5;
    }

    // Unified aggregation method
    async aggregateAllSources() {
        console.log('🔄 Fetching from enhanced news sources...');
        
        const [
            newsApiArticles,
            rssArticles,
            youtubeVideos
        ] = await Promise.all([
            this.fetchNewsAPI('in'),
            this.fetchPremiumRSSFeeds(),
            this.fetchYouTubeTrendsIndia()
        ]);

        // Combine and deduplicate
        const allContent = [
            ...newsApiArticles,
            ...rssArticles,
            ...youtubeVideos
        ];

        // Remove duplicates based on title similarity
        const uniqueContent = this.deduplicateContent(allContent);
        
        // Sort by trending score
        uniqueContent.sort((a, b) => b.trending_score - a.trending_score);
        
        console.log(`✅ Enhanced aggregation complete: ${uniqueContent.length} unique items`);
        return uniqueContent.slice(0, 200); // Return top 200
    }

    deduplicateContent(content) {
        const seen = new Set();
        return content.filter(item => {
            const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (seen.has(normalizedTitle)) return false;
            seen.add(normalizedTitle);
            return true;
        });
    }
}

module.exports = EnhancedNewsAggregator;
