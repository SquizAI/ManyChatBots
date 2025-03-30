/**
 * ChatbotFactory.js
 * 
 * A simple factory to create new chatbot instances using the unified
 * agentic architecture. This makes it easy to create new chatbots
 * without having to understand all the internal components.
 */

const AgentCore = require('./AgentCore');
const PersonalityProfile = require('./personality/PersonalityProfile');
const KnowledgeBase = require('./knowledge/KnowledgeBase');

class ChatbotFactory {
    /**
     * Create a new chatbot with the specified configuration
     * 
     * @param {Object} config - Chatbot configuration
     * @returns {AgentCore} - A configured chatbot instance
     */
    static createChatbot(config) {
        // Validate required fields
        if (!config.botId) {
            throw new Error('Chatbot configuration must include a botId');
        }
        
        // Create default configuration
        const defaultConfig = {
            userId: config.userId || 'system',
            personalityProfile: {
                name: `${config.name || config.botId} Personality`,
                tone: {
                    formality: 0.5,
                    friendliness: 0.7,
                    humor: 0.3,
                    empathy: 0.8
                },
                behavior: {
                    proactivity: 0.5,
                    verbosity: 0.5,
                    persistence: 0.3,
                    creativity: 0.5
                }
            },
            knowledgeConfig: {
                sources: [],
                options: {
                    maxResults: 5,
                    minRelevanceScore: 0.6,
                    enableLearning: true
                }
            },
            actions: [
                'search_knowledge_base',
                'get_current_time',
                'get_user_profile',
                'save_conversation_note',
                'set_reminder'
            ],
            nluOptions: {
                model: 'standard',
                confidenceThreshold: 0.6
            },
            contextOptions: {
                maxHistoryTurns: 10
            },
            responseOptions: {
                includeTimestamp: true
            },
            memoryOptions: {
                storageType: 'default'
            },
            learningOptions: {
                enabled: true
            },
            options: {
                debugMode: false
            }
        };
        
        // Merge user configuration with defaults
        const mergedConfig = this.mergeConfigs(defaultConfig, config);
        
        // Create the chatbot instance
        return new AgentCore(mergedConfig);
    }
    
    /**
     * Create a chatbot from a template with customizations
     * 
     * @param {String} templateName - Name of template (sales, support, assistant)
     * @param {Object} customizations - Custom overrides
     * @returns {AgentCore} - A configured chatbot instance
     */
    static createFromTemplate(templateName, customizations = {}) {
        // Get the template configuration
        const templateConfig = this.getTemplate(templateName);
        
        // Merge template with customizations
        const config = this.mergeConfigs(templateConfig, customizations);
        
        // Create the chatbot
        return this.createChatbot(config);
    }
    
    /**
     * Deep merge two configuration objects
     * 
     * @private
     * @param {Object} base - Base configuration
     * @param {Object} override - Override configuration
     * @returns {Object} - Merged configuration
     */
    static mergeConfigs(base, override) {
        const result = { ...base };
        
        for (const key in override) {
            if (override.hasOwnProperty(key)) {
                if (typeof override[key] === 'object' && !Array.isArray(override[key]) && 
                    typeof base[key] === 'object' && !Array.isArray(base[key])) {
                    // Recursively merge objects
                    result[key] = this.mergeConfigs(base[key], override[key]);
                } else {
                    // Override value
                    result[key] = override[key];
                }
            }
        }
        
        return result;
    }
    
    /**
     * Get a template configuration by name
     * 
     * @private
     * @param {String} templateName - Name of the template
     * @returns {Object} - Template configuration
     */
    static getTemplate(templateName) {
        const templates = {
            sales: {
                botId: 'sales_bot',
                name: 'Sales Assistant',
                personalityProfile: {
                    name: 'Sales Professional',
                    tone: {
                        formality: 0.6,
                        friendliness: 0.9,
                        humor: 0.4,
                        empathy: 0.8
                    },
                    behavior: {
                        proactivity: 0.8,
                        verbosity: 0.6,
                        persistence: 0.7,
                        creativity: 0.5
                    },
                    industry: 'sales'
                },
                knowledgeConfig: {
                    sources: [
                        { id: 'product_catalog', type: 'database', access: 'read' },
                        { id: 'pricing', type: 'faq' },
                        { id: 'testimonials', type: 'document' }
                    ]
                },
                actions: [
                    'search_knowledge_base',
                    'get_current_time',
                    'get_user_profile',
                    'save_conversation_note',
                    'set_reminder',
                    'generate_quote',
                    'schedule_demo',
                    'add_to_crm'
                ]
            },
            
            support: {
                botId: 'support_bot',
                name: 'Support Agent',
                personalityProfile: {
                    name: 'Support Professional',
                    tone: {
                        formality: 0.5,
                        friendliness: 0.8,
                        humor: 0.2,
                        empathy: 0.9
                    },
                    behavior: {
                        proactivity: 0.6,
                        verbosity: 0.4,
                        persistence: 0.7,
                        creativity: 0.3
                    },
                    industry: 'support'
                },
                knowledgeConfig: {
                    sources: [
                        { id: 'help_docs', type: 'document' },
                        { id: 'faq', type: 'faq' },
                        { id: 'troubleshooting', type: 'document' }
                    ]
                },
                actions: [
                    'search_knowledge_base',
                    'get_current_time',
                    'get_user_profile',
                    'save_conversation_note',
                    'set_reminder',
                    'create_support_ticket',
                    'check_ticket_status',
                    'escalate_to_human'
                ]
            },
            
            assistant: {
                botId: 'personal_assistant',
                name: 'Virtual Assistant',
                personalityProfile: {
                    name: 'Helpful Assistant',
                    tone: {
                        formality: 0.4,
                        friendliness: 0.8,
                        humor: 0.5,
                        empathy: 0.7
                    },
                    behavior: {
                        proactivity: 0.7,
                        verbosity: 0.5,
                        persistence: 0.4,
                        creativity: 0.6
                    },
                    industry: 'assistant'
                },
                knowledgeConfig: {
                    sources: [
                        { id: 'general_knowledge', type: 'document' },
                        { id: 'user_docs', type: 'document' },
                        { id: 'calendar', type: 'api' }
                    ]
                },
                actions: [
                    'search_knowledge_base',
                    'get_current_time',
                    'get_user_profile',
                    'save_conversation_note',
                    'set_reminder',
                    'check_calendar',
                    'create_task',
                    'send_email'
                ]
            }
        };
        
        if (!templates[templateName]) {
            throw new Error(`Template not found: ${templateName}`);
        }
        
        return templates[templateName];
    }
    
    /**
     * Create a chatbot from a JSON file
     * 
     * @param {String} configFile - Path to configuration file
     * @returns {Promise<AgentCore>} - A configured chatbot instance
     */
    static async createFromFile(configFile) {
        try {
            // In a real implementation, this would load a file
            // For this example, we'll just throw an error
            throw new Error('File loading not implemented in this example');
        } catch (error) {
            console.error(`Error loading configuration from ${configFile}:`, error);
            throw error;
        }
    }
}

module.exports = ChatbotFactory;
