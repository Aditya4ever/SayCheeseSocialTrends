const axios = require('axios');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();

class RobustYouTubeScraper {
    constructor() {
        this.db = new sqlite3.Database('./youtube-data.db');
        
        // Multiple user agents to rotate
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
        ];

        // Enhanced subscriber count patterns
        this.subscriberPatterns = [
            // Pattern 1: Direct subscriber text
            /(\d+\.?\d*[KMB]?)\s*subscribers?/i,
            // Pattern 2: JSON data patterns
            /"subscriberCountText"[^:]*:\s*[^"]*"([^"]*)/i,
            /"simpleText"\s*:\s*"([^"]*subscriber[^"]*)/i,
            // Pattern 3: Meta tags
            /"subscriptionCountText":"([^"]*)/i,
            // Pattern 4: Compact format
            /(\d+\.?\d*[KMB]?)\s*subscriber/i,
            // Pattern 5: Video count context
            /subscribers?\s*•\s*(\d+\.?\d*[KMB]?)/i,
            // Pattern 6: Alternative formats
            /subscribed\s*(\d+\.?\d*[KMB]?)/i
        ];

        // Video count patterns
        this.videoPatterns = [
            /(\d+\.?\d*[KMB]?)\s*videos?/i,
            /"videoCountText":"([^"]*)/i,
            /(\d+\.?\d*[KMB]?)\s*video/i
        ];
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    parseCount(countStr) {
        if (!countStr) return 0;
        
        // Remove any non-numeric characters except K, M, B, and decimal points
        const cleanStr = countStr.replace(/[^\d.KMB]/gi, '');
        
        // Extract number and multiplier
        const match = cleanStr.match(/^(\d+\.?\d*)([KMB])?$/i);
        if (!match) return 0;
        
        const number = parseFloat(match[1]);
        const multiplier = match[2] ? match[2].toUpperCase() : '';
        
        switch (multiplier) {
            case 'K': return Math.floor(number * 1000);
            case 'M': return Math.floor(number * 1000000);
            case 'B': return Math.floor(number * 1000000000);
            default: return Math.floor(number);
        }
    }

    async scrapeChannel(channelUrl, retryCount = 0) {
        const maxRetries = 3;
        
        try {
            console.log(`🔍 Scraping: ${channelUrl} (attempt ${retryCount + 1})`);
            
            const response = await axios.get(channelUrl, {
                timeout: 15000,
                headers: {
                    'User-Agent': this.getRandomUserAgent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive'
                }
            });

            const $ = cheerio.load(response.data);
            const fullText = response.data;
            
            let subscriberCount = 0;
            let videoCount = 0;
            let foundSubscriberPattern = null;
            let foundVideoPattern = null;

            // Try to extract subscriber count
            for (let i = 0; i < this.subscriberPatterns.length; i++) {
                const match = fullText.match(this.subscriberPatterns[i]);
                if (match) {
                    const rawCount = match[1];
                    subscriberCount = this.parseCount(rawCount);
                    if (subscriberCount > 0) {
                        foundSubscriberPattern = i + 1;
                        console.log(`   ✅ Subscriber pattern ${foundSubscriberPattern}: "${rawCount}" = ${subscriberCount.toLocaleString()}`);
                        break;
                    }
                }
            }

            // Try to extract video count
            for (let i = 0; i < this.videoPatterns.length; i++) {
                const match = fullText.match(this.videoPatterns[i]);
                if (match) {
                    const rawCount = match[1];
                    videoCount = this.parseCount(rawCount);
                    if (videoCount > 0) {
                        foundVideoPattern = i + 1;
                        console.log(`   ✅ Video pattern ${foundVideoPattern}: "${rawCount}" = ${videoCount.toLocaleString()}`);
                        break;
                    }
                }
            }

            // Extract channel name and verification status
            const channelName = $('meta[property="og:title"]').attr('content') || 
                              $('title').text().replace(' - YouTube', '') || 
                              'Unknown Channel';
            
            const isVerified = fullText.includes('verified') || fullText.includes('✓');
            
            // Extract description
            const description = $('meta[name="description"]').attr('content') || 
                              $('meta[property="og:description"]').attr('content') || '';

            return {
                success: true,
                subscriberCount,
                videoCount,
                channelName: channelName.trim(),
                isVerified,
                description: description.substring(0, 500), // Limit description length
                foundSubscriberPattern,
                foundVideoPattern,
                contentLength: response.data.length
            };

        } catch (error) {
            console.log(`   ❌ Error (attempt ${retryCount + 1}): ${error.message}`);
            
            if (retryCount < maxRetries && 
                (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || 
                 (error.response && error.response.status >= 500))) {
                
                console.log(`   🔄 Retrying in ${(retryCount + 1) * 2} seconds...`);
                await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
                return this.scrapeChannel(channelUrl, retryCount + 1);
            }

            return {
                success: false,
                error: error.message,
                statusCode: error.response ? error.response.status : null
            };
        }
    }

    async batchScrapeFailedChannels(limit = 10) {
        console.log('🚀 ROBUST BATCH SCRAPING OF FAILED CHANNELS');
        console.log('==========================================\n');

        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT id, channel_name, channel_url, category, language
                FROM youtube_channels 
                WHERE (subscriber_count IS NULL OR subscriber_count = 0)
                AND scrape_status != 'completed'
                ORDER BY priority = 'ultra_high' DESC, priority = 'high' DESC
                LIMIT ?
            `, [limit], async (err, channels) => {
                if (err) {
                    reject(err);
                    return;
                }

                console.log(`🎯 Found ${channels.length} channels to scrape\n`);
                
                let successCount = 0;
                let failureCount = 0;

                for (let i = 0; i < channels.length; i++) {
                    const channel = channels[i];
                    console.log(`[${i + 1}/${channels.length}] ${channel.channel_name} [${channel.category}/${channel.language}]`);
                    
                    const result = await this.scrapeChannel(channel.channel_url);
                    
                    if (result.success && result.subscriberCount > 0) {
                        // Update database with success
                        await this.updateChannelData(channel.id, {
                            subscriber_count: result.subscriberCount,
                            video_count: result.videoCount,
                            description: result.description,
                            is_verified: result.isVerified ? 1 : 0,
                            scrape_status: 'completed',
                            error_count: 0
                        });
                        
                        console.log(`   ✅ Success! ${result.subscriberCount.toLocaleString()} subscribers, ${result.videoCount.toLocaleString()} videos`);
                        successCount++;
                        
                    } else {
                        // Update database with failure
                        await this.updateChannelData(channel.id, {
                            scrape_status: 'failed',
                            error_count: 1
                        });
                        
                        console.log(`   ❌ Failed: ${result.error || 'No data found'}`);
                        failureCount++;
                    }
                    
                    // Wait between requests to avoid rate limiting
                    if (i < channels.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    }
                }

                console.log(`\n📊 BATCH SCRAPING RESULTS:`);
                console.log(`✅ Successful: ${successCount}`);
                console.log(`❌ Failed: ${failureCount}`);
                console.log(`📈 Success Rate: ${((successCount / channels.length) * 100).toFixed(1)}%`);
                
                resolve({ successCount, failureCount });
            });
        });
    }

    updateChannelData(channelId, data) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
            const values = Object.values(data);
            values.push(new Date().toISOString());
            values.push(channelId);

            const sql = `UPDATE youtube_channels SET ${fields}, updated_at = ? WHERE id = ?`;
            
            this.db.run(sql, values, function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async close() {
        this.db.close();
    }
}

// Run the robust scraper
async function runRobustScraping() {
    const scraper = new RobustYouTubeScraper();
    try {
        await scraper.batchScrapeFailedChannels(15); // Scrape 15 failed channels
        await scraper.close();
        console.log('\n🏁 Robust scraping complete!');
    } catch (error) {
        console.error('❌ Robust scraping failed:', error);
        await scraper.close();
    }
}

runRobustScraping();
