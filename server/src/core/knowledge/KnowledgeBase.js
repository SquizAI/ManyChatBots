/**
 * KnowledgeBase.js
 * 
 * Provides access to information sources for the chatbot to use in responses.
 * Each chatbot can have its own knowledge base while using the same system architecture.
 */

const { searchDocuments, extractRelevantInfo } = require('./KnowledgeUtils');

class KnowledgeBase {
    /**
     * Initialize the knowledge base
     * 
     * @param {Object} config - Knowledge base configuration
     * @param {Array} config.sources - Information sources (docs, FAQs, etc.)
     * @param {Object} config.options - Additional options
     */
    constructor(config = {}) {
        this.sources = config.sources || [];
        this.options = {
            maxResults: 5,
            minRelevanceScore: 0.6,
            enableLearning: true,
            ...config.options
        };
        
        this.cache = new Map();
        this.cacheTimeout = config.cacheTimeout || 60 * 60 * 1000; // 1 hour default
        
        console.log(`Knowledge base initialized with ${this.sources.length} sources`);
    }
    
    /**
     * Query the knowledge base for relevant information
     * 
     * @param {Object} params - Query parameters
     * @param {Object} params.understanding - NLU understanding of user message
     * @param {Object} params.context - Current conversation context
     * @param {String} params.userId - User ID for personalized results
     * @returns {Promise<Object>} - Relevant knowledge
     */
    async query(params) {
        try {
            const { understanding, context, userId } = params;
            
            // Generate a cache key from the query parameters
            const cacheKey = this.generateCacheKey(understanding, context);
            
            // Check cache first
            const cachedResult = this.checkCache(cacheKey);
            if (cachedResult) {
                console.log('Using cached knowledge result');
                return cachedResult;
            }
            
            // Determine the query based on understanding
            const query = this.buildQuery(understanding, context);
            
            // Search across all knowledge sources
            let relevantDocs = [];
            for (const source of this.sources) {
                const sourceResults = await this.searchSource(source, query);
                relevantDocs = relevantDocs.concat(sourceResults);
            }
            
            // Sort by relevance and limit results
            relevantDocs.sort((a, b) => b.relevance - a.relevance);
            relevantDocs = relevantDocs
                .filter(doc => doc.relevance >= this.options.minRelevanceScore)
                .slice(0, this.options.maxResults);
            
            // Extract relevant information from documents
            const extractedInfo = await extractRelevantInfo(relevantDocs, understanding);
            
            // Determine if any actions are needed based on the knowledge
            const requiresAction = this.checkForRequiredActions(extractedInfo, understanding);
            
            // Compose the knowledge response
            const result = {
                query,
                found: relevantDocs.length > 0,
                confidence: relevantDocs.length > 0 ? relevantDocs[0].relevance : 0,
                sources: relevantDocs.map(doc => ({
                    id: doc.id,
                    title: doc.title,
                    relevance: doc.relevance,
                    type: doc.type
                })),
                information: extractedInfo,
                requiresAction,
                suggestedActions: requiresAction ? this.getSuggestedActions(extractedInfo) : []
            };
            
            // Cache the result
            this.setCache(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error('Error querying knowledge base:', error);
            return {
                found: false,
                confidence: 0,
                information: null,
                requiresAction: false,
                suggestedActions: [],
                error: 'Failed to query knowledge base'
            };
        }
    }
    
    /**
     * Build a search query from NLU understanding
     * 
     * @private
     * @param {Object} understanding - NLU understanding
     * @param {Object} context - Conversation context
     * @returns {Object} - Structured query
     */
    buildQuery(understanding, context) {
        // Extract key information from understanding
        const { intent, entities, text } = understanding;
        
        // Build query based on intent and entities
        const query = {
            text: text,
            intent: intent.name,
            entities: entities.reduce((obj, entity) => {
                obj[entity.type] = entity.value;
                return obj;
            }, {}),
            filters: {}
        };
        
        // Add context-based filters if available
        if (context.user && context.user.preferences) {
            query.filters.userPreferences = context.user.preferences;
        }
        
        // Add conversation history context if relevant
        if (context.conversationTurns > 1 && context.previousIntents) {
            query.previousIntents = context.previousIntents;
        }
        
        return query;
    }
    
    /**
     * Search a specific knowledge source
     * 
     * @private
     * @param {Object} source - Knowledge source to search
     * @param {Object} query - The query to run
     * @returns {Promise<Array>} - Search results
     */
    async searchSource(source, query) {
        try {
            // Different handling based on source type
            switch (source.type) {
                case 'faq':
                    return this.searchFaq(source, query);
                
                case 'document':
                    return await searchDocuments(source, query);
                
                case 'database':
                    return await this.searchDatabase(source, query);
                
                case 'api':
                    return await this.callExternalApi(source, query);
                
                default:
                    console.warn(`Unknown source type: ${source.type}`);
                    return [];
            }
        } catch (error) {
            console.error(`Error searching source ${source.id}:`, error);
            return [];
        }
    }
    
    /**
     * Search FAQ knowledge source
     * 
     * @private
     * @param {Object} source - FAQ source
     * @param {Object} query - The query
     * @returns {Array} - Matching FAQs
     */
    searchFaq(source, query) {
        const results = [];
        
        // Simple keyword matching for FAQs
        const keywords = query.text.toLowerCase().split(/\s+/);
        
        for (const faq of source.data) {
            let matchScore = 0;
            
            // Check question for keyword matches
            const questionLower = faq.question.toLowerCase();
            keywords.forEach(keyword => {
                if (questionLower.includes(keyword)) {
                    matchScore += 0.2;
                }
            });
            
            // Check for intent match
            if (faq.intents && faq.intents.includes(query.intent)) {
                matchScore += 0.5;
            }
            
            // If score is high enough, add to results
            if (matchScore > 0.3) {
                results.push({
                    id: faq.id,
                    title: faq.question,
                    content: faq.answer,
                    relevance: matchScore,
                    type: 'faq',
                    metadata: faq.metadata || {}
                });
            }
        }
        
        return results;
    }
    
    /**
     * Search database knowledge source
     * 
     * @private
     * @param {Object} source - Database source
     * @param {Object} query - The query
     * @returns {Promise<Array>} - Search results
     */
    async searchDatabase(source, query) {
        // In a real implementation, this would query a database
        // For this example, we'll return an empty array
        return [];
    }
    
    /**
     * Call an external API for knowledge
     * 
     * @private
     * @param {Object} source - API source
     * @param {Object} query - The query
     * @returns {Promise<Array>} - API results
     */
    async callExternalApi(source, query) {
        // In a real implementation, this would call an API
        // For this example, we'll return an empty array
        return [];
    }
    
    /**
     * Check if any actions are required based on the knowledge
     * 
     * @private
     * @param {Object} extractedInfo - Information extracted from docs
     * @param {Object} understanding - NLU understanding
     * @returns {Boolean} - True if actions are needed
     */
    checkForRequiredActions(extractedInfo, understanding) {
        if (!extractedInfo) {
            return false;
        }
        
        // Check if info contains action triggers
        if (extractedInfo.actionTriggers && extractedInfo.actionTriggers.length > 0) {
            return true;
        }
        
        // Check for special content types that need actions
        if (extractedInfo.contentType === 'form' || 
            extractedInfo.contentType === 'booking' || 
            extractedInfo.contentType === 'payment') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get suggested actions based on extracted information
     * 
     * @private
     * @param {Object} extractedInfo - Information extracted from docs
     * @returns {Array} - Suggested actions
     */
    getSuggestedActions(extractedInfo) {
        const suggestedActions = [];
        
        if (extractedInfo.actionTriggers) {
            extractedInfo.actionTriggers.forEach(trigger => {
                suggestedActions.push({
                    type: trigger.actionType,
                    parameters: trigger.parameters || {}
                });
            });
        }
        
        // Add content type specific actions
        if (extractedInfo.contentType === 'form') {
            suggestedActions.push({
                type: 'display_form',
                parameters: {
                    formId: extractedInfo.formId || 'general_contact'
                }
            });
        } else if (extractedInfo.contentType === 'booking') {
            suggestedActions.push({
                type: 'show_booking_interface',
                parameters: {
                    serviceType: extractedInfo.serviceType || 'general'
                }
            });
        } else if (extractedInfo.contentType === 'payment') {
            suggestedActions.push({
                type: 'initiate_payment_flow',
                parameters: {
                    amount: extractedInfo.amount,
                    currency: extractedInfo.currency || 'USD',
                    description: extractedInfo.description || 'Service payment'
                }
            });
        }
        
        return suggestedActions;
    }
    
    /**
     * Generate cache key from query parameters
     * 
     * @private
     * @param {Object} understanding - NLU understanding
     * @param {Object} context - Conversation context
     * @returns {String} - Cache key
     */
    generateCacheKey(understanding, context) {
        const intentKey = understanding.intent ? understanding.intent.name : 'unknown';
        return `${intentKey}:${understanding.text}`;
    }
    
    /**
     * Check cache for existing results
     * 
     * @private
     * @param {String} key - Cache key
     * @returns {Object|null} - Cached result or null
     */
    checkCache(key) {
        if (!this.cache.has(key)) {
            return null;
        }
        
        const cached = this.cache.get(key);
        
        // Check if cache entry is expired
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    /**
     * Store result in cache
     * 
     * @private
     * @param {String} key - Cache key
     * @param {Object} data - Data to cache
     */
    setCache(key, data) {
        this.cache.set(key, {
            timestamp: Date.now(),
            data
        });
    }
    
    /**
     * Add a new source to the knowledge base
     * 
     * @param {Object} source - Source to add
     * @returns {Boolean} - Success status
     */
    addSource(source) {
        if (!source.id || !source.type) {
            console.error('Invalid source format - must have id and type');
            return false;
        }
        
        // Check for duplicate
        const existingIndex = this.sources.findIndex(s => s.id === source.id);
        if (existingIndex >= 0) {
            this.sources[existingIndex] = source;
        } else {
            this.sources.push(source);
        }
        
        // Clear cache when sources change
        this.cache.clear();
        
        return true;
    }
    
    /**
     * Remove a source from the knowledge base
     * 
     * @param {String} sourceId - ID of source to remove
     * @returns {Boolean} - Success status
     */
    removeSource(sourceId) {
        const initialLength = this.sources.length;
        this.sources = this.sources.filter(source => source.id !== sourceId);
        
        // Clear cache when sources change
        if (this.sources.length !== initialLength) {
            this.cache.clear();
            return true;
        }
        
        return false;
    }
    
    /**
     * Update the knowledge base with new content
     * 
     * @param {Object} update - Update information
     * @returns {Promise<Boolean>} - Success status
     */
    async update(update) {
        try {
            if (update.sources) {
                for (const source of update.sources) {
                    this.addSource(source);
                }
            }
            
            if (update.options) {
                this.options = {
                    ...this.options,
                    ...update.options
                };
            }
            
            if (update.clearCache) {
                this.cache.clear();
            }
            
            return true;
        } catch (error) {
            console.error('Error updating knowledge base:', error);
            return false;
        }
    }
}

module.exports = KnowledgeBase;
