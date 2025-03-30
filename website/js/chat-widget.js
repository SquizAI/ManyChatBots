/**
 * Chat Widget for ManyChatBot Demo
 * Demonstrates integration with unified agent architecture
 */

class ChatWidget {
    constructor(options = {}) {
        this.options = Object.assign({
            welcomeMessage: "👋 Hi there! I'm ManyChatBot. How can I help you today?",
            placeholder: "Type your message here...",
            position: "right",
            agentName: "ManyChatBot",
            agentAvatar: "images/chatbot-avatar.png",
            apiEndpoint: "/api/chat",
            disableUserInput: false,
            quickReplies: [
                "What services do you offer?",
                "How much does it cost?",
                "How does it work?"
            ]
        }, options);

        this.messages = [];
        this.isOpen = false;
        this.isTyping = false;
        this.initialized = false;
        this.sessionId = this._generateSessionId();
        
        this._init();
    }

    _init() {
        this._createWidgetElements();
        this._setupEventListeners();
        this._addWelcomeMessage();
        this.initialized = true;
    }

    _createWidgetElements() {
        // Create the main container
        this.container = document.createElement('div');
        this.container.className = 'chat-widget';
        
        // Create the chat button
        this.button = document.createElement('div');
        this.button.className = 'chat-widget-button';
        this.button.innerHTML = `
            <i class="fas fa-comment chat-icon"></i>
            <i class="fas fa-times close-icon"></i>
        `;
        
        // Create the chat container
        this.chatContainer = document.createElement('div');
        this.chatContainer.className = 'chat-widget-container';
        
        // Create the chat header
        this.header = document.createElement('div');
        this.header.className = 'chat-widget-header';
        this.header.innerHTML = `
            <img src="${this.options.agentAvatar}" alt="${this.options.agentName}">
            <div class="chat-widget-header-text">
                <h3>${this.options.agentName}</h3>
                <p>Online | Typically replies instantly</p>
            </div>
            <div class="expand-button" title="Expand chat">
                <i class="fas fa-expand-alt"></i>
            </div>
        `;
        
        // Create the messages container
        this.messagesContainer = document.createElement('div');
        this.messagesContainer.className = 'chat-widget-messages';
        
        // Create the input area
        this.inputContainer = document.createElement('div');
        this.inputContainer.className = 'chat-widget-input';
        
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.placeholder = this.options.placeholder;
        if (this.options.disableUserInput) {
            this.input.disabled = true;
        }
        
        this.sendButton = document.createElement('button');
        this.sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        if (this.options.disableUserInput) {
            this.sendButton.disabled = true;
        }
        
        // Create microphone button for speech input
        this.micButton = document.createElement('button');
        this.micButton.className = 'mic-button';
        this.micButton.innerHTML = '<i class="fas fa-microphone"></i>';
        this.micButton.setAttribute('title', 'Speak your message');
        if (this.options.disableUserInput) {
            this.micButton.disabled = true;
        }
        
        // Add speech transcript element
        this.speechTranscript = document.createElement('div');
        this.speechTranscript.className = 'speech-transcript';
        this.speechTranscript.style.display = 'none';
        
        this.inputContainer.appendChild(this.input);
        this.inputContainer.appendChild(this.sendButton);
        this.inputContainer.appendChild(this.micButton);
        
        // Assemble the chat container
        this.chatContainer.appendChild(this.header);
        this.chatContainer.appendChild(this.messagesContainer);
        this.chatContainer.appendChild(this.inputContainer);
        this.chatContainer.appendChild(this.speechTranscript);
        
        // Assemble the widget
        this.container.appendChild(this.button);
        this.container.appendChild(this.chatContainer);
        
        // Add to the document
        document.body.appendChild(this.container);
    }

    _setupEventListeners() {
        // Toggle chat visibility when button is clicked
        this.button.addEventListener('click', () => this.toggle());
        
        // Send message when send button is clicked
        this.sendButton.addEventListener('click', () => this._handleSendMessage());
        
        // Send message when Enter key is pressed
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this._handleSendMessage();
            }
        });
        
        // Enable/disable send button based on input
        this.input.addEventListener('input', () => {
            this.sendButton.disabled = !this.input.value.trim();
        });
        
        // Initialize speech-to-text component if supported
        if (typeof SpeechToTextInput !== 'undefined') {
            this.speechToText = new SpeechToTextInput({
                microphoneButtonSelector: null, // We'll handle the button manually
                useWebsocket: true,
                debug: this.options.debug,
                onTranscriptComplete: (transcript) => {
                    if (transcript && transcript.trim()) {
                        this.input.value = transcript;
                        this.sendButton.disabled = false;
                        this._handleSendMessage();
                    }
                    this.speechTranscript.style.display = 'none';
                },
                onTranscriptInterim: (transcript) => {
                    if (transcript && transcript.trim()) {
                        this.speechTranscript.style.display = 'block';
                        this.speechTranscript.textContent = transcript;
                    }
                }
            });
            
            // Attach mic button click event
            this.micButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.speechToText) {
                    this.speechToText.toggleRecording();
                }
            });
        } else {
            // Hide mic button if speech-to-text is not available
            this.micButton.style.display = 'none';
        }
        
        // Add expand button functionality
        const expandButton = this.header.querySelector('.expand-button');
        if (expandButton) {
            expandButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering other listeners
                this.chatContainer.classList.toggle('expanded');
                
                // Toggle icon between expand and compress
                const icon = expandButton.querySelector('i');
                if (icon) {
                    if (icon.classList.contains('fa-expand-alt')) {
                        icon.classList.remove('fa-expand-alt');
                        icon.classList.add('fa-compress-alt');
                        expandButton.setAttribute('title', 'Compress chat');
                    } else {
                        icon.classList.remove('fa-compress-alt');
                        icon.classList.add('fa-expand-alt');
                        expandButton.setAttribute('title', 'Expand chat');
                    }
                }
            });
        }
    }

    _handleSendMessage() {
        const message = this.input.value.trim();
        if (!message) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.input.value = '';
        this.sendButton.disabled = true;
        
        // Process message with our agent
        this._processUserMessage(message);
    }

    _processUserMessage(message) {
        // Show typing indicator
        this.showTypingIndicator();
        
        // Here we'd normally connect to our backend, but for the demo we'll simulate a response
        const isDemo = true; // Set to false to connect to real backend
        
        if (isDemo) {
            // Simulate network delay
            setTimeout(() => {
                this.hideTypingIndicator();
                
                // Log to show which AI engine would be used based on query complexity
                const messageComplexity = this._analyzeComplexity(message);
                let aiEngine = 'simple';
                let modelName = 'rules-based';
                
                if (messageComplexity > 0.7) {
                    aiEngine = 'OpenAI';
                    modelName = 'gpt-4o-2024-08-06';
                    console.log(`Using OpenAI's advanced model for complex query (complexity score: ${messageComplexity.toFixed(2)})`);
                } else if (messageComplexity > 0.4) {
                    aiEngine = 'Gemini';
                    modelName = 'gemini-2.0-flash-001';
                    console.log(`Using Google's Gemini model for moderate query (complexity score: ${messageComplexity.toFixed(2)})`);
                } else {
                    console.log(`Using efficient model for simple query (complexity score: ${messageComplexity.toFixed(2)})`);
                }
                
                // Display "AI thinking" for a realistic duration based on complexity
                const thinkingTime = 1000 + (messageComplexity * 1500);
                
                // Generate response based on message content with enhanced pattern matching
                const lowerMessage = message.toLowerCase();
                let response, quickReplies;
                
                // Pricing queries
                if (this._matchesAny(lowerMessage, ['price', 'cost', 'pricing', 'payment', 'subscription', 'plan'])) {
                    response = `[${aiEngine}: ${modelName}] Our pricing plans are designed to fit businesses of all sizes:\n\n• **Starter**: $99/mo - Basic chatbot with pre-built templates\n• **Professional**: $299/mo - AI-powered with custom training\n• **Enterprise**: Custom pricing - Full integration with advanced analytics\n\nAll plans include our 60-day satisfaction guarantee.`;
                    quickReplies = [
                        "Tell me about the Starter plan",
                        "Professional plan details",
                        "Enterprise features",
                        "Do you offer a free trial?"
                    ];
                } 
                // Implementation questions
                else if (this._matchesAny(lowerMessage, ['how', 'work', 'setup', 'implement']) || 
                         (lowerMessage.includes('how') && lowerMessage.includes('work'))) {
                    response = `[${aiEngine}: ${modelName}] Our implementation process is straightforward and efficient:\n\n1. **Discovery** - We learn about your business needs (1-2 days)\n2. **Configuration** - We build your custom chatbot (3-5 days)\n3. **Training** - We train the AI on your specific data (1-3 days)\n4. **Integration** - We deploy on your chosen platforms (1 day)\n5. **Optimization** - Continuous improvement based on real conversations\n\nMost clients have fully functioning chatbots within 5-7 business days!`;
                    quickReplies = [
                        "Book a demo",
                        "What data do you need?",
                        "Integration options",
                        "Success stories"
                    ];
                } 
                // Features and services
                else if (this._matchesAny(lowerMessage, ['feature', 'service', 'offer', 'do', 'capability', 'can'])) {
                    response = `[${aiEngine}: ${modelName}] ManyChatBot offers a comprehensive suite of features:\n\n• **Conversational AI** - Natural language understanding\n• **Multi-channel deployment** - Web, Facebook, WhatsApp, SMS\n• **Lead qualification** - Score and route potential customers\n• **Appointment scheduling** - Sync with your calendar\n• **Analytics dashboard** - Track performance metrics\n• **Payment processing** - Secure transactions\n• **Human handoff** - Seamless transition to your team\n\nWhat specific feature would you like to explore?`;
                    quickReplies = [
                        "Tell me about AI capabilities",
                        "Multi-channel options",
                        "Analytics features",
                        "Human handoff process"
                    ];
                }
                // AI and technology questions
                else if (this._matchesAny(lowerMessage, ['ai', 'technology', 'machine learning', 'openai', 'gpt', 'gemini', 'google', 'model'])) {
                    response = `[${aiEngine}: ${modelName}] Our platform leverages the latest AI technology from both OpenAI and Google:\n\n• **Unified architecture** - Switches between providers based on task needs\n• **Adaptive complexity analysis** - Uses simpler models for basic queries, advanced models for complex reasoning\n• **Continuous learning** - Improves from conversations with your customers\n• **Structured outputs** - Ensures consistent, formatted responses\n• **Multilingual support** - 95+ languages with native-quality translation\n\nOur system automatically selects the optimal model based on each query's complexity.`;
                    quickReplies = [
                        "How do you ensure accuracy?",
                        "Data security measures",
                        "Supported languages",
                        "Technical requirements"
                    ];
                }
                // Industry-specific questions
                else if (this._matchesAny(lowerMessage, ['industry', 'specific', 'use case', 'example', 'business', 'company'])) {
                    response = `[${aiEngine}: ${modelName}] ManyChatBot excels across multiple industries:\n\n• **E-commerce** - Product recommendations, order tracking\n• **Healthcare** - Appointment scheduling, basic symptom checking\n• **Real Estate** - Property inquiries, viewing schedules\n• **Financial Services** - FAQ handling, basic account inquiries\n• **Education** - Student support, course information\n• **Hospitality** - Reservations, concierge services\n\nWe have pre-built templates optimized for each industry's specific needs.`;
                    quickReplies = [
                        "E-commerce examples",
                        "Healthcare use cases",
                        "Financial services",
                        "My industry is different"
                    ];
                }
                // Default response for other queries
                else {
                    response = `[${aiEngine}: ${modelName}] Thanks for reaching out to ManyChatBot! We specialize in creating intelligent conversational agents that help businesses automate customer interactions, qualify leads, and provide 24/7 support.\n\nOur platform integrates with your existing systems and can be deployed across multiple channels. How can I help you today?`;
                    quickReplies = [
                        "Tell me about your services",
                        "How much does it cost?",
                        "How does implementation work?",
                        "Book a consultation"
                    ];
                }
                
                // Add AI engine tag in console for demonstration
                console.log(`Response generated using ${aiEngine} (${modelName})`);
                
                // Process the response after the appropriate delay to simulate AI processing
                setTimeout(() => {
                    this.addMessage(response, 'bot', quickReplies);
                }, thinkingTime);
            }, 1500);
        } else {
            // Real backend connection
            fetch(this.options.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId,
                    source: 'website',
                    metadata: {
                        url: window.location.href,
                        userAgent: navigator.userAgent
                    }
                })
            })
            .then(response => response.json())
            .then(data => {
                this.hideTypingIndicator();
                this.addMessage(data.message, 'bot', data.quickReplies);
            })
            .catch(error => {
                console.error('Error:', error);
                this.hideTypingIndicator();
                this.addMessage("I'm sorry, I'm having trouble connecting. Please try again later.", 'bot');
            });
        }
    }

    _addWelcomeMessage() {
        setTimeout(() => {
            this.addMessage(this.options.welcomeMessage, 'bot', this.options.quickReplies);
        }, 500);
    }

    // Public methods

    /**
     * Add a message to the chat
     * @param {string} text - Message text
     * @param {string} sender - 'bot' or 'user'
     * @param {Array} options - Quick reply options (bot messages only)
     */
    addMessage(text, sender, options = []) {
        if (!text) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'chat-message-avatar';
        if (sender === 'bot') {
            avatar.innerHTML = '<i class="fas fa-robot"></i>';
        } else {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        }
        
        const content = document.createElement('div');
        content.className = 'chat-message-content';
        
        // Process text differently for bot messages to support markdown-like formatting
        if (sender === 'bot') {
            // Extract AI model tag if present in format [Provider: Model]
            const modelTagMatch = text.match(/^\[(OpenAI|Gemini|simple):\s?([^\]]+)\]/);
            if (modelTagMatch) {
                const provider = modelTagMatch[1];
                const model = modelTagMatch[2];
                
                // Create model tag element
                const modelTag = document.createElement('div');
                modelTag.className = 'ai-model-tag';
                modelTag.textContent = `${provider}: ${model}`;
                content.appendChild(modelTag);
                
                // Remove tag from text
                text = text.replace(/^\[(OpenAI|Gemini|simple):\s?([^\]]+)\]\s*/, '');
            }
            
            // Process markdown-like syntax
            text = this._processMarkdown(text);
            content.innerHTML = text;
        } else {
            // User messages use simple text
            content.textContent = text;
        }
        
        messageElement.appendChild(avatar);
        messageElement.appendChild(content);
        
        // Add quick reply options if provided and sender is bot
        if (sender === 'bot' && options && options.length > 0) {
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'chat-message-options';
            
            options.forEach(option => {
                const optionButton = document.createElement('button');
                optionButton.className = 'chat-message-option';
                optionButton.textContent = option;
                
                optionButton.addEventListener('click', () => {
                    // Add user message
                    this.addMessage(option, 'user');
                    
                    // Process as if user typed it
                    this._processUserMessage(option);
                    
                    // Remove options after selection
                    optionsContainer.remove();
                });
                
                optionsContainer.appendChild(optionButton);
            });
            
            content.appendChild(optionsContainer);
        }
        
        this.messagesContainer.appendChild(messageElement);
        
        // Store message
        this.messages.push({
            text,
            sender,
            timestamp: new Date()
        });
        
        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        
        const typingElement = document.createElement('div');
        typingElement.className = 'typing-indicator';
        typingElement.innerHTML = '<span></span><span></span><span></span>';
        
        this.messagesContainer.appendChild(typingElement);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        this.isTyping = false;
        
        const typingIndicator = this.messagesContainer.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    /**
     * Toggle chat visibility
     */
    toggle() {
        this.isOpen = !this.isOpen;
        
        this.button.classList.toggle('active', this.isOpen);
        this.chatContainer.classList.toggle('active', this.isOpen);
        
        if (this.isOpen) {
            this.input.focus();
        }
    }

    /**
     * Open the chat
     */
    open() {
        if (!this.isOpen) {
            this.toggle();
        }
    }

    /**
     * Close the chat
     */
    close() {
        if (this.isOpen) {
            this.toggle();
        }
    }

    /**
     * Generate a unique session ID
     */
    _generateSessionId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Analyze message complexity to determine which AI model would be most appropriate
     * Demonstrates the UnifiedAIClient's model selection logic
     * @param {string} message - User message to analyze
     * @returns {number} Complexity score between 0 and 1
     */
    _analyzeComplexity(message) {
        if (!message) return 0;
        
        // Start with base complexity
        let complexity = 0.3;
        
        // 1. Length factor - longer messages tend to be more complex
        const wordCount = message.split(/\s+/).length;
        const lengthFactor = Math.min(0.4, wordCount / 50 * 0.4); // Max 0.4 from length
        
        // 2. Complexity indicators in the text
        const complexityMarkers = [
            'how', 'why', 'explain', 'difference', 'compare', 'versus', 'vs',
            'technical', 'integrate', 'advantage', 'disadvantage', 'security',
            'feature', 'implementation', 'architecture', 'process', 'workflow',
            'api', 'data', 'ai', 'machine learning', 'openai', 'gemini', 'model',
            'language', 'multilingual', 'complex', 'advanced', 'enterprise',
            'customize', 'train', 'performance', 'analytics', 'reporting',
            'industry', 'specific', 'example', 'use case', 'roi', 'return'
        ];
        
        // Count how many complexity markers are in the message
        const lowerMessage = message.toLowerCase();
        let markerCount = 0;
        
        complexityMarkers.forEach(marker => {
            if (lowerMessage.includes(marker)) {
                markerCount++;
            }
        });
        
        // Calculate complexity factor from markers (max 0.5)
        const markerFactor = Math.min(0.5, markerCount * 0.05);
        
        // 3. Question marks increase complexity
        const questionFactor = (message.match(/\?/g) || []).length * 0.05;
        
        // 4. If asking about technical details, increase complexity
        const technicalFactor = 
            (lowerMessage.includes('technical') || 
             lowerMessage.includes('architecture') || 
             lowerMessage.includes('api') ||
             lowerMessage.includes('integration')) ? 0.2 : 0;
        
        // Calculate final complexity
        complexity = 0.3 + lengthFactor + markerFactor + questionFactor + technicalFactor;
        
        // Ensure within bounds
        return Math.max(0, Math.min(1, complexity));
    }
    
    /**
     * Check if message matches any of the keywords
     * @param {string} message - Message to check
     * @param {Array} keywords - Keywords to match against
     * @returns {boolean} True if any keyword matches
     */
    _matchesAny(message, keywords) {
        if (!message || !keywords || !keywords.length) return false;
        
        return keywords.some(keyword => message.includes(keyword));
    }
    
    /**
     * Process markdown-like syntax in bot messages
     * @param {string} text - Message text to process
     * @returns {string} Processed HTML with formatted elements
     */
    _processMarkdown(text) {
        if (!text) return '';
        
        // Process bold text - **text** or __text__
        text = text.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');
        
        // Process bullet points - lines starting with •
        text = text.replace(/^(•\s+.*?)$/gm, '<li>$1</li>');
        
        // Wrap bullet points in ul
        if (text.includes('<li>')) {
            text = text.replace(/(<li>.*?<\/li>)\n+/gs, '<ul>$1</ul>');
        }
        
        // Process line breaks
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }
}

// Initialize the chat widget when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    window.chatWidget = new ChatWidget({
        agentName: "ManyChatBot",
        agentAvatar: "images/favicon.svg",
        welcomeMessage: "👋 Hello! I'm your ManyChatBot assistant. How can I help your business today?"
    });
    
    // Open chat automatically after 5 seconds if user hasn't interacted
    // Commented out for now to not be intrusive
    /*
    setTimeout(() => {
        if (!window.chatWidget.isOpen && !window.chatWidget.interacted) {
            window.chatWidget.open();
        }
    }, 5000);
    */
});
