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
    const searchBar = document.querySelector('.search-bar input');
    const chatbotFilter = document.getElementById('chatbot-filter');
    const dateRangeFilter = document.getElementById('date-range-filter');
    const statusFilter = document.getElementById('status-filter');
    const exportBtn = document.getElementById('export-conversations');
    const conversationItems = document.querySelectorAll('.conversation-item');
    const actionTabs = document.querySelectorAll('.action-tabs .tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const addNoteBtn = document.querySelector('.add-note button');
    const addTagBtn = document.querySelector('.add-tag button');
    
    // State
    let currentFilters = {
        search: '',
        chatbot: 'all',
        dateRange: '7d',
        status: 'all'
    };
    
    let currentConversationId = 'conv1'; // Default selected conversation
    
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
    
    // Filter change event handlers
    if (searchBar) {
        searchBar.addEventListener('input', function() {
            currentFilters.search = this.value.toLowerCase();
            applyFilters();
        });
    }
    
    if (chatbotFilter) {
        chatbotFilter.addEventListener('change', function() {
            currentFilters.chatbot = this.value;
            applyFilters();
        });
    }
    
    if (dateRangeFilter) {
        dateRangeFilter.addEventListener('change', function() {
            currentFilters.dateRange = this.value;
            applyFilters();
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            currentFilters.status = this.value;
            applyFilters();
        });
    }
    
    // Export button
    if (exportBtn) {
        exportBtn.addEventListener('click', exportConversations);
    }
    
    // Conversation list item click
    conversationItems.forEach(item => {
        item.addEventListener('click', function() {
            const conversationId = this.getAttribute('data-id');
            selectConversation(conversationId);
        });
    });
    
    // Tab switching logic
    actionTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            actionTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Add note button
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', function() {
            const noteTextarea = document.querySelector('.add-note textarea');
            const noteText = noteTextarea.value.trim();
            
            if (noteText) {
                addNote(noteText);
                noteTextarea.value = '';
            }
        });
    }
    
    // Add tag button
    if (addTagBtn) {
        addTagBtn.addEventListener('click', function() {
            const tagInput = document.querySelector('.add-tag input');
            const tagText = tagInput.value.trim();
            
            if (tagText) {
                addTag(tagText);
                tagInput.value = '';
            }
        });
    }
    
    // Initialize conversations
    function initConversations() {
        loadConversations();
        // Select the first conversation by default
        if (conversationItems.length > 0) {
            selectConversation(currentConversationId);
        }
    }
    
    // Load conversations from API
    async function loadConversations() {
        try {
            if (window.ApiService) {
                showLoading(true);
                
                const response = await ApiService.conversations.getAllConversations();
                
                if (response.error) {
                    showNotification('Failed to load conversations: ' + response.message, 'error');
                    showLoading(false);
                    return;
                }
                
                // Populate the conversation list with the data
                populateConversationList(response.data);
                showLoading(false);
            } else {
                // Demo mode - use default conversations that are already in the HTML
                console.log('Using demo conversation data');
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            showLoading(false);
        }
    }
    
    // Populate the conversation list
    function populateConversationList(conversations) {
        if (!conversations || !conversations.length) return;
        
        const conversationList = document.querySelector('.conversation-list');
        if (!conversationList) return;
        
        // Clear existing conversations
        conversationList.innerHTML = '';
        
        // Add each conversation to the list
        conversations.forEach(conversation => {
            const { _id, visitor, source, createdAt, status, preview, messageCount, duration } = conversation;
            
            const conversationItem = document.createElement('div');
            conversationItem.className = 'conversation-item';
            conversationItem.setAttribute('data-id', _id);
            
            const formattedTime = formatTimestamp(createdAt);
            const durationFormatted = formatDuration(duration);
            
            conversationItem.innerHTML = `
                <div class="conversation-info">
                    <div class="user-info">
                        <div class="avatar">
                            <span>${getInitials(visitor.name)}</span>
                        </div>
                        <div class="details">
                            <h4>${visitor.name}</h4>
                            <div class="source">
                                <i class="${getSourceIcon(source)}"></i> ${source}
                            </div>
                        </div>
                    </div>
                    <div class="conversation-meta">
                        <div class="timestamp">${formattedTime}</div>
                        <div class="status ${status.toLowerCase()}">${formatStatus(status)}</div>
                    </div>
                </div>
                <div class="conversation-preview">
                    <p>${preview}</p>
                </div>
                <div class="conversation-metrics">
                    <div class="metric">
                        <i class="fas fa-comment"></i> ${messageCount} messages
                    </div>
                    <div class="metric">
                        <i class="fas fa-clock"></i> ${durationFormatted}
                    </div>
                </div>
            `;
            
            conversationItem.addEventListener('click', function() {
                selectConversation(_id);
            });
            
            conversationList.appendChild(conversationItem);
        });
    }
    
    // Apply filters to conversation list
    function applyFilters() {
        const { search, chatbot, dateRange, status } = currentFilters;
        
        conversationItems.forEach(item => {
            let show = true;
            
            // Apply search filter
            if (search) {
                const userName = item.querySelector('.details h4').textContent.toLowerCase();
                const preview = item.querySelector('.conversation-preview').textContent.toLowerCase();
                if (!userName.includes(search) && !preview.includes(search)) {
                    show = false;
                }
            }
            
            // Apply chatbot filter
            if (chatbot !== 'all') {
                // In a real implementation, would check if the conversation is from the selected chatbot
                // For now, we'll just filter by a data attribute we could add
                const itemChatbot = item.getAttribute('data-chatbot') || '';
                if (itemChatbot !== chatbot) {
                    // Disabling this check for the demo since we don't have the data attribute
                    // show = false;
                }
            }
            
            // Apply status filter
            if (status !== 'all') {
                const itemStatus = item.querySelector('.status').classList.contains(status);
                if (!itemStatus) {
                    show = false;
                }
            }
            
            item.style.display = show ? 'block' : 'none';
        });
    }
    
    // Select a conversation and load its details
    async function selectConversation(conversationId) {
        // Update current conversation ID
        currentConversationId = conversationId;
        
        // Update active item in the list
        conversationItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-id') === conversationId) {
                item.classList.add('active');
            }
        });
        
        try {
            if (window.ApiService) {
                showLoading(true);
                
                const response = await ApiService.conversations.getConversationById(conversationId);
                
                if (response.error) {
                    showNotification('Failed to load conversation details: ' + response.message, 'error');
                    showLoading(false);
                    return;
                }
                
                // Populate the conversation detail view with the data
                populateConversationDetail(response.data);
                showLoading(false);
            } else {
                // Demo mode - just update UI to show the selected conversation is active
                // We're keeping the default content that's already in the HTML
                console.log(`Selected conversation: ${conversationId}`);
            }
        } catch (error) {
            console.error('Error loading conversation details:', error);
            showLoading(false);
        }
    }
    
    // Populate the conversation detail view
    function populateConversationDetail(conversation) {
        if (!conversation) return;
        
        // In a real implementation, we would update all the details of the conversation
        // For this demo, we're using default content that's already in the HTML
        console.log('Loaded conversation details:', conversation);
    }
    
    // Add a note to the current conversation
    async function addNote(text) {
        if (!text || !currentConversationId) return;
        
        try {
            if (window.ApiService) {
                const response = await ApiService.conversations.addNote(currentConversationId, text);
                
                if (response.error) {
                    showNotification('Failed to add note: ' + response.message, 'error');
                    return;
                }
                
                // Add the note to the UI
                addNoteToUI(response.data);
                showNotification('Note added successfully', 'success');
            } else {
                // Demo mode - add a mock note to the UI
                const noteData = {
                    _id: 'note_' + Date.now(),
                    author: {
                        name: 'John Smith'
                    },
                    content: text,
                    createdAt: new Date().toISOString()
                };
                
                addNoteToUI(noteData);
                showNotification('Note added successfully', 'success');
            }
        } catch (error) {
            console.error('Error adding note:', error);
        }
    }
    
    // Add a note to the UI
    function addNoteToUI(note) {
        if (!note) return;
        
        const notesContainer = document.querySelector('.notes-container');
        if (!notesContainer) return;
        
        const { author, content, createdAt } = note;
        const formattedDate = formatTimestamp(createdAt, true);
        
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.innerHTML = `
            <div class="note-header">
                <span class="note-author">${author.name}</span>
                <span class="note-date">${formattedDate}</span>
            </div>
            <div class="note-content">
                <p>${content}</p>
            </div>
        `;
        
        notesContainer.prepend(noteItem);
    }
    
    // Add a tag to the current conversation
    async function addTag(tagText) {
        if (!tagText || !currentConversationId) return;
        
        try {
            if (window.ApiService) {
                const response = await ApiService.conversations.addTag(currentConversationId, tagText);
                
                if (response.error) {
                    showNotification('Failed to add tag: ' + response.message, 'error');
                    return;
                }
                
                // Add the tag to the UI
                addTagToUI(tagText);
                showNotification('Tag added successfully', 'success');
            } else {
                // Demo mode - add the tag to the UI
                addTagToUI(tagText);
                showNotification('Tag added successfully', 'success');
            }
        } catch (error) {
            console.error('Error adding tag:', error);
        }
    }
    
    // Add a tag to the UI
    function addTagToUI(tagText) {
        if (!tagText) return;
        
        const tagsContainer = document.querySelector('.current-tags');
        if (!tagsContainer) return;
        
        // Check if tag already exists
        const existingTags = tagsContainer.querySelectorAll('.tag');
        let tagExists = false;
        
        existingTags.forEach(tag => {
            if (tag.textContent.toLowerCase() === tagText.toLowerCase()) {
                tagExists = true;
            }
        });
        
        if (tagExists) {
            showNotification('Tag already exists', 'info');
            return;
        }
        
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tagText;
        
        tagsContainer.appendChild(tagElement);
    }
    
    // Export conversations
    function exportConversations() {
        showNotification('Exporting conversations...', 'info');
        
        setTimeout(() => {
            showNotification('Conversations exported successfully!', 'success');
        }, 1500);
    }
    
    // Show loading indicator
    function showLoading(isLoading) {
        // Implementation would add/remove loading spinners
        console.log(isLoading ? 'Loading conversations...' : 'Conversations loaded');
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
    
    // Helper Functions
    
    // Get initials from name
    function getInitials(name) {
        if (!name) return 'U';
        return name.split(' ').map(part => part.charAt(0)).join('').toUpperCase();
    }
    
    // Get icon class for source
    function getSourceIcon(source) {
        if (!source) return 'fas fa-globe';
        
        source = source.toLowerCase();
        
        if (source.includes('facebook')) return 'fab fa-facebook';
        if (source.includes('twitter')) return 'fab fa-twitter';
        if (source.includes('instagram')) return 'fab fa-instagram';
        if (source.includes('linkedin')) return 'fab fa-linkedin';
        if (source.includes('google')) return 'fab fa-google';
        
        return 'fas fa-globe';
    }
    
    // Format timestamp
    function formatTimestamp(timestamp, includeTime = false) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const isToday = date.toDateString() === now.toDateString();
        const isYesterday = date.toDateString() === yesterday.toDateString();
        
        const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        if (isToday) {
            return `Today, ${time}`;
        } else if (isYesterday) {
            return `Yesterday, ${time}`;
        } else {
            const options = includeTime 
                ? { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                : { month: 'long', day: 'numeric', year: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        }
    }
    
    // Format duration
    function formatDuration(seconds) {
        if (!seconds) return '0m 0s';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        return `${minutes}m ${remainingSeconds}s`;
    }
    
    // Format status
    function formatStatus(status) {
        if (!status) return '';
        
        if (status === 'LEAD') return 'Lead';
        if (status === 'ANSWERED') return 'Answered';
        if (status === 'HANDOFF') return 'Handoff';
        if (status === 'ABANDONED') return 'Abandoned';
        
        return status;
    }
    
    // Initialize
    initConversations();
});
