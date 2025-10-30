const axios = require('axios');
const xml2js = require('xml2js');
const DateFilterUtils = require('./date-filter-utils');

/**
 * Fetch trending content from RSS feeds
 * Filters to only show content from the last 7 days
 */
class RSSFeedService {
  constructor() {
    this.feeds = {
      youtube: [
        'https://www.youtube.com/feeds/videos.xml?channel_id=UCF0pVplsI8R5kcAqgtoRqoA', // Popular channels
        'https://www.youtube.com/feeds/videos.xml?channel_id=UCLXo7UDZvByw2ixzpQCufnA', // Vox
        'https://www.youtube.com/feeds/videos.xml?channel_id=UCsooa4yRKGN_zEE8iknghZA' // TED-Ed
      ],
      news: [
        'https://feeds.bbci.co.uk/news/rss.xml',
        'https://rss.cnn.com/rss/edition.rss',
        'https://feeds.npr.org/1001/rss.xml',
        'https://www.reddit.com/r/worldnews/.rss'
      ],
      tech: [
        'https://techcrunch.com/feed/',
        'https://www.theverge.com/rss/index.xml',
        'https://feeds.arstechnica.com/arstechnica/index',
        'https://www.reddit.com/r/technology/.rss'
      ],
      entertainment: [
        'https://www.reddit.com/r/movies/.rss',
        'https://www.reddit.com/r/Music/.rss',
        'https://variety.com/feed/'
      ],
      sports: [
        'https://www.espn.com/espn/rss/news',
        'https://www.reddit.com/r/sports/.rss'
      ],
      // Indian-specific RSS feeds
      india_news: [
        'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
        'https://feeds.feedburner.com/ndtvnews-top-stories',
        'https://www.hindustantimes.com/feeds/rss/india-news/index.xml',
        'https://indianexpress.com/feed/',
        'https://www.reddit.com/r/india/.rss',
        'https://www.reddit.com/r/indiaspeaks/.rss'
      ],
      india_business: [
        'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
        'https://www.livemint.com/rss/news',
        'https://www.moneycontrol.com/rss/news.xml'
      ],
      india_tech: [
        'https://www.medianama.com/feed/',
        'https://yourstory.com/feed',
        'https://www.reddit.com/r/indianstartups/.rss'
      ],
      india_sports: [
        'https://www.cricbuzz.com/rss-feed/news',
        'https://indianexpress.com/section/sports/feed/',
        'https://www.reddit.com/r/cricket/.rss'
      ]
    };
  }

  async fetchRSSFeed(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'SayCheese-Aggregator/1.0'
        }
      });
      
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);
      return this.parseRSSItems(result, url);
    } catch (error) {
      console.error(`Failed to fetch RSS from ${url}:`, error.message);
      return [];
    }
  }

  parseRSSItems(data, sourceUrl) {
    let items = [];
    
    // Handle different RSS formats
    if (data.rss && data.rss.channel && data.rss.channel[0].item) {
      items = data.rss.channel[0].item;
    } else if (data.feed && data.feed.entry) {
      items = data.feed.entry;
    }

    // Parse all items and filter by date
    const allItems = items
      .map((item, index) => {
        const publishedAt = this.extractText(item.pubDate || item.published);
        const normalizedDate = DateFilterUtils.parseRSSDate(publishedAt);
        
        return {
          id: `rss-${Date.now()}-${index}`,
          title: this.extractText(item.title),
          description: this.extractText(item.description || item.summary),
          link: this.extractText(item.link),
          publishedAt: normalizedDate,
          originalDate: publishedAt, // Keep original for debugging
          source: this.getSourceName(sourceUrl),
          platform: 'rss'
        };
      })
      .filter(item => item.publishedAt !== null); // Filter out items with invalid dates

    // Filter to only items from the last 7 days
    const recentItems = allItems.filter(item => 
      DateFilterUtils.isWithinWeek(item.publishedAt)
    );

    const invalidCount = items.length - allItems.length;
    if (invalidCount > 0) {
      console.log(`⚠️  RSS ${this.getSourceName(sourceUrl)}: Skipped ${invalidCount} items with invalid timestamps`);
    }
    console.log(`📅 RSS ${this.getSourceName(sourceUrl)}: ${recentItems.length}/${allItems.length} valid items from last 7 days`);
    return recentItems.slice(0, 15); // Return more since we're filtering
  }

  extractText(field) {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (Array.isArray(field)) return field[0] || '';
    if (field._) return field._;
    if (field.$) return field.$.href || '';
    return String(field);
  }

  getSourceName(url) {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').replace('.com', '').replace('.org', '');
  }

  async getTrendingByCategory(category = 'news', region = 'global') {
    let feeds = this.feeds[category] || this.feeds.news;
    
    // For Indian users, prioritize Indian feeds
    if (region === 'IN' && this.feeds[`india_${category}`]) {
      const indianFeeds = this.feeds[`india_${category}`];
      const globalFeeds = feeds.slice(0, 2); // Take fewer global feeds
      feeds = [...indianFeeds, ...globalFeeds];
      console.log(`🇮🇳 Using ${indianFeeds.length} Indian + ${globalFeeds.length} global RSS feeds for ${category}`);
    }
    
    const promises = feeds.map(feed => this.fetchRSSFeed(feed));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 15);
  }
}

module.exports = RSSFeedService;
