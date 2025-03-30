document.addEventListener('DOMContentLoaded', function() {
    // Check for authentication
    if (!localStorage.getItem('token') && !window.location.pathname.includes('login.html')) {
        window.location.href = '/dashboard/login.html';
        return;
    }

    // DOM Elements
    const menuToggle = document.querySelector('.menu-toggle');
    const closeSidebar = document.querySelector('.close-sidebar');
    const sidebar = document.querySelector('.sidebar');
    const dateRangeSelect = document.getElementById('date-range');
    const chatbotSelect = document.getElementById('chatbot-select');
    const exportBtn = document.querySelector('.export-btn');
    const chartTypeButtons = document.querySelectorAll('.chart-type button');
    
    // Chart instances
    let trendsChart, sourcesChart, engagementChart, outcomesChart, satisfactionChart;
    let deviceChart, browserChart;
    
    // Current filters
    let currentFilters = {
        dateRange: '7d',
        chatbotId: 'all',
        chartType: 'conversations'
    };
    
    // Toggle sidebar on mobile
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.add('active');
        });
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', function() {
            sidebar.classList.remove('active');
        });
    }
    
    // Filter change handlers
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', function() {
            currentFilters.dateRange = this.value;
            refreshAnalytics();
        });
    }
    
    if (chatbotSelect) {
        chatbotSelect.addEventListener('change', function() {
            currentFilters.chatbotId = this.value;
            refreshAnalytics();
        });
    }
    
    // Chart type buttons
    chartTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const chartType = this.getAttribute('data-chart-type');
            currentFilters.chartType = chartType;
            
            // Update active button
            chartTypeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update trends chart
            updateTrendsChart();
        });
    });
    
    // Export button
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAnalytics);
    }
    
    // Initialize analytics data and charts
    function initAnalytics() {
        loadChatbots();
        refreshAnalytics();
    }
    
    // Load user's chatbots
    async function loadChatbots() {
        try {
            if (window.ApiService) {
                const response = await ApiService.chatbots.getAllChatbots();
                
                if (response.error) {
                    showNotification('Failed to load chatbots: ' + response.message, 'error');
                    return;
                }
                
                // Populate chatbot selector
                const chatbots = response.data;
                populateChatbotSelector(chatbots);
            } else {
                // Demo mode - use default options
                console.log('Using demo chatbot data');
            }
        } catch (error) {
            console.error('Error loading chatbots:', error);
        }
    }
    
    // Populate chatbot selector dropdown
    function populateChatbotSelector(chatbots) {
        // Keep the "All Chatbots" option
        chatbotSelect.innerHTML = '<option value="all">All Chatbots</option>';
        
        // Add each chatbot as an option
        chatbots.forEach(chatbot => {
            const option = document.createElement('option');
            option.value = chatbot._id;
            option.textContent = chatbot.name;
            chatbotSelect.appendChild(option);
        });
    }
    
    // Refresh all analytics data
    async function refreshAnalytics() {
        showLoading(true);
        
        try {
            // Load analytics data based on current filters
            let analyticsData;
            
            if (window.ApiService) {
                // Get data from API
                const response = await ApiService.analytics.getConversationTrends(currentFilters.dateRange);
                
                if (response.error) {
                    showNotification('Failed to load analytics: ' + response.message, 'error');
                    showLoading(false);
                    return;
                }
                
                analyticsData = response.data;
            } else {
                // Demo mode - generate random data
                analyticsData = generateDemoData();
            }
            
            // Update dashboard with the data
            updateKPICards(analyticsData.summary);
            initCharts(analyticsData);
            
            showLoading(false);
        } catch (error) {
            console.error('Error refreshing analytics:', error);
            showLoading(false);
        }
    }
    
    // Update KPI summary cards
    function updateKPICards(summary) {
        const kpiValues = document.querySelectorAll('.kpi-value');
        const kpiComparisons = document.querySelectorAll('.kpi-comparison span');
        
        if (kpiValues.length >= 4 && summary) {
            // Total conversations
            kpiValues[0].textContent = formatNumber(summary.totalConversations);
            updateComparisonValue(kpiComparisons[0], summary.conversationsTrend);
            
            // Leads generated
            kpiValues[1].textContent = formatNumber(summary.leadsGenerated);
            updateComparisonValue(kpiComparisons[1], summary.leadsTrend);
            
            // Conversion rate
            kpiValues[2].textContent = summary.conversionRate + '%';
            updateComparisonValue(kpiComparisons[2], summary.conversionTrend);
            
            // Average session time
            kpiValues[3].textContent = formatTime(summary.avgSessionTime);
            updateComparisonValue(kpiComparisons[3], summary.sessionTimeTrend);
        }
    }
    
    // Update comparison value and class
    function updateComparisonValue(element, value) {
        if (element) {
            const formattedValue = Math.abs(value).toFixed(1) + '%';
            element.textContent = formattedValue;
            
            if (value >= 0) {
                element.className = 'positive';
                element.innerHTML = `+${formattedValue}`;
            } else {
                element.className = 'negative';
                element.innerHTML = `-${formattedValue}`;
            }
        }
    }
    
    // Initialize all charts
    function initCharts(data) {
        initTrendsChart(data.trends);
        initSourcesChart(data.sources);
        initEngagementChart(data.engagement);
        initOutcomesChart(data.outcomes);
        initSatisfactionChart(data.satisfaction);
        initDeviceChart(data.devices);
        initBrowserChart(data.browsers);
    }
    
    // Initialize trends chart
    function initTrendsChart(trendsData) {
        const ctx = document.getElementById('trends-chart');
        
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (trendsChart) {
            trendsChart.destroy();
        }
        
        // Prepare data based on selected chart type
        const chartData = prepareChartData(trendsData, currentFilters.chartType);
        
        // Create the chart
        trendsChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                elements: {
                    line: {
                        tension: 0.3
                    },
                    point: {
                        radius: 2,
                        hoverRadius: 4
                    }
                }
            }
        });
    }
    
    // Update trends chart based on selected chart type
    function updateTrendsChart() {
        if (!trendsChart) return;
        
        // Call API to get latest data, or use demo data
        if (window.ApiService) {
            ApiService.analytics.getConversationTrends(currentFilters.dateRange)
                .then(response => {
                    if (!response.error) {
                        const chartData = prepareChartData(response.data.trends, currentFilters.chartType);
                        trendsChart.data = chartData;
                        trendsChart.update();
                    }
                })
                .catch(error => console.error('Error updating trends chart:', error));
        } else {
            // Demo mode - use random data
            const demoData = generateDemoData();
            const chartData = prepareChartData(demoData.trends, currentFilters.chartType);
            trendsChart.data = chartData;
            trendsChart.update();
        }
    }
    
    // Prepare chart data based on selected type
    function prepareChartData(trendsData, chartType) {
        if (!trendsData) return;
        
        let labels = trendsData.labels;
        let datasets = [];
        
        if (chartType === 'conversations') {
            datasets = [
                {
                    label: 'Total Conversations',
                    data: trendsData.conversations,
                    borderColor: '#0071e3',
                    backgroundColor: 'rgba(0, 113, 227, 0.1)',
                    fill: true
                }
            ];
        } else if (chartType === 'leads') {
            datasets = [
                {
                    label: 'Leads Generated',
                    data: trendsData.leads,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    fill: true
                }
            ];
        } else if (chartType === 'conversion') {
            datasets = [
                {
                    label: 'Conversion Rate (%)',
                    data: trendsData.conversion,
                    borderColor: '#6f42c1',
                    backgroundColor: 'rgba(111, 66, 193, 0.1)',
                    fill: true
                }
            ];
        }
        
        return {
            labels: labels,
            datasets: datasets
        };
    }
    
    // Initialize sources chart (doughnut chart)
    function initSourcesChart(sourcesData) {
        const ctx = document.getElementById('sources-chart');
        
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (sourcesChart) {
            sourcesChart.destroy();
        }
        
        // Prepare data
        const labels = sourcesData.map(item => item.source);
        const data = sourcesData.map(item => item.percentage);
        const backgroundColors = [
            '#0071e3', '#4bb4fb', '#7ed6df', '#a29bfe', '#ffeaa7', '#fab1a0'
        ];
        
        // Create the chart
        sourcesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed}%`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }
    
    // Initialize engagement chart (bar chart)
    function initEngagementChart(engagementData) {
        const ctx = document.getElementById('engagement-chart');
        
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (engagementChart) {
            engagementChart.destroy();
        }
        
        // Create the chart
        engagementChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: engagementData.labels,
                datasets: [{
                    label: 'Messages per Conversation',
                    data: engagementData.messagesPerConversation,
                    backgroundColor: 'rgba(111, 66, 193, 0.7)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                barThickness: 20
            }
        });
    }
    
    // Initialize outcomes chart (pie chart)
    function initOutcomesChart(outcomesData) {
        const ctx = document.getElementById('outcomes-chart');
        
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (outcomesChart) {
            outcomesChart.destroy();
        }
        
        // Prepare data
        const labels = outcomesData.map(item => item.outcome);
        const data = outcomesData.map(item => item.percentage);
        const backgroundColors = [
            '#28a745', '#ffc107', '#dc3545', '#6c757d'
        ];
        
        // Create the chart
        outcomesChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 15
                        }
                    }
                }
            }
        });
    }
    
    // Initialize satisfaction chart (horizontal bar chart)
    function initSatisfactionChart(satisfactionData) {
        const ctx = document.getElementById('satisfaction-chart');
        
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (satisfactionChart) {
            satisfactionChart.destroy();
        }
        
        // Create the chart
        satisfactionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: satisfactionData.labels,
                datasets: [{
                    axis: 'y',
                    label: 'Satisfaction Rating',
                    data: satisfactionData.ratings,
                    backgroundColor: [
                        'rgba(220, 53, 69, 0.7)',   // 1 star - red
                        'rgba(255, 193, 7, 0.7)',   // 2 stars - yellow
                        'rgba(0, 123, 255, 0.7)',   // 3 stars - blue
                        'rgba(40, 167, 69, 0.7)',   // 4 stars - green
                        'rgba(0, 200, 81, 0.7)'     // 5 stars - bright green
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.raw}% of users`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Initialize device chart (doughnut chart)
    function initDeviceChart(deviceData) {
        const ctx = document.getElementById('device-chart');
        
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (deviceChart) {
            deviceChart.destroy();
        }
        
        // Prepare data
        const labels = deviceData.map(item => item.device);
        const data = deviceData.map(item => item.percentage);
        const backgroundColors = [
            '#0071e3', '#28a745', '#fd7e14', '#6c757d'
        ];
        
        // Create the chart
        deviceChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 15
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }
    
    // Initialize browser chart (bar chart)
    function initBrowserChart(browserData) {
        const ctx = document.getElementById('browser-chart');
        
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (browserChart) {
            browserChart.destroy();
        }
        
        // Prepare data
        const labels = browserData.map(item => item.browser);
        const data = browserData.map(item => item.percentage);
        
        // Create the chart
        browserChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Usage Percentage',
                    data: data,
                    backgroundColor: 'rgba(0, 113, 227, 0.7)',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                barThickness: 20
            }
        });
    }
    
    // Generate demo data for preview
    function generateDemoData() {
        // Generate dates for the last 7/30/90 days based on selected range
        const days = currentFilters.dateRange === '7d' ? 7 : 
                    currentFilters.dateRange === '30d' ? 30 : 90;
        
        const labels = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        
        // Generate random data for trends
        const conversations = Array.from({ length: days }, () => Math.floor(Math.random() * 500) + 100);
        const leads = Array.from({ length: days }, () => Math.floor(Math.random() * 50) + 10);
        const conversion = Array.from({ length: days }, () => (Math.random() * 15) + 5).map(val => parseFloat(val.toFixed(1)));
        
        // Calculate totals and trends
        const totalConversations = conversations.reduce((a, b) => a + b, 0);
        const leadsGenerated = leads.reduce((a, b) => a + b, 0);
        const conversionRate = parseFloat((leadsGenerated / totalConversations * 100).toFixed(1));
        const avgSessionTime = Math.floor(Math.random() * 180) + 60; // 1-4 minutes in seconds
        
        // Random trend percentages
        const conversationsTrend = (Math.random() * 30) - 10;
        const leadsTrend = (Math.random() * 20) - 5;
        const conversionTrend = (Math.random() * 10) - 5;
        const sessionTimeTrend = (Math.random() * 40) - 10;
        
        return {
            summary: {
                totalConversations,
                leadsGenerated,
                conversionRate,
                avgSessionTime,
                conversationsTrend,
                leadsTrend,
                conversionTrend,
                sessionTimeTrend
            },
            trends: {
                labels,
                conversations,
                leads,
                conversion
            },
            sources: [
                { source: 'Direct', percentage: 40 },
                { source: 'Website', percentage: 25 },
                { source: 'Facebook', percentage: 15 },
                { source: 'Google', percentage: 12 },
                { source: 'Other', percentage: 8 }
            ],
            engagement: {
                labels: ['<1', '1-3', '3-5', '5-10', '>10'],
                messagesPerConversation: [15, 35, 25, 18, 7]
            },
            outcomes: [
                { outcome: 'Lead Captured', percentage: 35 },
                { outcome: 'Question Answered', percentage: 45 },
                { outcome: 'Human Handoff', percentage: 12 },
                { outcome: 'Abandoned', percentage: 8 }
            ],
            satisfaction: {
                labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
                ratings: [3, 7, 15, 38, 37]
            },
            devices: [
                { device: 'Desktop', percentage: 48 },
                { device: 'Mobile', percentage: 42 },
                { device: 'Tablet', percentage: 8 },
                { device: 'Other', percentage: 2 }
            ],
            browsers: [
                { browser: 'Chrome', percentage: 58 },
                { browser: 'Safari', percentage: 22 },
                { browser: 'Firefox', percentage: 10 },
                { browser: 'Edge', percentage: 8 },
                { browser: 'Other', percentage: 2 }
            ]
        };
    }
    
    // Export analytics data
    function exportAnalytics() {
        showNotification('Exporting analytics data...', 'info');
        
        setTimeout(() => {
            showNotification('Analytics data exported successfully!', 'success');
        }, 1500);
    }
    
    // Show loading indicator
    function showLoading(isLoading) {
        // Implementation would add/remove loading spinners
        console.log(isLoading ? 'Loading analytics data...' : 'Analytics data loaded');
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        // Check if notification container exists, if not create it
        let notificationContainer = document.querySelector('.notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                }
                .notification {
                    background-color: white;
                    border-radius: 4px;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.15);
                    padding: 15px 20px;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    min-width: 300px;
                    transform: translateX(120%);
                    transition: transform 0.3s ease;
                }
                .notification.show {
                    transform: translateX(0);
                }
                .notification.success {
                    border-left: 4px solid #28a745;
                }
                .notification.error {
                    border-left: 4px solid #dc3545;
                }
                .notification.info {
                    border-left: 4px solid #0071e3;
                }
                .notification i {
                    margin-right: 10px;
                    font-size: 18px;
                }
                .notification.success i {
                    color: #28a745;
                }
                .notification.error i {
                    color: #dc3545;
                }
                .notification.info i {
                    color: #0071e3;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        notificationContainer.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    // Helper functions
    function formatNumber(num) {
        return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num;
    }
    
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }
    
    // Initialize
    initAnalytics();
});
