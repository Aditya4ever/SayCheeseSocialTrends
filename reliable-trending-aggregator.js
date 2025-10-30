const axios = require('axios');

/**
 * Enhanced trending data aggregator using multiple reliable public APIs
 * Implements various trending data sources for comprehensive coverage
 */
class ReliableTrendingAggregator {
  constructor() {
    this.baseTimeout = 10000;
    this.userAgent = 'SayCheese-TrendingAggregator/1.0';
    
    // API endpoints and configurations
    this.sources = {
      // Google Trends (unofficial API via serp API)
      googleTrends: {
        enabled: false, // Requires API key
        baseUrl: 'https://serpapi.com/search.json',
        apiKey: process.env.SERP_API_KEY
      },
      
      // HackerNews trending (free)
      hackerNews: {
        enabled: true,
        baseUrl: 'https://hacker-news.firebaseio.com/v0',
        endpoints: {
          topStories: '/topstories.json',
          item: '/item/{id}.json'
        }
      },
      
      // GitHub trending (free)
      githubTrending: {
        enabled: true,
        baseUrl: 'https://api.github.com',
        endpoints: {
          repos: '/search/repositories',
          trending: '/search/repositories?q=created:>{date}&sort=stars&order=desc'
        }
      },
      
      // Reddit trending (free - already implemented)
      reddit: {
        enabled: true,
        baseUrl: 'https://www.reddit.com'
      },
      
      // NewsAPI (free tier)
      newsAPI: {
        enabled: !!process.env.NEWS_API_KEY,
        baseUrl: 'https://newsapi.org/v2',
        apiKey: process.env.NEWS_API_KEY,
        endpoints: {
          topHeadlines: '/top-headlines',
          everything: '/everything'
        }
      },
      
      // The Guardian API (free)
      guardian: {
        enabled: !!process.env.GUARDIAN_API_KEY,
        baseUrl: 'https://content.guardianapis.com',
        apiKey: process.env.GUARDIAN_API_KEY
      },
      
      // Product Hunt (free)
      productHunt: {
        enabled: true,
        baseUrl: 'https://api.producthunt.com/v2/api/graphql'
      },
      
      // Twitter Trends (via unofficial APIs)
      twitterTrends: {
        enabled: false, // Requires API access
        baseUrl: 'https://api.twitter.com/1.1'
      },
      
      // YouTube trending (requires API key)
      youtube: {
        enabled: !!process.env.YOUTUBE_API_KEY,
        baseUrl: 'https://www.googleapis.com/youtube/v3',
        apiKey: process.env.YOUTUBE_API_KEY
      },
      
      // Trending GitHub topics
      githubTopics: {
        enabled: true,
        baseUrl: 'https://api.github.com/search/repositories'
      },
      
      // Dev.to trending posts
      devTo: {
        enabled: true,
        baseUrl: 'https://dev.to/api'
      },
      
      // Lobsters (tech news aggregator)
      lobsters: {
        enabled: true,
        baseUrl: 'https://lobste.rs'
      }
    };
  }

  async getHackerNewsTrending(limit = 20) {
    try {
      console.log('📰 Fetching HackerNews trending...');
      
      // Get top story IDs
      const topStoriesResponse = await axios.get(
        `${this.sources.hackerNews.baseUrl}/topstories.json`,
        { timeout: this.baseTimeout }
      );
      
      const topStoryIds = topStoriesResponse.data.slice(0, limit * 2); // Get more to filter
      
      // Fetch story details in parallel (limited batches)
      const storyPromises = topStoryIds.slice(0, limit).map(id =>
        axios.get(`${this.sources.hackerNews.baseUrl}/item/${id}.json`, {
          timeout: this.baseTimeout
        }).catch(() => null)
      );
      
      const stories = await Promise.allSettled(storyPromises);
      
      const trendingStories = stories
        .filter(result => result.status === 'fulfilled' && result.value?.data)
        .map(result => result.value.data)
        .filter(story => story && story.url && !story.deleted)
        .map(story => ({
          id: story.id,
          title: story.title,
          url: story.url,
          score: story.score || 0,
          commentCount: story.descendants || 0,
          author: story.by,
          publishedAt: new Date(story.time * 1000).toISOString(),
          source: 'HackerNews',
          platform: 'hackernews',
          type: 'tech'
        }));
      
      console.log(`📰 HackerNews: Found ${trendingStories.length} trending stories`);
      return trendingStories;
      
    } catch (error) {
      console.error('HackerNews trending fetch failed:', error.message);
      return [];
    }
  }

  async getGitHubTrending(language = '', period = 'daily', limit = 20) {
    try {
      console.log(`🐙 Fetching GitHub trending repositories (${period})...`);
      
      // Calculate date range for trending
      const date = new Date();
      if (period === 'daily') date.setDate(date.getDate() - 1);
      else if (period === 'weekly') date.setDate(date.getDate() - 7);
      else if (period === 'monthly') date.setMonth(date.getMonth() - 1);
      
      const dateStr = date.toISOString().split('T')[0];
      
      let query = `created:>${dateStr}`;
      if (language) query += `+language:${language}`;
      
      const response = await axios.get(`${this.sources.githubTrending.baseUrl}/search/repositories`, {
        params: {
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: limit
        },
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/vnd.github.v3+json'
        },
        timeout: this.baseTimeout
      });
      
      const trendingRepos = response.data.items.map(repo => ({
        id: repo.id,
        title: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        author: repo.owner.login,
        publishedAt: repo.created_at,
        updatedAt: repo.updated_at,
        source: 'GitHub',
        platform: 'github',
        type: 'tech'
      }));
      
      console.log(`🐙 GitHub: Found ${trendingRepos.length} trending repositories`);
      return trendingRepos;
      
    } catch (error) {
      console.error('GitHub trending fetch failed:', error.message);
      return [];
    }
  }

  async getDevToTrending(limit = 20) {
    try {
      console.log('👨‍💻 Fetching Dev.to trending posts...');
      
      const response = await axios.get(`${this.sources.devTo.baseUrl}/articles`, {
        params: {
          top: '7', // Last 7 days
          per_page: limit
        },
        timeout: this.baseTimeout
      });
      
      const trendingPosts = response.data.map(post => ({
        id: post.id,
        title: post.title,
        description: post.description,
        url: post.url,
        score: post.positive_reactions_count,
        commentCount: post.comments_count,
        author: post.user.name,
        publishedAt: post.published_at,
        tags: post.tag_list,
        source: 'Dev.to',
        platform: 'devto',
        type: 'tech'
      }));
      
      console.log(`👨‍💻 Dev.to: Found ${trendingPosts.length} trending posts`);
      return trendingPosts;
      
    } catch (error) {
      console.error('Dev.to trending fetch failed:', error.message);
      return [];
    }
  }

  async getLobstersTrending(limit = 20) {
    try {
      console.log('🦞 Fetching Lobsters trending...');
      
      const response = await axios.get(`${this.sources.lobsters.baseUrl}/hottest.json`, {
        timeout: this.baseTimeout
      });
      
      const trendingStories = response.data.slice(0, limit).map(story => ({
        id: story.short_id,
        title: story.title,
        url: story.url,
        score: story.score,
        commentCount: story.comment_count,
        author: story.submitter_user.username,
        publishedAt: story.created_at,
        tags: story.tags,
        source: 'Lobsters',
        platform: 'lobsters',
        type: 'tech'
      }));
      
      console.log(`🦞 Lobsters: Found ${trendingStories.length} trending stories`);
      return trendingStories;
      
    } catch (error) {
      console.error('Lobsters trending fetch failed:', error.message);
      return [];
    }
  }

  async getNewsAPITrending(country = 'in', category = '', limit = 20) {
    if (!this.sources.newsAPI.enabled) {
      console.log('📰 NewsAPI key not configured, skipping...');
      return [];
    }

    try {
      console.log(`📰 Fetching NewsAPI trending for ${country}...`);
      
      const params = {
        country: country,
        pageSize: limit,
        apiKey: this.sources.newsAPI.apiKey
      };
      
      if (category) params.category = category;
      
      const response = await axios.get(
        `${this.sources.newsAPI.baseUrl}/top-headlines`,
        { params, timeout: this.baseTimeout }
      );
      
      const trendingNews = response.data.articles.map((article, index) => ({
        id: `newsapi-${index}`,
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.urlToImage,
        author: article.author,
        publishedAt: article.publishedAt,
        source: article.source.name,
        platform: 'news',
        type: 'news'
      }));
      
      console.log(`📰 NewsAPI: Found ${trendingNews.length} trending articles`);
      return trendingNews;
      
    } catch (error) {
      console.error('NewsAPI trending fetch failed:', error.message);
      return [];
    }
  }

  async getGuardianTrending(limit = 20) {
    if (!this.sources.guardian.enabled) {
      console.log('📰 Guardian API key not configured, skipping...');
      return [];
    }

    try {
      console.log('📰 Fetching Guardian trending...');
      
      const response = await axios.get(`${this.sources.guardian.baseUrl}/search`, {
        params: {
          'order-by': 'relevance',
          'page-size': limit,
          'api-key': this.sources.guardian.apiKey,
          'show-fields': 'headline,byline,thumbnail,short-url'
        },
        timeout: this.baseTimeout
      });
      
      const trendingArticles = response.data.response.results.map(article => ({
        id: article.id,
        title: article.webTitle,
        url: article.webUrl,
        author: article.fields?.byline,
        publishedAt: article.webPublicationDate,
        section: article.sectionName,
        source: 'The Guardian',
        platform: 'news',
        type: 'news'
      }));
      
      console.log(`📰 Guardian: Found ${trendingArticles.length} trending articles`);
      return trendingArticles;
      
    } catch (error) {
      console.error('Guardian trending fetch failed:', error.message);
      return [];
    }
  }

  async getAllTrendingContent(region = 'IN') {
    console.log('🚀 Fetching from all reliable trending sources...');
    
    const promises = [
      this.getHackerNewsTrending(15),
      this.getGitHubTrending('', 'daily', 10),
      this.getDevToTrending(15),
      this.getLobstersTrending(10),
      this.getNewsAPITrending(region.toLowerCase(), '', 15),
      this.getGuardianTrending(15)
    ];
    
    const results = await Promise.allSettled(promises);
    
    const [hackerNews, github, devTo, lobsters, newsAPI, guardian] = results.map(
      result => result.status === 'fulfilled' ? result.value : []
    );
    
    // Combine and categorize results
    const trendingContent = {
      tech: [...hackerNews, ...github, ...devTo, ...lobsters],
      news: [...newsAPI, ...guardian],
      all: [...hackerNews, ...github, ...devTo, ...lobsters, ...newsAPI, ...guardian]
    };
    
    // Sort by relevance/score
    Object.keys(trendingContent).forEach(category => {
      trendingContent[category] = trendingContent[category]
        .sort((a, b) => (b.score || b.stars || 0) - (a.score || a.stars || 0))
        .slice(0, 20); // Limit each category
    });
    
    console.log(`🚀 Total trending content: Tech: ${trendingContent.tech.length}, News: ${trendingContent.news.length}`);
    
    return trendingContent;
  }

  getEnabledSources() {
    return Object.entries(this.sources)
      .filter(([name, config]) => config.enabled)
      .map(([name]) => name);
  }

  getAvailableAPIs() {
    return {
      enabled: this.getEnabledSources(),
      requiresApiKey: [
        { name: 'NewsAPI', env: 'NEWS_API_KEY', url: 'https://newsapi.org/' },
        { name: 'Guardian', env: 'GUARDIAN_API_KEY', url: 'https://open-platform.theguardian.com/' },
        { name: 'YouTube', env: 'YOUTUBE_API_KEY', url: 'https://developers.google.com/youtube/v3' },
        { name: 'SerpAPI (Google Trends)', env: 'SERP_API_KEY', url: 'https://serpapi.com/' }
      ],
      freeAPIs: [
        { name: 'HackerNews', status: 'enabled' },
        { name: 'GitHub', status: 'enabled' },
        { name: 'Dev.to', status: 'enabled' },
        { name: 'Lobsters', status: 'enabled' },
        { name: 'Reddit', status: 'enabled' }
      ]
    };
  }
}

module.exports = ReliableTrendingAggregator;
