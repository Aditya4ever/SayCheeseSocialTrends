const needle = require('needle');
require('dotenv').config();

// Twitter API credentials
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

// WOEID for India is 23424848
const INDIA_WOEID = 23424848;

/**
 * Fetches trending topics from Twitter for a specific location
 * @param {number} woeid - Where On Earth ID (e.g., 23424848 for India)
 * @returns {Promise<Array>} Array of trending topics
 */
async function fetchTwitterTrending(woeid = INDIA_WOEID) {
  const endpoint = `https://api.twitter.com/1.1/trends/place.json?id=${woeid}`;
  
  const options = {
    headers: {
      'Authorization': `Bearer ${BEARER_TOKEN}`
    }
  };

  try {
    const response = await needle('get', endpoint, options);
    
    if (response.statusCode !== 200) {
      throw new Error(`Request failed with status ${response.statusCode}`);
    }

    return response.body[0].trends.map(trend => ({
      name: trend.name,
      url: trend.url,
      tweetVolume: trend.tweet_volume,
      platform: 'twitter'
    }));
  } catch (error) {
    console.error('Error fetching Twitter trends:', error.message);
    return [];
  }
}

module.exports = { fetchTwitterTrending };