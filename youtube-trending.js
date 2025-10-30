const axios = require('axios');
require('dotenv').config();

// Load from environment variable
const API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Fetches trending videos from YouTube for a specific region
 * @param {string} regionCode - ISO 3166-1 alpha-2 country code (e.g., 'IN' for India)
 * @param {string} [categoryId] - Optional category ID to filter results
 * @param {number} [maxResults=25] - Number of results to return (max 50)
 * @returns {Promise<Array>} Array of trending video objects
 */
async function fetchYouTubeTrending(regionCode = 'IN', categoryId = '', maxResults = 25) {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,statistics,contentDetails',
        chart: 'mostPopular',
        regionCode: regionCode,
        videoCategoryId: categoryId,
        maxResults: maxResults,
        key: API_KEY
      }
    });

    return response.data.items.map(video => ({
      id: video.id,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      thumbnail: video.snippet.thumbnails.high.url,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      duration: video.contentDetails.duration,
      platform: 'youtube'
    }));
  } catch (error) {
    console.error('Error fetching YouTube trending:', error.message);
    return [];
  }
}

module.exports = { fetchYouTubeTrending };