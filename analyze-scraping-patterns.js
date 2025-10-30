const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const cheerio = require('cheerio');

class ScrapingAnalyzer {
    constructor() {
        this.db = new sqlite3.Database('./youtube-data.db');
    }

    async analyzeScrapingPatterns() {
        console.log('🔍 ANALYZING SCRAPING SUCCESS PATTERNS');
        console.log('=====================================\n');

        return new Promise((resolve, reject) => {
            // Get working channels (with data)
            this.db.all(`
                SELECT channel_name, channel_url, subscriber_count, category, language, last_scraped_at
                FROM youtube_channels 
                WHERE subscriber_count > 0 
                ORDER BY subscriber_count DESC
                LIMIT 5
            `, async (err, workingChannels) => {
                if (err) {
                    reject(err);
                    return;
                }

                console.log('✅ WORKING CHANNELS (Sample):');
                workingChannels.forEach((ch, i) => {
                    const subs = (ch.subscriber_count / 1000000).toFixed(1);
                    console.log(`  ${i + 1}. ${ch.channel_name}: ${subs}M subs [${ch.category}/${ch.language}]`);
                    console.log(`     URL: ${ch.channel_url}`);
                });

                // Get non-working channels
                this.db.all(`
                    SELECT channel_name, channel_url, category, language, error_count, scrape_status
                    FROM youtube_channels 
                    WHERE subscriber_count IS NULL OR subscriber_count = 0
                    LIMIT 10
                `, async (err, failedChannels) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    console.log('\n❌ NON-WORKING CHANNELS (Sample):');
                    failedChannels.forEach((ch, i) => {
                        console.log(`  ${i + 1}. ${ch.channel_name} [${ch.category}/${ch.language}] (errors: ${ch.error_count || 0})`);
                        console.log(`     URL: ${ch.channel_url}`);
                        console.log(`     Status: ${ch.scrape_status || 'not_scraped'}`);
                    });

                    // Analyze URL patterns
                    console.log('\n🔍 URL PATTERN ANALYSIS:');
                    console.log('Working URLs:');
                    workingChannels.forEach(ch => {
                        console.log(`  ✅ ${this.analyzeUrlPattern(ch.channel_url)}`);
                    });

                    console.log('Failed URLs (first 5):');
                    failedChannels.slice(0, 5).forEach(ch => {
                        console.log(`  ❌ ${this.analyzeUrlPattern(ch.channel_url)}`);
                    });

                    // Test direct access to a few failed channels
                    console.log('\n🧪 TESTING FAILED CHANNELS:');
                    await this.testChannelAccess(failedChannels.slice(0, 3));

                    resolve();
                });
            });
        });
    }

    analyzeUrlPattern(url) {
        const match = url.match(/youtube\.com\/@([^\/]+)/);
        if (match) {
            return `@${match[1]} (handle format)`;
        }
        return `${url} (unknown format)`;
    }

    async testChannelAccess(channels) {
        for (const channel of channels) {
            try {
                console.log(`\n🔍 Testing: ${channel.channel_name}`);
                console.log(`   URL: ${channel.channel_url}`);
                
                const response = await axios.get(channel.channel_url, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                console.log(`   ✅ Status: ${response.status}`);
                console.log(`   📏 Content length: ${response.data.length} chars`);

                // Check for subscriber count patterns
                const $ = cheerio.load(response.data);
                const text = $.text();
                
                const subPatterns = [
                    /(\d+\.?\d*[KMB]?)\s*subscribers?/i,
                    /(\d+\.?\d*[KMB]?)\s*subscriber/i,
                    /"subscriberCountText"[^:]*:\s*"([^"]*)/i,
                    /"simpleText"\s*:\s*"([^"]*subscriber[^"]*)/i
                ];

                let foundPattern = false;
                for (let i = 0; i < subPatterns.length; i++) {
                    const match = text.match(subPatterns[i]);
                    if (match) {
                        console.log(`   🎯 Found subscriber pattern ${i + 1}: "${match[1] || match[0]}"`);
                        foundPattern = true;
                        break;
                    }
                }

                if (!foundPattern) {
                    console.log('   ❌ No subscriber count patterns found');
                    // Check if it's a valid YouTube channel page
                    if (text.includes('This channel doesn\'t exist') || text.includes('channel was terminated')) {
                        console.log('   💀 Channel appears to be terminated/deleted');
                    } else if (text.includes('YouTube')) {
                        console.log('   ⚠️  Valid YouTube page but no subscriber data visible');
                    } else {
                        console.log('   🚫 Not recognized as YouTube page');
                    }
                }

            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                if (error.response) {
                    console.log(`   📊 Status: ${error.response.status}`);
                }
            }
        }
    }

    async close() {
        this.db.close();
    }
}

// Run the analysis
async function runAnalysis() {
    const analyzer = new ScrapingAnalyzer();
    try {
        await analyzer.analyzeScrapingPatterns();
        await analyzer.close();
        console.log('\n🏁 Analysis complete!');
    } catch (error) {
        console.error('❌ Analysis failed:', error);
        await analyzer.close();
    }
}

runAnalysis();
