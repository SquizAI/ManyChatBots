document.addEventListener('DOMContentLoaded', function() {
    // Check for authentication
    if (!localStorage.getItem('token') && !window.location.pathname.includes('login.html')) {
        window.location.href = '/dashboard/login.html';
        return;
    }

    // Elements
    const menuToggle = document.querySelector('.menu-toggle');
    const closeSidebar = document.querySelector('.close-sidebar');
    const sidebar = document.querySelector('.sidebar');
    const steps = document.querySelectorAll('.step');
    const prevButton = document.getElementById('prev-step');
    const nextButton = document.getElementById('next-step');
    const builderTitle = document.getElementById('builder-title');
    const allStepContents = document.querySelectorAll('.builder-step-content');
    
    // Form elements
    const chatbotNameInput = document.getElementById('chatbot-name');
    const chatbotDescriptionInput = document.getElementById('chatbot-description');
    const greetingMessageInput = document.getElementById('greeting-message');
    const followUpMessageInput = document.getElementById('follow-up-message');
    const themeColorInput = document.getElementById('theme-color');
    
    // Preview elements
    const previewName = document.getElementById('preview-name');
    const previewGreeting = document.getElementById('preview-greeting');
    const previewTrigger = document.getElementById('preview-trigger');
    const previewPanel = document.querySelector('.preview-panel');
    const previewClose = document.querySelector('.preview-close');
    const deviceToggles = document.querySelectorAll('.device-toggle');
    const previewContainer = document.querySelector('.preview-container');
    
    // Initialize variables
    let currentStep = 0;
    const stepIds = ['basics', 'welcome', 'knowledge', 'behavior', 'settings'];
    const defaultChatbot = {
        name: 'My Chatbot',
        description: '',
        themeColor: '#0071e3',
        avatar: {
            type: 'color',
            value: '#0071e3'
        },
        welcomeMessages: {
            greeting: 'Hello! How can I help you today?',
            followUp: 'I can answer questions about our products, services, or provide support.'
        },
        quickReplies: [
            'Products',
            'Pricing',
            'Support'
        ],
        offlineMessage: 'Sorry, I\'m currently offline. Please leave a message and we\'ll get back to you.',
        knowledge: {
            type: 'faq',
            items: [
                {
                    question: 'What are your business hours?',
                    answer: 'Our business hours are 9 AM to 5 PM, Monday through Friday.'
                }
            ]
        },
        personality: 'professional',
        skills: {
            appointmentBooking: false,
            leadCapture: true,
            productRecommendations: false,
            humanHandoff: true
        },
        settings: {
            position: 'bottom-right',
            responseTime: 1.5,
            autoStart: false,
            rememberConversations: true,
            businessHours: {
                monday: { enabled: true, start: '09:00', end: '17:00' }
                // Other days would be defined here
            }
        }
    };
    
    // For editing existing chatbot
    let editMode = false;
    let chatbotId = null;
    let chatbotData = {...defaultChatbot};
    
    // Initialize builder
    function initBuilder() {
        // Check if we're editing an existing chatbot
        const urlParams = new URLSearchParams(window.location.search);
        chatbotId = urlParams.get('id');
        
        if (chatbotId) {
            editMode = true;
            builderTitle.textContent = 'Edit Chatbot';
            loadChatbotData(chatbotId);
        } else {
            populateForm(chatbotData);
        }
        
        setupEventListeners();
        updateUI();
    }
    
    // Load existing chatbot data
    async function loadChatbotData(id) {
        try {
            showSaving(true, 'Loading chatbot...');
            
            // Get chatbot data from API
            if (window.ApiService) {
                const response = await ApiService.chatbots.getChatbot(id);
                
                if (response.error) {
                    showNotification('Failed to load chatbot: ' + response.message, 'error');
                    return;
                }
                
                chatbotData = response.data;
            } else {
                // Demo mode - simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                // Use default data with a different name for demo
                chatbotData.name = 'Sales Assistant';
                chatbotData.description = 'Helps customers with product information and captures leads.';
            }
            
            // Populate form with chatbot data
            populateForm(chatbotData);
            
            showSaving(false, 'Chatbot loaded successfully');
        } catch (error) {
            console.error('Error loading chatbot:', error);
            showNotification('Failed to load chatbot data', 'error');
            showSaving(false);
        }
    }
    
    // Populate form with chatbot data
    function populateForm(data) {
        // Basic info
        chatbotNameInput.value = data.name;
        chatbotDescriptionInput.value = data.description || '';
        themeColorInput.value = data.themeColor;
        document.querySelector('.color-preview').style.backgroundColor = data.themeColor;
        
        // Welcome messages
        if (data.welcomeMessages) {
            greetingMessageInput.value = data.welcomeMessages.greeting;
            followUpMessageInput.value = data.welcomeMessages.followUp || '';
        }
        
        // Update preview
        updatePreview();
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Sidebar toggle
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
        
        // Step navigation
        steps.forEach((step, index) => {
            step.addEventListener('click', function() {
                navigateToStep(index);
            });
        });
        
        // Prev/Next buttons
        prevButton.addEventListener('click', function() {
            if (currentStep > 0) {
                navigateToStep(currentStep - 1);
            }
        });
        
        nextButton.addEventListener('click', function() {
            if (validateCurrentStep()) {
                if (currentStep < steps.length - 1) {
                    navigateToStep(currentStep + 1);
                } else {
                    saveChatbot();
                }
            }
        });
        
        // Form input changes
        chatbotNameInput.addEventListener('input', function() {
            chatbotData.name = this.value;
            updatePreview();
            autoSave();
        });
        
        chatbotDescriptionInput.addEventListener('input', function() {
            chatbotData.description = this.value;
            autoSave();
        });
        
        greetingMessageInput.addEventListener('input', function() {
            if (!chatbotData.welcomeMessages) chatbotData.welcomeMessages = {};
            chatbotData.welcomeMessages.greeting = this.value;
            updatePreview();
            autoSave();
        });
        
        followUpMessageInput.addEventListener('input', function() {
            if (!chatbotData.welcomeMessages) chatbotData.welcomeMessages = {};
            chatbotData.welcomeMessages.followUp = this.value;
            autoSave();
        });
        
        // Color picker
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', function() {
                const color = this.getAttribute('data-color');
                themeColorInput.value = color;
                document.querySelector('.color-preview').style.backgroundColor = color;
                chatbotData.themeColor = color;
                updatePreview();
                autoSave();
            });
        });
        
        // Preview panel
        document.addEventListener('keydown', function(e) {
            // Toggle preview with P key
            if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                togglePreview();
            }
        });
        
        // Preview controls
        if (previewClose) {
            previewClose.addEventListener('click', function() {
                previewPanel.classList.remove('active');
            });
        }
        
        // Device toggle
        deviceToggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                deviceToggles.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                const device = this.getAttribute('data-device');
                previewContainer.className = `preview-container ${device}`;
            });
        });
        
        // Training method selection
        const trainingMethods = document.querySelectorAll('.training-method');
        trainingMethods.forEach(method => {
            method.addEventListener('click', function() {
                const methodType = this.getAttribute('data-method');
                
                // Update UI
                trainingMethods.forEach(m => m.classList.remove('active'));
                this.classList.add('active');
                
                // Update training content visibility
                document.querySelectorAll('.training-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${methodType}-training`).classList.add('active');
                
                // Update data
                chatbotData.knowledge = chatbotData.knowledge || {};
                chatbotData.knowledge.type = methodType;
                autoSave();
            });
        });
        
        // Personality selection
        const personalityOptions = document.querySelectorAll('.personality-option');
        personalityOptions.forEach(option => {
            option.addEventListener('click', function() {
                const personality = this.getAttribute('data-personality');
                
                // Update UI
                personalityOptions.forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                
                // Update data
                chatbotData.personality = personality;
                autoSave();
            });
        });
        
        // Toggle switches
        const toggleInputs = document.querySelectorAll('.toggle-input');
        toggleInputs.forEach(toggle => {
            toggle.addEventListener('change', function() {
                const skill = this.id.replace('-toggle', '');
                
                // Update data
                if (!chatbotData.skills) chatbotData.skills = {};
                chatbotData.skills[skill] = this.checked;
                autoSave();
            });
        });
        
        // Add FAQ button
        const addFaqBtn = document.querySelector('.add-faq-btn');
        if (addFaqBtn) {
            addFaqBtn.addEventListener('click', function() {
                addFaqItem();
            });
        }
        
        // Add quick reply button
        const addReplyBtn = document.querySelector('.add-reply-btn');
        if (addReplyBtn) {
            addReplyBtn.addEventListener('click', function() {
                addQuickReply();
            });
        }
        
        // Delete quick reply buttons
        document.addEventListener('click', function(e) {
            if (e.target.closest('.delete-btn')) {
                const deleteBtn = e.target.closest('.delete-btn');
                if (deleteBtn.closest('.quick-reply-item')) {
                    deleteQuickReply(deleteBtn.closest('.quick-reply-item'));
                } else if (deleteBtn.closest('.faq-item')) {
                    deleteFaqItem(deleteBtn.closest('.faq-item'));
                }
            }
        });
        
        // Position selection
        const positionOptions = document.querySelectorAll('.position-option');
        positionOptions.forEach(option => {
            option.addEventListener('click', function() {
                const position = this.getAttribute('data-position');
                
                // Update UI
                positionOptions.forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                
                // Update data
                if (!chatbotData.settings) chatbotData.settings = {};
                chatbotData.settings.position = position;
                autoSave();
            });
        });
        
        // Avatar upload
        const uploadBtn = document.querySelector('.upload-avatar-btn');
        const avatarUpload = document.getElementById('avatar-upload');
        
        if (uploadBtn && avatarUpload) {
            uploadBtn.addEventListener('click', function() {
                avatarUpload.click();
            });
            
            avatarUpload.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        document.getElementById('avatar-image').src = e.target.result;
                        chatbotData.avatar = {
                            type: 'image',
                            value: e.target.result
                        };
                        autoSave();
                    };
                    
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }
        
        // Avatar colors
        const avatarColors = document.querySelectorAll('.avatar-colors .color-option');
        avatarColors.forEach(color => {
            color.addEventListener('click', function() {
                const colorValue = this.getAttribute('data-color');
                document.getElementById('avatar-image').src = 'https://via.placeholder.com/100';
                chatbotData.avatar = {
                    type: 'color',
                    value: colorValue
                };
                autoSave();
            });
        });
    }
    
    // Navigate to a specific step
    function navigateToStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= steps.length) return;
        
        // Update current step
        currentStep = stepIndex;
        
        // Update step indicators
        steps.forEach((step, index) => {
            if (index === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Update step content
        allStepContents.forEach(content => {
            content.classList.remove('active');
        });
        
        const currentStepId = stepIds[currentStep];
        document.getElementById(`${currentStepId}-content`).classList.add('active');
        
        // Update buttons
        prevButton.disabled = currentStep === 0;
        
        if (currentStep === steps.length - 1) {
            nextButton.textContent = editMode ? 'Save Changes' : 'Create Chatbot';
        } else {
            const nextStepName = steps[currentStep + 1].querySelector('h3').textContent;
            nextButton.textContent = `Next: ${nextStepName}`;
        }
        
        // Update UI
        updateUI();
    }
    
    // Validate current step
    function validateCurrentStep() {
        const currentStepId = stepIds[currentStep];
        
        // Basic validation rules
        if (currentStepId === 'basics') {
            if (!chatbotNameInput.value.trim()) {
                showNotification('Please enter a chatbot name', 'error');
                chatbotNameInput.focus();
                return false;
            }
        } else if (currentStepId === 'welcome') {
            if (!greetingMessageInput.value.trim()) {
                showNotification('Please enter a greeting message', 'error');
                greetingMessageInput.focus();
                return false;
            }
        }
        
        return true;
    }
    
    // Update preview
    function updatePreview() {
        // Update chatbot name
        if (previewName) {
            previewName.textContent = chatbotData.name || 'My Chatbot';
        }
        
        // Update greeting message
        if (previewGreeting && chatbotData.welcomeMessages) {
            previewGreeting.textContent = chatbotData.welcomeMessages.greeting || 'Hello! How can I help you today?';
        }
        
        // Update theme color
        if (chatbotData.themeColor) {
            const chatHeader = document.querySelector('.chat-header');
            const chatTrigger = document.querySelector('.chat-trigger');
            const sendButton = document.querySelector('.chat-input button');
            
            if (chatHeader) chatHeader.style.backgroundColor = chatbotData.themeColor;
            if (chatTrigger) chatTrigger.style.backgroundColor = chatbotData.themeColor;
            if (sendButton) sendButton.style.backgroundColor = chatbotData.themeColor;
        }
    }
    
    // Toggle preview panel
    function togglePreview() {
        previewPanel.classList.toggle('active');
        updatePreview();
    }
    
    // Add a new FAQ item
    function addFaqItem() {
        const faqItems = document.querySelector('.faq-items');
        const newItem = document.createElement('div');
        newItem.className = 'faq-item';
        
        const itemCount = document.querySelectorAll('.faq-item').length + 1;
        
        newItem.innerHTML = `
            <div class="faq-header">
                <h4>Question & Answer Pair #${itemCount}</h4>
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
            <div class="faq-body">
                <div class="form-group">
                    <label>Question</label>
                    <input type="text" class="form-control faq-question" placeholder="Enter a question">
                </div>
                <div class="form-group">
                    <label>Answer</label>
                    <textarea class="form-control faq-answer" rows="3" placeholder="Enter the answer"></textarea>
                </div>
            </div>
        `;
        
        // Insert before the add button
        faqItems.insertBefore(newItem, document.querySelector('.add-faq-btn'));
        
        // Setup event listeners for the new inputs
        const questionInput = newItem.querySelector('.faq-question');
        const answerInput = newItem.querySelector('.faq-answer');
        
        questionInput.addEventListener('input', updateFaqData);
        answerInput.addEventListener('input', updateFaqData);
        
        // Update chatbot data
        updateFaqData();
    }
    
    // Delete an FAQ item
    function deleteFaqItem(item) {
        if (confirm('Are you sure you want to delete this question & answer pair?')) {
            item.remove();
            updateFaqData();
        }
    }
    
    // Update FAQ data
    function updateFaqData() {
        const faqItems = document.querySelectorAll('.faq-item');
        const faqs = [];
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question').value;
            const answer = item.querySelector('.faq-answer').value;
            
            if (question || answer) {
                faqs.push({ question, answer });
            }
        });
        
        if (!chatbotData.knowledge) chatbotData.knowledge = {};
        chatbotData.knowledge.items = faqs;
        autoSave();
    }
    
    // Add a new quick reply
    function addQuickReply() {
        const quickReplies = document.querySelector('.quick-replies');
        const newReply = document.createElement('div');
        newReply.className = 'quick-reply-item';
        
        newReply.innerHTML = `
            <input type="text" class="form-control quick-reply-text" placeholder="Button Text">
            <button class="delete-btn"><i class="fas fa-times"></i></button>
        `;
        
        // Insert before the add button
        quickReplies.insertBefore(newReply, document.querySelector('.add-reply-btn'));
        
        // Setup event listener for the new input
        const replyInput = newReply.querySelector('.quick-reply-text');
        replyInput.addEventListener('input', updateQuickRepliesData);
        
        // Update chatbot data
        updateQuickRepliesData();
    }
    
    // Delete a quick reply
    function deleteQuickReply(item) {
        item.remove();
        updateQuickRepliesData();
    }
    
    // Update quick replies data
    function updateQuickRepliesData() {
        const replyItems = document.querySelectorAll('.quick-reply-text');
        const replies = [];
        
        replyItems.forEach(item => {
            if (item.value) {
                replies.push(item.value);
            }
        });
        
        chatbotData.quickReplies = replies;
        
        // Update preview
        const previewButtons = document.getElementById('preview-buttons');
        if (previewButtons) {
            previewButtons.innerHTML = '';
            
            replies.forEach(reply => {
                const button = document.createElement('button');
                button.className = 'quick-reply';
                button.textContent = reply;
                previewButtons.appendChild(button);
            });
        }
        
        autoSave();
    }
    
    // Auto-save changes
    let saveTimeout;
    function autoSave() {
        showSaving(true);
        
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveChatbotChanges(false);
        }, 1000);
    }
    
    // Save chatbot (when clicking Save/Create button)
    function saveChatbot() {
        if (validateAllSteps()) {
            saveChatbotChanges(true);
        }
    }
    
    // Validate all steps
    function validateAllSteps() {
        // Basic validation
        if (!chatbotData.name) {
            showNotification('Please enter a chatbot name', 'error');
            navigateToStep(0); // Go to basics step
            return false;
        }
        
        if (!chatbotData.welcomeMessages || !chatbotData.welcomeMessages.greeting) {
            showNotification('Please enter a greeting message', 'error');
            navigateToStep(1); // Go to welcome step
            return false;
        }
        
        return true;
    }
    
    // Save chatbot changes
    async function saveChatbotChanges(isComplete) {
        try {
            showSaving(true, isComplete ? 'Saving chatbot...' : null);
            
            if (window.ApiService) {
                // Call API to save/update chatbot
                let response;
                
                if (editMode) {
                    response = await ApiService.chatbots.updateChatbot(chatbotId, chatbotData);
                } else {
                    response = await ApiService.chatbots.createChatbot(chatbotData);
                }
                
                if (response.error) {
                    showNotification(`Failed to save: ${response.message}`, 'error');
                    showSaving(false);
                    return;
                }
                
                if (isComplete) {
                    showNotification(`Chatbot ${editMode ? 'updated' : 'created'} successfully!`, 'success');
                    
                    // Redirect after a moment
                    setTimeout(() => {
                        window.location.href = '/dashboard/index.html#chatbots';
                    }, 1500);
                } else {
                    showSaving(false, 'All changes saved');
                }
            } else {
                // Demo mode - simulate API delay
                await new Promise(resolve => setTimeout(resolve, isComplete ? 1500 : 800));
                
                if (isComplete) {
                    showNotification(`Chatbot ${editMode ? 'updated' : 'created'} successfully!`, 'success');
                    
                    // Redirect after a moment
                    setTimeout(() => {
                        window.location.href = '/dashboard/index.html#chatbots';
                    }, 1500);
                } else {
                    showSaving(false, 'All changes saved');
                }
            }
        } catch (error) {
            console.error('Error saving chatbot:', error);
            showNotification('Failed to save chatbot', 'error');
            showSaving(false);
        }
    }
    
    // Show saving indicator
    function showSaving(isSaving, text) {
        const saveStatus = document.querySelector('.save-status');
        const statusText = saveStatus.querySelector('.status-text');
        const spinner = saveStatus.querySelector('.spinner');
        
        if (isSaving) {
            spinner.style.display = 'block';
            statusText.textContent = text || 'Saving...';
        } else {
            spinner.style.display = 'none';
            statusText.textContent = text || 'All changes saved';
        }
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
    
    // Update UI based on current step
    function updateUI() {
        // Additional UI updates for each step can be added here
    }
    
    // Initialize
    initBuilder();
});
