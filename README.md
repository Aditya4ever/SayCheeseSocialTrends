# SayCheese - Trending Content Aggregator

A Node.js application that aggregates trending content from multiple social media platforms into a unified API.

## Features

- 🎥 YouTube trending videos by region
- 🐦 Twitter trending topics by location
- 🚀 In-memory caching for optimal performance
- 🌍 Regional content filtering
- 📊 RESTful API with JSON responses
- ⚡ Fast response times with intelligent caching

## API Endpoints

### Get Trending Content
```
GET /api/trending?region=IN&platforms=youtube,twitter
```

**Parameters:**
- `region` (optional): ISO 3166-1 alpha-2 country code (default: 'IN')
- `platforms` (optional): Comma-separated list of platforms (default: 'youtube,twitter')

**Response:**
```json
{
  "timestamp": "2025-08-03T10:30:00.000Z",
  "region": "IN",
  "data": {
    "youtube": [...],
    "twitter": [...]
  }
}
```

## Setup

### Prerequisites
- Node.js 16+ 
- YouTube Data API v3 key
- Twitter Bearer Token

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd SayCheese
```

2. Install dependencies
```bash
npm install
```

3. Create environment variables
```bash
cp .env.example .env
```

4. Configure your API keys in `.env`:
```
YOUTUBE_API_KEY=your_youtube_api_key_here
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
PORT=3000
```

5. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | Yes |
| `TWITTER_BEARER_TOKEN` | Twitter API Bearer Token | Yes |
| `PORT` | Server port (default: 3000) | No |

## API Key Setup

### YouTube API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Restrict the key to YouTube Data API v3

### Twitter Bearer Token
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Generate Bearer Token from Keys and Tokens section

## Project Structure

```
├── files/
│   ├── server.js              # Main Express server
│   ├── youtube-trending.js    # YouTube API integration
│   ├── twitter-trending.js    # Twitter API integration
│   ├── cache-service.js       # Caching layer
│   └── project-architecture.md
├── package.json
├── .env.example
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
