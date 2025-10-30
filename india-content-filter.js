/**
 * Geographic content filter for India-specific trending content
 * Filters and prioritizes content relevant to Indian audiences
 */
class IndiaContentFilter {
  constructor() {
    this.indianKeywords = [
      // Cities
      'mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow',
      'kanpur', 'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam', 'pimpri', 'patna', 'vadodara', 'ghaziabad',
      'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'kalyan', 'vasai', 'varanasi', 'srinagar',
      
      // States
      'maharashtra', 'uttar pradesh', 'bihar', 'west bengal', 'madhya pradesh', 'tamil nadu', 'rajasthan',
      'karnataka', 'gujarat', 'andhra pradesh', 'odisha', 'telangana', 'kerala', 'jharkhand', 'assam',
      'punjab', 'chhattisgarh', 'haryana', 'jammu kashmir', 'uttarakhand', 'himachal pradesh', 'tripura',
      'meghalaya', 'manipur', 'nagaland', 'goa', 'arunachal pradesh', 'mizoram', 'sikkim',
      
      // Country terms
      'india', 'indian', 'bharath', 'bharat', 'hindustan',
      
      // Cultural/Political
      'bollywood', 'cricket', 'ipl', 'modi', 'bjp', 'congress', 'lok sabha', 'rajya sabha',
      'diwali', 'holi', 'eid', 'ganesh', 'durga puja', 'navratri', 'karva chauth',
      'hindi', 'tamil', 'telugu', 'malayalam', 'kannada', 'gujarati', 'marathi', 'bengali', 'punjabi',
      
      // Organizations/Brands
      'isro', 'drdo', 'tata', 'reliance', 'infosys', 'wipro', 'airtel', 'jio', 'paytm', 'flipkart',
      'ola', 'uber india', 'zomato', 'swiggy', 'byjus', 'zerodha',
      
      // Current events keywords
      'rupee', 'nse', 'bse', 'sensex', 'nifty', 'reserve bank', 'rbi',
      'iit', 'nit', 'aiims', 'upsc', 'neet', 'jee',
      
      // Regional
      'south india', 'north india', 'east india', 'west india', 'northeast india'
    ];

    this.indianDomains = [
      'zeenews.india.com',
      'timesofindia.indiatimes.com', 
      'indianexpress.com',
      'hindustantimes.com',
      'ndtv.com',
      'news18.com',
      'indiatoday.in',
      'firstpost.com',
      'scroll.in',
      'theprint.in',
      'livemint.com',
      'moneycontrol.com',
      'economic times.com',
      'cricbuzz.com',
      'india.com',
      'news.google.com/topics/CAAqJQgKIh9DQkFTRVFvSUwyMHZNRFZ4ZERBU0JYVnpMVWRDS0FBUAE' // Google News India
    ];

    this.excludeKeywords = [
      'china', 'pakistan', 'bangladesh', 'sri lanka', 'nepal', 'myanmar',
      'trump', 'biden', 'usa', 'america', 'uk', 'britain', 'europe',
      'russia', 'ukraine', 'putin', 'france', 'germany', 'japan'
    ];
  }

  isIndianContent(item) {
    if (!item) return false;

    const text = this.getSearchableText(item).toLowerCase();
    const url = (item.url || item.link || item.permalink || '').toLowerCase();
    
    // Check if URL is from Indian domain
    const isIndianDomain = this.indianDomains.some(domain => 
      url.includes(domain.toLowerCase())
    );

    // Check for Indian keywords in content
    const hasIndianKeywords = this.indianKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );

    // Check for exclude keywords (non-Indian content)
    const hasExcludeKeywords = this.excludeKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );

    // Reddit India-specific subreddits
    const isIndianSubreddit = item.subreddit && [
      'india', 'indiaspeaks', 'mumbai', 'delhi', 'bangalore', 'hyderabad',
      'chennai', 'kolkata', 'pune', 'indianews', 'bollywood', 'cricket',
      'indianfood', 'indianstartups', 'indiaInvestments'
    ].includes(item.subreddit.toLowerCase());

    // Priority scoring
    let score = 0;
    if (isIndianDomain) score += 3;
    if (hasIndianKeywords) score += 2;
    if (isIndianSubreddit) score += 2;
    if (hasExcludeKeywords) score -= 3;

    return score > 0;
  }

  getSearchableText(item) {
    const texts = [
      item.title || '',
      item.description || '',
      item.channelTitle || '',
      item.source || '',
      item.subreddit || '',
      item.author || ''
    ];
    return texts.join(' ');
  }

  filterIndianContent(items) {
    if (!Array.isArray(items)) return [];

    const indianContent = items.filter(item => this.isIndianContent(item));
    const otherContent = items.filter(item => !this.isIndianContent(item));

    // Prioritize Indian content but include some international content
    const maxIndian = Math.min(indianContent.length, Math.ceil(items.length * 0.7));
    const maxOther = Math.min(otherContent.length, items.length - maxIndian);

    const result = [
      ...indianContent.slice(0, maxIndian),
      ...otherContent.slice(0, maxOther)
    ];

    console.log(`🇮🇳 India Filter: ${indianContent.length} Indian + ${maxOther} international = ${result.length} total`);
    
    return result;
  }

  addIndianRSSSources() {
    return [
      // Indian News RSS feeds
      'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
      'https://feeds.feedburner.com/ndtvnews-top-stories',
      'https://www.hindustantimes.com/feeds/rss/india-news/index.xml',
      'https://indianexpress.com/feed/',
      'https://www.news18.com/rss/india.xml',
      'https://www.indiatoday.in/rss/home',
      
      // Business/Economy
      'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
      'https://www.livemint.com/rss/news',
      'https://www.moneycontrol.com/rss/news.xml',
      
      // Technology
      'https://www.medianama.com/feed/',
      'https://yourstory.com/feed',
      
      // Sports (Cricket focus)
      'https://www.cricbuzz.com/rss-feed/news',
      'https://indianexpress.com/section/sports/feed/'
    ];
  }

  addIndianSubreddits() {
    return {
      india: ['india', 'indiaspeaks', 'unitedstatesofindia'],
      news: ['indianews', 'india', 'indiaspeaks'],
      tech: ['indianstartups', 'developersIndia', 'india'],
      entertainment: ['bollywood', 'indianmusic', 'india'],
      sports: ['cricket', 'indiansports', 'ipl'],
      business: ['indiainvestments', 'indiabusiness', 'india'],
      cities: ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 'pune']
    };
  }

  getIndianTrendingTopics() {
    // Common trending topics in India
    return [
      'Cricket', 'IPL', 'Bollywood', 'Politics', 'Elections',
      'Monsoon', 'Festival', 'Economy', 'Startup', 'Technology',
      'Education', 'Healthcare', 'Infrastructure', 'Agriculture',
      'Space', 'ISRO', 'Defense', 'Culture', 'Tourism'
    ];
  }

  scoreContentRelevance(item) {
    let score = 0;
    const text = this.getSearchableText(item).toLowerCase();
    
    // Indian keyword bonus
    const indianMatches = this.indianKeywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    ).length;
    score += indianMatches * 2;

    // Recency bonus (more recent = higher score)
    if (item.publishedAt || item.createdISO) {
      const date = new Date(item.publishedAt || item.createdISO);
      const hoursAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 6) score += 3;
      else if (hoursAgo < 24) score += 2;
      else if (hoursAgo < 48) score += 1;
    }

    // Engagement bonus
    if (item.score) score += Math.min(item.score / 1000, 5);
    if (item.viewCount) score += Math.min(item.viewCount / 10000, 5);

    return score;
  }

  sortByRelevance(items) {
    return items
      .map(item => ({
        ...item,
        relevanceScore: this.scoreContentRelevance(item)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(({ relevanceScore, ...item }) => item);
  }
}

module.exports = IndiaContentFilter;
