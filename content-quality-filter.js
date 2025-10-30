/**
 * Content quality filter to exclude low-quality or irrelevant sources
 * Filters out subreddits and content that may not be suitable for trending news
 */
class ContentQualityFilter {
  constructor() {
    // Subreddits to exclude (low quality, personal discussions, etc.)
    this.excludedSubreddits = [
      'tragedeigh',           // Baby name discussions
      'amitheasshole',        // Personal relationship issues
      'relationshipadvice',   // Personal advice
      'unpopularopinion',     // Opinion posts
      'nostupidquestions',    // Q&A posts
      'explainlikeimfive',    // Educational Q&A
      'confessions',          // Personal confessions
      'tifu',                 // Personal stories
      'petpeeves',            // Personal complaints
      'rant',                 // Personal rants
      'offmychest',           // Personal venting
      'casualconversation',   // Casual chat
      'advice',               // Personal advice
      'askreddit',            // Question threads
      'showerthoughts',       // Random thoughts
      'mildlyinteresting',    // Low-impact content
      'mildlyinfuriating',    // Personal frustrations
      'polls',                // Poll posts
      'survey',               // Survey posts
      'free',                 // Free stuff posts
      'circlejerk',           // Meme/joke subreddits
      'wholesomememes',       // Meme content
      'memes',                // Meme content
      'dankmemes',            // Meme content
      'me_irl',               // Personal memes
      'teenagers',            // Age-specific content
      'college',              // Student life
      'jobs',                 // Job hunting
      'resume',               // Career advice
      'personalfinance',      // Personal finance advice
      'legaladvice',          // Personal legal questions
      'relationships',        // Relationship advice
      'dating',               // Dating advice
      'marriage',             // Marriage advice
      'parenting',            // Parenting advice
      'babies',               // Baby-related content
      'pregnant',             // Pregnancy content
      'namenerds',            // Name discussions
    ];

    // Keywords that indicate personal/low-quality content
    this.excludedKeywords = [
      'am i the only one',
      'does anyone else',
      'unpopular opinion',
      'change my mind',
      'am i wrong',
      'what do you think',
      'help me decide',
      'should i',
      'is it just me',
      'rate my',
      'judge my',
      'roast me',
      'advice needed',
      'what would you do',
      'personal story',
      'confession',
      'rant',
      'shower thought',
      'random thought',
      'eli5',
      'explain like',
      'stupid question',
      'probably dumb',
      'might be stupid',
      'baby name',
      'name suggestion',
      'what to name',
      'naming my'
    ];

    // Content that should be prioritized (high-quality sources)
    this.prioritySubreddits = [
      'worldnews',
      'news',
      'technology',
      'science',
      'business',
      'economics',
      'politics',
      'finance',
      'investing',
      'startups',
      'entrepreneur',
      'programming',
      'artificial',
      'MachineLearning',
      'space',
      'environment',
      'climate',
      'energy',
      'healthcare',
      'medicine',
      'research',
      'academia',
      'datascience',
      'cybersecurity',
      'privacy',
      'linux',
      'android',
      'apple',
      'google',
      'microsoft',
      'tesla',
      'electricvehicles',
      'renewableenergy',
      'cryptocurrency',
      'blockchain',
      'stocks',
      'wallstreetbets',
      'investing',
      'personalfinanceindia',
      'indiainvestments',
      'indianstartups',
      'developersIndia',
      'india',
      'indiaspeaks',
      'cricket',
      'bollywood',
      'indianfood',
      'travel',
      'photography',
      'art',
      'music',
      'movies',
      'books',
      'gaming',
      'sports'
    ];
  }

  isHighQualityContent(item) {
    if (!item) return false;

    const title = (item.title || '').toLowerCase();
    const subreddit = (item.subreddit || '').toLowerCase();
    const text = `${title} ${subreddit}`.toLowerCase();

    // Check if subreddit is explicitly excluded
    if (this.excludedSubreddits.includes(subreddit)) {
      console.log(`❌ Excluding low-quality subreddit: r/${subreddit} - "${item.title}"`);
      return false;
    }

    // Check for excluded keywords in title
    const hasExcludedKeywords = this.excludedKeywords.some(keyword => 
      title.includes(keyword.toLowerCase())
    );

    if (hasExcludedKeywords) {
      console.log(`❌ Excluding content with low-quality keywords: "${item.title}"`);
      return false;
    }

    // Prioritize high-quality subreddits
    const isPrioritySubreddit = this.prioritySubreddits.includes(subreddit);
    
    // Filter out very short titles (likely low quality)
    if (title.length < 15) {
      console.log(`❌ Excluding short title: "${item.title}"`);
      return false;
    }

    // Filter out titles with excessive punctuation or caps
    const punctuationRatio = (title.match(/[!?]/g) || []).length / title.length;
    const capsRatio = (title.match(/[A-Z]/g) || []).length / title.length;
    
    if (punctuationRatio > 0.1 || capsRatio > 0.3) {
      console.log(`❌ Excluding clickbait-style title: "${item.title}"`);
      return false;
    }

    return true;
  }

  filterHighQualityContent(items) {
    if (!Array.isArray(items)) return [];

    const originalCount = items.length;
    const filtered = items.filter(item => this.isHighQualityContent(item));
    
    console.log(`✨ Quality Filter: ${filtered.length}/${originalCount} items passed quality check`);
    
    return filtered;
  }

  scoreContentQuality(item) {
    let score = 0;
    const subreddit = (item.subreddit || '').toLowerCase();
    const title = (item.title || '').toLowerCase();

    // Priority subreddit bonus
    if (this.prioritySubreddits.includes(subreddit)) {
      score += 5;
    }

    // Engagement bonus
    if (item.score) {
      score += Math.min(item.score / 1000, 3);
    }

    // Recent content bonus
    if (item.publishedAt || item.createdISO) {
      const date = new Date(item.publishedAt || item.createdISO);
      const hoursAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 6) score += 2;
      else if (hoursAgo < 24) score += 1;
    }

    // Title quality bonus
    if (title.length > 30 && title.length < 200) {
      score += 1;
    }

    // Professional keywords bonus
    const professionalKeywords = [
      'announces', 'launches', 'releases', 'reports', 'study', 'research',
      'breakthrough', 'innovation', 'technology', 'develops', 'discovers',
      'investment', 'funding', 'economy', 'market', 'industry', 'company'
    ];

    const hasProKeywords = professionalKeywords.some(keyword => 
      title.includes(keyword)
    );

    if (hasProKeywords) score += 2;

    return score;
  }

  sortByQuality(items) {
    return items
      .map(item => ({
        ...item,
        qualityScore: this.scoreContentQuality(item)
      }))
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .map(({ qualityScore, ...item }) => item);
  }
}

module.exports = ContentQualityFilter;
