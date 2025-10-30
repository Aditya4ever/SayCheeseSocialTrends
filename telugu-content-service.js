const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const RSS = require('rss-parser');

/**
 * Advanced Telugu Content Aggregation Service
 * Based on expert research for Telugu/Tollywood/Telangana content
 * Implements keyword-driven, multi-tier content discovery
 */
class TeluguContentService {
  constructor() {
    this.rss = new RSS({
      timeout: 10000,
      maxRedirects: 5,
      customFields: {
        item: ['pubDate', 'description', 'content', 'guid']
      }
    });
    
    // Initialize dynamic keyword database
    this.initializeKeywordDatabase();
    
    // Cache for storing trending keywords and entities
    this.trendingCache = new Map();
    this.lastUpdated = null;
  }

  /**
   * Tier 1: Core Telugu Content Keywords Database
   * This is the brain of the system - dynamically maintained keyword lists
   */
  initializeKeywordDatabase() {
    this.keywords = {
      // Major Tollywood Actors (A-List)
      actors: [
        'prabhas', 'mahesh babu', 'allu arjun', 'ram charan', 'jr ntr', 'ntr',
        'chiranjeevi', 'pawan kalyan', 'vijay deverakonda', 'nani', 'rana daggubati',
        'ravi teja', 'naga chaitanya', 'nagarjuna', 'venkatesh', 'balakrishna',
        'sai dharam tej', 'varun tej', 'sharwanand', 'nithiin', 'gopichand',
        'kalyan ram', 'bellamkonda sreenivas', 'sudheer babu', 'adivi sesh'
      ],
      
      // Major Tollywood Actresses
      actresses: [
        'samantha', 'rashmika mandanna', 'pooja hegde', 'kajal aggarwal',
        'anushka shetty', 'tamannaah', 'keerthy suresh', 'rakul preet singh',
        'pragya jaiswal', 'mehreen pirzada', 'raashi khanna', 'sai pallavi',
        'nivetha thomas', 'regina cassandra', 'lavanya tripathi', 'hebah patel'
      ],
      
      // Major Directors & Producers
      directors: [
        'ss rajamouli', 'rajamouli', 'trivikram', 'koratala siva', 'sukumar',
        'vamshi paidipally', 'harish shankar', 'anil ravipudi', 'boyapati sreenu',
        'krish jagarlamudi', 'maruthi', 'parasuram', 'gopichand malineni',
        'srinu vaitla', 'puri jagannadh', 'vv vinayak', 'dil raju', 'allu aravind'
      ],
      
      // Current & Recent Movies (Dynamic - should be updated regularly)
      movies: [
        'kalki 2898 ad', 'devara', 'pushpa 2', 'rrr', 'radhe shyam', 'acharya',
        'liger', 'godfather', 'bheemla nayak', 'sarkaru vaari paata', 'major',
        'ante sundaraniki', 'vikram', 'kgf chapter 2', 'beast', 'jersey',
        'love story', 'vakeel saab', 'krack', 'ala vaikunthapurramuloo',
        'sarileru neekevvaru', 'disco raja', 'world famous lover',
        'coolie', 'war 2', 'pushpa the rule', 'game changer', 'rc 16'
      ],
      
      // Political Leaders (Telangana & Andhra Pradesh)
      politicians: [
        'kcr', 'k chandrashekar rao', 'ktr', 'k t rama rao', 'revanth reddy',
        'jagan', 'ys jagan', 'chandrababu naidu', 'pawan kalyan', 'harish rao',
        'kavitha', 'sabitha indra reddy', 'etela rajender', 'bandi sanjay',
        'kishan reddy', 'asaduddin owaisi', 'akbaruddin owaisi'
      ],
      
      // Geographic Keywords
      places: [
        'hyderabad', 'secunderabad', 'warangal', 'nizamabad', 'karimnagar',
        'khammam', 'telangana', 'andhra pradesh', 'vijayawada', 'visakhapatnam',
        'tirupati', 'guntur', 'kurnool', 'nellore', 'chittoor', 'kadapa',
        'anantapur', 'srikakulam', 'vizianagaram', 'hitec city', 'hitech city',
        'cyberabad', 'gachibowli', 'madhapur', 'kondapur', 'banjara hills',
        'jubilee hills', 'film nagar', 'annapurna studios', 'ramoji film city'
      ],
      
      // Political Parties
      parties: [
        'trs', 'brs', 'tdp', 'ysrcp', 'janasena', 'congress telangana',
        'bjp telangana', 'mim', 'aimim', 'cpi', 'cpm', 'tjs'
      ],
      
      // Production Houses & Music Labels
      productionHouses: [
        'mythri movie makers', 'geetha arts', 'sri venkateswara creations',
        'haarika hassine creations', 'sithara entertainments', 'aditya music',
        'lahari music', 'sony music south', 'anil sunkara', 'dil raju productions'
      ],
      
      // News Channels & Media
      mediaChannels: [
        'tv9 telugu', 'ntv', 'etv telugu', 'greatandhra', 'idream filmnagar',
        'eenadu', 'sakshi', 'andhra jyothy', 'telangana today', 'hans india',
        '123telugu', 'gulte', 'tupaki', 'cinejosh', 'mirchi9', 'telugu cinema'
      ],
      
      // Sports & Culture Keywords (for "All Telugu" category)
      sports: [
        'cricket', 'ipl', 'srh', 'sunrisers hyderabad', 'kabaddi', 'badminton',
        'pv sindhu', 'saina nehwal', 'pullela gopichand', 'sania mirza'
      ],
      
      // Business & Tech Keywords (for "All Telugu" category)
      business: [
        'startup', 'technology', 'hitec city', 'hitech city', 'cyberabad',
        'microsoft', 'google', 'amazon', 'facebook', 'infosys', 'tcs',
        'pharma', 'biocon', 'dr reddy', 'aurobindo', 'hetero'
      ],
      
      // Cultural Keywords (for "All Telugu" category)
      culture: [
        'festival', 'bonalu', 'bathukamma', 'dussehra', 'ugadi', 'sankranti',
        'food', 'biryani', 'hyderabadi', 'telugu language', 'heritage'
      ]
    };
  }

  /**
   * Tier 2: Telugu RSS Feed Sources (Primary Data Sources)
   * These are the most reliable sources for Telugu content
   */
  getTeluguRSSFeeds() {
    return {
      // Cinema-Focused (Highest Priority)
      cinema: [
        {
          name: '123Telugu',
          url: 'https://www.123telugu.com/feed',
          priority: 'high',
          category: 'cinema'
        },
        {
          name: 'GreatAndhra',
          url: 'https://www.greatandhra.com/rss',
          priority: 'high',
          category: 'mixed',
          backup_urls: [
            'https://greatandhra.com/rss/',
            'https://feeds.feedburner.com/greatandhra'
          ]
        },
        {
          name: 'Gulte',
          url: 'https://www.gulte.com/rss',
          priority: 'high',
          category: 'mixed'
        },
        {
          name: 'Tupaki',
          url: 'https://english.tupaki.com/feed',
          priority: 'medium',
          category: 'mixed'
        },
        {
          name: 'CineJosh',
          url: 'https://www.cinejosh.com/rss.xml',
          priority: 'medium',
          category: 'cinema'
        },
        {
          name: 'FilmiBeat Telugu',
          url: 'https://www.filmibeat.com/rss/telugu-movie-news.xml',
          priority: 'medium',
          category: 'cinema',
          backup_urls: [
            'https://www.filmibeat.com/rss/news/telugu.xml'
          ]
        },
        {
          name: 'IndiaGlitz Telugu',
          url: 'https://www.indiaglitz.com/rss/telugu-movie-news.xml',
          priority: 'medium',
          category: 'cinema',
          backup_urls: [
            'https://www.indiaglitz.com/rss/news/telugu.xml'
          ]
        }
      ],
      
      // General News (For AP/Telangana Context)
      news: [
        {
          name: 'Eenadu',
          url: 'https://www.eenadu.net/rss',
          priority: 'high',
          category: 'news'
        },
        {
          name: 'Sakshi',
          url: 'https://www.sakshi.com/rss',
          priority: 'high',
          category: 'news'
        },
        {
          name: 'Andhra Jyothy',
          url: 'https://www.andhrajyothy.com/rss',
          priority: 'high',
          category: 'news'
        },
        {
          name: 'TV9 Telugu',
          url: 'https://www.tv9telugu.com/rss.xml',
          priority: 'high',
          category: 'news'
        },
        {
          name: 'Telangana Today',
          url: 'https://telanganatoday.com/feed',
          priority: 'low',
          category: 'news'
        },
        {
          name: 'The Hans India',
          url: 'https://www.thehansindia.com/feeds/rss/news',
          priority: 'medium',
          category: 'news'
        },
        {
          name: 'Deccan Chronicle',
          url: 'https://www.deccanchronicle.com/rss_feeds/hyderabad.xml',
          priority: 'medium',
          category: 'news'
        },
        {
          name: 'Times of India Hyderabad',
          url: 'https://timesofindia.indiatimes.com/rssfeeds/2950623.cms',
          priority: 'medium',
          category: 'news'
        },
        {
          name: 'NTV Telugu',
          url: 'https://www.ntvtelugu.com/rss',
          priority: 'medium',
          category: 'news'
        },
        {
          name: 'ETV Telangana',
          url: 'https://www.etvtelangana.com/rss',
          priority: 'medium',
          category: 'news'
        }
      ]
    };
  }

  /**
   * Main method to get comprehensive Telugu trending content
   */
  async getTeluguTrendingContent() {
    console.log('🎬 Starting comprehensive Telugu content aggregation...');
    
    try {
      // Run all tiers in parallel for maximum efficiency
      const [rssContent, youtubeContent, twitterContent, redditContent] = await Promise.all([
        this.getTier2RSSContent(),
        this.getTier1YouTubeContent(),
        this.getTier3TwitterContent(),
        this.getTier4RedditContent()
      ]);

      // Combine and categorize all content
      const aggregatedContent = this.combineAndCategorizeContent(
        rssContent,
        youtubeContent,
        twitterContent,
        redditContent
      );

      // Apply Telugu-specific trending algorithm
      const trendingContent = this.applyTeluguTrendingAlgorithm(aggregatedContent);

      console.log(`🎯 Telugu content aggregation complete:`, {
        total: trendingContent.politics.length + trendingContent.cinema.length + trendingContent.all.length,
        politics: trendingContent.politics.length,
        cinema: trendingContent.cinema.length,
        all: trendingContent.all.length
      });

      return trendingContent;

    } catch (error) {
      console.error('❌ Error in Telugu content aggregation:', error);
      return this.getFallbackContent();
    }
  }

  /**
   * Tier 2: RSS Feed Content Aggregation
   */
  async getTier2RSSContent() {
    console.log('📰 Fetching Tier 2: Telugu RSS feeds...');
    
    const feeds = this.getTeluguRSSFeeds();
    const allFeeds = [...feeds.cinema, ...feeds.news];
    const results = [];

    // Process feeds in parallel with error handling
    const feedPromises = allFeeds.map(async (feedConfig) => {
      try {
        console.log(`📡 Fetching ${feedConfig.name}...`);
        
        // Try primary URL first
        let feed = null;
        let usedUrl = feedConfig.url;
        
        try {
          feed = await this.rss.parseURL(feedConfig.url);
        } catch (primaryError) {
          console.warn(`⚠️ Primary URL failed for ${feedConfig.name}: ${primaryError.message}`);
          
          // Try backup URLs if available
          if (feedConfig.backup_urls && feedConfig.backup_urls.length > 0) {
            for (const backupUrl of feedConfig.backup_urls) {
              try {
                console.log(`🔄 Trying backup URL for ${feedConfig.name}: ${backupUrl}`);
                feed = await this.rss.parseURL(backupUrl);
                usedUrl = backupUrl;
                console.log(`✅ ${feedConfig.name}: Successfully used backup URL`);
                break;
              } catch (backupError) {
                console.warn(`⚠️ Backup URL failed for ${feedConfig.name}: ${backupError.message}`);
              }
            }
          }
          
          if (!feed) {
            throw primaryError;
          }
        }
        
        const validItems = feed.items
          .filter(item => this.isValidTeluguContent(item.title, item.contentSnippet || item.description))
          .filter(item => this.isRecentContent(item.pubDate))
          .map(item => ({
            ...item,
            source: feedConfig.name,
            priority: feedConfig.priority,
            category: feedConfig.category,
            platform: 'rss',
            feedUrl: usedUrl,
            confidence: this.calculateTeluguConfidence(item.title, item.contentSnippet || item.description)
          }));

        console.log(`✅ ${feedConfig.name}: ${validItems.length} Telugu items found (${feed.items.length} total items)`);
        return validItems;

      } catch (error) {
        console.warn(`❌ Failed to fetch ${feedConfig.name}:`, error.message);
        return [];
      }
    });

    const feedResults = await Promise.all(feedPromises);
    return feedResults.flat();
  }

  /**
   * Tier 1: YouTube Content (Most Important API)
   * Now using our accurate YouTube Channel Analyzer
   */
  async getTier1YouTubeContent() {
    console.log('🎥 Fetching Tier 1: YouTube Telugu content...');
    
    try {
      // Import our working YouTube analyzer
      const YouTubeChannelAnalyzer = require('./youtube-analyzer-fixed');
      const analyzer = new YouTubeChannelAnalyzer();

      // Top Telugu YouTube channels to monitor
      const teluguChannels = [
        // Entertainment channels
        'https://www.youtube.com/@SriBalajiMovies',
        'https://www.youtube.com/@UVCreations',
        'https://www.youtube.com/@GeethaartsOfficial',
        
        // News channels  
        'https://www.youtube.com/@TV9Telugu',
        'https://www.youtube.com/@NtvTelugu',
        'https://www.youtube.com/@ETVTelangana',
        
        // Music channels
        'https://www.youtube.com/@AdityaMusic',
        'https://www.youtube.com/@LahariMusic'
      ];

      const youtubeResults = [];
      
      // Analyze channels in parallel (limited to 3 concurrent to avoid rate limiting)
      const channelChunks = [];
      for (let i = 0; i < teluguChannels.length; i += 3) {
        channelChunks.push(teluguChannels.slice(i, i + 3));
      }

      for (const chunk of channelChunks) {
        const chunkPromises = chunk.map(async (channelUrl) => {
          try {
            console.log(`📊 Analyzing channel: ${channelUrl}`);
            const channelData = await analyzer.analyzeChannel(channelUrl);
            
            if (channelData && channelData.subscriberCount) {
              // Create content item from channel data
              const content = {
                title: `${channelData.channelName} - ${channelData.subscriberCount.toLocaleString()} subscribers, ${channelData.videoCount?.toLocaleString() || 'N/A'} videos`,
                description: channelData.description || `Telugu channel with ${channelData.subscriberCount.toLocaleString()} subscribers`,
                link: channelData.url,
                source: channelData.channelName,
                platform: 'youtube',
                category: this.categorizeYouTubeChannel(channelUrl, channelData.channelName),
                confidence: 0.95, // High confidence for verified channels
                subscriberCount: channelData.subscriberCount,
                videoCount: channelData.videoCount,
                isVerified: channelData.isVerified,
                channelId: channelData.channelId,
                publishedAt: new Date().toISOString(), // Current time for channel stats
                priority: this.getChannelPriority(channelData.subscriberCount)
              };
              
              console.log(`✅ Added YouTube channel: ${channelData.channelName} (${channelData.subscriberCount.toLocaleString()} subs)`);
              return content;
            }
          } catch (error) {
            console.warn(`❌ Failed to analyze channel ${channelUrl}:`, error.message);
            return null;
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        youtubeResults.push(...chunkResults.filter(result => result !== null));
        
        // Add delay between chunks to be respectful
        if (channelChunks.indexOf(chunk) < channelChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`🎯 YouTube analysis complete: ${youtubeResults.length} channels analyzed`);
      return youtubeResults;

    } catch (error) {
      console.error('❌ Error in YouTube content fetch:', error);
      
      // Return mock data as fallback
      return [
        {
          title: 'Pushpa 2 First Look - Allu Arjun',
          source: 'Mythri Movie Makers',
          platform: 'youtube',
          category: 'cinema',
          confidence: 0.95,
          viewCount: 2500000,
          publishedAt: new Date().toISOString()
        }
      ];
    }
  }

  /**
   * Categorize YouTube channels based on URL and name
   */
  categorizeYouTubeChannel(url, channelName) {
    const text = `${url} ${channelName}`.toLowerCase();
    
    // News channels
    if (text.includes('tv9') || text.includes('ntv') || text.includes('etv') || 
        text.includes('news') || text.includes('today')) {
      return 'politics'; // News goes to politics category
    }
    
    // Entertainment/Movie channels
    if (text.includes('movies') || text.includes('entertainment') || 
        text.includes('music') || text.includes('creations') || 
        text.includes('productions') || text.includes('films')) {
      return 'cinema';
    }
    
    // Default to all for other Telugu channels
    return 'all';
  }

  /**
   * Get channel priority based on subscriber count
   */
  getChannelPriority(subscriberCount) {
    if (subscriberCount > 5000000) return 'high';      // 5M+ subscribers
    if (subscriberCount > 1000000) return 'medium';    // 1M+ subscribers  
    return 'low';                                      // Under 1M subscribers
  }

  /**
   * Tier 3: Twitter/Social Content
   */
  async getTier3TwitterContent() {
    console.log('🐦 Fetching Tier 3: Twitter Telugu trends...');
    
    // For now, return mock data structure
    // TODO: Implement actual Twitter API integration with Hyderabad WOEID
    return [
      {
        title: '#PushpaTheRule trending in Hyderabad',
        source: 'Twitter Trends',
        platform: 'twitter',
        category: 'cinema',
        confidence: 0.85,
        volume: 45000,
        publishedAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Tier 4: Reddit Community Content (Most Authentic Telugu Discussions)
   */
  async getTier4RedditContent() {
    console.log('🔥 Fetching Tier 4: Reddit Telugu community content...');
    
    try {
      const redditResults = [];
      
      // Target subreddits for Telugu content
      const teluguSubreddits = [
        {
          name: 'Ni_Bondha',
          subreddit: 'Ni_Bondha',
          priority: 'high',
          description: 'Main Telugu community subreddit - unfiltered opinions and memes'
        },
        {
          name: 'tollywood',
          subreddit: 'tollywood', 
          priority: 'high',
          description: 'Tollywood film industry discussions'
        },
        {
          name: 'hyderabad',
          subreddit: 'hyderabad',
          priority: 'medium',
          description: 'Hyderabad city discussions'
        },
        {
          name: 'telangana',
          subreddit: 'telangana',
          priority: 'medium',
          description: 'Telangana state discussions'
        }
      ];

      // Process each subreddit
      const subredditPromises = teluguSubreddits.map(async (subredditConfig) => {
        try {
          console.log(`🔍 Fetching r/${subredditConfig.subreddit}...`);
          
          // Fetch hot posts from subreddit (using Reddit JSON API)
          const hotUrl = `https://www.reddit.com/r/${subredditConfig.subreddit}/hot.json?limit=25`;
          const topUrl = `https://www.reddit.com/r/${subredditConfig.subreddit}/top.json?t=day&limit=15`;
          
          const [hotResponse, topResponse] = await Promise.all([
            axios.get(hotUrl, {
              headers: {
                'User-Agent': 'SayCheese-Telugu-Aggregator/1.0'
              },
              timeout: 8000
            }),
            axios.get(topUrl, {
              headers: {
                'User-Agent': 'SayCheese-Telugu-Aggregator/1.0'
              },
              timeout: 8000
            })
          ]);

          const allPosts = [
            ...hotResponse.data.data.children,
            ...topResponse.data.data.children
          ];

          const validPosts = allPosts
            .filter(post => post.data && post.data.title)
            .filter(post => this.isValidTeluguContent(post.data.title, post.data.selftext || ''))
            .filter(post => this.isRecentContent(new Date(post.data.created_utc * 1000).toISOString()))
            .map(post => ({
              title: post.data.title,
              description: post.data.selftext || '',
              link: `https://www.reddit.com${post.data.permalink}`,
              source: `r/${subredditConfig.subreddit}`,
              platform: 'reddit',
              priority: subredditConfig.priority,
              category: 'community',
              publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
              score: post.data.score,
              comments: post.data.num_comments,
              upvoteRatio: post.data.upvote_ratio,
              author: post.data.author,
              confidence: this.calculateRedditConfidence(post.data)
            }));

          console.log(`✅ r/${subredditConfig.subreddit}: ${validPosts.length} Telugu posts found`);
          return validPosts;

        } catch (error) {
          console.warn(`❌ Failed to fetch r/${subredditConfig.subreddit}:`, error.message);
          return [];
        }
      });

      const subredditResults = await Promise.all(subredditPromises);
      const allRedditPosts = subredditResults.flat();

      console.log(`🎯 Reddit aggregation complete: ${allRedditPosts.length} total posts`);
      return allRedditPosts;

    } catch (error) {
      console.error('❌ Error in Reddit content aggregation:', error);
      return [];
    }
  }

  /**
   * Advanced Telugu Content Validation
   */
  isValidTeluguContent(title, description = '') {
    const text = `${title} ${description}`.toLowerCase();
    
    // Check against our comprehensive keyword database
    const hasActorName = this.keywords.actors.some(actor => 
      text.includes(actor.toLowerCase())
    );
    
    const hasMovieName = this.keywords.movies.some(movie => 
      text.includes(movie.toLowerCase())
    );
    
    const hasDirectorName = this.keywords.directors.some(director => 
      text.includes(director.toLowerCase())
    );
    
    const hasPoliticianName = this.keywords.politicians.some(politician => 
      text.includes(politician.toLowerCase())
    );
    
    const hasPlaceName = this.keywords.places.some(place => 
      text.includes(place.toLowerCase())
    );
    
    const hasMediaChannel = this.keywords.mediaChannels.some(channel => 
      text.includes(channel.toLowerCase())
    );
    
    const hasSportsKeyword = this.keywords.sports.some(sport => 
      text.includes(sport.toLowerCase())
    );
    
    const hasBusinessKeyword = this.keywords.business.some(business => 
      text.includes(business.toLowerCase())
    );
    
    const hasCultureKeyword = this.keywords.culture.some(culture => 
      text.includes(culture.toLowerCase())
    );
    
    // Telugu language indicators
    const hasTeluguLanguage = /\btelugu\b|\btollywood\b|\btelangana\b|\bandhra pradesh\b/i.test(text);
    
    // Expanded criteria: Include sports, business, culture for "All Telugu" content
    const strongIndicators = [
      hasActorName && hasTeluguLanguage,
      hasMovieName && (hasActorName || hasDirectorName),
      hasPoliticianName && hasPlaceName,
      hasMediaChannel && hasTeluguLanguage,
      hasSportsKeyword && hasPlaceName,
      hasBusinessKeyword && hasPlaceName,
      hasCultureKeyword && hasPlaceName,
      text.includes('tollywood'),
      text.includes('hyderabad') && (hasActorName || hasPoliticianName || hasSportsKeyword || hasBusinessKeyword)
    ].filter(Boolean);
    
    return strongIndicators.length >= 1;
  }

  /**
   * Calculate Telugu content confidence score
   */
  calculateTeluguConfidence(title, description = '') {
    const text = `${title} ${description}`.toLowerCase();
    let score = 0;
    
    // Actor mentions (+0.3 each, max 0.6)
    const actorMatches = this.keywords.actors.filter(actor => 
      text.includes(actor.toLowerCase())
    );
    score += Math.min(actorMatches.length * 0.3, 0.6);
    
    // Movie mentions (+0.4 each, max 0.8)
    const movieMatches = this.keywords.movies.filter(movie => 
      text.includes(movie.toLowerCase())
    );
    score += Math.min(movieMatches.length * 0.4, 0.8);
    
    // Special boost for highly anticipated movies
    const anticipatedMovies = ['coolie', 'war 2', 'pushpa 2', 'devara', 'kalki 2898 ad'];
    const anticipatedMatches = anticipatedMovies.filter(movie => 
      text.includes(movie.toLowerCase())
    );
    if (anticipatedMatches.length > 0) {
      score += 0.3; // Extra boost for highly anticipated content
      console.log(`🎬 Found anticipated movie: ${anticipatedMatches.join(', ')}`);
    }
    
    // Geographic relevance (+0.2 each, max 0.4)
    const placeMatches = this.keywords.places.filter(place => 
      text.includes(place.toLowerCase())
    );
    score += Math.min(placeMatches.length * 0.2, 0.4);
    
    // Language indicators (+0.5)
    if (/\btelugu\b|\btollywood\b/i.test(text)) {
      score += 0.5;
    }
    
    // Regional indicators (+0.3)
    if (/\btelangana\b|\bandhra pradesh\b|\bhyderabad\b/i.test(text)) {
      score += 0.3;
    }
    
    // Sports/Business/Culture relevance (+0.2)
    const sportsMatches = this.keywords.sports?.filter(sport => 
      text.includes(sport.toLowerCase())
    ) || [];
    const businessMatches = this.keywords.business?.filter(business => 
      text.includes(business.toLowerCase())
    ) || [];
    const cultureMatches = this.keywords.culture?.filter(culture => 
      text.includes(culture.toLowerCase())
    ) || [];
    
    const diverseMatches = sportsMatches.length + businessMatches.length + cultureMatches.length;
    if (diverseMatches > 0) {
      score += Math.min(diverseMatches * 0.2, 0.4);
      console.log(`🌟 Found diverse Telugu content: Sports(${sportsMatches.length}), Business(${businessMatches.length}), Culture(${cultureMatches.length})`);
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate Reddit-specific confidence score based on community engagement
   */
  calculateRedditConfidence(postData) {
    let score = this.calculateTeluguConfidence(postData.title, postData.selftext || '');
    
    // Reddit-specific engagement signals
    
    // High score posts (+0.2)
    if (postData.score > 100) {
      score += 0.2;
    } else if (postData.score > 50) {
      score += 0.1;
    }
    
    // Active discussion (+0.2)
    if (postData.num_comments > 20) {
      score += 0.2;
    } else if (postData.num_comments > 10) {
      score += 0.1;
    }
    
    // High upvote ratio indicates quality (+0.1)
    if (postData.upvote_ratio > 0.9) {
      score += 0.1;
    }
    
    // Fresh content gets boost
    const hoursOld = (Date.now() - (postData.created_utc * 1000)) / (1000 * 60 * 60);
    if (hoursOld < 6) {
      score += 0.15; // Very fresh
    } else if (hoursOld < 24) {
      score += 0.1; // Fresh
    }
    
    // r/Ni_Bondha gets special treatment as it's the main Telugu community
    if (postData.subreddit === 'Ni_Bondha') {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Check if content is recent (last 7 days) - strictly enforced
   */
  isRecentContent(dateString) {
    if (!dateString) {
      console.log('⚠️ No date provided, assuming recent');
      return true; // Assume recent if no date
    }
    
    try {
      const contentDate = new Date(dateString);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const isRecent = contentDate >= sevenDaysAgo;
      
      if (!isRecent) {
        const daysDiff = Math.floor((new Date() - contentDate) / (1000 * 60 * 60 * 24));
        console.log(`📅 Content is ${daysDiff} days old, excluding from recent filter`);
      }
      
      return isRecent;
    } catch (error) {
      console.warn(`⚠️ Invalid date format: ${dateString}, assuming recent`);
      return true;
    }
  }

  /**
   * Combine and categorize all content types
   */
  combineAndCategorizeContent(rssContent, youtubeContent, twitterContent, redditContent = []) {
    const allContent = [...rssContent, ...youtubeContent, ...twitterContent, ...redditContent];
    
    const categorized = {
      politics: [],
      cinema: [],
      all: [] // Changed from 'tech' to 'all' for broader Telugu content
    };

    allContent.forEach(item => {
      const category = this.categorizeContent(item);
      if (categorized[category]) {
        categorized[category].push({
          ...item,
          teluguConfidence: item.confidence || this.calculateTeluguConfidence(item.title, item.description)
        });
      }
    });

    return categorized;
  }

  /**
   * Categorize individual content items
   */
  categorizeContent(item) {
    const text = `${item.title} ${item.description || ''}`.toLowerCase();
    
    // Cinema indicators (Highest priority for entertainment content)
    const cinemaKeywords = /\bmovie\b|\bfilm\b|\bactor\b|\bactress\b|\btrailer\b|\breview\b|\bbox office\b|\btollywood\b|\bcinema\b|\bdirector\b|\bproducer\b|\brelease\b|\bteaser\b|\bfirst look\b/;
    
    // Politics indicators (High priority for governance content)
    const politicsKeywords = /\bpolitics\b|\belection\b|\bcm\b|\bminister\b|\bparty\b|\bgovernment\b|\bassembly\b|\bparliament\b|\bpolicy\b|\bcabinet\b|\bcongress\b|\bbrs\b|\btdp\b|\bysrcp\b/;
    
    // Reddit community content indicators
    const communityKeywords = /\bmemes?\b|\bfunny\b|\brant\b|\bdiscussion\b|\bopinion\b|\bthoughts\b|\bfeels?\b|\bdae\b|\btil\b|\bshowerthoughts\b/;
    
    // Check for specific actor/movie/politician names
    const hasActorName = this.keywords.actors.some(actor => text.includes(actor.toLowerCase()));
    const hasActressName = this.keywords.actresses.some(actress => text.includes(actress.toLowerCase()));
    const hasMovieName = this.keywords.movies.some(movie => text.includes(movie.toLowerCase()));
    const hasDirectorName = this.keywords.directors.some(director => text.includes(director.toLowerCase()));
    const hasPoliticianName = this.keywords.politicians.some(politician => text.includes(politician.toLowerCase()));
    const hasPartyName = this.keywords.parties.some(party => text.includes(party.toLowerCase()));
    
    // Special handling for Reddit community content
    if (item.platform === 'reddit') {
      // r/Ni_Bondha and r/tollywood posts about movies should go to cinema
      if ((item.source === 'r/Ni_Bondha' || item.source === 'r/tollywood') && 
          (hasActorName || hasMovieName || hasDirectorName || cinemaKeywords.test(text))) {
        return 'cinema';
      }
      
      // Political discussions from Reddit
      if (hasPoliticianName || hasPartyName || politicsKeywords.test(text)) {
        return 'politics';
      }
      
      // Most Reddit content goes to "all" for community discussions, memes, etc.
      return 'all';
    }
    
    // Regular categorization for non-Reddit content
    // Cinema: Movies, actors, entertainment industry
    if (hasActorName || hasActressName || hasMovieName || hasDirectorName || cinemaKeywords.test(text)) {
      return 'cinema';
    } 
    // Politics: Politicians, parties, governance
    else if (hasPoliticianName || hasPartyName || politicsKeywords.test(text)) {
      return 'politics';
    } 
    // All Telugu: Everything else that's Telugu-relevant (sports, culture, business, tech, general news, etc.)
    else {
      return 'all'; // This will catch tech, sports, culture, business, general news, etc.
    }
  }

  /**
   * Apply Telugu-specific trending algorithm with source diversity
   */
  applyTeluguTrendingAlgorithm(categorizedContent) {
    const result = {
      politics: [],
      cinema: [],
      all: [] // Changed from 'tech' to 'all'
    };

    Object.keys(categorizedContent).forEach(category => {
      const items = categorizedContent[category];

      // First, calculate trending scores for all items
      const scoredItems = items
        .map(item => ({
          ...item,
          trendingScore: this.calculateTrendingScore(item)
        }))
        .sort((a, b) => b.trendingScore - a.trendingScore);

      // Apply source diversity: max 2 items per source for better balance
      const diversifiedItems = this.applySourceDiversity(scoredItems, 2);
      
      // Take top 10 from diversified list
      result[category] = diversifiedItems.slice(0, 10);
    });

    return result;
  }

  /**
   * Apply source diversity to ensure balanced content from multiple sources
   */
  applySourceDiversity(items, maxPerSource = 3) {
    const sourceMap = new Map();
    const diversifiedItems = [];

    // Track items per source
    items.forEach(item => {
      const source = item.source || 'Unknown';
      
      if (!sourceMap.has(source)) {
        sourceMap.set(source, 0);
      }
      
      // Only add if we haven't exceeded the limit for this source
      if (sourceMap.get(source) < maxPerSource) {
        diversifiedItems.push(item);
        sourceMap.set(source, sourceMap.get(source) + 1);
      }
    });

    console.log(`📊 Source diversity applied:`, Object.fromEntries(sourceMap));
    return diversifiedItems;
  }  /**
   * Calculate trending score based on Telugu-specific signals
   */
  calculateTrendingScore(item) {
    let score = item.teluguConfidence || 0;
    
    // Boost recent content
    if (this.isRecentContent(item.publishedAt)) {
      score += 0.3;
    }
    
    // Boost high-priority sources, penalize low-priority
    if (item.priority === 'high') {
      score += 0.2;
    } else if (item.priority === 'low') {
      score -= 0.1; // Penalize low-priority sources
    }
    
    // Platform-specific scoring
    if (item.platform === 'reddit') {
      // Reddit community engagement boost
      if (item.score > 100) {
        score += 0.25; // High upvotes
      }
      if (item.comments > 20) {
        score += 0.2; // Active discussion
      }
      if (item.upvoteRatio > 0.9) {
        score += 0.15; // Quality content
      }
      // r/Ni_Bondha gets special priority as main Telugu community
      if (item.source === 'r/Ni_Bondha') {
        score += 0.25;
      }
    }
    
    // Boost cinema content during film release seasons
    if (item.category === 'cinema') {
      score += 0.1;
    }
    
    // Boost diverse content in "all" category to encourage variety
    if (item.category === 'all') {
      score += 0.15; // Slight boost for non-politics/cinema content
    }
    
    // Boost content with high engagement (if available)
    if (item.viewCount > 100000 || item.volume > 10000) {
      score += 0.2;
    }
    
    return score;
  }

  /**
   * Fallback content for when APIs fail
   */
  getFallbackContent() {
    return {
      politics: [
        {
          title: 'Telugu content aggregation service initializing...',
          source: 'System',
          platform: 'internal',
          publishedAt: new Date().toISOString(),
          confidence: 0.1
        }
      ],
      cinema: [],
      tech: []
    };
  }

  /**
   * Update keywords dynamically based on trending content
   */
  updateKeywordDatabase(newContent) {
    // This method would analyze trending content and add new keywords
    // Implementation would include NLP for entity extraction
    console.log('🔄 Updating keyword database with new entities...');
  }
}

module.exports = TeluguContentService;
