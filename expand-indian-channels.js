const YouTubeChannelAnalyzer = require('./youtube-analyzer-fixed');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * 🇮🇳 COMPREHENSIVE INDIAN YOUTUBE CHANNELS EXPANSION
 * 
 * This script adds popular Indian channels across all major categories and languages
 * Categories: Bollywood, Music, Tech, Comedy, Food, Education, Gaming, Kids, News, Regional
 * Languages: Hindi, Telugu, Tamil, Malayalam, Kannada, Bengali, Marathi, Gujarati, Punjabi
 */

class IndianChannelExpansion {
  constructor() {
    this.analyzer = new YouTubeChannelAnalyzer();
    this.dbPath = path.join(__dirname, 'data', 'youtube_channels.db');
    this.db = null;
    
    // 🎬 MASSIVE INDIAN CHANNELS DATABASE
    this.indianChannels = {
      // 🎵 MUSIC & BOLLYWOOD (Hindi)
      bollywood_music: [
        { name: 'T-Series', handle: '@TSeries', category: 'music', language: 'hindi', priority: 'ultra_high' },
        { name: 'Zee Music Company', handle: '@ZeeMusicCompany', category: 'music', language: 'hindi', priority: 'ultra_high' },
        { name: 'Sony Music India', handle: '@SonyMusicIndia', category: 'music', language: 'hindi', priority: 'ultra_high' },
        { name: 'Tips Official', handle: '@TipsOfficial', category: 'music', language: 'hindi', priority: 'high' },
        { name: 'Saregama Music', handle: '@saregamamusic', category: 'music', language: 'hindi', priority: 'high' },
        { name: 'Venus Worldwide Entertainment', handle: '@VenusWorldwideEntertainment', category: 'music', language: 'hindi', priority: 'high' },
        { name: 'Ultra Bollywood', handle: '@UltraBollywood', category: 'music', language: 'hindi', priority: 'medium' },
        { name: 'Shemaroo Entertainment', handle: '@ShemarooEnt', category: 'cinema', language: 'hindi', priority: 'high' },
        { name: 'Rajshri', handle: '@rajshri', category: 'cinema', language: 'hindi', priority: 'high' },
        { name: 'SET India', handle: '@SETIndia', category: 'entertainment', language: 'hindi', priority: 'ultra_high' },
        { name: 'Goldmines', handle: '@Goldmines', category: 'cinema', language: 'hindi', priority: 'high' },
        { name: 'Yash Raj Films', handle: '@YashRajFilms', category: 'cinema', language: 'hindi', priority: 'high' }
      ],

      // 🎭 SOUTH INDIAN ENTERTAINMENT
      south_entertainment: [
        // Telugu (already have some, adding more)
        { name: 'Mango Music Telugu', handle: '@MangoMusicTelugu', category: 'music', language: 'telugu', priority: 'high' },
        { name: 'Aditya Movies', handle: '@AdityaMovies', category: 'cinema', language: 'telugu', priority: 'high' },
        { name: 'Volga Video', handle: '@VolgaVideo', category: 'cinema', language: 'telugu', priority: 'medium' },
        { name: 'Shreyas Media', handle: '@ShreyasMedia', category: 'cinema', language: 'telugu', priority: 'medium' },
        // Tamil
        { name: 'Sony Music South', handle: '@SonyMusicSouth', category: 'music', language: 'tamil', priority: 'ultra_high' },
        { name: 'Think Music India', handle: '@ThinkMusicIndia', category: 'music', language: 'tamil', priority: 'high' },
        { name: 'Saregama Tamil', handle: '@SaregamaTamil', category: 'music', language: 'tamil', priority: 'high' },
        { name: 'Eros Now Tamil', handle: '@ErosNowTamil', category: 'cinema', language: 'tamil', priority: 'high' },
        { name: 'Raj Television Network', handle: '@rajtv', category: 'entertainment', language: 'tamil', priority: 'medium' },
        // Malayalam
        { name: 'Manorama Online', handle: '@manoramaonline', category: 'news', language: 'malayalam', priority: 'high' },
        { name: 'Flowers TV', handle: '@FlowersTV', category: 'entertainment', language: 'malayalam', priority: 'medium' },
        { name: 'Goodwill Entertainments', handle: '@GoodwillEntertainments', category: 'cinema', language: 'malayalam', priority: 'medium' },
        // Kannada
        { name: 'Anand Audio', handle: '@AnandAudioOfficial', category: 'music', language: 'kannada', priority: 'medium' },
        { name: 'Zee Kannada', handle: '@ZeeKannada', category: 'entertainment', language: 'kannada', priority: 'medium' }
      ],

      // 📺 NEWS & POLITICS
      news_politics: [
        { name: 'Aaj Tak', handle: '@aajtak', category: 'news', language: 'hindi', priority: 'ultra_high' },
        { name: 'ABP News', handle: '@abpnewstv', category: 'news', language: 'hindi', priority: 'ultra_high' },
        { name: 'NDTV', handle: '@ndtv', category: 'news', language: 'english', priority: 'ultra_high' },
        { name: 'India Today', handle: '@indiatoday', category: 'news', language: 'hindi', priority: 'ultra_high' },
        { name: 'Zee News', handle: '@zeenews', category: 'news', language: 'hindi', priority: 'high' },
        { name: 'CNN-News18', handle: '@CNNnews18', category: 'news', language: 'english', priority: 'high' },
        { name: 'Times Now', handle: '@timesnow', category: 'news', language: 'english', priority: 'high' },
        { name: 'Republic Bharat', handle: '@RepublicBharat', category: 'news', language: 'hindi', priority: 'high' },
        { name: 'TV9 Bharatvarsh', handle: '@TV9Bharatvarsh', category: 'news', language: 'hindi', priority: 'medium' }
      ],

      // 💻 TECH & EDUCATION
      tech_education: [
        { name: 'Technical Guruji', handle: '@TechnicalGuruji', category: 'tech', language: 'hindi', priority: 'ultra_high' },
        { name: 'Unacademy', handle: '@unacademy', category: 'education', language: 'hindi', priority: 'ultra_high' },
        { name: 'Physics Wallah - Alakh Pandey', handle: '@PhysicsWallah', category: 'education', language: 'hindi', priority: 'ultra_high' },
        { name: 'Khan Academy India', handle: '@KhanAcademyIndia', category: 'education', language: 'hindi', priority: 'high' },
        { name: 'Geekyranjit', handle: '@geekyranjit', category: 'tech', language: 'english', priority: 'high' },
        { name: 'MySmartPrice', handle: '@mysmartprice', category: 'tech', language: 'hindi', priority: 'medium' },
        { name: 'Technical Sagar', handle: '@TechnicalSagar', category: 'tech', language: 'hindi', priority: 'medium' },
        { name: 'BYJUS', handle: '@byjus', category: 'education', language: 'english', priority: 'high' }
      ],

      // 😂 COMEDY & ENTERTAINMENT
      comedy_entertainment: [
        { name: 'The Viral Fever', handle: '@theviralfevertv', category: 'comedy', language: 'hindi', priority: 'ultra_high' },
        { name: 'AIB', handle: '@aib', category: 'comedy', language: 'english', priority: 'high' },
        { name: 'Ashish Chanchlani Vines', handle: '@AshishChanchlani', category: 'comedy', language: 'hindi', priority: 'ultra_high' },
        { name: 'CarryMinati', handle: '@CarryMinati', category: 'gaming', language: 'hindi', priority: 'ultra_high' },
        { name: 'BB Ki Vines', handle: '@BBKiVines', category: 'comedy', language: 'hindi', priority: 'ultra_high' },
        { name: 'Round2hell', handle: '@Round2hell', category: 'comedy', language: 'hindi', priority: 'high' },
        { name: 'Amit Bhadana', handle: '@AmitBhadana', category: 'comedy', language: 'hindi', priority: 'ultra_high' },
        { name: 'Triggered Insaan', handle: '@TriggeredInsaan', category: 'gaming', language: 'hindi', priority: 'high' },
        { name: 'MostlySane', handle: '@MostlySane', category: 'comedy', language: 'english', priority: 'high' }
      ],

      // 🎮 GAMING
      gaming: [
        { name: 'Total Gaming', handle: '@TotalGaming', category: 'gaming', language: 'hindi', priority: 'ultra_high' },
        { name: 'Techno Gamerz', handle: '@TechnoGamerzOfficial', category: 'gaming', language: 'hindi', priority: 'ultra_high' },
        { name: 'GamerFleet', handle: '@GamerFleet', category: 'gaming', language: 'hindi', priority: 'high' },
        { name: 'MortaL', handle: '@MortaLOfficial', category: 'gaming', language: 'hindi', priority: 'high' },
        { name: 'Dynamo Gaming', handle: '@DynamoGaming', category: 'gaming', language: 'hindi', priority: 'ultra_high' },
        { name: 'Live Insaan', handle: '@LiveInsaan', category: 'gaming', language: 'hindi', priority: 'high' }
      ],

      // 🍳 FOOD & LIFESTYLE
      food_lifestyle: [
        { name: 'Kabita Kitchen', handle: '@kabitaskitchen', category: 'food', language: 'hindi', priority: 'high' },
        { name: 'Nisha Madhulika', handle: '@nishamadhulika', category: 'food', language: 'hindi', priority: 'ultra_high' },
        { name: 'CookingShooking', handle: '@CookingShooking', category: 'food', language: 'hindi', priority: 'high' },
        { name: 'Village Cooking Channel', handle: '@VillageCookingChannel', category: 'food', language: 'tamil', priority: 'high' },
        { name: 'Grandpa Kitchen', handle: '@GrandpaKitchen', category: 'food', language: 'telugu', priority: 'medium' },
        { name: 'BeerBiceps', handle: '@BeerBiceps', category: 'lifestyle', language: 'english', priority: 'high' },
        { name: 'Fit Tuber', handle: '@FitTuber', category: 'health', language: 'hindi', priority: 'high' }
      ],

      // 👶 KIDS & FAMILY
      kids_family: [
        { name: 'ChuChu TV', handle: '@ChuChuTV', category: 'kids', language: 'english', priority: 'ultra_high' },
        { name: 'Wow Kidz', handle: '@WowKidzOfficial', category: 'kids', language: 'hindi', priority: 'high' },
        { name: 'Infobells', handle: '@infobells', category: 'kids', language: 'english', priority: 'high' },
        { name: 'Pinkfong India', handle: '@PinkfongIndia', category: 'kids', language: 'hindi', priority: 'medium' },
        { name: 'Super Simple Songs', handle: '@SuperSimpleSongs', category: 'kids', language: 'english', priority: 'high' }
      ],

      // 🎨 REGIONAL CONTENT
      regional_diverse: [
        // Bengali
        { name: 'Zee Bangla', handle: '@ZeeBangla', category: 'entertainment', language: 'bengali', priority: 'high' },
        { name: 'ABP Ananda', handle: '@abpananda', category: 'news', language: 'bengali', priority: 'medium' },
        // Marathi
        { name: 'Zee Marathi', handle: '@ZeeMarathi', category: 'entertainment', language: 'marathi', priority: 'high' },
        { name: 'Colors Marathi', handle: '@ColorsMarathi', category: 'entertainment', language: 'marathi', priority: 'medium' },
        // Gujarati
        { name: 'Colors Gujarati', handle: '@ColorsGujarati', category: 'entertainment', language: 'gujarati', priority: 'medium' },
        // Punjabi
        { name: 'PTC Punjabi', handle: '@PTCPunjabi', category: 'entertainment', language: 'punjabi', priority: 'medium' },
        { name: 'Speed Records', handle: '@SpeedRecords', category: 'music', language: 'punjabi', priority: 'high' }
      ],

      // 💼 BUSINESS & FINANCE
      business_finance: [
        { name: 'Zerodha', handle: '@zerodhaonline', category: 'finance', language: 'english', priority: 'high' },
        { name: 'ET Now', handle: '@etnow', category: 'business', language: 'english', priority: 'high' },
        { name: 'CNBC TV18', handle: '@cnbctv18', category: 'business', language: 'english', priority: 'high' },
        { name: 'Asset Yogi', handle: '@AssetYogi', category: 'finance', language: 'hindi', priority: 'medium' },
        { name: 'CA Rachana Phadke Ranade', handle: '@CARachanaPhadkeRanade', category: 'finance', language: 'hindi', priority: 'high' }
      ]
    };
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Database connection failed:', err.message);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  async insertChannel(channelData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR IGNORE INTO youtube_channels 
        (channel_id, channel_name, channel_url, category, priority, language, scrape_status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `;
      
      const channelUrl = `https://www.youtube.com/${channelData.handle}`;
      const values = [
        channelData.handle,
        channelData.name,
        channelUrl,
        channelData.category,
        channelData.priority,
        channelData.language
      ];

      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async expandChannels() {
    console.log('🇮🇳 EXPANDING INDIAN YOUTUBE CHANNELS DATABASE');
    console.log('=' .repeat(60));

    try {
      await this.initDatabase();

      let totalAdded = 0;
      let totalSkipped = 0;

      for (const [categoryName, channels] of Object.entries(this.indianChannels)) {
        console.log(`\n📂 Processing ${categoryName.replace('_', ' ').toUpperCase()}...`);
        
        for (const channel of channels) {
          try {
            await this.insertChannel(channel);
            console.log(`  ✅ Added: ${channel.name} (@${channel.handle.replace('@', '')})`);
            totalAdded++;
          } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
              console.log(`  ⏭️  Skipped: ${channel.name} (already exists)`);
              totalSkipped++;
            } else {
              console.log(`  ❌ Error adding ${channel.name}: ${error.message}`);
            }
          }
        }
      }

      console.log('\n' + '=' .repeat(60));
      console.log('📊 EXPANSION SUMMARY:');
      console.log(`✅ Channels Added: ${totalAdded}`);
      console.log(`⏭️  Channels Skipped: ${totalSkipped}`);
      console.log(`🎯 Total Channels in Database: ${totalAdded + totalSkipped + 8}`); // +8 for existing Telugu channels

      this.db.close();
      console.log('\n🚀 Database expansion completed!');
      
      return { added: totalAdded, skipped: totalSkipped };

    } catch (error) {
      console.error('❌ Expansion failed:', error.message);
      if (this.db) this.db.close();
      throw error;
    }
  }

  async scrapeRandomSample() {
    console.log('\n🎯 TESTING WITH RANDOM SAMPLE CHANNELS...');
    console.log('=' .repeat(50));

    // Pick 5 random channels from different categories for testing
    const sampleChannels = [
      'https://www.youtube.com/@TechnicalGuruji',  // Tech
      'https://www.youtube.com/@TSeries',          // Music (huge)
      'https://www.youtube.com/@aajtak',           // News
      'https://www.youtube.com/@ChuChuTV',         // Kids
      'https://www.youtube.com/@BBKiVines'         // Comedy
    ];

    for (const channelUrl of sampleChannels) {
      try {
        console.log(`\n🔍 Analyzing: ${channelUrl}`);
        const stats = await this.analyzer.getChannelStatsFromHTML(channelUrl);
        
        if (stats) {
          console.log(`  📺 ${stats.channelName}`);
          console.log(`  👥 ${this.analyzer.formatCount(stats.subscriberCount)} subscribers`);
          console.log(`  🎥 ${this.analyzer.formatCount(stats.videoCount)} videos`);
          console.log(`  👁️ ${this.analyzer.formatCount(stats.viewCount)} total views`);
          console.log(`  ✅ ${stats.isVerified ? 'Verified' : 'Not Verified'}`);
        } else {
          console.log(`  ❌ Could not extract data`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
  }

  async getChannelStats() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          language, 
          category, 
          COUNT(*) as count 
        FROM youtube_channels 
        GROUP BY language, category 
        ORDER BY language, count DESC
      `;
      
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async showDatabaseStats() {
    console.log('\n📊 DATABASE STATISTICS:');
    console.log('=' .repeat(40));

    try {
      await this.initDatabase();
      const stats = await this.getChannelStats();
      
      const languageGroups = {};
      stats.forEach(row => {
        if (!languageGroups[row.language]) {
          languageGroups[row.language] = [];
        }
        languageGroups[row.language].push(`${row.category}: ${row.count}`);
      });

      for (const [language, categories] of Object.entries(languageGroups)) {
        console.log(`\n🌐 ${language.toUpperCase()}:`);
        categories.forEach(cat => console.log(`  • ${cat}`));
      }

      this.db.close();
    } catch (error) {
      console.error('❌ Error getting stats:', error.message);
      if (this.db) this.db.close();
    }
  }
}

// Export for use in other modules
module.exports = IndianChannelExpansion;

// Run if called directly
if (require.main === module) {
  const expansion = new IndianChannelExpansion();
  
  async function runExpansion() {
    try {
      // 1. Expand the database
      await expansion.expandChannels();
      
      // 2. Show statistics
      await expansion.showDatabaseStats();
      
      // 3. Test with some samples
      await expansion.scrapeRandomSample();
      
      console.log('\n🎉 INDIAN CHANNELS EXPANSION COMPLETE!');
      console.log('💡 Use this for future users who want similar comprehensive coverage.');
      
    } catch (error) {
      console.error('❌ Expansion process failed:', error.message);
    }
  }
  
  runExpansion();
}
