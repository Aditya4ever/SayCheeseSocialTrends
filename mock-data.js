// Mock data for testing without API keys
const mockYouTubeData = [
  // Sports
  {
    id: "sports1",
    title: "UEFA Champions League Final 2025 - Best Goals & Highlights",
    channelTitle: "UEFA",
    publishedAt: "2025-08-02T18:30:00Z",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    viewCount: "5234567",
    likeCount: "234567",
    duration: "PT12M45S",
    platform: "youtube"
  },
  {
    id: "sports2",
    title: "Cricket World Cup 2025 - India vs Australia Final Match Highlights",
    channelTitle: "ICC Cricket",
    publishedAt: "2025-08-01T14:20:00Z",
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    viewCount: "8945612",
    likeCount: "456789",
    duration: "PT8M32S",
    platform: "youtube"
  },
  // Entertainment
  {
    id: "ent1",
    title: "Taylor Swift - New Song 2025 (Official Music Video)",
    channelTitle: "TaylorSwiftVEVO",
    publishedAt: "2025-08-03T06:00:00Z",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    viewCount: "12345678",
    likeCount: "987654",
    duration: "PT3M45S",
    platform: "youtube"
  },
  {
    id: "ent2",
    title: "Marvel Phase 6 - Avengers 5 Official Trailer (2025)",
    channelTitle: "Marvel Entertainment",
    publishedAt: "2025-08-02T16:00:00Z",
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    viewCount: "23456789",
    likeCount: "1234567",
    duration: "PT2M18S",
    platform: "youtube"
  },
  // Technology
  {
    id: "tech1",
    title: "iPhone 17 Pro Max - Revolutionary AI Features Revealed!",
    channelTitle: "Apple",
    publishedAt: "2025-08-03T09:00:00Z",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    viewCount: "6789012",
    likeCount: "345678",
    duration: "PT15M22S",
    platform: "youtube"
  },
  {
    id: "tech2",
    title: "OpenAI GPT-5 Demo - The Future of AI Programming",
    channelTitle: "OpenAI",
    publishedAt: "2025-08-02T12:30:00Z",
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    viewCount: "4567890",
    likeCount: "234567",
    duration: "PT22M15S",
    platform: "youtube"
  },
  // Politics
  {
    id: "pol1",
    title: "Global Climate Summit 2025 - Major Announcements",
    channelTitle: "UN News",
    publishedAt: "2025-08-01T20:00:00Z",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    viewCount: "3456789",
    likeCount: "123456",
    duration: "PT18M45S",
    platform: "youtube"
  },
  // News
  {
    id: "news1",
    title: "Breaking: Major Scientific Discovery Changes Everything",
    channelTitle: "BBC News",
    publishedAt: "2025-08-03T08:45:00Z",
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    viewCount: "7890123",
    likeCount: "456789",
    duration: "PT5M30S",
    platform: "youtube"
  },
  {
    id: "news2",
    title: "Space Mission Launch Live - Mars Colony Project 2025",
    channelTitle: "NASA",
    publishedAt: "2025-08-02T22:15:00Z",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    viewCount: "9012345",
    likeCount: "567890",
    duration: "PT45M20S",
    platform: "youtube"
  }
];

const mockTwitterData = [
  // Sports trends
  {
    name: "#ChampionsLeagueFinal",
    url: "https://twitter.com/search?q=%23ChampionsLeagueFinal",
    tweetVolume: 2345000,
    platform: "twitter"
  },
  {
    name: "#CricketWorldCup",
    url: "https://twitter.com/search?q=%23CricketWorldCup",
    tweetVolume: 1876000,
    platform: "twitter"
  },
  // Entertainment trends
  {
    name: "#TaylorSwift",
    url: "https://twitter.com/search?q=%23TaylorSwift",
    tweetVolume: 3456000,
    platform: "twitter"
  },
  {
    name: "#AvengersTrailer",
    url: "https://twitter.com/search?q=%23AvengersTrailer",
    tweetVolume: 4567000,
    platform: "twitter"
  },
  // Technology trends
  {
    name: "#iPhone17",
    url: "https://twitter.com/search?q=%23iPhone17",
    tweetVolume: 1234000,
    platform: "twitter"
  },
  {
    name: "#GPT5",
    url: "https://twitter.com/search?q=%23GPT5",
    tweetVolume: 987000,
    platform: "twitter"
  },
  // Politics trends
  {
    name: "#ClimateSummit2025",
    url: "https://twitter.com/search?q=%23ClimateSummit2025",
    tweetVolume: 654000,
    platform: "twitter"
  },
  // News trends
  {
    name: "#BreakingNews",
    url: "https://twitter.com/search?q=%23BreakingNews",
    tweetVolume: 5678000,
    platform: "twitter"
  },
  {
    name: "#MarsColony",
    url: "https://twitter.com/search?q=%23MarsColony",
    tweetVolume: 432000,
    platform: "twitter"
  },
  {
    name: "#SpaceLaunch",
    url: "https://twitter.com/search?q=%23SpaceLaunch",
    tweetVolume: 876000,
    platform: "twitter"
  }
];

module.exports = { mockYouTubeData, mockTwitterData };
