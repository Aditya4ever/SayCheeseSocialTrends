const RSSFeedService = require('./rss-service');
const RedditService = require('./reddit-service');
const GoogleTrendsService = require('./google-trends-service');
const FreeNewsService = require('./free-news-service');
const DateFilterUtils = require('./date-filter-utils');
const URLValidator = require('./url-validator');
const YouTubeService = require('./youtube-service');
const TwitterService = require('./twitter-service');
const TrendingReliableService = require('./trending-reliable-service');
const QualityFilterUtils = require('./quality-filter-utils');
const EnhancedTrendingService = require('./enhanced-trending-service');
const TeluguContentService = require('./telugu-content-service');

class AlternativeTrendingService {
  constructor() {
    this.rss = new RSSFeedService();
    this.reddit = new RedditService();
    this.googleTrends = new GoogleTrendsService();
    this.freeNews = new FreeNewsService();
    this.dateFilter = new DateFilterUtils();
    this.urlValidator = new URLValidator();
    this.youtube = new YouTubeService();
    this.twitter = new TwitterService();
    this.reliable = new TrendingReliableService();
    this.quality = new QualityFilterUtils();
    this.enhanced = new EnhancedTrendingService();
    this.teluguContent = new TeluguContentService();

    this.cache = new Map();
  }

  // Main method to get alternative trending data (last 7 days only)
  async getTrendingData(region = 'IN', category = 'all', timeRange = '7days') {
    console.log('🔄 Fetching alternative trending data (last 7 days only)...');
    
    const cacheKey = `alternative-trending-${region}-${category}-${timeRange}`;
    
    if (this.cache.has(cacheKey)) {
      console.log(`Cache hit for ${cacheKey}`);
      return this.cache.get(cacheKey);
    }
    
    console.log(`Cache miss for ${cacheKey}, fetching fresh data`);
    
    try {
      const [
        reddit,
        news,
        trends,
        rss,
        reliable,
        enhanced
      ] = await Promise.allSettled([
        this.reddit.getPopularPosts().catch(() => []),
        this.freeNews.getNews().catch(() => []),
        this.googleTrends.getTrends().catch(() => []),
        this.getRSSFeeds().catch(() => []),
        this.reliable.getReliableTrending().catch(() => []),
        this.enhanced.getEnhancedTrending().catch(() => [])
      ]);

      const results = {
        reddit: reddit.status === 'fulfilled' ? this.dateFilter.filterByDate(reddit.value, 7) : [],
        news: news.status === 'fulfilled' ? this.dateFilter.filterByDate(news.value, 7) : [],
        trends: trends.status === 'fulfilled' ? this.dateFilter.filterByDate(trends.value, 7) : [],
        rss: rss.status === 'fulfilled' ? this.dateFilter.filterByDate(rss.value, 7) : [],
        reliable: reliable.status === 'fulfilled' ? this.dateFilter.filterByDate(reliable.value, 7) : [],
        enhanced: enhanced.status === 'fulfilled' ? this.dateFilter.filterByDate(enhanced.value, 7) : []
      };

      console.log(`📊 Fetched data: Reddit ${results.reddit.length}, News ${results.news.length}, Trends ${results.trends.length}, RSS ${results.rss.length}, Reliable ${results.reliable.length}, Enhanced ${results.enhanced.length}`);

      // URL validation
      const allContentWithUrls = [
        ...results.reddit.filter(item => item.url || item.permalink),
        ...results.rss.filter(item => item.link),
        ...results.news.filter(item => item.url),
        ...results.reliable.filter(item => item.url),
        ...results.enhanced.filter(item => item.url)
      ];

      console.log(`🔗 Validating ${allContentWithUrls.length} URLs...`);
      
      // URL validation with timeout and error handling
      const urlValidationPromises = allContentWithUrls.map(async (item) => {
        try {
          const url = item.url || item.link || item.permalink;
          if (url && url !== '#') {
            const isValid = await this.urlValidator.isValidURL(url);
            return { item, isValid };
          }
          return { item, isValid: false };
        } catch {
          return { item, isValid: false };
        }
      });

      const urlValidationResults = await Promise.allSettled(urlValidationPromises);
      const validUrls = urlValidationResults
        .filter(result => result.status === 'fulfilled' && result.value.isValid)
        .map(result => result.value.item);

      // Filter out items with invalid URLs
      const validCount = validUrls.length;
      const totalCount = allContentWithUrls.length;
      
      results.reddit = results.reddit.filter(item => {
        const url = item.url || item.permalink;
        return !url || url === '#' || validUrls.some(valid => 
          (valid.url || valid.link || valid.permalink) === url
        );
      });
      
      results.rss = results.rss.filter(item => {
        return !item.link || item.link === '#' || validUrls.some(valid => 
          (valid.url || valid.link || valid.permalink) === item.link
        );
      });
      
      results.news = results.news.filter(item => {
        return !item.url || item.url === '#' || validUrls.some(valid => 
          (valid.url || valid.link || valid.permalink) === item.url
        );
      });
      
      results.reliable = results.reliable.filter(item => {
        return !item.url || item.url === '#' || validUrls.some(valid => 
          (valid.url || valid.link || valid.permalink) === item.url
        );
      });

      const originalRedditCount = reddit.status === 'fulfilled' ? this.dateFilter.filterByDate(reddit.value, 7).length : 0;
      const originalRssCount = rss.status === 'fulfilled' ? this.dateFilter.filterByDate(rss.value, 7).length : 0;
      const originalNewsCount = news.status === 'fulfilled' ? this.dateFilter.filterByDate(news.value, 7).length : 0;
      const originalReliableCount = reliable.status === 'fulfilled' ? this.dateFilter.filterByDate(reliable.value, 7).length : 0;

      console.log(`✅ URL Validation: ${validCount}/${totalCount} URLs are accessible`);
      console.log(`📊 Filtered: Reddit ${originalRedditCount}→${results.reddit.length}, RSS ${originalRssCount}→${results.rss.length}, News ${originalNewsCount}→${results.news.length}, Reliable ${originalReliableCount}→${results.reliable.length}`);

      // Apply quality filtering
      console.log('✨ Applying content quality filtering...');
      const qualityOriginalCounts = {
        reddit: results.reddit.length,
        rss: results.rss.length,
        news: results.news.length,
        reliable: results.reliable.length
      };

      results.reddit = this.quality.filterContent(results.reddit);
      results.rss = this.quality.filterContent(results.rss);
      results.news = this.quality.filterContent(results.news);
      results.reliable = this.quality.filterContent(results.reliable);

      console.log(`✨ Quality Filter: Reddit ${qualityOriginalCounts.reddit}→${results.reddit.length}, RSS ${qualityOriginalCounts.rss}→${results.rss.length}, News ${qualityOriginalCounts.news}→${results.news.length}, Reliable ${qualityOriginalCounts.reliable}→${results.reliable.length}`);

      this.cache.set(cacheKey, results);
      return results;

    } catch (error) {
      console.error('Error fetching alternative trending data:', error);
      return {
        reddit: [],
        news: [],
        trends: [],
        rss: [],
        reliable: [],
        enhanced: []
      };
    }
  }
