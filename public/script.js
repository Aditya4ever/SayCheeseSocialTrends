// YouTube Channel Dashboard - Uses Database API Only (No Direct YouTube Scraping)
// This script connects ONLY to our backend API service running on port 3001
// It does NOT make direct calls to YouTube - all data comes from our database

const API_BASE_URL = 'http://localhost:3001/api/youtube';

class YouTubeDashboard {
    constructor() {
        this.channels = [];
        this.filteredChannels = [];
        this.currentSortColumn = null;
        this.currentSortDirection = 'asc';
        this.init();
    }

    async init() {
        // Create HTML structure first
        this.createTableStructure();
        this.updateStatus('Dashboard structure created');
        
        await this.loadChannels();
        this.updateStatus('Channels loaded, setting up event listeners');
        
        this.setupEventListeners();
        this.updateStatus('Event listeners configured');
        
        this.updateStats();
        this.updateStatus('Statistics updated');
        
        this.renderChannels();
        this.updateStatus('Channel table rendered');
        
        this.startAutoRefresh();
        this.updateStatus('Auto-refresh started - Dashboard ready!');
    }

    // Load channels from our database API (NOT from YouTube directly)
    async loadChannels() {
        try {
            this.updateStatus('Connecting to database API...');
            console.log('🔄 Loading channels from database API...');
            console.log('🔗 API URL:', `${API_BASE_URL}/channels`);
            
            const response = await fetch(`${API_BASE_URL}/channels`);
            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);
            console.log('📡 Response type:', response.type);
            
            this.updateApiStatus(`Response: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                throw new Error(`Database API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('🔍 Raw API Response structure:', {
                success: data.success,
                dataArray: data.data ? `Array of ${data.data.length} items` : 'null',
                cached: data.cached,
                timestamp: data.timestamp
            });
            
            if (data.success && Array.isArray(data.data)) {
                this.channels = data.data;
                this.filteredChannels = [...this.channels];
                console.log(`✅ Loaded ${this.channels.length} channels from database`);
                this.updateChannelCount(`Successfully loaded ${this.channels.length} channels`);
                this.updateApiStatus('✅ API working correctly');
                
                if (this.channels.length > 0) {
                    console.log('🔍 First channel sample:', this.channels[0]);
                }
            } else {
                console.error('❌ API response format error:', {
                    success: data.success,
                    hasData: !!data.data,
                    isArray: Array.isArray(data.data),
                    dataType: typeof data.data,
                    fullResponse: data
                });
                this.channels = [];
                this.filteredChannels = [];
                this.updateChannelCount('❌ No channels loaded - API format error');
                this.updateApiStatus('❌ API response format error');
            }
            
            this.updateLastUpdated();
            
        } catch (error) {
            console.error('❌ Error loading channels from database:', error);
            console.error('❌ Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            this.updateChannelCount('❌ Failed to load channels');
            this.updateApiStatus(`❌ Error: ${error.message}`);
            this.showError('Failed to load channels from database. Is the API service running on port 3001?');
            this.channels = [];
            this.filteredChannels = [];
        }
    }

    // Apply filters based on category and priority
    applyFilters() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        
        this.filteredChannels = this.channels.filter(channel => {
            let matchesCategory = true;
            let matchesPriority = true;
            
            if (categoryFilter && categoryFilter !== 'all') {
                matchesCategory = channel.category === categoryFilter;
            }
            
            if (priorityFilter && priorityFilter !== 'all') {
                matchesPriority = channel.priority === priorityFilter;
            }
            
            return matchesCategory && matchesPriority;
        });
        
        this.renderChannels();
        this.updateStats();
    }

    // Sort channels by column
    sortChannels(column) {
        if (this.currentSortColumn === column) {
            this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortColumn = column;
            this.currentSortDirection = 'asc';
        }
        
        this.filteredChannels.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];
            
            // Handle numeric values
            if (typeof aVal === 'string' && !isNaN(aVal)) {
                aVal = parseInt(aVal);
                bVal = parseInt(bVal);
            }
            
            if (this.currentSortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        this.renderChannels();
        this.updateSortIndicators();
    }

    // Update sort indicators in table headers
    updateSortIndicators() {
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });
        
        if (this.currentSortColumn) {
            const header = document.querySelector(`[data-sort="${this.currentSortColumn}"]`);
            if (header) {
                header.classList.add(`sort-${this.currentSortDirection}`);
            }
        }
    }

    // Render channels table
    renderChannels() {
        let tbody = document.getElementById('channelsTableBody');
        
        // Create table structure if it doesn't exist
        if (!tbody) {
            this.createTableStructure();
            tbody = document.getElementById('channelsTableBody');
        }
        
        if (this.filteredChannels.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        No channels found matching current filters
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.filteredChannels.map(channel => `
            <tr class="channel-row" data-priority="${channel.priority}">
                <td>
                    <div class="channel-info">
                        <strong>${this.escapeHtml(channel.channel_name)}</strong>
                        ${channel.description ? `<div class="channel-description">${this.escapeHtml(channel.description.substring(0, 100))}${channel.description.length > 100 ? '...' : ''}</div>` : ''}
                    </div>
                </td>
                <td><span class="category-badge category-${channel.category || 'other'}">${channel.category || 'Other'}</span></td>
                <td><span class="priority-badge priority-${channel.priority || 'medium'}">${channel.priority || 'Medium'}</span></td>
                <td class="number-cell">${this.formatNumber(channel.subscriber_count)}</td>
                <td class="number-cell">${this.formatNumber(channel.video_count)}</td>
                <td class="number-cell">${this.formatNumber(channel.total_views)}</td>
                <td class="date-cell">${this.formatDate(channel.last_scraped_at)}</td>
                <td>
                    <div class="actions">
                        ${channel.channel_url ? `<a href="${channel.channel_url}" target="_blank" class="btn-link" title="Visit Channel">🔗</a>` : ''}
                        <button onclick="dashboard.refreshChannel('${channel.id}')" class="btn-refresh" title="Refresh Data">🔄</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Create basic table structure if it doesn't exist
    createTableStructure() {
        const container = document.body;
        
        const dashboardHTML = `
            <div id="youtube-dashboard" style="padding: 20px; font-family: Arial, sans-serif;">
                <h1>🎬 YouTube Channel Dashboard</h1>
                <p>📊 <strong>Data Source:</strong> Database API only (no direct YouTube scraping)</p>
                
                <div id="status" style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 8px; border: 1px solid #ffeeba;">
                    <h3>🔄 Status</h3>
                    <p id="statusMessage">Initializing dashboard...</p>
                    <p id="apiStatus">API Status: Unknown</p>
                    <p id="channelCount">Channels: Loading...</p>
                </div>
                
                <div id="stats" style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px;">
                    <h3>📈 Statistics</h3>
                    <p>Total Channels: <span id="totalChannels">0</span> | Filtered: <span id="filteredChannels">0</span></p>
                    <p>Total Subscribers: <span id="totalSubscribers">0</span> | Total Views: <span id="totalViews">0</span> | Avg Videos: <span id="avgVideos">0</span></p>
                    <p>Last Updated: <span id="lastUpdated">Never</span></p>
                </div>
                
                <div id="controls" style="margin: 20px 0;">
                    <label>Category: 
                        <select id="categoryFilter">
                            <option value="all">All</option>
                            <option value="cinema">Cinema</option>
                            <option value="politics">Politics</option>
                            <option value="news">News</option>
                            <option value="entertainment">Entertainment</option>
                        </select>
                    </label>
                    
                    <label style="margin-left: 20px;">Priority: 
                        <select id="priorityFilter">
                            <option value="all">All</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </label>
                    
                    <button id="refreshAllBtn" style="margin-left: 20px;">🔄 Refresh All</button>
                    <button id="manualRefreshBtn" style="margin-left: 10px;">📊 Reload Data</button>
                </div>
                
                <table border="1" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #e0e0e0;">
                            <th class="sortable" data-sort="channel_name">Channel Name</th>
                            <th class="sortable" data-sort="category">Category</th>
                            <th class="sortable" data-sort="priority">Priority</th>
                            <th class="sortable" data-sort="subscriber_count">Subscribers</th>
                            <th class="sortable" data-sort="video_count">Videos</th>
                            <th class="sortable" data-sort="total_views">Views</th>
                            <th class="sortable" data-sort="last_scraped_at">Last Updated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="channelsTableBody">
                        <tr><td colspan="8">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = dashboardHTML;
    }

    // Update statistics display
    updateStats() {
        const totalChannels = this.channels.length;
        const filteredChannels = this.filteredChannels.length;
        const totalSubscribers = this.filteredChannels.reduce((sum, ch) => sum + (parseInt(ch.subscriber_count) || 0), 0);
        const totalViews = this.filteredChannels.reduce((sum, ch) => sum + (parseInt(ch.total_views) || 0), 0);
        const avgVideos = filteredChannels > 0 ? Math.round(this.filteredChannels.reduce((sum, ch) => sum + (parseInt(ch.video_count) || 0), 0) / filteredChannels) : 0;
        
        // Only update elements if they exist
        const totalChannelsEl = document.getElementById('totalChannels');
        const filteredChannelsEl = document.getElementById('filteredChannels');
        const totalSubscribersEl = document.getElementById('totalSubscribers');
        const totalViewsEl = document.getElementById('totalViews');
        const avgVideosEl = document.getElementById('avgVideos');
        
        if (totalChannelsEl) totalChannelsEl.textContent = totalChannels;
        if (filteredChannelsEl) filteredChannelsEl.textContent = filteredChannels;
        if (totalSubscribersEl) totalSubscribersEl.textContent = this.formatNumber(totalSubscribers);
        if (totalViewsEl) totalViewsEl.textContent = this.formatNumber(totalViews);
        if (avgVideosEl) avgVideosEl.textContent = this.formatNumber(avgVideos);
        
        console.log(`📊 Stats: ${totalChannels} total, ${filteredChannels} filtered, ${totalSubscribers} subscribers, ${totalViews} views`);
    }

    // Refresh specific channel data (triggers backend collector)
    async refreshChannel(channelId) {
        try {
            console.log(`🔄 Refreshing channel ${channelId}...`);
            const response = await fetch(`${API_BASE_URL}/channels/${channelId}/refresh`, {
                method: 'POST'
            });
            
            if (response.ok) {
                console.log(`✅ Channel ${channelId} refresh triggered`);
                this.showSuccess('Channel refresh triggered. Data will update in background.');
                // Reload data after a short delay
                setTimeout(() => this.loadChannels(), 2000);
            } else {
                throw new Error(`Refresh failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error refreshing channel:', error);
            this.showError('Failed to refresh channel data');
        }
    }

    // Refresh all channels
    async refreshAllChannels() {
        try {
            console.log('🔄 Refreshing all channels...');
            document.getElementById('refreshAllBtn').disabled = true;
            document.getElementById('refreshAllBtn').textContent = 'Refreshing...';
            
            const response = await fetch(`${API_BASE_URL}/refresh-all`, {
                method: 'POST'
            });
            
            if (response.ok) {
                console.log('✅ All channels refresh triggered');
                this.showSuccess('All channels refresh triggered. Data will update in background.');
                setTimeout(() => this.loadChannels(), 3000);
            } else {
                throw new Error(`Refresh failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error refreshing all channels:', error);
            this.showError('Failed to refresh all channels');
        } finally {
            document.getElementById('refreshAllBtn').disabled = false;
            document.getElementById('refreshAllBtn').textContent = '🔄 Refresh All';
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Filter controls
        const categoryFilter = document.getElementById('categoryFilter');
        const priorityFilter = document.getElementById('priorityFilter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => this.applyFilters());
        }
        
        // Sort controls
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const sortColumn = header.dataset.sort;
                if (sortColumn) {
                    this.sortChannels(sortColumn);
                }
            });
        });
        
        // Refresh buttons
        const refreshAllBtn = document.getElementById('refreshAllBtn');
        const manualRefreshBtn = document.getElementById('manualRefreshBtn');
        
        if (refreshAllBtn) {
            refreshAllBtn.addEventListener('click', () => this.refreshAllChannels());
        }
        if (manualRefreshBtn) {
            manualRefreshBtn.addEventListener('click', () => this.loadChannels());
        }
    }

    // Auto-refresh every 30 seconds
    startAutoRefresh() {
        setInterval(() => {
            console.log('🔄 Auto-refreshing dashboard...');
            this.loadChannels();
        }, 30000);
    }

    // Utility functions
    formatNumber(num) {
        if (!num || num === null || num === undefined) return 'N/A';
        const number = parseInt(num);
        if (isNaN(number)) return 'N/A';
        if (number >= 1000000) {
            return (number / 1000000).toFixed(1) + 'M';
        } else if (number >= 1000) {
            return (number / 1000).toFixed(1) + 'K';
        }
        return number.toLocaleString();
    }

    formatDate(dateStr) {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateLastUpdated() {
        const element = document.getElementById('lastUpdated');
        if (element) {
            element.textContent = new Date().toLocaleTimeString();
        }
    }

    updateStatus(message) {
        const element = document.getElementById('statusMessage');
        if (element) {
            element.textContent = message;
        }
        console.log('📊 Status:', message);
    }

    updateApiStatus(status) {
        const element = document.getElementById('apiStatus');
        if (element) {
            element.textContent = `API Status: ${status}`;
        }
    }

    updateChannelCount(message) {
        const element = document.getElementById('channelCount');
        if (element) {
            element.textContent = `Channels: ${message}`;
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            background: ${type === 'error' ? '#dc3545' : '#28a745'};
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 YouTube Dashboard initializing...');
    console.log('📊 Data Source: Database API only (no direct YouTube scraping)');
    console.log('🔗 API Endpoint: ' + API_BASE_URL);
    
    dashboard = new YouTubeDashboard();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .sortable:hover {
        background-color: #f5f5f5;
        cursor: pointer;
    }
    
    .sort-asc::after {
        content: ' ↑';
        color: #007bff;
    }
    
    .sort-desc::after {
        content: ' ↓';
        color: #007bff;
    }
    
    .channel-description {
        font-size: 0.85em;
        color: #666;
        margin-top: 4px;
    }
    
    .number-cell {
        text-align: right;
        font-family: monospace;
    }
    
    .date-cell {
        font-size: 0.9em;
        color: #666;
    }
    
    .actions {
        display: flex;
        gap: 8px;
    }
    
    .btn-link, .btn-refresh {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 3px;
        text-decoration: none;
    }
    
    .btn-link:hover, .btn-refresh:hover {
        background-color: #f0f0f0;
    }
    
    .category-badge, .priority-badge {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: bold;
        text-transform: uppercase;
    }
    
    .category-entertainment { background: #e3f2fd; color: #1976d2; }
    .category-news { background: #fff3e0; color: #f57c00; }
    .category-education { background: #e8f5e8; color: #388e3c; }
    .category-music { background: #fce4ec; color: #c2185b; }
    .category-other { background: #f5f5f5; color: #757575; }
    
    .priority-high { background: #ffebee; color: #d32f2f; }
    .priority-medium { background: #fff8e1; color: #f57c00; }
    .priority-low { background: #e8f5e8; color: #388e3c; }
    
    .channel-row[data-priority="high"] {
        border-left: 3px solid #d32f2f;
    }
    
    .channel-row[data-priority="medium"] {
        border-left: 3px solid #f57c00;
    }
    
    .channel-row[data-priority="low"] {
        border-left: 3px solid #388e3c;
    }
`;
document.head.appendChild(style);
