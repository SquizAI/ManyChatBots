document.addEventListener('DOMContentLoaded', function() {
    // Toggle sidebar on mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const closeSidebar = document.querySelector('.close-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
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
    
    // Close sidebar when clicking outside
    document.addEventListener('click', function(event) {
        if (sidebar.classList.contains('active') && 
            !sidebar.contains(event.target) && 
            event.target !== menuToggle) {
            sidebar.classList.remove('active');
        }
    });
    
    // Simulated API data loading (would be replaced with actual API calls)
    function loadDashboardData() {
        // This is where you would make API calls to your backend
        console.log('Loading dashboard data...');
        
        // Simulate API delay
        setTimeout(() => {
            // Update dashboard with data
            updateNotifications();
        }, 1000);
    }
    
    function updateNotifications() {
        // Update notification badge when new messages come in
        const badge = document.querySelector('.notifications .badge');
        const count = Math.floor(Math.random() * 5) + 1;
        badge.textContent = count;
    }
    
    // Initialize dashboard
    loadDashboardData();
    
    // Handle navigation
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(link => {
                link.parentElement.classList.remove('active');
            });
            
            // Add active class to clicked link
            this.parentElement.classList.add('active');
            
            // Show appropriate section (in a real app, this would load content or redirect)
            const section = this.getAttribute('href').substring(1);
            console.log(`Navigating to ${section}`);
            
            // Close sidebar on mobile after navigation
            if (window.innerWidth < 992) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // Handle logout
    const logoutBtn = document.querySelector('.logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Are you sure you want to log out?')) {
                console.log('Logging out...');
                // In a real app, this would call your logout API endpoint
                // window.location.href = '/login';
            }
        });
    }
    
    // Chatbot actions
    const actionButtons = document.querySelectorAll('.action-buttons .btn-icon');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.querySelector('i').className;
            const chatbotRow = this.closest('tr');
            const chatbotName = chatbotRow.querySelector('.chatbot-name h4').textContent;
            
            if (action.includes('fa-edit')) {
                console.log(`Edit ${chatbotName}`);
                // This would open the chatbot editor
            } else if (action.includes('fa-chart-bar')) {
                console.log(`View analytics for ${chatbotName}`);
                // This would show detailed analytics
            } else if (action.includes('fa-ellipsis-v')) {
                console.log(`More options for ${chatbotName}`);
                // This would show a dropdown with more options
            }
        });
    });
    
    // Simulated real-time updates (for demo purposes)
    function simulateRealTimeUpdates() {
        setInterval(() => {
            // Randomly update conversation count
            const conversationStats = document.querySelector('.stats-card:first-child .stats-card-content h3');
            if (conversationStats) {
                const currentValue = parseInt(conversationStats.textContent.replace(',', ''));
                const newValue = currentValue + Math.floor(Math.random() * 10);
                conversationStats.textContent = newValue.toLocaleString();
            }
            
            // Add a new conversation occasionally
            if (Math.random() > 0.7) {
                addNewConversation();
            }
        }, 10000); // Every 10 seconds
    }
    
    function addNewConversation() {
        const conversationsList = document.querySelector('.conversations-list');
        if (!conversationsList) return;
        
        const names = ['Alex Johnson', 'Taylor Smith', 'Jordan Brown', 'Casey Lee', 'Morgan Wilson'];
        const messages = [
            'How much does your service cost?',
            'Can you integrate with my website?',
            'Do you offer a trial period?',
            'I need help setting up my chatbot',
            'Is there any setup fee?'
        ];
        
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const initials = randomName.split(' ').map(n => n[0]).join('');
        
        const newConversation = document.createElement('div');
        newConversation.className = 'conversation-item';
        newConversation.innerHTML = `
            <div class="conversation-avatar">
                <span>${initials}</span>
            </div>
            <div class="conversation-content">
                <div class="conversation-header">
                    <h4>${randomName}</h4>
                    <span class="conversation-time">Just now</span>
                </div>
                <p>${randomMessage}</p>
            </div>
        `;
        
        // Add with fade-in effect
        newConversation.style.opacity = '0';
        conversationsList.prepend(newConversation);
        
        // Remove oldest conversation if more than 3
        if (conversationsList.children.length > 3) {
            conversationsList.removeChild(conversationsList.lastChild);
        }
        
        // Fade in
        setTimeout(() => {
            newConversation.style.transition = 'opacity 0.5s ease';
            newConversation.style.opacity = '1';
        }, 10);
    }
    
    // Start simulated updates
    simulateRealTimeUpdates();
});
