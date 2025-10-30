class TrendingDashboard {
    constructor() {
        this.currentPlatform = 'all';
        this.currentTopic = 'all';
        this.currentRegion = 'IN';
        this.currentDataSource = 'mock';
        this.data = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkServerStatus();
        this.loadTrendingData();
        
        // Auto-refresh every 5 minutes
        setInterval(() => this.loadTrendingData(), 5 * 60 * 1000);
    }

    setupEventListeners() {
        // Data source selector
        document.getElementById('dataSource').addEventListener('change', (e) => {
            this.currentDataSource = e.target.value;
            this.updatePlatformButtons();
            this.loadTrendingData();
        });

        // Platform filters
        document.querySelectorAll('[data-platform]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter('platform', e.target.dataset.platform);
                this.currentPlatform = e.target.dataset.platform;
                this.applyFilters();
            });
        });

        // Topic filters
        document.querySelectorAll('[data-topic]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter('topic', e.target.dataset.topic);
                this.currentTopic = e.target.dataset.topic;
                this.applyFilters();
            });
        });

        // Region selector
        document.getElementById('regionSelect').addEventListener('change', (e) => {
            this.currentRegion = e.target.value;
            this.loadTrendingData();
        });
    }

    setActiveFilter(type, value) {
        const filterGroup = type === 'platform' ? '[data-platform]' : '[data-topic]';
        document.querySelectorAll(filterGroup).forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-${type}="${value}"]`).classList.add('active');
    }

    updatePlatformButtons() {
        const redditBtn = document.getElementById('redditBtn');
        const newsBtn = document.getElementById('newsBtn');
        const reliableBtn = document.getElementById('reliableBtn');
        
        if (this.currentDataSource === 'alternative') {
            redditBtn.style.display = 'inline-flex';
            newsBtn.style.display = 'inline-flex';
            reliableBtn.style.display = 'inline-flex';
        } else {
            redditBtn.style.display = 'none';
            newsBtn.style.display = 'none';
            reliableBtn.style.display = 'none';
            
            // Reset to valid platform if currently on Reddit/News/Reliable
            if (this.currentPlatform === 'reddit' || this.currentPlatform === 'news' || this.currentPlatform === 'reliable') {
                this.currentPlatform = 'all';
                this.setActiveFilter('platform', 'all');
            }
        }
    }

    async checkServerStatus() {
        try {
            const response = await fetch('/api/status');
            const status = await response.json();
            
            const indicator = document.getElementById('statusIndicator');
            if (status.status === 'running') {
                indicator.classList.add('online');
                indicator.innerHTML = '<i class="fas fa-circle"></i><span>Online</span>';
                
                if (status.developmentMode) {
                    indicator.innerHTML += ' <small>(Demo Mode)</small>';
                }
            } else {
                indicator.classList.add('offline');
                indicator.innerHTML = '<i class="fas fa-circle"></i><span>Offline</span>';
            }
        } catch (error) {
            console.error('Status check failed:', error);
            const indicator = document.getElementById('statusIndicator');
            indicator.classList.add('offline');
            indicator.innerHTML = '<i class="fas fa-circle"></i><span>Error</span>';
        }
    }

    async loadTrendingData() {
        this.showLoading(true);
        
        try {
            let response;
            let teluguResponse;
            
            if (this.currentDataSource === 'alternative') {
                const categoriesParam = this.currentTopic === 'all' ? 'all' : this.currentTopic;
                
                // Load both regular content and Telugu content
                const [regularData, teluguData] = await Promise.all([
                    fetch(`/api/trending/alternative?region=${this.currentRegion}&categories=${categoriesParam}`),
                    fetch('/api/trending/telugu')
                ]);
                
                if (!regularData.ok) {
                    throw new Error(`HTTP error! status: ${regularData.status}`);
                }
                
                this.data = await regularData.json();
                
                // Handle Telugu data (don't fail if it's not available)
                try {
                    if (teluguData.ok) {
                        this.teluguData = await teluguData.json();
                    } else {
                        console.warn('Telugu data not available');
                        this.teluguData = null;
                    }
                } catch (teluguError) {
                    console.warn('Failed to load Telugu data:', teluguError);
                    this.teluguData = null;
                }
            } else {
                const platformsParam = this.currentPlatform === 'all' ? 'youtube,twitter' : this.currentPlatform;
                response = await fetch(`/api/trending?region=${this.currentRegion}&platforms=${platformsParam}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                this.data = await response.json();
                this.teluguData = null; // No Telugu data for non-alternative sources
            }
            
            this.renderContent();
            this.updateLastUpdated();
            
        } catch (error) {
            console.error('Failed to load trending data:', error);
            this.showError('Failed to load trending data. Please try again later.');
        } finally {
            this.showLoading(false);
        }
    }

    renderContent() {
        if (this.currentDataSource === 'alternative') {
            // Hide legacy grids and show categorized layout
            this.showCategorizedLayout();
            this.renderAlternativeContent();
        } else {
            // Hide categorized layout and show legacy grids
            this.showLegacyLayout();
            this.renderYouTubeContent();
            this.renderTwitterContent();
        }
        this.applyFilters();
    }

    showCategorizedLayout() {
        // Show category grids and Telugu section, hide legacy grids
        const categoryGrids = document.querySelectorAll('.category-grid');
        const teluguSection = document.getElementById('teluguSection');
        const youtubeGrid = document.getElementById('youtubeGrid');
        const twitterGrid = document.getElementById('twitterGrid');
        
        categoryGrids.forEach(grid => {
            if (grid) grid.style.display = 'grid';
        });
        
        if (teluguSection) teluguSection.style.display = 'block';
        if (youtubeGrid) youtubeGrid.style.display = 'none';
        if (twitterGrid) twitterGrid.style.display = 'none';
    }

    showLegacyLayout() {
        // Hide category grids and Telugu section, show legacy grids
        const categoryGrids = document.querySelectorAll('.category-grid');
        const teluguSection = document.getElementById('teluguSection');
        const youtubeGrid = document.getElementById('youtubeGrid');
        const twitterGrid = document.getElementById('twitterGrid');
        
        categoryGrids.forEach(grid => {
            if (grid) grid.style.display = 'none';
        });
        
        if (teluguSection) teluguSection.style.display = 'none';
        if (youtubeGrid) youtubeGrid.style.display = 'grid';
        if (twitterGrid) twitterGrid.style.display = 'grid';
    }

    renderAlternativeContent() {
        // Only render categorized content if we're actually using alternative source
        if (this.currentDataSource !== 'alternative') {
            console.warn('renderAlternativeContent called but currentDataSource is not alternative');
            return;
        }
        
        // Handle new categorized data structure
        const categorizedData = this.data?.data || {};
        
        // Render Telugu content first (top row)
        this.renderTeluguContent();
        
        // Render News categories
        this.renderNewsCategories(categorizedData.news || {});
        
        // Render YouTube categories
        this.renderYouTubeCategories(categorizedData.youtube || {});
        
        // Render Twitter categories
        this.renderTwitterCategories(categorizedData.twitter || {});
        
        // Update counts
        this.updateCategorizedCounts(categorizedData);
        
        console.log('Categorized data loaded:', categorizedData);
        console.log('Telugu data loaded:', this.teluguData);
    }

    renderNewsCategories(newsData) {
        const categories = ['Technology', 'Politics', 'Entertainment'];
        
        categories.forEach(category => {
            const container = document.getElementById(`news${category}`);
            if (!container) {
                console.warn(`Container not found: news${category}`);
                return;
            }
            
            const items = newsData[category] || [];
            
            if (items.length === 0) {
                container.innerHTML = '<div class="no-content">No content available</div>';
                return;
            }
            
            this.renderCategoryItems(container, items, 'news', category, this.createNewsItem.bind(this));
        });
    }

    renderYouTubeCategories(youtubeData) {
        const categories = ['Technology', 'Politics', 'Entertainment'];
        
        categories.forEach(category => {
            const container = document.getElementById(`youtube${category}`);
            if (!container) {
                console.warn(`Container not found: youtube${category}`);
                return;
            }
            
            const items = youtubeData[category] || [];
            
            if (items.length === 0) {
                container.innerHTML = '<div class="no-content">No content available</div>';
                return;
            }
            
            this.renderCategoryItems(container, items, 'youtube', category, this.createYouTubeItem.bind(this));
        });
    }

    renderTwitterCategories(twitterData) {
        const categories = ['Technology', 'Politics', 'Entertainment'];
        
        categories.forEach(category => {
            const container = document.getElementById(`twitter${category}`);
            if (!container) {
                console.warn(`Container not found: twitter${category}`);
                return;
            }
            
            const items = twitterData[category] || [];
            
            if (items.length === 0) {
                container.innerHTML = '<div class="no-content">No content available</div>';
                return;
            }
            
            this.renderCategoryItems(container, items, 'twitter', category, this.createTwitterItem.bind(this));
        });
    }

    renderCategoryItems(container, items, platform, category, createItemFn) {
        const defaultCount = 5;
        const maxCount = 10;
        const categoryId = `${platform}${category}`;
        
        // Clear container
        container.innerHTML = '';
        
        // Create items wrapper
        const itemsWrapper = document.createElement('div');
        itemsWrapper.className = 'category-items-wrapper';
        
        // Render initial items (default: 5)
        const initialItems = items.slice(0, defaultCount);
        const remainingItems = items.slice(defaultCount, maxCount);
        
        // Add initial items
        initialItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.innerHTML = createItemFn(item);
            itemsWrapper.appendChild(itemElement.firstElementChild);
        });
        
        // Add remaining items (hidden initially)
        const hiddenWrapper = document.createElement('div');
        hiddenWrapper.className = 'hidden-items';
        hiddenWrapper.style.display = 'none';
        hiddenWrapper.setAttribute('data-category', categoryId);
        
        remainingItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.innerHTML = createItemFn(item);
            hiddenWrapper.appendChild(itemElement.firstElementChild);
        });
        
        itemsWrapper.appendChild(hiddenWrapper);
        
        // Add show more/less controls if there are hidden items
        if (remainingItems.length > 0) {
            const controlsWrapper = document.createElement('div');
            controlsWrapper.className = 'category-controls';
            
            const showMoreBtn = document.createElement('button');
            showMoreBtn.className = 'show-more-btn';
            showMoreBtn.innerHTML = `<i class="fas fa-chevron-down"></i> Show More (${remainingItems.length})`;
            showMoreBtn.setAttribute('data-category', categoryId);
            showMoreBtn.setAttribute('data-action', 'expand');
            
            const showLessBtn = document.createElement('button');
            showLessBtn.className = 'show-less-btn';
            showLessBtn.innerHTML = `<i class="fas fa-chevron-up"></i> Show Less`;
            showLessBtn.setAttribute('data-category', categoryId);
            showLessBtn.setAttribute('data-action', 'collapse');
            showLessBtn.style.display = 'none';
            
            controlsWrapper.appendChild(showMoreBtn);
            controlsWrapper.appendChild(showLessBtn);
            itemsWrapper.appendChild(controlsWrapper);
            
            // Add event listeners
            this.setupCategoryControls(showMoreBtn, showLessBtn, hiddenWrapper);
        }
        
        container.appendChild(itemsWrapper);
    }

    setupCategoryControls(showMoreBtn, showLessBtn, hiddenWrapper) {
        showMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hiddenWrapper.style.display = 'block';
            showMoreBtn.style.display = 'none';
            showLessBtn.style.display = 'inline-flex';
            
            // Smooth scroll animation
            setTimeout(() => {
                hiddenWrapper.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }, 100);
        });
        
        showLessBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hiddenWrapper.style.display = 'none';
            showMoreBtn.style.display = 'inline-flex';
            showLessBtn.style.display = 'none';
            
            // Smooth scroll back to top of category
            showMoreBtn.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        });
    }

    // Telugu Content Methods
    renderTeluguContent() {
        if (!this.teluguData || !this.teluguData.data) {
            console.warn('No Telugu data available');
            this.showTeluguNoContent();
            return;
        }
        
        const teluguData = this.teluguData.data;
        console.log('Rendering Telugu content:', teluguData);
        
        // Render Telugu Politics
        this.renderTeluguCategory('Politics', teluguData.politics || []);
        
        // Render Telugu Cinema
        this.renderTeluguCategory('Cinema', teluguData.cinema || []);

        // Render All Telugu
        this.renderTeluguCategory('All', teluguData.all || []);        // Update Telugu counts
        this.updateTeluguCounts(teluguData);
    }

    renderTeluguCategory(category, items) {
        const container = document.getElementById(`telugu${category}Content`);
        if (!container) {
            console.warn(`Telugu container not found: telugu${category}Content`);
            return;
        }
        
        if (items.length === 0) {
            container.innerHTML = '<div class="telugu-no-content">No Telugu content available</div>';
            return;
        }
        
        this.renderTeluguCategoryItems(container, items, category);
    }

    renderTeluguCategoryItems(container, items, category) {
        // Filter out items without valid links (Twitter trends, incomplete data, etc.)
        const filteredItems = items.filter(item => {
            return item.link && 
                   item.link.trim() !== '' && 
                   item.link !== 'undefined' && 
                   item.link.startsWith('http');
        });

        // If no valid items after filtering, show message
        if (filteredItems.length === 0) {
            container.innerHTML = '<div class="telugu-no-content">No valid Telugu content available</div>';
            return;
        }

        const defaultCount = 5;
        const maxCount = 10;
        const categoryId = `telugu${category}`;

        // Clear container
        container.innerHTML = '';

        // Create items wrapper
        const itemsWrapper = document.createElement('div');
        itemsWrapper.className = 'telugu-items-wrapper';

        // Render initial items (default: 5)
        const initialItems = filteredItems.slice(0, defaultCount);
        const remainingItems = filteredItems.slice(defaultCount, maxCount);        // Add initial items
        initialItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.innerHTML = this.createTeluguItem(item);
            itemsWrapper.appendChild(itemElement.firstElementChild);
        });
        
        // Add remaining items (hidden initially)
        if (remainingItems.length > 0) {
            const hiddenWrapper = document.createElement('div');
            hiddenWrapper.className = 'telugu-hidden-items';
            hiddenWrapper.style.display = 'none';
            hiddenWrapper.setAttribute('data-category', categoryId);
            
            remainingItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.innerHTML = this.createTeluguItem(item);
                hiddenWrapper.appendChild(itemElement.firstElementChild);
            });
            
            itemsWrapper.appendChild(hiddenWrapper);
            
            // Add show more/less controls
            const controlsWrapper = document.createElement('div');
            controlsWrapper.className = 'telugu-category-controls';
            
            const showMoreBtn = document.createElement('button');
            showMoreBtn.className = 'telugu-show-more-btn';
            showMoreBtn.innerHTML = `<i class="fas fa-chevron-down"></i> Show More (${remainingItems.length})`;
            showMoreBtn.setAttribute('data-category', categoryId);
            
            const showLessBtn = document.createElement('button');
            showLessBtn.className = 'telugu-show-less-btn';
            showLessBtn.innerHTML = `<i class="fas fa-chevron-up"></i> Show Less`;
            showLessBtn.setAttribute('data-category', categoryId);
            showLessBtn.style.display = 'none';
            
            controlsWrapper.appendChild(showMoreBtn);
            controlsWrapper.appendChild(showLessBtn);
            itemsWrapper.appendChild(controlsWrapper);
            
            // Add event listeners
            this.setupTeluguCategoryControls(showMoreBtn, showLessBtn, hiddenWrapper);
        }
        
        container.appendChild(itemsWrapper);
    }

    setupTeluguCategoryControls(showMoreBtn, showLessBtn, hiddenWrapper) {
        showMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hiddenWrapper.style.display = 'block';
            showMoreBtn.style.display = 'none';
            showLessBtn.style.display = 'inline-flex';
            
            // Smooth scroll animation
            setTimeout(() => {
                hiddenWrapper.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }, 100);
        });
        
        showLessBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hiddenWrapper.style.display = 'none';
            showMoreBtn.style.display = 'inline-flex';
            showLessBtn.style.display = 'none';
            
            // Smooth scroll back to top of category
            showMoreBtn.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        });
    }

    createTeluguItem(item) {
        const publishedDate = this.formatDate(item.publishedAt || item.date || item.isoDate || item.pubDate);
        const source = item.source || item.platform || 'Unknown';
        const platformTag = this.getTeluguPlatformTag(item);
        
        return `
            <div class="telugu-item" onclick="window.open('${item.link}', '_blank')">
                <h5>${item.title}</h5>
                <div class="telugu-item-source">
                    <span>${source}</span>
                    ${platformTag}
                    <span class="telugu-item-time">${publishedDate}</span>
                </div>
            </div>
        `;
    }

    getTeluguPlatformTag(item) {
        if (item.platform === 'youtube') {
            return '<span class="telugu-platform-tag">YouTube</span>';
        } else if (item.platform === 'twitter') {
            return '<span class="telugu-platform-tag">Twitter</span>';
        } else if (item.platform === 'news') {
            return '<span class="telugu-platform-tag">News</span>';
        }
        return '';
    }

    updateTeluguCounts(teluguData) {
        const politicsCount = (teluguData.politics || []).length;
        const cinemaCount = (teluguData.cinema || []).length;
        const techCount = (teluguData.all || []).length;
        
        const politicsCountElement = document.getElementById('teluguPoliticsCount');
        const cinemaCountElement = document.getElementById('teluguCinemaCount');
        const techCountElement = document.getElementById('teluguAllCount');
        
        if (politicsCountElement) {
            politicsCountElement.textContent = `${politicsCount} items`;
        }
        
        if (cinemaCountElement) {
            cinemaCountElement.textContent = `${cinemaCount} items`;
        }
        
        if (techCountElement) {
            techCountElement.textContent = `${techCount} items`;
        }
    }

    showTeluguNoContent() {
        const categories = ['Politics', 'Cinema', 'Tech'];
        
        categories.forEach(category => {
            const container = document.getElementById(`telugu${category}Content`);
            if (container) {
                container.innerHTML = '<div class="telugu-no-content">Loading Telugu content...</div>';
            }
            
            const countElement = document.getElementById(`telugu${category}Count`);
            if (countElement) {
                countElement.textContent = '0 items';
            }
        });
    }

    createNewsItem(item) {
        const publishedDate = this.formatDate(item.publishedAt);
        return `
            <div class="news-item" onclick="window.open('${item.url}', '_blank')">
                <h5>${item.title}</h5>
                <div class="news-source">${item.source}</div>
                <div class="news-time">${publishedDate}</div>
            </div>
        `;
    }

    createYouTubeItem(item) {
        const views = this.formatViews(item.viewCount || 0);
        const likes = this.formatViews(item.likeCount || 0);
        const publishedDate = this.formatDate(item.publishedAt);
        return `
            <div class="youtube-item" onclick="window.open('${item.url}', '_blank')">
                <h5>${item.title}</h5>
                <div class="youtube-channel">${item.channelTitle || item.source}</div>
                <div class="youtube-stats">
                    <span>${views} views</span>
                    <span>${likes} likes</span>
                    <span>${publishedDate}</span>
                </div>
            </div>
        `;
    }

    createTwitterItem(item) {
        const volume = this.formatViews(item.tweetVolume || 0);
        return `
            <div class="twitter-item" onclick="window.open('${item.url}', '_blank')">
                <h5>${item.name || item.title}</h5>
                <div class="twitter-volume">${volume} tweets</div>
                <div class="twitter-platform">${item.originalPlatform || item.source}</div>
            </div>
        `;
    }

    updateCategorizedCounts(data) {
        // Count total items for each platform
        const newsCount = Object.values(data.news || {}).flat().length;
        const youtubeCount = Object.values(data.youtube || {}).flat().length;
        const twitterCount = Object.values(data.twitter || {}).flat().length;
        
        const newsCountElement = document.getElementById('newsCount');
        const youtubeCountElement = document.getElementById('youtubeCount');
        const twitterCountElement = document.getElementById('twitterCount');
        
        if (newsCountElement) {
            newsCountElement.textContent = `${newsCount} articles`;
        }
        
        if (youtubeCountElement) {
            youtubeCountElement.textContent = `${youtubeCount} videos`;
        }
        
        if (twitterCountElement) {
            twitterCountElement.textContent = `${twitterCount} topics`;
        }
    }

    renderYouTubeContent(customData = null) {
        const container = document.getElementById('youtubeGrid');
        const section = document.getElementById('youtubeSection');
        
        if (!container) {
            console.warn('youtubeGrid element not found');
            return;
        }
        
        const youtubeData = customData || this.data?.data?.youtube || [];

        if (youtubeData.length === 0) {
            container.innerHTML = '<div class="no-content">No YouTube content available</div>';
            return;
        }

        container.innerHTML = youtubeData.map(video => this.createVideoCard(video)).join('');
        
        const countElement = document.getElementById('youtubeCount');
        if (countElement) {
            countElement.textContent = `${youtubeData.length} videos`;
        }
    }

    renderTwitterContent(customData = null) {
        const container = document.getElementById('twitterGrid');
        const section = document.getElementById('twitterSection');
        
        if (!container) {
            console.warn('twitterGrid element not found');
            return;
        }
        
        const twitterData = customData || this.data?.data?.twitter || [];

        if (twitterData.length === 0) {
            container.innerHTML = '<div class="no-content">No Twitter content available</div>';
            return;
        }

        container.innerHTML = twitterData.map(trend => this.createTwitterCard(trend)).join('');
        
        const countElement = document.getElementById('twitterCount');
        if (countElement) {
            countElement.textContent = `${twitterData.length} topics`;
        }
    }

    createVideoCard(video) {
        const views = this.formatViews(video.viewCount);
        const duration = this.formatDuration(video.duration);
        const publishedDate = this.formatDate(video.publishedAt);
        const topic = this.guessVideoTopic(video.title, video.channelTitle);
        
        return `
            <div class="video-card" data-topic="${topic}">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                    <div class="video-duration">${duration}</div>
                </div>
                <div class="video-info">
                    <h4 class="video-title">
                        <a href="https://www.youtube.com/watch?v=${video.id}" target="_blank" rel="noopener">
                            ${video.title}
                        </a>
                    </h4>
                    <div class="video-channel">${video.channelTitle}</div>
                    <div class="video-stats">
                        <div class="video-views">
                            <i class="fas fa-eye"></i>
                            <span>${views}</span>
                        </div>
                        <div class="video-date">${publishedDate}</div>
                    </div>
                </div>
            </div>
        `;
    }

    createTwitterCard(trend) {
        const volume = trend.tweetVolume ? this.formatNumber(trend.tweetVolume) : 'N/A';
        const topic = this.guessTrendTopic(trend.name);
        
        return `
            <div class="twitter-card" data-topic="${topic}">
                <div class="trend-name">
                    <i class="fab fa-twitter"></i>
                    ${trend.name}
                </div>
                <div class="trend-volume">
                    <i class="fas fa-chart-line"></i>
                    ${volume} tweets
                </div>
                <a href="${trend.url}" target="_blank" rel="noopener" class="trend-link">
                    View on Twitter →
                </a>
            </div>
        `;
    }

    applyFilters() {
        // With categorized layout, we show/hide entire sections based on platform filter
        const newsSection = document.getElementById('newsSection');
        const youtubeSection = document.getElementById('youtubeSection');
        const twitterSection = document.getElementById('twitterSection');

        // Show sections based on platform filter
        if (newsSection) {
            newsSection.style.display = (this.currentPlatform === 'all' || this.currentPlatform === 'news') ? 'block' : 'none';
        }
        
        if (youtubeSection) {
            youtubeSection.style.display = (this.currentPlatform === 'all' || this.currentPlatform === 'youtube') ? 'block' : 'none';
        }
        
        if (twitterSection) {
            twitterSection.style.display = (this.currentPlatform === 'all' || this.currentPlatform === 'twitter') ? 'block' : 'none';
        }

        // For topic filtering with categorized data, we can show/hide specific category columns
        if (this.currentTopic !== 'all') {
            this.filterByTopic(this.currentTopic);
        } else {
            this.showAllCategories();
        }

        // Update content title
        this.updateContentTitle();
    }

    filterByTopic(topic) {
        // Hide categories that don't match the selected topic
        const categories = ['Technology', 'Politics', 'Entertainment'];
        categories.forEach(category => {
            const isVisible = topic.toLowerCase() === category.toLowerCase();
            
            // News categories
            const newsCategory = document.querySelector(`#news${category}`);
            if (newsCategory && newsCategory.parentElement) {
                newsCategory.parentElement.style.display = isVisible ? 'block' : 'none';
            }
            
            // YouTube categories  
            const youtubeCategory = document.querySelector(`#youtube${category}`);
            if (youtubeCategory && youtubeCategory.parentElement) {
                youtubeCategory.parentElement.style.display = isVisible ? 'block' : 'none';
            }
            
            // Twitter categories
            const twitterCategory = document.querySelector(`#twitter${category}`);
            if (twitterCategory && twitterCategory.parentElement) {
                twitterCategory.parentElement.style.display = isVisible ? 'block' : 'none';
            }
        });
    }

    showAllCategories() {
        // Show all category columns
        const categoryColumns = document.querySelectorAll('.category-column');
        categoryColumns.forEach(column => {
            column.style.display = 'block';
        });
    }

    updateContentTitle() {
        const titleElement = document.getElementById('contentTitle');
        let title = '<i class="fas fa-fire"></i> ';
        
        if (this.currentTopic !== 'all') {
            title += this.currentTopic.charAt(0).toUpperCase() + this.currentTopic.slice(1) + ' ';
        }
        
        title += 'Trending';
        
        if (this.currentPlatform !== 'all') {
            title += ` on ${this.currentPlatform.charAt(0).toUpperCase() + this.currentPlatform.slice(1)}`;
        }
        
        // Add 7-day filter indicator for alternative sources
        if (this.currentDataSource === 'alternative') {
            title += ' <small>(Last 7 Days, Verified URLs)</small>';
            
            // Add URL validation stats if available
            if (this.data?.urlStats) {
                const { valid, total } = this.data.urlStats;
                title += ` <span class="url-stats">✅ ${valid}/${total} URLs verified</span>`;
            }
        }
        
        if (titleElement) {
            titleElement.innerHTML = title;
        }
    }

    guessVideoTopic(title, channel) {
        const titleLower = title.toLowerCase();
        const channelLower = channel.toLowerCase();
        
        if (titleLower.includes('sports') || titleLower.includes('football') || titleLower.includes('cricket') || 
            titleLower.includes('basketball') || channelLower.includes('sports')) {
            return 'sports';
        }
        
        if (titleLower.includes('politics') || titleLower.includes('election') || titleLower.includes('government') ||
            channelLower.includes('news') || channelLower.includes('politics')) {
            return 'politics';
        }
        
        if (titleLower.includes('music') || titleLower.includes('movie') || titleLower.includes('entertainment') ||
            titleLower.includes('celebrity') || titleLower.includes('trailer')) {
            return 'entertainment';
        }
        
        if (titleLower.includes('tech') || titleLower.includes('ai') || titleLower.includes('technology') ||
            titleLower.includes('programming') || titleLower.includes('coding')) {
            return 'technology';
        }
        
        if (titleLower.includes('news') || titleLower.includes('breaking') || channelLower.includes('news')) {
            return 'news';
        }
        
        return 'entertainment'; // Default fallback
    }

    guessTrendTopic(trendName) {
        const name = trendName.toLowerCase();
        
        if (name.includes('sport') || name.includes('football') || name.includes('cricket') || 
            name.includes('basketball') || name.includes('fifa')) {
            return 'sports';
        }
        
        if (name.includes('politic') || name.includes('election') || name.includes('vote') ||
            name.includes('government') || name.includes('minister')) {
            return 'politics';
        }
        
        if (name.includes('music') || name.includes('movie') || name.includes('celebrity') ||
            name.includes('actor') || name.includes('singer')) {
            return 'entertainment';
        }
        
        if (name.includes('tech') || name.includes('ai') || name.includes('crypto') ||
            name.includes('bitcoin') || name.includes('app')) {
            return 'technology';
        }
        
        if (name.includes('news') || name.includes('breaking') || name.includes('alert')) {
            return 'news';
        }
        
        return 'news'; // Default fallback
    }

    formatViews(views) {
        const num = parseInt(views);
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatDuration(duration) {
        // Convert ISO 8601 duration (PT3M33S) to readable format
        if (!duration) return 'N/A';
        
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 'N/A';
        
        const hours = parseInt(match[1] || 0);
        const minutes = parseInt(match[2] || 0);
        const seconds = parseInt(match[3] || 0);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Recent';
        
        const date = new Date(dateString);
        const now = new Date();
        
        // Check if date is valid
        if (isNaN(date.getTime())) return 'Recent';
        
        // Check if date is too old (before 2020) - likely invalid timestamp
        const minimumDate = new Date('2020-01-01');
        if (date < minimumDate) return 'Recent';
        
        // Check if date is in the future
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (date > tomorrow) return 'Recent';
        
        const diffTime = Math.abs(now - date);
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffHours < 1) {
            return 'Just now';
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays === 1) {
            return '1 day ago';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            // For content older than 7 days, it shouldn't appear due to backend filtering
            return `${diffDays} days ago`;
        }
    }

    updateLastUpdated() {
        const timestamp = this.data?.timestamp;
        if (timestamp) {
            const date = new Date(timestamp);
            document.getElementById('lastUpdated').textContent = date.toLocaleTimeString();
        }
    }

    showLoading(show) {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const newsSection = document.getElementById('newsSection');
        const youtubeSection = document.getElementById('youtubeSection');
        const twitterSection = document.getElementById('twitterSection');
        
        if (loadingSpinner) {
            loadingSpinner.style.display = show ? 'block' : 'none';
        }
        
        if (newsSection) {
            newsSection.style.display = show ? 'none' : 'block';
        }
        
        if (youtubeSection) {
            youtubeSection.style.display = show ? 'none' : 'block';
        }
        
        if (twitterSection) {
            twitterSection.style.display = show ? 'none' : 'block';
        }
    }

    showError(message) {
        const container = document.querySelector('.main-content .container');
        container.innerHTML = `
            <div class="error-message" style="
                background: rgba(220, 53, 69, 0.1);
                border: 1px solid rgba(220, 53, 69, 0.3);
                color: #721c24;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
            ">
                <i class="fas fa-exclamation-triangle"></i>
                ${message}
            </div>
        `;
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TrendingDashboard();
});
