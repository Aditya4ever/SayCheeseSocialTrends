const axios = require('axios');
const DateFilterUtils = require('./date-filter-utils');

/**
 * Fetch trending content from Reddit without authentication
 * Filters to only show content from the last 7 days
 */
class RedditService {
  constructor() {
    this.baseURL = 'https://www.reddit.com';
    this.subreddits = {
      all: ['popular', 'all'],
      technology: ['technology', 'programming', 'artificial'],
      entertainment: ['movies', 'Music', 'entertainment', 'funny'],
      sports: ['sports', 'nfl', 'soccer', 'basketball'],
      news: ['worldnews', 'news', 'politics'],
      gaming: ['gaming', 'Games']
    };
  }

  async fetchSubreddit(subreddit, sort = 'hot', limit = 50) { // Increased limit to filter later
    try {
      const url = `${this.baseURL}/r/${subreddit}/${sort}.json?limit=${limit}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'SayCheese-Aggregator/1.0'
        },
        timeout: 10000
      });

      // Filter posts to only include those from the last 7 days
      const allPosts = response.data.data.children
        .map(post => {
          const createdISO = DateFilterUtils.parseRedditTime(post.data.created_utc);
          return {
            id: post.data.id,
            title: post.data.title,
            url: post.data.url,
            permalink: `https://reddit.com${post.data.permalink}`,
            score: post.data.score,
            upvoteRatio: post.data.upvote_ratio,
            numComments: post.data.num_comments,
            created: post.data.created_utc,
            createdISO: createdISO,
            subreddit: post.data.subreddit,
            author: post.data.author,
            thumbnail: post.data.thumbnail !== 'self' ? post.data.thumbnail : null,
            platform: 'reddit'
          };
        })
        .filter(post => post.createdISO !== null); // Skip posts with invalid timestamps

      // Filter to last 7 days only (createdISO will be null for invalid dates)
      const recentPosts = allPosts.filter(post => 
        DateFilterUtils.isWithinWeek(post.createdISO)
      );

      const invalidCount = response.data.data.children.length - allPosts.length;
      if (invalidCount > 0) {
        console.log(`⚠️  Reddit r/${subreddit}: Skipped ${invalidCount} posts with invalid timestamps`);
      }
      console.log(`📅 Reddit r/${subreddit}: ${recentPosts.length}/${allPosts.length} valid posts from last 7 days`);
      return recentPosts;
    } catch (error) {
      console.error(`Failed to fetch from r/${subreddit}:`, error.message);
      return [];
    }
  }

  async getTrendingByCategory(category = 'all', limit = 15) {
    const subreddits = this.subreddits[category] || this.subreddits.all;
    const promises = subreddits.map(sub => this.fetchSubreddit(sub, 'hot', Math.ceil(limit / subreddits.length)));
    
    const results = await Promise.allSettled(promises);
    const posts = results
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return posts;
  }

  async getTopPosts(timeframe = 'day', limit = 20) {
    try {
      const url = `${this.baseURL}/top.json?t=${timeframe}&limit=${limit}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'SayCheese-Aggregator/1.0'
        }
      });

      return response.data.data.children.map(post => this.formatPost(post.data));
    } catch (error) {
      console.error('Failed to fetch top posts:', error.message);
      return [];
    }
  }

  formatPost(data) {
    return {
      id: data.id,
      title: data.title,
      url: data.url,
      permalink: `https://reddit.com${data.permalink}`,
      score: data.score,
      upvoteRatio: data.upvote_ratio,
      numComments: data.num_comments,
      created: new Date(data.created_utc * 1000).toISOString(),
      subreddit: data.subreddit,
      author: data.author,
      thumbnail: data.thumbnail !== 'self' && data.thumbnail !== 'default' ? data.thumbnail : null,
      platform: 'reddit'
    };
  }
}

module.exports = RedditService;
