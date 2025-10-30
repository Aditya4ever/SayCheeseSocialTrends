const axios = require('axios');
const DateFilterUtils = require('./date-filter-utils');

/**
 * Free News APIs that provide trending content
 * Filters to only show content from the last 7 days
 */
class FreeNewsService {
  constructor() {
    this.services = {
      // NewsAPI.org - 1000 requests/day free
      newsapi: {
        baseURL: 'https://newsapi.org/v2',
        // You can get a free API key from https://newsapi.org/
        apiKey: process.env.NEWS_API_KEY || null
      },
      
      // Guardian API - Free with registration
      guardian: {
        baseURL: 'https://content.guardianapis.com',
        apiKey: process.env.GUARDIAN_API_KEY || null
      },
      
      // Hacker News - No API key required
      hackernews: {
        baseURL: 'https://hacker-news.firebaseio.com/v0'
      }
    };
  }

  async getNewsAPITrending(category = 'general') {
    if (!this.services.newsapi.apiKey) {
      console.log('NewsAPI key not configured, using fallback');
      return this.getFallbackNews(category);
    }

    try {
      const url = `${this.services.newsapi.baseURL}/top-headlines`;
      const response = await axios.get(url, {
        params: {
          category: category,
          country: 'in',
          pageSize: 20,
          apiKey: this.services.newsapi.apiKey
        }
      });

      const allArticles = response.data.articles.map((article, index) => ({
        id: `news-${Date.now()}-${index}`,
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        source: article.source.name,
        platform: 'news'
      }));

      // Filter to only articles from the last 7 days
      const recentArticles = allArticles.filter(article => 
        DateFilterUtils.isWithinWeek(article.publishedAt)
      );

      console.log(`📅 NewsAPI: ${recentArticles.length}/${allArticles.length} articles from last 7 days`);
      return recentArticles;
    } catch (error) {
      console.error('NewsAPI request failed:', error.message);
      return this.getFallbackNews(category);
    }
  }

  async getHackerNewsTrending() {
    try {
      // Get top stories
      const topStoriesResponse = await axios.get(`${this.services.hackernews.baseURL}/topstories.json`);
      const topStoryIds = topStoriesResponse.data.slice(0, 20);

      // Get details for each story
      const storyPromises = topStoryIds.map(id => 
        axios.get(`${this.services.hackernews.baseURL}/item/${id}.json`)
      );

      const stories = await Promise.allSettled(storyPromises);
      
      const allStories = stories
        .filter(result => result.status === 'fulfilled' && result.value.data)
        .map(result => {
          const story = result.value.data;
          return {
            id: `hn-${story.id}`,
            title: story.title,
            url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            score: story.score,
            comments: story.descendants || 0,
            author: story.by,
            publishedAt: new Date(story.time * 1000).toISOString(),
            platform: 'hackernews'
          };
        });

      // Filter to only stories from the last 7 days
      const recentStories = allStories.filter(story => 
        DateFilterUtils.isWithinWeek(story.publishedAt)
      );

      console.log(`📅 Hacker News: ${recentStories.length}/${allStories.length} stories from last 7 days`);
      return recentStories;
    } catch (error) {
      console.error('Hacker News request failed:', error.message);
      return [];
    }
  }

  async getGuardianTrending() {
    try {
      const url = `${this.services.guardian.baseURL}/search`;
      const response = await axios.get(url, {
        params: {
          'order-by': 'relevance',
          'show-fields': 'thumbnail,headline,trailText',
          'page-size': 20,
          'api-key': this.services.guardian.apiKey || 'test'
        }
      });

      const allArticles = response.data.response.results.map((article, index) => ({
        id: `guardian-${Date.now()}-${index}`,
        title: article.webTitle,
        description: article.fields?.trailText || '',
        url: article.webUrl,
        thumbnail: article.fields?.thumbnail,
        publishedAt: article.webPublicationDate,
        section: article.sectionName,
        platform: 'guardian'
      }));

      // Filter to only articles from the last 7 days
      const recentArticles = allArticles.filter(article => 
        DateFilterUtils.isWithinWeek(article.publishedAt)
      );

      console.log(`📅 Guardian: ${recentArticles.length}/${allArticles.length} articles from last 7 days`);
      return recentArticles;
    } catch (error) {
      console.error('Guardian API request failed:', error.message);
      return [];
    }
  }

  getFallbackNews(category) {
    const fallbackData = {
      technology: [
        { title: 'AI Breakthrough in 2025', description: 'Major advancement in artificial intelligence' },
        { title: 'New Smartphone Features', description: 'Latest mobile technology trends' },
        { title: 'Space Technology Update', description: 'Recent developments in space exploration' }
      ],
      sports: [
        { title: 'Championship Finals 2025', description: 'Major sporting events this year' },
        { title: 'Olympic Preparations', description: 'Athletes preparing for upcoming games' },
        { title: 'Record Breaking Performance', description: 'New sports records set this week' }
      ],
      general: [
        { title: 'Global Climate Initiative', description: 'New environmental policies announced' },
        { title: 'Economic Growth Report', description: 'Latest economic indicators show positive trends' },
        { title: 'Health Research Findings', description: 'New medical research results published' }
      ]
    };

    return (fallbackData[category] || fallbackData.general).map((item, index) => {
      // Create dates within the last 7 days for fallback data
      const daysAgo = Math.floor(Math.random() * 7);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      return {
        id: `fallback-${category}-${index}`,
        title: item.title,
        description: item.description,
        url: '#',
        publishedAt: date.toISOString(),
        source: 'SayCheese Demo',
        platform: 'news'
      };
    });
  }

  async getAllTrendingNews() {
    const promises = [
      this.getNewsAPITrending(),
      this.getHackerNewsTrending(),
      this.getGuardianTrending()
    ];

    const results = await Promise.allSettled(promises);
    
    return results
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value)
      .slice(0, 30);
  }
}

module.exports = FreeNewsService;
