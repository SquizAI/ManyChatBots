document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const closeSidebar = document.querySelector('.close-sidebar');
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const contentSections = document.querySelectorAll('.content-section');
    
    // Toggle sidebar on mobile
    menuToggle.addEventListener('click', function() {
        sidebar.classList.add('active');
    });
    
    closeSidebar.addEventListener('click', function() {
        sidebar.classList.remove('active');
    });
    
    // Navigation handling
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(link => {
                link.parentElement.classList.remove('active');
            });
            
            // Add active class to clicked link
            this.parentElement.classList.add('active');
            
            // Get the target section
            const targetSection = this.getAttribute('data-section');
            
            // Hide all sections
            contentSections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Show target section
            document.getElementById(`${targetSection}-section`).classList.add('active');
            
            // Close sidebar on mobile after navigation
            if (window.innerWidth < 992) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // Initialize data fetching functions
    initDashboard();
    
    // Demo data fetching function - in a real app, these would fetch from API
    function initDashboard() {
        fetchUserStats();
        fetchChatbotStats();
        fetchConsultationStats();
        fetchRecentActivity();
    }
    
    function fetchUserStats() {
        // This would be an API call in production
        console.log('Fetching user statistics...');
        // Simulate data update with random values for demo purposes
        updateRandomStats();
    }
    
    function fetchChatbotStats() {
        console.log('Fetching chatbot statistics...');
    }
    
    function fetchConsultationStats() {
        console.log('Fetching consultation statistics...');
    }
    
    function fetchRecentActivity() {
        console.log('Fetching recent activity...');
    }
    
    // Demo function to randomize dashboard stats
    function updateRandomStats() {
        const statValues = document.querySelectorAll('.stat-info h3');
        const trends = document.querySelectorAll('.stat-trend');
        
        statValues.forEach((stat, index) => {
            const randomChange = Math.floor(Math.random() * 10) - 3; // Random value between -3 and +6
            
            if (randomChange >= 0) {
                trends[index].classList.add('positive');
                trends[index].classList.remove('negative');
                trends[index].innerHTML = `<i class="fas fa-arrow-up"></i> ${randomChange}%`;
            } else {
                trends[index].classList.add('negative');
                trends[index].classList.remove('positive');
                trends[index].innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(randomChange)}%`;
            }
        });
    }
    
    // User management functionality
    initUserTable();
    
    function initUserTable() {
        const userRows = document.querySelectorAll('.data-table tbody tr');
        
        userRows.forEach(row => {
            // Add click handlers for action buttons
            const actionButtons = row.querySelectorAll('.table-actions button');
            
            actionButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    const action = this.querySelector('i').classList.contains('fa-edit') ? 'edit' :
                                  this.querySelector('i').classList.contains('fa-envelope') ? 'message' : 'more';
                    
                    const userName = row.querySelector('.user-name span').textContent;
                    
                    handleUserAction(userName, action);
                });
            });
        });
    }
    
    function handleUserAction(userName, action) {
        console.log(`Action: ${action} for user: ${userName}`);
        
        // Demo implementation - would be replaced with actual functionality
        switch(action) {
            case 'edit':
                alert(`Edit user profile for ${userName}`);
                break;
            case 'message':
                alert(`Send message to ${userName}`);
                break;
            case 'more':
                alert(`More options for ${userName}`);
                break;
        }
    }
    
    // Simulate API data loading with randomized stats update every 30 seconds
    setInterval(updateRandomStats, 30000);
    
    // Handle pagination
    const paginationButtons = document.querySelectorAll('.pagination-pages button');
    
    paginationButtons.forEach(button => {
        button.addEventListener('click', function() {
            paginationButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // In a real app, this would fetch the next page of data
            console.log(`Loading page ${this.textContent}`);
        });
    });
    
    // Handle table filters
    const filterButton = document.querySelector('.filter-actions .btn-secondary');
    
    if (filterButton) {
        filterButton.addEventListener('click', function() {
            const planFilter = document.querySelector('.filter-actions select:first-child').value;
            const roleFilter = document.querySelector('.filter-actions select:last-child').value;
            
            console.log(`Filtering: Plan=${planFilter}, Role=${roleFilter}`);
            // This would trigger a filtered data fetch in a real app
        });
    }
    
    // Handle logout
    const logoutBtn = document.querySelector('.logout-btn');
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (confirm('Are you sure you want to logout?')) {
            console.log('User logged out');
            // In a real app, this would call a logout API endpoint and redirect
            alert('You have been logged out!');
        }
    });
    
    // Connect to the API for real-time data (simulated)
    connectToAPIServer();
    
    function connectToAPIServer() {
        console.log('Connecting to API server...');
        setTimeout(() => {
            console.log('Connected to API server.');
            
            // Fetch initial data
            fetchDashboardData();
        }, 1000);
    }
    
    function fetchDashboardData() {
        // This would be replaced with actual API calls in production
        console.log('Fetching dashboard data...');
        
        // Simulate API response time
        setTimeout(() => {
            console.log('Dashboard data loaded successfully!');
        }, 1500);
    }
    
    // Handle notifications
    const notificationBell = document.querySelector('.notifications');
    
    if (notificationBell) {
        notificationBell.addEventListener('click', function() {
            alert('Notifications panel would open here.');
            // In a real app, this would open a notifications dropdown
        });
    }
    
    // Handle search functionality
    const searchInput = document.querySelector('.search-bar input');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    console.log(`Searching for: ${searchTerm}`);
                    alert(`Search results for: ${searchTerm}`);
                    // In a real app, this would perform a global search
                }
            }
        });
    }
    
    // Initialize charts (placeholder for real charts implementation)
    initSystemStatusCharts();
    
    function initSystemStatusCharts() {
        // This would use a charting library in a real app
        console.log('Initializing system charts...');
        
        // Update progress bars with random data for demo
        const progressBars = document.querySelectorAll('.status-progress');
        
        progressBars.forEach(bar => {
            const randomValue = 30 + Math.floor(Math.random() * 70); // Random between 30-100
            bar.style.width = `${randomValue}%`;
            
            const valueElement = bar.closest('.status-item').querySelector('.status-value');
            
            // Update status text
            if (randomValue > 80) {
                valueElement.textContent = `Healthy (${randomValue}%)`;
                valueElement.className = 'status-value green';
            } else if (randomValue > 50) {
                valueElement.textContent = `Moderate (${randomValue}%)`;
                valueElement.className = 'status-value orange';
            } else {
                valueElement.textContent = `Warning (${randomValue}%)`;
                valueElement.className = 'status-value red';
            }
        });
    }
});
